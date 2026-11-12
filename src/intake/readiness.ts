/**
 * D-06 MaterialityAndReadiness – Entscheidungsfähigkeit nach Fachkonzept 02 §5.1 (TC-09, DEC-13).
 *
 * | materieller Fakt fehlt | Beweisniveau ausreichend | Pflichtentscheidungen verifiziert | Ergebnis |
 * |---|---|---|---|
 * | nein | ja | ja | ready |
 * | ja | beliebig | beliebig | blocked – oder ausdrückliche Einschränkung (limitation) |
 * | nein | nein | beliebig | clarify |
 * | nein | ja | nein | human_review |
 *
 * „unknown“ ist ein Faktenstatus, keine akzeptierte Entscheidung. „not_applicable“ braucht eine
 * eigene fachliche Begründung und darf eine materielle Unbekannte nie ersetzen.
 */
export const DECISION_ID = 'D-06';
export const DECISION_VERSION = '2026-11.1';

export type QuestionState = 'open' | 'answered' | 'unknown' | 'not_applicable' | 'deferred';

export interface OpenQuestion {
  id: string;
  text: string;
  materiality: 'material' | 'nonmaterial';
  state: QuestionState;
  /** Pflicht bei not_applicable */
  naJustification?: string;
  /** Verweis auf eine freigegebene Scope-/Einschränkungsentscheidung, die die Lücke offen ausweist */
  limitationRef?: string;
  /** Pflicht bei deferred: wer, bis wann, Auswirkung */
  owner?: string;
}

export type Readiness = 'ready' | 'blocked' | 'limitation' | 'clarify' | 'human_review';

export interface ReadinessResult {
  decisionId: typeof DECISION_ID;
  version: typeof DECISION_VERSION;
  result: Readiness;
  reasons: string[];
  /** ein positives Ergebnis ist nur bei „ready“ zulässig */
  positiveStatementAllowed: boolean;
}

export function validateQuestion(q: OpenQuestion): string[] {
  const e: string[] = [];
  if (q.state === 'not_applicable' && !q.naJustification?.trim()) e.push(`${q.id}: „nicht anwendbar“ ohne fachliche Begründung`);
  if (q.state === 'deferred' && !q.owner?.trim()) e.push(`${q.id}: vertagt ohne Verantwortlichen`);
  return e;
}

export function readiness(input: {
  questions: OpenQuestion[];
  evidenceSufficient: boolean;
  mandatoryDecisionsVerified: boolean;
}): ReadinessResult {
  const reasons: string[] = [];
  for (const q of input.questions) reasons.push(...validateQuestion(q));
  const ungueltig = reasons.length > 0;

  // materiell offen: offen, unbekannt, vertagt – oder „nicht anwendbar“ ohne Begründung
  const materialGaps = input.questions.filter((q) =>
    q.materiality === 'material' && (q.state === 'open' || q.state === 'unknown' || q.state === 'deferred'
      || (q.state === 'not_applicable' && !q.naJustification?.trim())));

  const base = { decisionId: DECISION_ID, version: DECISION_VERSION } as const;
  if (materialGaps.length) {
    const ohneEinschraenkung = materialGaps.filter((q) => !q.limitationRef);
    for (const q of materialGaps) reasons.push(`${q.id}: entscheidungsrelevante Angabe ${q.state === 'unknown' ? 'unbekannt' : 'offen'}${q.limitationRef ? ` – als Einschränkung ausgewiesen (${q.limitationRef})` : ''}`);
    if (ohneEinschraenkung.length) return { ...base, result: 'blocked', reasons, positiveStatementAllowed: false };
    return { ...base, result: 'limitation', reasons, positiveStatementAllowed: false };
  }
  if (ungueltig) return { ...base, result: 'clarify', reasons, positiveStatementAllowed: false };
  if (!input.evidenceSufficient) {
    reasons.push('Beweisniveau nicht ausreichend');
    return { ...base, result: 'clarify', reasons, positiveStatementAllowed: false };
  }
  if (!input.mandatoryDecisionsVerified) {
    reasons.push('Pflichtentscheidungen noch nicht verifiziert');
    return { ...base, result: 'human_review', reasons, positiveStatementAllowed: false };
  }
  return { ...base, result: 'ready', reasons, positiveStatementAllowed: true };
}
