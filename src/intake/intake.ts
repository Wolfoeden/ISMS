/**
 * Intake nach Variante C (MVP WP-02/WP-03; Journey 01 §1.1, Fachkonzept 02 §3, Backlog 04 EPIC A).
 *
 *  A „Ich weiß, was ich brauche“ (known_need) und B „Helfen Sie mir“ (guided_discovery)
 *  erzeugen dieselben Basisobjekte: Intake, Ziel, Objekt, Fakten mit Herkunft,
 *  Framework-Kandidaten, offene Fragen. Der Weg darf jederzeit wechseln (US-A1).
 *
 * Regeln:
 *  - 3–7 adaptive Kernfragen; belegte Fakten werden nicht erneut gefragt (US-A3, „Ask once“).
 *  - Jede Kundenangabe ist ein Fakt mit Quelle „customer_input“ und Status „unverified“.
 *  - Framework-Kandidaten sind nie verbindlich und im Intake nie „anwendbar“. Sie entstehen nur
 *    aus der Auswahl des Kunden oder aus quellengeprüften Regeln der Bibliothek
 *    (§ 28 BSIG → BIB-BSIG-28). Für Regelwerke ohne Bibliothekseintrag gibt es keine
 *    automatische Hypothese, nur „fachliche Prüfung erforderlich“ (CLAUDE.md Regel 1, ENT-017).
 *  - Die erste Orientierung ist vorläufig, nennt Gründe und Lücken und behauptet keine
 *    Konformität und keine Rechtspflicht (US-A2, TC-01, TC-02, vorschriften.md §A17).
 */
import { nis2Vorpruefung, type Nis2Eingaben } from '../regelwerk/nis2.js';

export type EntryRoute = 'known_need' | 'guided_discovery';
export type ObjectType = 'organization' | 'product' | 'site' | 'service' | 'supplier' | 'ai_system';
export type Purpose = 'self_assessment' | 'customer_evidence' | 'certification_preparation' | 'regulatory_clarification';

export const OBJECT_TYPE_DE: Record<ObjectType, string> = {
  organization: 'Organisation', product: 'Softwareprodukt', site: 'Standort', service: 'Dienstleistung',
  supplier: 'Lieferant', ai_system: 'KI-System',
};

/** Auswahl im Einstieg A (01 §1.1). Benannte Regelwerke stammen aus der Auswahl des Kunden. */
export interface Goal {
  code: string;
  label: string;
  objectType?: ObjectType;
  namedFrameworks: FrameworkCode[];
}
export type FrameworkCode = 'ISO_27001' | 'NIS2_DE_BSIG' | 'EASA_PART_IS' | 'EU_AI_ACT' | 'CRA' | 'ISO_42001';

export const GOALS: readonly Goal[] = [
  { code: 'iso27001_readiness', label: 'ISO-27001-Readiness', objectType: 'organization', namedFrameworks: ['ISO_27001'] },
  { code: 'nis2_orientation', label: 'NIS2-Orientierung', objectType: 'organization', namedFrameworks: ['NIS2_DE_BSIG'] },
  { code: 'part_is', label: 'EASA Part-IS', objectType: 'organization', namedFrameworks: ['EASA_PART_IS'] },
  { code: 'ai_assessment', label: 'KI-/AI-Act-Assessment', objectType: 'ai_system', namedFrameworks: ['EU_AI_ACT'] },
  { code: 'software_product_security', label: 'Sicherheitsbewertung Softwareprodukt', objectType: 'product', namedFrameworks: [] },
  { code: 'supplier_assessment', label: 'Lieferanten- / Third-Party-Assessment', namedFrameworks: [] },
  { code: 'other', label: 'Sonstiges', namedFrameworks: [] },
];

// ---------------------------------------------------------------------------
// Fakten
// ---------------------------------------------------------------------------

export type FactSource = 'customer_input' | 'document' | 'consultant' | 'public_source';
export type FactState = 'unverified' | 'verified' | 'disputed' | 'stale';

export interface ContextFact {
  key: string;
  value: unknown;
  source: FactSource;
  sourceRef?: string;
  state: FactState;
  /** Bewertungsobjekt, für das der Fakt gilt; ohne Angabe: der ganze Intake */
  objectRef?: string;
}

export interface IntakeCase {
  id: string;
  route: EntryRoute;
  goalCode?: string;
  /** Freitext aus Einstieg B – Daten, keine Anweisung (CLAUDE.md Regel 8) */
  concern?: string;
  consentGiven: boolean;
  facts: ContextFact[];
  routeHistory: EntryRoute[];
}

