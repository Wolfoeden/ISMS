/**
 * KI-Vorschläge, menschliche Verifikation und Sperre (MVP WP-08; Fachkonzept 02 §4.4, §7.2;
 * Backlog 04 US-C1, US-C2, TC-12, TC-21; ENT-029).
 *
 * Artefaktstatus: ai_proposed → in_review → verified → persisted_locked → superseded,
 * dazu rejected_with_reason und deferred_with_owner_impact_trigger.
 *
 *  - Jeder Vorschlag nennt mindestens eine Fundstelle im Originalbeleg (Nachweis + Stelle),
 *    Modell- und Promptversion, Scope-Version, Zeitpunkt und Unsicherheit.
 *  - Nur Menschen von DT Agency nehmen an, korrigieren, lehnen ab, vertagen, verifizieren, sperren.
 *  - Ein gesperrter oder verifizierter Datensatz wird nie durch die KI verändert: ein abweichender
 *    KI-Befund wird ein neuer Vorschlag im Review; der alte bleibt unverändert (TC-12).
 *  - Konfidenz der KI ist kein Beweis; fehlende Evidenz wird nie ergänzt.
 */

export type ArtifactStatus =
  | 'ai_proposed' | 'in_review' | 'verified' | 'persisted_locked' | 'superseded'
  | 'rejected_with_reason' | 'deferred_with_owner_impact_trigger';

export const ARTIFACT_STATUS_DE: Record<ArtifactStatus, string> = {
  ai_proposed: 'KI-Vorschlag', in_review: 'in Prüfung', verified: 'verifiziert', persisted_locked: 'freigegeben und gesperrt',
  superseded: 'ersetzt', rejected_with_reason: 'abgelehnt (mit Begründung)', deferred_with_owner_impact_trigger: 'vertagt',
};

export interface SourceRef {
  evidenceId: string;
  /** Fundstelle im Originalbeleg, z. B. Seite/Abschnitt/Zeile */
  locator: string;
  excerpt?: string;
}

export interface Proposal {
  id: string;
  mandateId: string;
  target: { type: string; id: string };
  payload: Record<string, unknown>;
  sources: SourceRef[];
  model: string;
  promptVersion: string;
  scopeVersionId: string;
  createdAt: string;
  uncertainty: string;
  status: ArtifactStatus;
  /** bei Korrektur: der ursprüngliche KI-Inhalt bleibt erhalten */
  originalPayload?: Record<string, unknown>;
  reviewedBy?: string;
  reason?: string;
  deferral?: { owner: string; impact: string; trigger: string };
  /** Vorschlag, der diesen ersetzt hat bzw. den dieser ersetzt */
  supersedes?: string;
}

export type ReviewActor = { kind: 'ai'; system: string } | { kind: 'human'; personId: string; party: 'agency' | 'customer' };

export function createProposal(
  p: Omit<Proposal, 'status'>,
  ctx: { allowedEvidenceIds: string[] },
): Proposal {
  if (!p.sources.length) throw new Error('KI-Vorschlag ohne Fundstelle – nicht zulässig (WP-06: jede KI-Aussage zeigt ihre Quellstelle)');
  for (const s of p.sources) {
    if (!s.locator.trim()) throw new Error(`Fundstelle für ${s.evidenceId} fehlt`);
    if (!ctx.allowedEvidenceIds.includes(s.evidenceId)) throw new Error(`Quelle ${s.evidenceId} gehört nicht zum Mandat – Vorschlag abgelehnt`);
  }
  for (const [feld, wert] of Object.entries({ model: p.model, promptVersion: p.promptVersion, scopeVersionId: p.scopeVersionId, uncertainty: p.uncertainty })) {
    if (!String(wert).trim()) throw new Error(`KI-Vorschlag ohne ${feld}`);
  }
  return { ...p, status: 'ai_proposed' };
}

export type ReviewAction =
  | { action: 'start_review' }
  | { action: 'accept' }
  | { action: 'correct'; payload: Record<string, unknown> }
  | { action: 'reject'; reason: string }
  | { action: 'defer'; owner: string; impact: string; trigger: string }
  | { action: 'lock' };

