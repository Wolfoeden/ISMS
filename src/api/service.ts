/**
 * Fachfunktionen der Anwendungsschicht – ein Aufruf je Schritt des Pilotfalls.
 * Der Kern (src/) prüft und rechnet; die Datenbank erzwingt dieselben Regeln noch einmal.
 * Keine Funktion umgeht eine Datenbankregel; Fehler kommen als ApiError zurück.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanUntrusted, sha256 } from '../evidence/evidence.js';
import { DEFAULT_OFFER_VALIDITY_DAYS, checkOfferText } from '../engagement/offer.js';
import { reworkTarget, type PackageIssue } from '../engagement/report.js';
import {
  createIntake as coreCreateIntake, nextQuestions, orientation as coreOrientation, type ContextFact, type EntryRoute, type IntakeCase,
} from '../intake/intake.js';
import { ApiError } from './errors.js';
import { one, type Db } from './db.js';

type Row = Record<string, unknown>;
/** Änderung muss greifen – sonst hat der Zugriffsschutz sie verhindert (die Datenbank meldet dann 0 Zeilen, keinen Fehler) */
async function change(db: Db, sql: string, params: unknown[]): Promise<void> {
  const r = await db.query(sql, params);
  if (!r.rowCount) throw new ApiError(403, 'keine_berechtigung', 'Keine Berechtigung für diese Änderung oder Datensatz nicht vorhanden');
}

const need = (v: unknown, name: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new ApiError(400, 'pflichtfeld', `Feld „${name}“ fehlt`);
  return v;
};

// ---------------------------------------------------------------------------
// Stammdaten (DT Agency)
// ---------------------------------------------------------------------------

export async function createOrganization(db: Db, b: Row) {
  return one(db, 'insert into isms.organization (name) values ($1) returning id, name', [need(b['name'], 'name')]);
}

export async function createPerson(db: Db, b: Row) {
  return one(db, 'insert into isms.person (party, organization_id, display_name, email) values ($1, $2, $3, $4) returning id, party, display_name',
    [need(b['party'], 'party'), b['organizationId'] ?? null, need(b['displayName'], 'displayName'), b['email'] ?? null]);
}

/** Einstufung als Grundlage des Mandats – Profil und Untergrenze kommen aus der Einstufung (Werkzeug `einstufung`) */
export async function createProfileDecision(db: Db, b: Row, personId: string) {
  const ca = await one<{ id: string }>(db,
    `insert into isms.complexity_assessment (organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [need(b['organizationId'], 'organizationId'), JSON.stringify(b['facts'] ?? {}), b['policyVersion'] ?? '2026-11.1',
      JSON.stringify(b['derivation'] ?? {}), b['recommendedProfile'], b['minProfile'], personId]);
  return one(db,
    `insert into isms.profile_decision (complexity_assessment_id, profile, deviation, justification, decided_by, reviewed_by)
     values ($1, $2, $3, $4, $5, $6) returning id, profile`,
    [ca.id, b['profile'], b['deviation'] ?? 'none', b['justification'] ?? null, personId, b['reviewedBy'] ?? null]);
}

// ---------------------------------------------------------------------------
// Intake (WP-02/03)
// ---------------------------------------------------------------------------

export async function createIntake(db: Db, b: Row, personId: string) {
  const route = need(b['route'], 'route') as EntryRoute;
  // Kern prüft Hinweisbestätigung und Ziel und belegt den Gegenstand aus der Zielauswahl
  let core: IntakeCase;
  try {
    core = coreCreateIntake('neu', route, {
    consentGiven: b['consentGiven'] === true,
    ...(typeof b['goalCode'] === 'string' ? { goalCode: b['goalCode'] } : {}),
    ...(typeof b['concern'] === 'string' ? { concern: b['concern'] } : {}),
    });
  } catch (e) {
    throw new ApiError(422, 'regelverstoss', (e as Error).message);
  }
  const intake = await one<{ id: string }>(db,
    `insert into isms.intake_case (entry_route, goal_code, concern, consent_at, created_by) values ($1, $2, $3, now(), $4) returning id`,
    [route, core.goalCode ?? null, core.concern ?? null, personId]);
  for (const f of core.facts) await insertFact(db, intake.id, f);
  return { id: intake.id };
}

async function insertFact(db: Db, intakeId: string, f: Pick<ContextFact, 'key' | 'value' | 'source' | 'sourceRef'>) {
  await db.query(`update isms.context_fact set superseded_at = now() where intake_id = $1 and fact_key = $2 and object_id is null and superseded_at is null`,
    [intakeId, f.key]);
  await db.query(`insert into isms.context_fact (intake_id, fact_key, value, source_type, source_ref) values ($1, $2, $3, $4, $5)`,
    [intakeId, f.key, JSON.stringify(f.value), f.source, f.sourceRef ?? null]);
}

export async function recordFact(db: Db, intakeId: string, b: Row) {
  await insertFact(db, intakeId, { key: need(b['key'], 'key'), value: b['value'], source: (b['source'] as ContextFact['source']) ?? 'customer_input', sourceRef: (b['sourceRef'] as string) ?? 'Intake-Formular' });
  return { ok: true };
}

export async function switchRoute(db: Db, intakeId: string, b: Row) {
  await change(db, 'update isms.intake_case set entry_route = $2, goal_code = coalesce($3, goal_code) where id = $1', [intakeId, need(b['route'], 'route'), b['goalCode'] ?? null]);
  return { ok: true };
}

async function loadIntake(db: Db, intakeId: string): Promise<IntakeCase> {
  const i = await one<{ entry_route: EntryRoute; goal_code: string | null; concern: string | null }>(db,
    'select entry_route, goal_code, concern from isms.intake_case where id = $1', [intakeId]);
  const facts = await db.query(`select fact_key, value, source_type, source_ref, verification_status from isms.context_fact
                                 where intake_id = $1 and superseded_at is null and object_id is null order by recorded_at`, [intakeId]);
  return {
    id: intakeId, route: i.entry_route, consentGiven: true, routeHistory: [i.entry_route],
    ...(i.goal_code ? { goalCode: i.goal_code } : {}), ...(i.concern ? { concern: i.concern } : {}),
    facts: facts.rows.map((r) => ({ key: r.fact_key, value: r.value, source: r.source_type, sourceRef: r.source_ref ?? undefined, state: r.verification_status })),
  };
}

export async function intakeOrientation(db: Db, intakeId: string) {
  const i = await loadIntake(db, intakeId);
  return { orientation: coreOrientation(i), questions: nextQuestions(i).ask.map((a) => ({ id: a.question.id, key: a.question.key, text: a.question.text, materiality: a.materiality, reason: a.reason })) };
}

// ---------------------------------------------------------------------------
// Prüfvorgang, Objekte, Scope (WP-04)
// ---------------------------------------------------------------------------

export async function createCase(db: Db, b: Row) {
  return one(db, `insert into isms.assessment_case (intake_id, entry_route, status) select id, entry_route, 'scope_draft' from isms.intake_case where id = $1 returning id, status`,
    [need(b['intakeId'], 'intakeId')]);
}

export async function createObject(db: Db, b: Row) {
  return one(db, `insert into isms.assessment_object (organization_id, object_type, name, version, boundaries) values ($1, $2, $3, $4, $5) returning id`,
    [need(b['organizationId'], 'organizationId'), need(b['type'], 'type'), need(b['name'], 'name'), b['version'] ?? null, need(b['boundaries'], 'boundaries')]);
}

export async function createScopeVersion(db: Db, caseId: string, b: Row) {
  const next = await one<{ v: number }>(db, 'select coalesce(max(version), 0) + 1 as v from isms.scope_version where case_id = $1', [caseId]);
  const s = await one<{ id: string }>(db,
    `insert into isms.scope_version (case_id, version, goal, criteria, exclusions, handling_mode, assurance_statement, depth_profile, criteria_versions)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
    [caseId, next.v, need(b['goal'], 'goal'), need(b['criteria'], 'criteria'), b['exclusions'] ?? null, need(b['handlingMode'], 'handlingMode'),
      need(b['assuranceStatement'], 'assuranceStatement'), b['depthProfile'] ?? null, JSON.stringify(b['criteriaVersions'] ?? {})]);
  for (const o of (b['objectIds'] as string[] | undefined) ?? []) await db.query('insert into isms.scope_object values ($1, $2)', [s.id, o]);
  return { id: s.id, version: next.v };
}

