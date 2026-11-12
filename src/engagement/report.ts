/**
 * Lead-Review, QA und Berichtsfreigabe (MVP WP-10; Journey 01 §4.3; Fachkonzept 02 D-11, D-12, D-13;
 * Backlog 04 US-C3, US-D1, US-D2, TC-13, TC-15, TC-16; DEC-05, DEC-13, DEC-17; ENT-029).
 *
 *  - D-11: Im MVP geht jeder finale Bericht durch QA (DEC-05); QA ≠ Autor (TC-13).
 *  - Review-Paket: jede Feststellung mit Kriterien- und Nachweisbezug oder „nicht beurteilbar“;
 *    Kriterienversionen müssen zum Scope passen (US-C3).
 *  - QA entscheidet: approve · approve_with_explicit_limitations · return_for_rework · reject_stop.
 *    Der Kunde bestätigt Fakten, erteilt aber keine fachliche Freigabe.
 *  - D-12: Nacharbeit geht in die früheste betroffene Phase; kein Versand (TC-15).
 *  - D-13: Abschluss nur ohne offene materielle Unbekannte – sonst nur mit ausdrücklichen
 *    Einschränkungen (closed_with_limitations, TC-16) oder Stopp.
 *  - Veröffentlichte Berichtsversion ist gesperrt; Änderung = neue Version mit Änderungsprotokoll (US-D2).
 */
import { createHash } from 'node:crypto';

export const REVIEW_POLICY = { decisionId: 'D-11', version: '2026-11.1' } as const;
export const REWORK_POLICY = { decisionId: 'D-12', version: '2026-11.1' } as const;
export const COMPLETION_POLICY = { decisionId: 'D-13', version: '2026-11.1' } as const;

/** Pflichtbaustein „Einschränkungen“ (vorschriften.md §A17.3) – Kernsatz, muss im Bericht stehen */
export const EINSCHRAENKUNG_KERNSATZ = 'Dieses Ergebnis ist keine Zertifizierung und kein Audit einer akkreditierten Stelle.';

// ---------------------------------------------------------------------------
// D-11 ReviewRequirement
// ---------------------------------------------------------------------------

export type AssuranceStatement = 'indicative' | 'professionally_reviewed' | 'independently_assessed';
export type ReviewLevel = 'qa' | 'senior_qa' | 'independent';

export function reviewRequirement(i: {
  engagementType: string;
  assuranceStatement: AssuranceStatement;
  depthProfile: 1 | 2 | 3 | 4;
  depthDowngraded: boolean;
}): { reviewRequired: true; sodRequired: true; level: ReviewLevel; reasons: string[] } {
  const reasons = ['DEC-05: im MVP QA für jeden finalen Bericht; QA ist nie der Autor'];
  let level: ReviewLevel = 'qa';
  if (i.depthProfile >= 3 || i.depthDowngraded) {
    level = 'senior_qa';
    reasons.push(i.depthDowngraded ? 'Herabstufung der Tiefe (US-B3)' : `Prüftiefenprofil ${i.depthProfile}`);
  }
  if (i.assuranceStatement === 'independently_assessed' || i.engagementType === 'internal_audit') {
    level = 'independent';
    reasons.push('unabhängige Aussage bzw. internes Audit: Unabhängigkeit des Reviewers erforderlich');
  }
  return { reviewRequired: true, sodRequired: true, level, reasons };
}

// ---------------------------------------------------------------------------
// Berichtsentwurf und Review-Paket (US-C3, US-D1)
// ---------------------------------------------------------------------------

export interface ReportFinding {
  id: string;
  criterionRef?: string;
  criterionVersion?: string;
  evidenceRefs: string[];
  status: 'assessed' | 'not_assessable';
  statement: string;
}

export interface ReportDraft {
  id: string;
  caseId: string;
  version: number;
  scopeVersionId: string;
  authorId: string;
  asOf: string;
  scope: string;
  method: string;
  sampling: string;
  /** Kriterien mit gepinnter Version, z. B. { 'ISO/IEC 27001': '2022' } */
  criteriaVersions: Record<string, string>;
  findings: ReportFinding[];
  recommendations: string[];
  materialUnknowns: string[];
  limitations: string;
  text: string;
}