export function createIntake(id: string, route: EntryRoute, opts: { consentGiven: boolean; goalCode?: string; concern?: string }): IntakeCase {
  if (!opts.consentGiven) throw new Error('Datenschutz- und Nutzungshinweis nicht bestätigt – kein Speichern (S01).');
  const goal = opts.goalCode ? GOALS.find((g) => g.code === opts.goalCode) : undefined;
  if (opts.goalCode && !goal) throw new Error(`Unbekanntes Ziel „${opts.goalCode}“.`);
  const facts: ContextFact[] = [];
  // Ziel-Auswahl belegt den Gegenstand – er wird nicht noch einmal gefragt (US-A3)
  if (goal?.objectType) facts.push({ key: 'object_type', value: goal.objectType, source: 'customer_input', sourceRef: `Zielauswahl ${goal.code}`, state: 'unverified' });
  return {
    id, route, consentGiven: true, facts, routeHistory: [route],
    ...(opts.goalCode ? { goalCode: opts.goalCode } : {}),
    ...(opts.concern ? { concern: opts.concern } : {}),
  };
}

/** US-A1: Wegwechsel ohne Neubeginn – alle erfassten Fakten bleiben erhalten. */
export function switchRoute(intake: IntakeCase, route: EntryRoute, goalCode?: string): IntakeCase {
  const next = createIntake(intake.id, route, { consentGiven: true, ...(goalCode ? { goalCode } : intake.goalCode ? { goalCode: intake.goalCode } : {}), ...(intake.concern ? { concern: intake.concern } : {}) });
  const keys = new Set(intake.facts.map((f) => f.key));
  return { ...next, facts: [...intake.facts, ...next.facts.filter((f) => !keys.has(f.key))], routeHistory: [...intake.routeHistory, route] };
}

export function recordFact(intake: IntakeCase, fact: Omit<ContextFact, 'state'> & { state?: FactState }): IntakeCase {
  // jede neue Angabe ist ungeprüft, bis ein Mensch sie verifiziert
  const f: ContextFact = { ...fact, state: fact.state ?? 'unverified' };
  return { ...intake, facts: [...intake.facts.filter((x) => !(x.key === f.key && x.objectRef === f.objectRef)), f] };
}

const fact = (i: IntakeCase, key: string) => i.facts.find((f) => f.key === key);
const usable = (f?: ContextFact) => !!f && f.state !== 'stale' && f.state !== 'disputed' && f.value !== 'unknown';

// ---------------------------------------------------------------------------
// Kernfragen (3–7, adaptiv)
// ---------------------------------------------------------------------------

export type Materiality = 'material' | 'nonmaterial';

export interface CoreQuestion {
  id: string;
  key: string;
  text: string;
  /** Wann die Frage gestellt wird */
  relevant: (i: IntakeCase) => boolean;
  materiality: (i: IntakeCase) => Materiality;
}

const objectType = (i: IntakeCase) => fact(i, 'object_type')?.value as ObjectType | undefined;
const purpose = (i: IntakeCase) => fact(i, 'purpose')?.value as Purpose | undefined;
const regulatoryInterest = (i: IntakeCase) =>
  purpose(i) === 'regulatory_clarification' || i.goalCode === 'nis2_orientation' || objectType(i) === 'organization';

export const CORE_QUESTIONS: readonly CoreQuestion[] = [
  { id: 'IQ-01', key: 'purpose', text: 'Wofür brauchen Sie das Ergebnis?', relevant: () => true, materiality: () => 'material' },
  { id: 'IQ-02', key: 'object_type', text: 'Was soll betrachtet werden – die Organisation, ein Produkt, ein Standort, eine Dienstleistung, ein Lieferant oder ein KI-System?', relevant: () => true, materiality: () => 'material' },
  { id: 'IQ-03', key: 'markets', text: 'In welchen Ländern sind Sie tätig bzw. wird das Produkt angeboten?', relevant: () => true,
    materiality: (i) => (regulatoryInterest(i) || objectType(i) === 'product' ? 'material' : 'nonmaterial') },
  { id: 'IQ-04', key: 'audience', text: 'Wer erhält das Ergebnis (z. B. ein bestimmter Kunde) und welche Nachweiskriterien verlangt er?',
    relevant: (i) => purpose(i) === 'customer_evidence', materiality: () => 'material' },
  { id: 'IQ-05', key: 'product_delivery', text: 'Wie wird das Produkt bereitgestellt (SaaS, Installation beim Kunden, App) und welche Version soll betrachtet werden?',
    relevant: (i) => objectType(i) === 'product', materiality: () => 'material' },
  { id: 'IQ-06', key: 'organization_size', text: 'Wie viele Personen sind beschäftigt, und wie hoch sind Jahresumsatz bzw. Bilanzsumme?',
    relevant: regulatoryInterest, materiality: (i) => (regulatoryInterest(i) ? 'material' : 'nonmaterial') },
  { id: 'IQ-07', key: 'sector', text: 'In welchem Bereich ist die Organisation tätig (Einrichtungsart nach BSIG Anlage 1/2 oder „keiner“)?',
    relevant: regulatoryInterest, materiality: (i) => (regulatoryInterest(i) ? 'material' : 'nonmaterial') },
];