export async function approveScope(db: Db, scopeId: string, personId: string) {
  const s = await one<{ case_id: string }>(db, 'select case_id from isms.scope_version where id = $1', [scopeId]);
  // Änderung = neue Version: die bisher freigegebene wird ersetzt
  await db.query(`update isms.scope_version set status = 'superseded' where case_id = $1 and status = 'approved' and id <> $2`, [s.case_id, scopeId]);
  await change(db, `update isms.scope_version set status = 'approved', approved_by = $2, approved_at = now() where id = $1`, [scopeId, personId]);
  // Prüfvorgang folgt der Freigabe (sonst bliebe er im Scope-Entwurf stehen)
  await db.query(`update isms.assessment_case set status = 'scope_approved' where id = $1 and status = 'scope_draft'`, [s.case_id]);
  return { ok: true };
}

export async function setCaseStatus(db: Db, caseId: string, b: Row) {
  await change(db, 'update isms.assessment_case set status = $2, limitations = coalesce($3, limitations) where id = $1', [caseId, need(b['status'], 'status'), b['limitations'] ?? null]);
  return one(db, 'select id, status from isms.assessment_case where id = $1', [caseId]);
}

// ---------------------------------------------------------------------------
// Angebot und Mandat (WP-05)
// ---------------------------------------------------------------------------

export async function createOffer(db: Db, caseId: string, b: Row, personId: string) {
  const next = await one<{ v: number }>(db, 'select coalesce(max(version), 0) + 1 as v from isms.offer where case_id = $1', [caseId]);
  await db.query(`update isms.offer set status = 'superseded' where case_id = $1 and status in ('draft', 'sent')`, [caseId]);
  return one(db,
    `insert into isms.offer (case_id, version, scope_version_id, customer_id, engagement_type, depth_profile, planned_start, service_description, customer_wants_certificate, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id, version, status`,
    [caseId, next.v, need(b['scopeVersionId'], 'scopeVersionId'), need(b['customerId'], 'customerId'), need(b['engagementType'], 'engagementType'),
      b['depthProfile'], need(b['plannedStart'], 'plannedStart'), need(b['serviceDescription'], 'serviceDescription'), b['customerWantsCertificate'] === true, personId]);
}

export async function sendOffer(db: Db, offerId: string, b: Row) {
  const o = await one<{ service_description: string; customer_wants_certificate: boolean }>(db,
    'select service_description, customer_wants_certificate from isms.offer where id = $1', [offerId]);
  const fehler = checkOfferText({ serviceDescription: o.service_description, customerWantsCertificate: o.customer_wants_certificate });
  if (fehler.length) throw new ApiError(422, 'regelverstoss', fehler.join('; '));
  const days = typeof b['validityDays'] === 'number' ? b['validityDays'] : DEFAULT_OFFER_VALIDITY_DAYS;
  await change(db, `update isms.offer set status = 'sent', sent_at = current_date, valid_until = current_date + $2::int where id = $1`, [offerId, days]);
  return one(db, 'select id, status, sent_at, valid_until from isms.offer where id = $1', [offerId]);
}

