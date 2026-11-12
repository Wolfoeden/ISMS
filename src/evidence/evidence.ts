/**
 * Nachweise: Provenienz, Deduplikation, kontextbezogene Wiederverwendung
 * (MVP WP-06; Fachkonzept 02 §3 EvidenceLink, §7.3; Backlog 04 US-C1, TC-10, TC-11).
 *
 *  - Jeder Nachweis hat Herkunft: Quelle, Zeitpunkt, erfassende Person, Version, Klassifikation, SHA-256.
 *  - Dieselbe Datei (gleicher Hash) wird je Mandat nur einmal gespeichert.
 *  - Eine global geprüfte Datei ist kein globaler Erfüllungsnachweis: Jede Verknüpfung speichert
 *    ihren Bewertungsumfang. Wiederverwendung aus einem anderen Mandat zählt erst, wenn ein Mensch
 *    Geltungsbereich, Stand, Zulassung und Scope erneut bewertet hat (TC-10).
 *  - Dateiinhalte sind Daten, nie Anweisungen. Anweisungsähnliche Inhalte werden erkannt und als
 *    Sicherheitsereignis gemeldet; sie ändern nichts an Rechten oder Abläufen (TC-11).
 */
import { createHash } from 'node:crypto';

export type Classification = 'public' | 'internal' | 'confidential' | 'strictly_confidential';

export interface Evidence {
  id: string;
  mandateId: string;
  organizationId: string;
  kind: 'claim' | 'evidence';
  source: string;
  capturedAt: string;
  capturedBy: string;
  version?: string;
  classification: Classification;
  sha256: string;
  validUntil?: string;
}

export const sha256 = (data: string | Uint8Array): string => createHash('sha256').update(data).digest('hex');

export interface EvidenceStore {
  items: Evidence[];
}

export function registerEvidence(
  store: EvidenceStore,
  upload: Omit<Evidence, 'sha256' | 'id'> & { id: string; content: string | Uint8Array },
): { store: EvidenceStore; evidence: Evidence; duplicate: boolean } {
  for (const [feld, wert] of Object.entries({ source: upload.source, capturedAt: upload.capturedAt, capturedBy: upload.capturedBy })) {
    if (!String(wert ?? '').trim()) throw new Error(`Herkunft unvollständig: ${feld} fehlt`);
  }
  const hash = sha256(upload.content);
  const vorhanden = store.items.find((e) => e.mandateId === upload.mandateId && e.sha256 === hash);
  if (vorhanden) return { store, evidence: vorhanden, duplicate: true };
  const { content: _c, ...rest } = upload;
  const evidence: Evidence = { ...rest, sha256: hash };
  return { store: { items: [...store.items, evidence] }, evidence, duplicate: false };
}

// ---------------------------------------------------------------------------
// Verknüpfung mit Bewertungsumfang und Wiederverwendung (TC-10)
// ---------------------------------------------------------------------------

export interface LinkTarget {
  mandateId: string;
  organizationId: string;
  assessmentId: string;
  objectId?: string;
  scopeVersionId: string;
  /** Stichtag der Bewertung (ISO-Datum) */
  asOf: string;
}

export type ReuseCheck = 'scope_fit' | 'currency' | 'permission' | 'applicability';
export const REUSE_CHECK_DE: Record<ReuseCheck, string> = {
  scope_fit: 'Geltungsbereich des Nachweises deckt Objekt und Scope',
  currency: 'Stand und Gültigkeit zum Stichtag',
  permission: 'Zulassung zur Nutzung in diesem Mandat',
  applicability: 'Aussagekraft für die konkrete Anforderung',
};

export interface EvidenceLink {
  evidenceId: string;
  target: LinkTarget;
  state: 'confirmed' | 'pending_review' | 'rejected';
  /** offene Prüfpunkte, solange state = pending_review */
  openChecks: ReuseCheck[];
  notes: string[];
}