const ERLAUBT: Record<ReviewAction['action'], ArtifactStatus[]> = {
  start_review: ['ai_proposed', 'deferred_with_owner_impact_trigger'],
  accept: ['in_review'],
  correct: ['in_review'],
  reject: ['ai_proposed', 'in_review'],
  defer: ['ai_proposed', 'in_review'],
  lock: ['verified'],
};

export function review(p: Proposal, a: ReviewAction, actor: ReviewActor): { ok: true; proposal: Proposal } | { ok: false; error: string } {
  if (actor.kind === 'ai') return { ok: false, error: 'KI darf Vorschläge erzeugen, aber nicht prüfen, verifizieren oder sperren.' };
  if (actor.party !== 'agency') return { ok: false, error: 'Vorschläge prüft DT Agency.' };
  if (!ERLAUBT[a.action].includes(p.status)) {
    return { ok: false, error: `„${a.action}“ ist bei Status ${ARTIFACT_STATUS_DE[p.status]} nicht zulässig.` };
  }
  const by = { reviewedBy: actor.personId };
  switch (a.action) {
    case 'start_review': return { ok: true, proposal: { ...p, ...by, status: 'in_review' } };
    case 'accept': return { ok: true, proposal: { ...p, ...by, status: 'verified' } };
    case 'correct': return { ok: true, proposal: { ...p, ...by, status: 'verified', originalPayload: p.payload, payload: a.payload } };
    case 'reject':
      if (!a.reason.trim()) return { ok: false, error: 'Ablehnung ohne Begründung' };
      return { ok: true, proposal: { ...p, ...by, status: 'rejected_with_reason', reason: a.reason } };
    case 'defer':
      if (!a.owner.trim() || !a.impact.trim() || !a.trigger.trim()) return { ok: false, error: 'Vertagung braucht Verantwortlichen, Auswirkung und Auslöser' };
      return { ok: true, proposal: { ...p, ...by, status: 'deferred_with_owner_impact_trigger', deferral: { owner: a.owner, impact: a.impact, trigger: a.trigger } } };
    case 'lock': return { ok: true, proposal: { ...p, ...by, status: 'persisted_locked' } };
  }
}

/**
 * Neuer KI-Befund zu einem Ziel, für das es bereits ein verifiziertes oder gesperrtes Artefakt gibt:
 * Der Bestand bleibt unverändert, der Befund wird ein eigener Vorschlag im Review (TC-12).
 */
export function proposeChange(existing: Proposal, incoming: Omit<Proposal, 'status'>, ctx: { allowedEvidenceIds: string[] }): { existing: Proposal; proposal: Proposal } {
  const p = createProposal({ ...incoming, supersedes: existing.id }, ctx);
  return { existing, proposal: { ...p, status: 'in_review' } };
}

/** Übernahme eines geprüften Nachfolgers: der alte gesperrte Stand wird ersetzt, nicht überschrieben. */
export function supersede(old: Proposal, successor: Proposal, actor: ReviewActor): { ok: true; old: Proposal; successor: Proposal } | { ok: false; error: string } {
  if (actor.kind === 'ai' || actor.party !== 'agency') return { ok: false, error: 'Ersetzen entscheidet ein Mensch von DT Agency.' };
  if (old.status !== 'persisted_locked' || successor.status !== 'verified' || successor.supersedes !== old.id) {
    return { ok: false, error: 'Ersetzen nur: gesperrter Stand durch verifizierten Nachfolger, der auf ihn verweist.' };
  }
  return { ok: true, old: { ...old, status: 'superseded' }, successor: { ...successor, status: 'persisted_locked', reviewedBy: actor.personId } };
}

// ---------------------------------------------------------------------------
// KI-Ausfall (TC-21)
// ---------------------------------------------------------------------------

export interface FallbackResult<T> {
  mode: 'ai' | 'manual';
  result?: T;
  incident?: { type: 'ai.unavailable'; message: string; attempts: number };
}

/** Bei Ausfall: Bearbeitung geht manuell weiter, der Ausfall wird als Ereignis dokumentiert. */
export async function withAiFallback<T>(call: () => Promise<T>, attempts = 2): Promise<FallbackResult<T>> {
  let letzter = '';
  for (let i = 0; i < attempts; i++) {
    try {
      return { mode: 'ai', result: await call() };
    } catch (e) {
      letzter = e instanceof Error ? e.message : String(e);
    }
  }
  return { mode: 'manual', incident: { type: 'ai.unavailable', message: letzter, attempts } };
}