export interface PackageIssue {
  kind: 'missing_evidence' | 'scope' | 'regulatory' | 'requirements' | 'assessment' | 'report';
  ref: string;
  text: string;
}

export function reviewPackage(d: ReportDraft): PackageIssue[] {
  const out: PackageIssue[] = [];
  for (const f of d.findings) {
    if (!f.criterionRef) out.push({ kind: 'requirements', ref: f.id, text: 'Feststellung ohne Kriterienbezug' });
    if (f.status === 'assessed' && f.evidenceRefs.length === 0) out.push({ kind: 'missing_evidence', ref: f.id, text: 'Feststellung ohne Nachweis – belegen oder „nicht beurteilbar“' });
    if (f.criterionRef) {
      const fw = Object.keys(d.criteriaVersions).find((k) => f.criterionRef!.startsWith(k));
      if (!fw) out.push({ kind: 'requirements', ref: f.id, text: `Kriterium ${f.criterionRef} gehört zu keinem Rahmenwerk des Scopes` });
      else if (f.criterionVersion && f.criterionVersion !== d.criteriaVersions[fw]) {
        out.push({ kind: 'requirements', ref: f.id, text: `Versionskonflikt: ${fw} ${f.criterionVersion} statt ${d.criteriaVersions[fw]}` });
      }
    }
  }
  for (const [feld, wert] of Object.entries({ scope: d.scope, method: d.method, sampling: d.sampling, asOf: d.asOf })) {
    if (!wert.trim()) out.push({ kind: 'report', ref: feld, text: `Bericht ohne Angabe „${feld}“ (US-D1)` });
  }
  if (!Object.keys(d.criteriaVersions).length) out.push({ kind: 'report', ref: 'criteria', text: 'Bericht ohne Kriterienversionen (US-D1)' });
  if (!d.text.includes(EINSCHRAENKUNG_KERNSATZ)) out.push({ kind: 'report', ref: 'limitations', text: 'Pflichtbaustein Einschränkungen fehlt (vorschriften.md §A17.3)' });
  return out;
}

// ---------------------------------------------------------------------------
// D-12 ReworkRouter
// ---------------------------------------------------------------------------

/** frühere Phase zuerst – Nacharbeit geht in die früheste betroffene Phase */
const PHASE_ORDER = ['scope_draft', 'collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review'] as const;
export type ReworkPhase = (typeof PHASE_ORDER)[number];
const ZIEL: Record<PackageIssue['kind'], ReworkPhase> = {
  scope: 'scope_draft',
  regulatory: 'scope_draft',
  missing_evidence: 'collecting_evidence',
  requirements: 'ready_for_assessment',
  assessment: 'assessing',
  report: 'internal_review',
};

export function reworkTarget(issues: Pick<PackageIssue, 'kind'>[]): ReworkPhase | undefined {
  if (!issues.length) return undefined;
  return issues.map((i) => ZIEL[i.kind]).sort((a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b))[0];
}

// ---------------------------------------------------------------------------
// QA-Entscheidung und D-13
// ---------------------------------------------------------------------------

export type QaDecision = 'approve' | 'approve_with_explicit_limitations' | 'return_for_rework' | 'reject_stop';

export interface Reviewer {
  personId: string;
  party: 'agency' | 'customer';
  kind: 'human' | 'ai';
  roles: string[];
}

export interface QaResult {
  decision: QaDecision;
  caseStatus: 'approved' | 'rework' | 'cancelled';
  /** Endstatus nach Veröffentlichung */
  finalStatus?: 'closed' | 'closed_with_limitations';
  reworkTarget?: ReworkPhase;
  sendAllowed: boolean;
  issues: PackageIssue[];
}