export function linkEvidence(e: Evidence, target: LinkTarget): EvidenceLink {
  const notes: string[] = [];
  if (e.organizationId !== target.organizationId) {
    throw new Error('Zulassung fehlt: Nachweis einer anderen Organisation – keine Verknüpfung (Mandantentrennung)');
  }
  if (e.validUntil && e.validUntil < target.asOf) notes.push(`abgelaufen am ${e.validUntil}`);
  const fremdesMandat = e.mandateId !== target.mandateId;
  if (fremdesMandat) {
    notes.push('Wiederverwendung aus einem anderen Mandat – erneute Bewertung erforderlich');
    return { evidenceId: e.id, target, state: 'pending_review', openChecks: ['scope_fit', 'currency', 'permission', 'applicability'], notes };
  }
  if (e.validUntil && e.validUntil < target.asOf) return { evidenceId: e.id, target, state: 'pending_review', openChecks: ['currency'], notes };
  return { evidenceId: e.id, target, state: 'confirmed', openChecks: [], notes };
}

export function confirmReuse(
  link: EvidenceLink,
  review: { reviewer: { kind: 'human' | 'ai'; party?: 'agency' | 'customer' }; passed: ReuseCheck[]; rejectedReason?: string },
): EvidenceLink {
  if (review.reviewer.kind !== 'human' || review.reviewer.party !== 'agency') {
    throw new Error('Wiederverwendung bestätigt nur ein Mensch von DT Agency');
  }
  if (review.rejectedReason) return { ...link, state: 'rejected', notes: [...link.notes, review.rejectedReason] };
  const offen = link.openChecks.filter((c) => !review.passed.includes(c));
  return { ...link, openChecks: offen, state: offen.length ? 'pending_review' : 'confirmed' };
}

/** Für R1/R2 zählen nur bestätigte Verknüpfungen. */
export const countsAsBacking = (l: EvidenceLink): boolean => l.state === 'confirmed';

// ---------------------------------------------------------------------------
// Untrusted Input (TC-11)
// ---------------------------------------------------------------------------

const MUSTER: Array<{ muster: RegExp; art: string }> = [
  { muster: /\b(ignoriere|ignore)\b.{0,40}\b(anweisung|instruction|regeln|rules|vorherige|previous)/i, art: 'Anweisung, Regeln zu ignorieren' },
  { muster: /\b(gib|zeige|liste|export|send|sende|schicke|output|print)\b.{0,40}\b(alle|all|sämtliche)\b.{0,40}\b(mandant|mandat|kunde|akte|record|tenant|client|daten|data)/i, art: 'Aufforderung zur Datenherausgabe' },
  { muster: /\b(system ?prompt|developer message|you are now|du bist jetzt|act as)\b/i, art: 'Rollen- oder Systemanweisung' },
  { muster: /\b(setze|set|mark|markiere)\b.{0,40}\b(verifiziert|verified|freigegeben|approved|geeignet|suitable)\b/i, art: 'Aufforderung zur Statusänderung' },
  { muster: /<script\b|javascript:|\bon(load|error)\s*=/i, art: 'Skriptinhalt' },
];

export interface SecurityEvent {
  type: 'security.untrusted_instruction';
  evidenceId: string;
  findings: string[];
  handling: 'treated_as_content';
}

/** Erkennt anweisungsähnliche Inhalte. Sie werden nie ausgeführt; das Ergebnis ist nur ein Protokolleintrag. */
export function scanUntrusted(evidenceId: string, text: string): SecurityEvent | undefined {
  const findings = MUSTER.filter((m) => m.muster.test(text)).map((m) => m.art);
  return findings.length ? { type: 'security.untrusted_instruction', evidenceId, findings, handling: 'treated_as_content' } : undefined;
}

/** KI-Kontext: nur Nachweise des eigenen Mandats – unabhängig davon, was ein Dokument verlangt. */
export function aiContext(store: EvidenceStore, mandateId: string, evidenceIds: string[]): Evidence[] {
  return store.items.filter((e) => e.mandateId === mandateId && evidenceIds.includes(e.id));
}