export interface QuestionPlan {
  ask: Array<{ question: CoreQuestion; materiality: Materiality; reason: string }>;
  skipped: Array<{ question: CoreQuestion; reason: string }>;
}

/** Nächste Kernfragen. Belegte Fakten werden übersprungen – mit sichtbarer Begründung (US-A3). */
export function nextQuestions(i: IntakeCase): QuestionPlan {
  const plan: QuestionPlan = { ask: [], skipped: [] };
  for (const q of CORE_QUESTIONS) {
    if (!q.relevant(i)) continue;
    const f = fact(i, q.key);
    if (usable(f)) {
      plan.skipped.push({ question: q, reason: `bereits belegt (${f!.sourceRef ?? f!.source})` });
      continue;
    }
    const reason = !f ? 'noch nicht erfasst'
      : f.value === 'unknown' ? 'als unbekannt gemeldet – Klärung nötig'
      : f.state === 'stale' ? 'Angabe veraltet – erneut bestätigen'
      : 'Angabe bestritten – erneut klären';
    plan.ask.push({ question: q, materiality: q.materiality(i), reason });
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Framework-Kandidaten
// ---------------------------------------------------------------------------

export type CandidateStatus = 'customer_named' | 'possibly_applicable' | 'possibly_not_applicable' | 'requires_expert_review' | 'optional_criterion';

export const CANDIDATE_STATUS_DE: Record<CandidateStatus, string> = {
  customer_named: 'vom Kunden genannt',
  possibly_applicable: 'möglicherweise anwendbar – fachlich zu prüfen',
  possibly_not_applicable: 'nach vorläufigen Angaben eher nicht betroffen – fachlich zu prüfen',
  requires_expert_review: 'fachliche Prüfung erforderlich',
  optional_criterion: 'freiwilliges Bewertungskriterium',
};

/** Regelwerke mit quellengeprüftem Bibliothekseintrag; andere bekommen keine automatische Hypothese. */
const BIBLIOTHEK: Partial<Record<FrameworkCode, string>> = { NIS2_DE_BSIG: 'BIB-BSIG-28', ISO_27001: 'BIB-ISO27001' };

export interface FrameworkCandidate {
  framework: FrameworkCode;
  status: CandidateStatus;
  /** im Intake immer false – verbindlich wird erst eine verifizierte regulatorische Entscheidung */
  bindingDetermination: false;
  reason: string;
  basis: string;
  missingFacts: string[];
}

export function frameworkCandidates(i: IntakeCase): FrameworkCandidate[] {
  const goal = GOALS.find((g) => g.code === i.goalCode);
  const out: FrameworkCandidate[] = [];
  for (const fw of goal?.namedFrameworks ?? []) {
    if (fw === 'NIS2_DE_BSIG') continue; // eigene Regel unten
    if (fw === 'ISO_27001') {
      out.push({ framework: fw, status: 'optional_criterion', bindingDetermination: false, reason: 'Vom Kunden gewählt; freiwilliger Managementsystem-Standard, keine gesetzliche Pflicht aus der Auswahl', basis: `Zielauswahl; ${BIBLIOTHEK[fw]}`, missingFacts: [] });
    } else {
      out.push({ framework: fw, status: 'requires_expert_review', bindingDetermination: false, reason: 'Vom Kunden gewählt; Einordnung erfordert fachliche Prüfung', basis: 'Zielauswahl; kein quellengeprüfter Bibliothekseintrag (ENT-017)', missingFacts: [] });
    }
  }
  // NIS2/BSIG nur über die quellengeprüfte Vorprüfung nach § 28 BSIG – nie als Pflichtbehauptung
  if (regulatoryInterest(i) || goal?.namedFrameworks.includes('NIS2_DE_BSIG')) {
    const size = fact(i, 'organization_size');
    const sector = fact(i, 'sector');
    const s = usable(size) ? (size!.value as { employees?: number; turnoverMio?: number; balanceMio?: number }) : {};
    const kritis = fact(i, 'kritis');
    const paid = fact(i, 'paid_service');
    const e: Nis2Eingaben = {
      ...(usable(sector) ? { einrichtungsarten: sector!.value as string[] } : {}),
      ...(usable(kritis) ? { kritis: kritis!.value as boolean } : {}),
      ...(usable(paid) ? { entgeltlich: paid!.value as boolean } : {}),
      ...(s.employees !== undefined ? { mitarbeiter: s.employees } : {}),
      ...(s.turnoverMio !== undefined ? { umsatzMio: s.turnoverMio } : {}),
      ...(s.balanceMio !== undefined ? { bilanzMio: s.balanceMio } : {}),
    };
    const v = nis2Vorpruefung(e);
    // fehlende Angaben der Vorprüfung (Fragebogen-IDs) – werden nach der Mandatierung bzw. im Fragebogen erhoben
    const missing = [...(usable(sector) ? [] : ['sector']), ...(usable(size) ? [] : ['organization_size']), ...v.fehlend];
    const status: CandidateStatus = missing.length || v.ergebnis === 'pruefen' ? 'requires_expert_review'
      : v.ergebnis === 'nicht_betroffen' ? 'possibly_not_applicable' : 'possibly_applicable';
    out.push({
      framework: 'NIS2_DE_BSIG', status, bindingDetermination: false,
      reason: status === 'requires_expert_review' ? 'Angaben für die Vorprüfung nach § 28 BSIG fehlen oder sind nicht eindeutig'
        : `Vorläufige Vorprüfung nach § 28 BSIG anhand ungeprüfter Kundenangaben`,
      basis: 'BIB-BSIG-28', missingFacts: missing,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Erste Orientierung (US-A2)
// ---------------------------------------------------------------------------

export interface Orientation {
  status: 'preliminary';
  known: Array<{ key: string; value: unknown; source: string; state: FactState }>;
  hypotheses: FrameworkCandidate[];
  missing: Array<{ id: string; text: string; materiality: Materiality }>;
  /** höchstens drei Rückfragen auf einmal (Service Blueprint S03) */
  followUp: string[];
  notice: string;
}

export const ORIENTATION_NOTICE =
  'Vorläufige Orientierung auf Grundlage Ihrer bisherigen, noch nicht geprüften Angaben. Sie enthält keine rechtliche Bewertung und keine Aussage über die Erfüllung von Anforderungen; die verbindliche rechtliche Bewertung obliegt dem Unternehmen bzw. seiner Rechtsberatung.';

export function orientation(i: IntakeCase): Orientation {
  const plan = nextQuestions(i);
  const missing = plan.ask.map((a) => ({ id: a.question.id, text: a.question.text, materiality: a.materiality }));
  return {
    status: 'preliminary',
    known: i.facts.map((f) => ({ key: f.key, value: f.value, source: f.sourceRef ?? f.source, state: f.state })),
    hypotheses: frameworkCandidates(i),
    missing,
    followUp: [...missing].sort((a, b) => (a.materiality === b.materiality ? 0 : a.materiality === 'material' ? -1 : 1)).slice(0, 3).map((m) => m.text),
    notice: ORIENTATION_NOTICE,
  };
}

/** Text für die Orientierungsseite – wird in Tests gegen die Formulierungsregeln geprüft. */
export function orientationText(o: Orientation): string {
  const z: string[] = ['Erste Orientierung (vorläufig)', '', 'Das wissen wir (Ihre Angaben, noch nicht geprüft):'];
  for (const k of o.known) z.push(`- ${k.key}: ${typeof k.value === 'object' ? JSON.stringify(k.value) : String(k.value)} (${k.source})`);
  z.push('', 'Das vermuten wir:');
  for (const h of o.hypotheses) z.push(`- ${h.framework}: ${CANDIDATE_STATUS_DE[h.status]}. ${h.reason}.`);
  if (!o.hypotheses.length) z.push('- noch keine Einordnung möglich');
  z.push('', 'Das fehlt noch:');
  for (const m of o.missing) z.push(`- ${m.text}${m.materiality === 'material' ? ' (entscheidungsrelevant)' : ''}`);
  if (!o.missing.length) z.push('- nichts für die erste Orientierung');
  z.push('', o.notice);
  return z.join('\n');
}