/** Unterschrift: idempotent – dieselbe Nachricht oder dasselbe Angebot ergibt immer dasselbe Mandat (TC-20) */
export async function signOffer(db: Db, offerId: string, b: Row) {
  const r = await one<{ mandate_id: string }>(db, 'select isms.handle_signed_mandate($1, $2) as mandate_id', [need(b['eventId'], 'eventId'), offerId]);
  return { mandateId: r.mandate_id };
}

export async function addTeamMember(db: Db, mandateId: string, b: Row) {
  const personId = need(b['personId'], 'personId');
  await db.query('insert into isms.mandate_participant values ($1, $2) on conflict do nothing', [mandateId, personId]);
  for (const role of (b['roles'] as string[] | undefined) ?? []) {
    await db.query('insert into isms.mandate_role values ($1, $2, $3) on conflict do nothing', [mandateId, personId, role]);
  }
  return { ok: true };
}

export async function activateMandate(db: Db, mandateId: string, b: Row) {
  await change(db, `update isms.mandate set status = 'active', profile_decision_id = $2 where id = $1`, [mandateId, need(b['profileDecisionId'], 'profileDecisionId')]);
  return one(db, 'select id, status from isms.mandate where id = $1', [mandateId]);
}

// ---------------------------------------------------------------------------
// Nachweise (WP-06)
// ---------------------------------------------------------------------------

const ABLAGE = process.env['ISMS_EVIDENCE_DIR'] ?? join(process.cwd(), '.data', 'evidence');

export async function uploadEvidence(db: Db, mandateId: string, b: Row, personId: string) {
  const content = Buffer.from(need(b['contentBase64'], 'contentBase64'), 'base64');
  const hash = sha256(content);
  const vorhanden = await db.query('select id from isms.evidence where mandate_id = $1 and sha256 = $2', [mandateId, hash]);
  if (vorhanden.rows[0]) return { id: vorhanden.rows[0].id as string, duplicate: true, securityEvent: false };
  const e = await one<{ id: string }>(db,
    `insert into isms.evidence (mandate_id, kind, source, captured_at, captured_by, version, sha256, storage_ref, classification, valid_until)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
    [mandateId, b['kind'] ?? 'evidence', need(b['source'], 'source'), need(b['capturedAt'], 'capturedAt'), personId, b['version'] ?? null,
      hash, `local:${hash}`, b['classification'] ?? 'confidential', b['validUntil'] ?? null]);
  // Prototyp: lokale Ablage; der verschlüsselte Speicher folgt mit der Hosting-Entscheidung (ENT-032)
  mkdirSync(ABLAGE, { recursive: true });
  writeFileSync(join(ABLAGE, hash), content);
  // Dateiinhalt ist Daten, nie Anweisung (TC-11)
  const ereignis = scanUntrusted(e.id, content.toString('utf-8'));
  if (ereignis) await db.query('select isms.log_security_event($1, $2, $3)', [mandateId, e.id, ereignis.findings]);
  return { id: e.id, duplicate: false, securityEvent: !!ereignis };
}

export async function reviewEvidence(db: Db, evidenceId: string, b: Row, personId: string) {
  await change(db, 'update isms.evidence set review_state = $2, reviewed_by = $3, reviewed_at = now() where id = $1', [evidenceId, need(b['state'], 'state'), personId]);
  return { ok: true };
}

export async function createControlAssessment(db: Db, mandateId: string, b: Row) {
  return one(db,
    `insert into isms.control_assessment (mandate_id, control_id, object_id, applicability, base_depth, required_depth, implementation)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [mandateId, need(b['controlId'], 'controlId'), b['objectId'] ?? null, b['applicability'] ?? 'applicable', b['baseDepth'] ?? 1, b['requiredDepth'] ?? 1, b['implementation'] ?? 'unknown']);
}

export async function updateControlAssessment(db: Db, id: string, b: Row) {
  const felder: Record<string, string> = { implementation: 'implementation', effectiveness: 'effectiveness', evidenceState: 'evidence_state', approval: 'approval' };
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [k, col] of Object.entries(felder)) if (k in b) { params.push(b[k]); sets.push(`${col} = $${params.length}`); }
  if (!sets.length) throw new ApiError(400, 'pflichtfeld', 'Keine Änderung angegeben');
  await change(db, `update isms.control_assessment set ${sets.join(', ')} where id = $1`, params);
  await db.query('set constraints all immediate'); // R1/R2 sofort prüfen, nicht erst am Ende
  return one(db, 'select id, report_status from isms.control_assessment where id = $1', [id]);
}

export async function linkEvidence(db: Db, b: Row) {
  await db.query('insert into isms.assessment_evidence (evidence_id, control_assessment_id, requirement_assessment_id, scope_version_id) values ($1, $2, $3, $4)',
    [need(b['evidenceId'], 'evidenceId'), b['controlAssessmentId'] ?? null, b['requirementAssessmentId'] ?? null, b['scopeVersionId'] ?? null]);
  return one(db, 'select link_state, open_checks from isms.assessment_evidence where evidence_id = $1 and (control_assessment_id = $2 or requirement_assessment_id = $3)',
    [b['evidenceId'], b['controlAssessmentId'] ?? null, b['requirementAssessmentId'] ?? null]);
}