export function qaDecide(
  d: ReportDraft,
  decision: QaDecision,
  reviewer: Reviewer,
  opts: { level: ReviewLevel; reason?: string; reworkIssues?: PackageIssue[] },
): { ok: true; result: QaResult } | { ok: false; error: string } {
  if (reviewer.kind !== 'human' || reviewer.party !== 'agency') return { ok: false, error: 'QA entscheidet ein Mensch von DT Agency – nicht Kunde, nicht KI.' };
  if (reviewer.personId === d.authorId) return { ok: false, error: 'Reviewer ist Autor – anderer Reviewer erforderlich (TC-13).' };
  if (!reviewer.roles.includes('independent_reviewer')) return { ok: false, error: 'QA-Freigabe nur durch die Rolle Independent Reviewer.' };

  const issues = reviewPackage(d);
  switch (decision) {
    case 'approve':
      if (issues.length) return { ok: false, error: `Review-Paket nicht vollständig: ${issues.map((i) => i.text).join('; ')}` };
      if (d.materialUnknowns.length) return { ok: false, error: 'Materielle Unbekannte offen – nur mit ausdrücklichen Einschränkungen freigeben (D-13, DEC-13)' };
      return { ok: true, result: { decision, caseStatus: 'approved', finalStatus: 'closed', sendAllowed: true, issues } };
    case 'approve_with_explicit_limitations': {
      const formal = issues.filter((i) => i.kind === 'report');
      if (formal.length) return { ok: false, error: `Bericht formal unvollständig: ${formal.map((i) => i.text).join('; ')}` };
      if (!d.limitations.trim()) return { ok: false, error: 'Freigabe mit Einschränkungen ohne benannte Einschränkungen' };
      const nichtGenannt = d.materialUnknowns.filter((u) => !d.limitations.includes(u));
      if (nichtGenannt.length) return { ok: false, error: `Einschränkungen nennen nicht: ${nichtGenannt.join(', ')} (TC-16: Grenzen prominent)` };
      return { ok: true, result: { decision, caseStatus: 'approved', finalStatus: 'closed_with_limitations', sendAllowed: true, issues } };
    }
    case 'return_for_rework': {
      const target = reworkTarget(opts.reworkIssues?.length ? opts.reworkIssues : issues);
      if (!target) return { ok: false, error: 'Rückgabe ohne benannte QA-Punkte' };
      return { ok: true, result: { decision, caseStatus: 'rework', reworkTarget: target, sendAllowed: false, issues: opts.reworkIssues ?? issues } };
    }
    case 'reject_stop':
      if (!opts.reason?.trim()) return { ok: false, error: 'Stopp ohne Begründung' };
      return { ok: true, result: { decision, caseStatus: 'cancelled', sendAllowed: false, issues } };
  }
}

// ---------------------------------------------------------------------------
// Veröffentlichte, gesperrte Berichtsversion (US-D2, DEC-17)
// ---------------------------------------------------------------------------

export interface ReportVersion {
  readonly reportId: string;
  readonly caseId: string;
  readonly version: number;
  readonly publishedAt: string;
  readonly signatories: readonly { personId: string; role: 'author' | 'qa' }[];
  readonly limitations: string;
  readonly evidenceSnapshot: readonly { evidenceId: string; sha256: string }[];
  readonly contentSha256: string;
  readonly finalStatus: 'closed' | 'closed_with_limitations';
  readonly previousVersion?: number;
  readonly changeLog?: string;
}

export function publish(
  d: ReportDraft,
  qa: QaResult,
  qaPersonId: string,
  evidence: { evidenceId: string; sha256: string }[],
  publishedAt: string,
  previous?: ReportVersion,
  changeLog?: string,
): ReportVersion {
  if (!qa.sendAllowed || !qa.finalStatus) throw new Error('Keine Veröffentlichung ohne QA-Freigabe (TC-15)');
  if (previous && !changeLog?.trim()) throw new Error('Neue Berichtsversion ohne Änderungsprotokoll (US-D2)');
  if (previous && d.version <= previous.version) throw new Error('Neue Berichtsversion muss die Versionsnummer erhöhen');
  const v: ReportVersion = {
    reportId: d.id, caseId: d.caseId, version: d.version, publishedAt,
    signatories: [{ personId: d.authorId, role: 'author' }, { personId: qaPersonId, role: 'qa' }],
    limitations: d.limitations,
    evidenceSnapshot: evidence.map((e) => ({ ...e })),
    contentSha256: createHash('sha256').update(JSON.stringify({ text: d.text, findings: d.findings, limitations: d.limitations })).digest('hex'),
    finalStatus: qa.finalStatus,
    ...(previous ? { previousVersion: previous.version, changeLog: changeLog! } : {}),
  };
  return Object.freeze(v);
}