export async function confirmEvidenceLink(db: Db, b: Row, personId: string) {
  await change(db, `update isms.assessment_evidence set link_state = 'confirmed', open_checks = '{}', reviewed_by = $3, reviewed_at = now(), review_note = $4
                  where evidence_id = $1 and control_assessment_id = $2`, [need(b['evidenceId'], 'evidenceId'), need(b['controlAssessmentId'], 'controlAssessmentId'), personId, b['note'] ?? null]);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// KI-Vorschläge (WP-08)
// ---------------------------------------------------------------------------

export async function createProposal(db: Db, mandateId: string, b: Row) {
  return one(db,
    `insert into isms.ai_proposal (mandate_id, target_table, target_id, payload, sources, model, prompt_version, scope_version_id, uncertainty, supersedes)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id, status`,
    [mandateId, need(b['targetTable'], 'targetTable'), need(b['targetId'], 'targetId'), JSON.stringify(b['payload'] ?? {}), JSON.stringify(b['sources'] ?? []),
      need(b['model'], 'model'), need(b['promptVersion'], 'promptVersion'), need(b['scopeVersionId'], 'scopeVersionId'), need(b['uncertainty'], 'uncertainty'), b['supersedes'] ?? null]);
}

export async function reviewProposal(db: Db, proposalId: string, b: Row, personId: string) {
  const action = need(b['action'], 'action');
  const q = (sql: string, p: unknown[]) => change(db, sql, [proposalId, ...p]);
  switch (action) {
    case 'start_review': await q(`update isms.ai_proposal set status = 'in_review' where id = $1`, []); break;
    case 'accept': await q(`update isms.ai_proposal set status = 'verified', reviewed_by = $2, reviewed_at = now() where id = $1`, [personId]); break;
    case 'correct': await q(`update isms.ai_proposal set status = 'verified', payload = $3, reviewed_by = $2, reviewed_at = now() where id = $1`, [personId, JSON.stringify(b['payload'] ?? {})]); break;
    case 'reject': await q(`update isms.ai_proposal set status = 'rejected_with_reason', reason = $3, reviewed_by = $2, reviewed_at = now() where id = $1`, [personId, b['reason'] ?? null]); break;
    case 'defer': await q(`update isms.ai_proposal set status = 'deferred_with_owner_impact_trigger', defer_owner = $3, defer_impact = $4, defer_trigger = $5, reviewed_by = $2, reviewed_at = now() where id = $1`,
      [personId, b['owner'] ?? null, b['impact'] ?? null, b['trigger'] ?? null]); break;
    case 'lock': await q(`update isms.ai_proposal set status = 'persisted_locked', reviewed_by = $2, reviewed_at = now() where id = $1`, [personId]); break;
    default: throw new ApiError(400, 'ungueltig', `Unbekannte Aktion „${action}“`);
  }
  const r = await one<{ status: string }>(db, 'select status from isms.ai_proposal where id = $1', [proposalId]);
  return { id: proposalId, status: r.status };
}

// ---------------------------------------------------------------------------
// Normversion (TC-17)
// ---------------------------------------------------------------------------

export async function decideVersionImpact(db: Db, impactId: string, b: Row, personId: string) {
  await change(db, 'update isms.version_impact set decision = $2, rationale = $3, decided_by = $4, decided_at = now() where id = $1',
    [impactId, need(b['decision'], 'decision'), need(b['rationale'], 'rationale'), personId]);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Bericht, QA, Veröffentlichung (WP-10)
// ---------------------------------------------------------------------------

export async function createReport(db: Db, caseId: string, b: Row, personId: string) {
  const next = await one<{ v: number; prev: string | null }>(db,
    `select coalesce(max(version), 0) + 1 as v, (select id from isms.report_version where case_id = $1 and status = 'published') as prev
       from isms.report_version where case_id = $1`, [caseId]);
  return one(db,
    `insert into isms.report_version (case_id, version, scope_version_id, content, report_text, limitations, material_unknowns, author_id, previous_id, change_log)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id, version, status`,
    [caseId, next.v, need(b['scopeVersionId'], 'scopeVersionId'), JSON.stringify(b['content'] ?? {}), need(b['reportText'], 'reportText'),
      b['limitations'] ?? null, (b['materialUnknowns'] as string[] | undefined) ?? [], personId, next.prev, b['changeLog'] ?? null]);
}

export async function submitReport(db: Db, reportId: string) {
  await change(db, `update isms.report_version set status = 'in_qa' where id = $1`, [reportId]);
  return { ok: true };
}

export async function qaDecision(db: Db, reportId: string, b: Row, personId: string) {
  const decision = need(b['decision'], 'decision');
  const status = { approve: 'approved', approve_with_explicit_limitations: 'approved', return_for_rework: 'returned', reject_stop: 'stopped' }[decision];
  if (!status) throw new ApiError(400, 'ungueltig', `Unbekannte QA-Entscheidung „${decision}“`);
  // D-12: Zielphase aus den QA-Punkten berechnen, falls nicht vorgegeben
  const target = decision === 'return_for_rework' ? (b['reworkTarget'] as string | undefined) ?? reworkTarget((b['issues'] as PackageIssue[] | undefined) ?? []) : null;
  await change(db,
    `update isms.report_version set status = $2, qa_decision = $3, qa_reason = $4, rework_target = $5, limitations = coalesce($6, limitations),
            reviewer_id = $7, qa_at = now() where id = $1`,
    [reportId, status, decision, b['reason'] ?? null, target ?? null, b['limitations'] ?? null, personId]);
  return one(db, 'select id, status, qa_decision, rework_target from isms.report_version where id = $1', [reportId]);
}

export async function publishReport(db: Db, reportId: string, personId: string) {
  const r = await one<{ case_id: string; content: unknown; report_text: string; limitations: string | null }>(db,
    'select case_id, content, report_text, limitations from isms.report_version where id = $1', [reportId]);
  const snapshot = await db.query(
    `select distinct e.id as evidence_id, e.sha256 from isms.assessment_evidence ae
       join isms.evidence e on e.id = ae.evidence_id
       join isms.control_assessment ca on ca.id = ae.control_assessment_id
       join isms.assessment_case c on c.mandate_id = ca.mandate_id
      where c.id = $1 and ae.link_state = 'confirmed' order by 1`, [r.case_id]);
  const hash = createHash('sha256').update(JSON.stringify({ content: r.content, text: r.report_text, limitations: r.limitations })).digest('hex');
  await change(db, `update isms.report_version set status = 'published', published_by = $2, published_at = now(), content_sha256 = $3, evidence_snapshot = $4 where id = $1`,
    [reportId, personId, hash, JSON.stringify(snapshot.rows)]);
  return one(db, 'select id, status, content_sha256 from isms.report_version where id = $1', [reportId]);
}

export async function caseOverview(db: Db, caseId: string) {
  const c = await one(db, 'select id, status, mandate_id, limitations from isms.assessment_case where id = $1', [caseId]);
  const scope = await db.query('select id, version, status from isms.scope_version where case_id = $1 order by version', [caseId]);
  const offers = await db.query('select id, version, status, valid_until from isms.offer where case_id = $1 order by version', [caseId]);
  const reports = await db.query('select id, version, status, qa_decision from isms.report_version where case_id = $1 order by version', [caseId]);
  const impacts = await db.query('select id, framework, old_version, new_version, decision from isms.version_impact where case_id = $1', [caseId]);
  return { case: c, scopeVersions: scope.rows, offers: offers.rows, reports: reports.rows, versionImpacts: impacts.rows };
}

// ---------------------------------------------------------------------------
// Etappe 2: Storno, offene Fragen, Normversion, Fristen-Lauf, Spurprotokoll
// ---------------------------------------------------------------------------

/** TC-19: Storno nur mit dokumentierter Daten- und Vertragsentscheidung */
export async function terminateMandate(db: Db, mandateId: string, b: Row, personId: string) {
  await db.query(
    `insert into isms.mandate_termination (mandate_id, reason, data_decision, retain_until, retention_basis, contract_decision, decided_by)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [mandateId, need(b['reason'], 'reason'), need(b['dataDecision'], 'dataDecision'), b['retainUntil'] ?? null, b['retentionBasis'] ?? null,
      need(b['contractDecision'], 'contractDecision'), personId]);
  await change(db, `update isms.mandate set status = 'terminated' where id = $1`, [mandateId]);
  return one(db, 'select id, status from isms.mandate where id = $1', [mandateId]);
}

/** Offene Frage im Prüfvorgang (D-06, US-B2) */
export async function createQuestion(db: Db, caseId: string, b: Row) {
  return one(db,
    `insert into isms.open_question (case_id, question_code, text, materiality, state, na_justification, owner, due_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id, state`,
    [caseId, need(b['code'], 'code'), need(b['text'], 'text'), need(b['materiality'], 'materiality'), b['state'] ?? 'open',
      b['naJustification'] ?? null, b['owner'] ?? null, b['dueAt'] ?? null]);
}

export async function updateQuestion(db: Db, questionId: string, b: Row) {
  await change(db,
    `update isms.open_question set state = coalesce($2, state), na_justification = coalesce($3, na_justification),
            limitation_ref = coalesce($4, limitation_ref), owner = coalesce($5, owner), due_at = coalesce($6, due_at) where id = $1`,
    [questionId, b['state'] ?? null, b['naJustification'] ?? null, b['limitationRef'] ?? null, b['owner'] ?? null, b['dueAt'] ?? null]);
  return one(db, 'select id, state, limitation_ref from isms.open_question where id = $1', [questionId]);
}

/** Neue Normversion hinterlegen (Methodik) – löst Folgeprüfungen aus (TC-17) */
export async function createFrameworkVersion(db: Db, b: Row) {
  await db.query('insert into isms.framework_version (framework, version, effective_from, supersedes, note) values ($1, $2, $3, $4, $5)',
    [need(b['framework'], 'framework'), need(b['version'], 'version'), need(b['effectiveFrom'], 'effectiveFrom'), b['supersedes'] ?? null, b['note'] ?? null]);
  const r = await db.query('select id, case_id from isms.version_impact where framework = $1 and new_version = $2', [b['framework'], b['version']]);
  return { impacts: r.rows };
}

/** Fristen-Lauf (Timer-Job, DEC-10) – Systemaufruf */
export async function expireOffers(db: Db, b: Row) {
  const r = await one<{ n: number }>(db, 'select isms.expire_offers($1::date) as n', [b['today'] ?? new Date().toISOString().slice(0, 10)]);
  return { expired: r.n };
}

/**
 * Spurprotokoll eines Berichts (WP-11): die vollständige Kette von der Anfrage bis zum Bericht.
 * `gaps` nennt jede Stelle, an der die Kette abreißt – leer heißt: lückenlos nachvollziehbar.
 */
export async function traceReport(db: Db, reportId: string) {
  // enthält interne Daten (Protokoll, KI-Vorschläge, Prüfer) – nur DT Agency
  const agentur = await one<{ ok: boolean }>(db, 'select isms.is_agency() and not isms.is_ai_session() as ok');
  if (!agentur.ok) throw new ApiError(403, 'keine_berechtigung', 'Spurprotokoll nur für DT Agency');
  const report = await one<Row & { case_id: string; scope_version_id: string }>(db,
    `select id, case_id, version, status, scope_version_id, author_id, reviewer_id, qa_decision, qa_at, published_by, published_at,
            content_sha256, evidence_snapshot, limitations, material_unknowns, previous_id, change_log from isms.report_version where id = $1`, [reportId]);
  const fall = await one<Row & { mandate_id: string | null; intake_id: string | null }>(db,
    'select id, status, mandate_id, intake_id, entry_route, limitations from isms.assessment_case where id = $1', [report.case_id]);
  const scope = await one(db, 'select id, version, status, goal, criteria, handling_mode, assurance_statement, depth_profile, criteria_versions, approved_by, approved_at from isms.scope_version where id = $1', [report.scope_version_id]);
  const objects = (await db.query(`select o.id, o.object_type, o.name, o.version, o.boundaries from isms.scope_object so join isms.assessment_object o on o.id = so.object_id
                                    where so.scope_version_id = $1`, [report.scope_version_id])).rows;
  const mandate = fall.mandate_id ? (await db.query('select id, status, engagement_type, depth_profile, offer_id, profile_decision_id from isms.mandate where id = $1', [fall.mandate_id])).rows[0] : undefined;
  const offer = mandate?.offer_id ? (await db.query('select id, version, status, sent_at, valid_until, scope_version_id from isms.offer where id = $1', [mandate.offer_id])).rows[0] : undefined;
  const intake = fall.intake_id ? (await db.query('select id, entry_route, goal_code, consent_at from isms.intake_case where id = $1', [fall.intake_id])).rows[0] : undefined;
  const facts = fall.intake_id ? (await db.query(`select fact_key, value, source_type, source_ref, verification_status from isms.context_fact
                                                  where intake_id = $1 and superseded_at is null order by recorded_at`, [fall.intake_id])).rows : [];
  const assessments = fall.mandate_id ? (await db.query(`select id, control_id, object_id, report_status, evidence_state, approval from isms.control_assessment
                                                         where mandate_id = $1 order by control_id`, [fall.mandate_id])).rows : [];
  const links = fall.mandate_id ? (await db.query(`select ae.control_assessment_id, ae.link_state, e.id as evidence_id, e.sha256, e.source, e.captured_at, e.review_state
                                                    from isms.assessment_evidence ae join isms.evidence e on e.id = ae.evidence_id
                                                    join isms.control_assessment ca on ca.id = ae.control_assessment_id
                                                   where ca.mandate_id = $1`, [fall.mandate_id])).rows : [];
  const proposals = fall.mandate_id ? (await db.query(`select id, target_id, status, model, prompt_version, sources, reviewed_by, original_payload is not null as corrected
                                                        from isms.ai_proposal where mandate_id = $1 order by created_at`, [fall.mandate_id])).rows : [];
  const impacts = (await db.query('select framework, old_version, new_version, decision, decided_by from isms.version_impact where case_id = $1', [report.case_id])).rows;
  const events = fall.mandate_id ? (await db.query(`select occurred_at, actor_kind, event_type, object_table, details from isms.audit_event
                                                     where mandate_id = $1 order by id`, [fall.mandate_id])).rows : [];

  const gaps: string[] = [];
  if (!intake) gaps.push('Prüfvorgang ohne Intake');
  if (!mandate) gaps.push('Prüfvorgang ohne Mandat');
  if (mandate && !offer) gaps.push('Mandat ohne Angebot');
  if (offer && offer.scope_version_id !== report.scope_version_id) gaps.push('Bericht bezieht sich auf eine andere Scope-Version als das Angebot');
  if (!objects.length) gaps.push('Scope ohne Bewertungsobjekt');
  if (!Object.keys((scope['criteria_versions'] as object) ?? {}).length) gaps.push('Scope ohne festgelegte Normversion');
  for (const a of assessments) {
    const belegt = links.some((l) => l.control_assessment_id === a.id && l.link_state === 'confirmed');
    if (['met', 'partially_met'].includes(String(a.report_status)) && !belegt) gaps.push(`Bewertung ${a.control_id}: Ergebnis ohne bestätigten Nachweis`);
  }
  for (const l of links) if (!/^[0-9a-f]{64}$/.test(String(l.sha256 ?? ''))) gaps.push(`Nachweis ${l.evidence_id} ohne Fingerabdruck`);
  for (const p of proposals) {
    if (!Array.isArray(p.sources) || !p.sources.length) gaps.push(`KI-Vorschlag ${p.id} ohne Fundstelle`);
    if (['verified', 'persisted_locked'].includes(String(p.status)) && !p.reviewed_by) gaps.push(`KI-Vorschlag ${p.id} ohne menschliche Prüfung`);
  }
  for (const i of impacts) if (!i.decision) gaps.push(`Folgeprüfung ${i.framework} ${i.new_version} ohne Entscheidung`);
  if (report.status === 'published' && (!report['reviewer_id'] || !report['content_sha256'])) gaps.push('Veröffentlichung ohne QA oder Fingerabdruck');
  if (!events.length) gaps.push('kein Protokoll');

  return { report, case: fall, scope: { ...scope, objects }, offer, mandate, intake: intake ? { ...intake, facts } : undefined, assessments, evidence: links, proposals, versionImpacts: impacts, events, gaps };
}

// ---------------------------------------------------------------------------
// Etappe 3: Leseaufrufe für die Oberfläche
// ---------------------------------------------------------------------------

/** Intakes, die die angemeldete Person sehen darf (eigene bzw. alle für DT Agency) */
export async function listIntakes(db: Db) {
  const r = await db.query(
    `select i.id, i.entry_route, i.goal_code, i.phase, i.created_at, p.display_name as created_by_name,
            (select c.id from isms.assessment_case c where c.intake_id = i.id limit 1) as case_id
       from isms.intake_case i left join isms.person p on p.id = i.created_by order by i.created_at desc`);
  return r.rows;
}

export async function listCases(db: Db) {
  const r = await db.query(
    `select c.id, c.status, c.mandate_id, c.intake_id, i.goal_code, c.created_at
       from isms.assessment_case c left join isms.intake_case i on i.id = c.intake_id order by c.created_at desc`);
  return r.rows;
}

/** Organisation des Falls: die des Kunden, der die Anfrage gestellt hat */
async function caseOrganization(db: Db, caseId: string): Promise<string | null> {
  const r = await db.query(
    `select p.organization_id from isms.assessment_case c join isms.intake_case i on i.id = c.intake_id
       join isms.person p on p.id = i.created_by where c.id = $1`, [caseId]);
  return (r.rows[0]?.organization_id as string | undefined) ?? null;
}

/** Arbeitsansicht für DT Agency – alles, was die Person im Fall sehen darf */
export async function caseWorkspace(db: Db, caseId: string) {
  const base = await caseOverview(db, caseId);
  const org = await caseOrganization(db, caseId);
  const m = base.case['mandate_id'] as string | null;
  const q = async (sql: string, p: unknown[]) => (await db.query(sql, p)).rows;
  return {
    ...base,
    organizationId: org,
    objects: org ? await q('select id, object_type, name, version, boundaries from isms.assessment_object where organization_id = $1 order by created_at', [org]) : [],
    scopeDetails: await q(`select s.id, s.version, s.status, s.goal, s.criteria, s.handling_mode, s.assurance_statement, s.depth_profile, s.criteria_versions,
                                  coalesce((select array_agg(object_id) from isms.scope_object where scope_version_id = s.id), '{}') as object_ids
                             from isms.scope_version s where s.case_id = $1 order by s.version`, [caseId]),
    mandate: m ? (await q('select id, status, engagement_type, depth_profile, offered_depth from isms.mandate where id = $1', [m]))[0] ?? null : null,
    team: m ? await q(`select p.id, p.display_name, p.party, coalesce(array_agg(r.role) filter (where r.role is not null), '{}') as roles
                         from isms.mandate_participant mp join isms.person p on p.id = mp.person_id
                         left join isms.mandate_role r on r.mandate_id = mp.mandate_id and r.person_id = mp.person_id
                        where mp.mandate_id = $1 group by p.id, p.display_name, p.party order by p.party, p.display_name`, [m]) : [],
    evidence: m ? await q('select id, source, captured_at, review_state, sha256, kind from isms.evidence where mandate_id = $1 order by captured_at, id', [m]) : [],
    assessments: m ? await q(`select ca.id, ca.control_id, c.title, ca.object_id, ca.implementation, ca.effectiveness, ca.evidence_state, ca.approval, ca.report_status
                                from isms.control_assessment ca join isms.control c on c.id = ca.control_id where ca.mandate_id = $1 order by ca.control_id`, [m]) : [],
    links: m ? await q(`select ae.evidence_id, ae.control_assessment_id, ae.link_state, ae.open_checks from isms.assessment_evidence ae
                          join isms.control_assessment ca on ca.id = ae.control_assessment_id where ca.mandate_id = $1`, [m]) : [],
    proposals: m ? await q('select id, target_id, status, payload, original_payload, sources, model, prompt_version, uncertainty, reason from isms.ai_proposal where mandate_id = $1 order by created_at', [m]) : [],
    questions: await q('select id, question_code, text, materiality, state, limitation_ref from isms.open_question where case_id = $1 order by created_at', [caseId]),
    controls: await q('select id, title from isms.control order by id', []),
  };
}

export async function readReport(db: Db, reportId: string) {
  return one(db, `select id, version, status, report_text, limitations, material_unknowns, qa_decision, published_at, content_sha256, change_log
                    from isms.report_version where id = $1`, [reportId]);
}

/**
 * Fortschritt je Mandat (ENT-037): dieselbe Ansicht für Kunde und Berater. Gezählt wird nur, was
 * beide sehen dürfen (Freigegebenes) – sonst wichen die Zahlen je nach Rolle ab. Kein Prozentwert.
 */
export async function caseDashboard(db: Db, caseId: string) {
  const c = await one<{ status: string; mandate_id: string | null; intake_id: string | null; limitations: string | null }>(db,
    'select status, mandate_id, intake_id, limitations from isms.assessment_case where id = $1', [caseId]);
  const m = c.mandate_id;
  const zahl = async (sql: string, p: unknown[]) => Number((await db.query(sql, p)).rows[0]?.n ?? 0);
  const scopeFrei = await zahl(`select count(*) as n from isms.scope_version where case_id = $1 and status = 'approved'`, [caseId]);
  const angebot = (await db.query(`select status, valid_until from isms.offer where case_id = $1 and status <> 'draft' order by version desc limit 1`, [caseId])).rows[0];
  const mandat = m ? (await db.query('select status from isms.mandate where id = $1', [m])).rows[0] : undefined;
  const nachweise = m ? await zahl('select count(*) as n from isms.evidence where mandate_id = $1', [m]) : 0;
  const geeignet = m ? await zahl(`select count(*) as n from isms.evidence where mandate_id = $1 and review_state = 'suitable'`, [m]) : 0;
  const bewertet = m ? await zahl(`select count(*) as n from isms.control_assessment where mandate_id = $1 and approval in ('approved', 'filed')`, [m]) : 0;
  const fragen = await zahl(`select count(*) as n from isms.open_question where case_id = $1 and materiality = 'material' and state in ('open', 'unknown', 'deferred') and limitation_ref is null`, [caseId]);
  const bericht = (await db.query(`select id, version, published_at from isms.report_version where case_id = $1 and status = 'published'`, [caseId])).rows[0];

  const reihe = ['scope_draft', 'scope_approved', 'collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review', 'qa', 'approved', 'published', 'closed', 'closed_with_limitations'];
  const pos = reihe.indexOf(c.status);
  const stand = (fertig: boolean, laeuft: boolean) => (fertig ? 'erledigt' : laeuft ? 'in_arbeit' : 'offen');
  const phasen = [
    { name: 'Scope', stand: stand(scopeFrei > 0, true), detail: scopeFrei ? 'Scope freigegeben' : 'Scope in Abstimmung' },
    { name: 'Angebot und Auftrag', stand: stand(!!mandat && ['active', 'closed'].includes(String(mandat.status)), !!angebot),
      detail: mandat ? `Mandat ${mandat.status === 'active' ? 'aktiv' : mandat.status}` : angebot ? `Angebot ${angebot.status === 'sent' ? `offen bis ${String(angebot.valid_until).slice(0, 10)}` : angebot.status}` : 'noch kein Angebot' },
    { name: 'Nachweise', stand: stand(pos >= reihe.indexOf('ready_for_assessment'), pos >= reihe.indexOf('collecting_evidence')), detail: `${geeignet} von ${nachweise} Nachweisen geprüft und geeignet` },
    { name: 'Bewertung', stand: stand(pos >= reihe.indexOf('internal_review'), pos >= reihe.indexOf('assessing')), detail: `${bewertet} Prüfpunkte freigegeben${fragen ? ` · ${fragen} entscheidungsrelevante Fragen offen` : ''}` },
    { name: 'Qualitätssicherung', stand: stand(pos >= reihe.indexOf('approved'), c.status === 'qa' || c.status === 'rework'), detail: c.status === 'rework' ? 'Nacharbeit' : pos >= reihe.indexOf('approved') ? 'abgeschlossen' : 'noch nicht begonnen' },
    { name: 'Bericht', stand: stand(!!bericht, false), detail: bericht ? `Version ${bericht.version} veröffentlicht` : 'noch nicht veröffentlicht' },
  ];
  const aufgaben: Array<{ wer: string; text: string }> = [];
  if (c.status === 'collecting_evidence') aufgaben.push({ wer: 'Kunde', text: 'Nachweise hochladen' });
  if (fragen) aufgaben.push({ wer: 'Kunde', text: `${fragen} entscheidungsrelevante Fragen klären` });
  if (bericht) aufgaben.push({ wer: 'Kunde', text: `Bericht Version ${bericht.version} lesen und Rückfragen stellen` });
  if (angebot?.status === 'sent') aufgaben.push({ wer: 'Kunde', text: 'Angebot prüfen und unterschreiben' });
  if (!scopeFrei) aufgaben.push({ wer: 'DT Agency', text: 'Scope abstimmen und freigeben' });
  if (c.status === 'qa') aufgaben.push({ wer: 'DT Agency', text: 'Qualitätssicherung des Berichts' });
  return {
    status: c.status, phasen, aufgaben, berichtId: bericht?.id ?? null, einschraenkungen: c.status === 'closed_with_limitations' ? c.limitations : null,
    hinweis: 'Zeigt den Bearbeitungsstand, keine Bewertung des Sicherheitsniveaus.',
  };
}

// ---------------------------------------------------------------------------
// Nur Prototyp (Routen unter /dev, aktiv nur mit ISMS_DEV_AUTH=1)
// ---------------------------------------------------------------------------

export async function devPersons(db: Db) {
  const r = await db.query(`select p.id, p.party, p.display_name, o.name as organization from isms.person p
                              left join isms.organization o on o.id = p.organization_id order by p.party, p.display_name`);
  return r.rows;
}

/**
 * Simuliert einen KI-Vorschlag – läuft über die echte KI-Sitzung (app.actor_kind = ai) mit allen Grenzen:
 * nur Vorschläge, nur im eigenen Mandat, Fundstelle Pflicht. Inhalt ist ein fester Platzhalter, kein Modellaufruf.
 */
export async function devSimulateProposal(db: Db, mandateId: string, b: Row) {
  const ziel = await one<{ id: string; implementation: string }>(db, 'select id, implementation from isms.control_assessment where id = $1', [need(b['assessmentId'], 'assessmentId')]);
  const beleg = await one<{ id: string; source: string }>(db, 'select id, source from isms.evidence where id = $1', [need(b['evidenceId'], 'evidenceId')]);
  const scope = await one<{ id: string }>(db,
    `select s.id from isms.scope_version s join isms.assessment_case c on c.id = s.case_id where c.mandate_id = $1 and s.status = 'approved'`, [mandateId]);
  return createProposal(db, mandateId, {
    targetTable: 'control_assessment', targetId: ziel.id,
    payload: { implementation: ziel.implementation === 'present' ? 'partial' : 'present', hinweis: 'simulierter Vorschlag (Prototyp)' },
    sources: [{ evidence_id: beleg.id, locator: `${beleg.source}, Abschnitt 1` }],
    model: 'simulation', promptVersion: 'DEV-0', scopeVersionId: scope.id, uncertainty: 'simuliert – keine fachliche Aussage',
  });
}
