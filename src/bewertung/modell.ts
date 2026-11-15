/**
 * Bewertungsmodell nach ENT-018 (Option C, freigegeben 2026-11-12):
 * getrennte Achsen werden gespeichert, der Berichtsstatus wird berechnet.
 *
 * Codes englisch (018.1), Bezeichnungen deutsch – siehe vorschriften.md §A8, §A17.
 */

export const ANWENDBARKEIT = ['undecided', 'applicable', 'not_applicable'] as const;
export const ERFUELLUNG = ['open', 'met', 'partially_met', 'not_met'] as const;
export const UMSETZUNG = ['unknown', 'absent', 'partial', 'present'] as const;
/** ENT-040: `not_demonstrated` = geprüft, Beleg reicht nicht – keine Lücke, sondern nicht ausreichend beurteilbar. */
export const WIRKSAMKEIT = ['not_verified', 'not_demonstrated', 'effective', 'ineffective'] as const;
export const EVIDENZLAGE = ['none', 'claim_only', 'insufficient', 'sufficient', 'conflicting'] as const;
/** ENT-029 (Option 3): „verifiziert“ = fachlich geprüft, „freigegeben“ = genehmigt. */
export const FREIGABE = ['offen', 'vorgeschlagen', 'verifiziert', 'freigegeben', 'abgelegt'] as const;
/** ENT-040: Prüfbezug – ein Scope-Ausschluss ist keine fachliche Nichtanwendbarkeit (Lastenheft 7.2.3). */
export const PRUEFBEZUG = ['in_scope', 'out_of_scope', 'unclear'] as const;
/**
 * ENT-040: Prüfstatus E0–E4 – wird abgeleitet, nie gesetzt (db: isms.evidence_grade):
 * E4 Prüfschritt Test/Beobachtung · E3 Prüfschritt Dokumentprüfung/Interview · E2 Nachweis verknüpft · E1 nur Aussage · E0 nichts.
 */
export const PRUEFSTATUS = ['E0', 'E1', 'E2', 'E3', 'E4'] as const;
/** P-A3: fallbezogen bestätigte Verbindlichkeit eines Kriteriums (F-023). */
export const VERBINDLICHKEIT = ['mandatory', 'agreed', 'guidance', 'unclear'] as const;
export const BERICHTSSTATUS = [
  'out_of_scope',
  'not_applicable',
  'needs_review',
  'not_assessed',
  'not_met',
  'evidence_missing',
  'insufficient_evidence',
  'partially_met',
  'met',
] as const;

export type Anwendbarkeit = (typeof ANWENDBARKEIT)[number];
export type Erfuellung = (typeof ERFUELLUNG)[number];
export type Umsetzung = (typeof UMSETZUNG)[number];
export type Wirksamkeit = (typeof WIRKSAMKEIT)[number];
export type Pruefbezug = (typeof PRUEFBEZUG)[number];
export type Pruefstatus = (typeof PRUEFSTATUS)[number];
export type Verbindlichkeit = (typeof VERBINDLICHKEIT)[number];
export type Evidenzlage = (typeof EVIDENZLAGE)[number];
export type Freigabe = (typeof FREIGABE)[number];
export type Berichtsstatus = (typeof BERICHTSSTATUS)[number];

/** Deutsche Bezeichnungen für Berichte und Oberflächen (vorschriften.md §A17). */
export const BEZEICHNUNG: Record<string, string> = {
  undecided: 'offen',
  applicable: 'anwendbar',
  not_applicable: 'nicht anwendbar',
  open: 'nicht bewertet',
  met: 'erfüllt',
  partially_met: 'teilweise erfüllt',
  not_met: 'nicht erfüllt',
  unknown: 'unbekannt',
  absent: 'nicht umgesetzt',
  partial: 'teilweise umgesetzt',
  present: 'umgesetzt',
  not_verified: 'Wirksamkeit nicht untersucht',
  not_demonstrated: 'Wirksamkeit nicht nachgewiesen',
  in_scope: 'im Auftrag',
  out_of_scope: 'außerhalb des Prüfauftrags',
  unclear: 'Prüfbezug ungeklärt',
  E0: 'E0 kein Nachweis',
  E1: 'E1 Eigenauskunft',
  E2: 'E2 Dokumenthinweis, ungeprüft',
  E3: 'E3 vom Prüfer geprüft',
  E4: 'E4 beobachtet oder getestet',
  mandatory: 'verbindlich',
  agreed: 'vereinbart',
  guidance: 'Empfehlung',
  effective: 'wirksam',
  ineffective: 'nicht wirksam',
  none: 'kein Nachweis',
  claim_only: 'nur Aussage',
  insufficient: 'Nachweis unzureichend',
  sufficient: 'Nachweis ausreichend',
  conflicting: 'Nachweise widersprüchlich',
  needs_review: 'in Klärung',
  not_assessed: 'nicht bewertet',
  evidence_missing: 'Nachweis fehlt',
  insufficient_evidence: 'Nachweis unzureichend',
};

/** In Audit-Mandaten (interne Audits) wird „nicht erfüllt“ als Nichtkonformität bezeichnet (§A17). */
export const BEZEICHNUNG_AUDIT: Partial<Record<Berichtsstatus, string>> = {
  not_met: 'Nichtkonformität',
  met: 'konform',
};

export interface Bewertung {
  /** Anforderung (ISO 4–10, Gesetzespflicht) oder Control/Prüfbereich */
  art: 'anforderung' | 'control';
  /** ENT-040; fehlt = im Auftrag (Werkzeuge des Arbeitssystems) */
  pruefbezug?: Pruefbezug;
  /** Begründung, warum außerhalb des Prüfauftrags */
  pruefbezugNotiz?: string;
  /** ENT-040: abgeleiteter Prüfstatus; fehlt = nicht erfasst (Arbeitssystem prüft über `pruefung: geeignet`) */
  pruefstatus?: Pruefstatus;
  /** Ein Prüfschritt mit Stichprobe ist protokolliert (Voraussetzung für „wirksam“) */
  stichprobeProtokolliert?: boolean;
  anwendbarkeit: Anwendbarkeit;
  erfuellung?: Erfuellung;
  umsetzung?: Umsetzung;
  wirksamkeit?: Wirksamkeit;
  evidenzlage: Evidenzlage;
  freigabe: Freigabe;
  /** Erforderliche Umsetzungstiefe 1–4 (nur Controls) */
  tiefe?: 1 | 2 | 3 | 4;
  /** Begründung der Nichtanwendbarkeit (Verweis auf Entscheidung) */
  begruendung?: string;
  /** Mindestens ein geeigneter Nachweis der Art `evidence` (nicht nur Aussage) liegt vor */
  nachweisVorhanden?: boolean;
  /** ISO/IEC 27001 Abschnitte 4–10 bzw. Pflicht aus anwendbarem Gesetz – nie `not_applicable` */
  pflichtanforderung?: boolean;
}

/** Berechneter Berichtsstatus – erste zutreffende Regel gewinnt (Entscheidungsvorlage §3). */
export function berichtsstatus(b: Bewertung): Berichtsstatus {
  const tiefe = b.tiefe ?? 1;
  if (b.pruefbezug === 'out_of_scope') return 'out_of_scope';
  if (b.anwendbarkeit === 'not_applicable') return 'not_applicable';
  if (b.evidenzlage === 'conflicting' || b.freigabe === 'vorgeschlagen' || b.freigabe === 'verifiziert') return 'needs_review';
  if (b.pruefbezug === 'unclear' || b.anwendbarkeit === 'undecided') return 'not_assessed';
  if (b.art === 'anforderung' ? (b.erfuellung ?? 'open') === 'open' : (b.umsetzung ?? 'unknown') === 'unknown') return 'not_assessed';
  if (b.erfuellung === 'not_met' || b.umsetzung === 'absent' || b.wirksamkeit === 'ineffective') return 'not_met';
  if (b.evidenzlage === 'none') return 'evidence_missing';
  if (b.evidenzlage === 'claim_only' || b.evidenzlage === 'insufficient') return 'insufficient_evidence';
  if (b.art === 'control' && b.wirksamkeit === 'not_demonstrated') return 'insufficient_evidence';
  if (b.art === 'control' && b.umsetzung === 'present' && tiefe >= 3 && b.wirksamkeit !== 'effective') return 'insufficient_evidence';
  if (b.erfuellung === 'partially_met' || b.umsetzung === 'partial') return 'partially_met';
  return 'met';
}

export interface Regelverstoss {
  regel: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9' | 'W';
  text: string;
}

/** Prüft die Regeln R1–R6 und die Wertebereiche. R6 (nur Abgelegtes in isms.md) prüft das Werkzeug. */
export function pruefeBewertung(b: Bewertung): Regelverstoss[] {
  const v: Regelverstoss[] = [];
  const imBereich = (wert: string | undefined, liste: readonly string[], name: string) => {
    if (wert !== undefined && !liste.includes(wert)) v.push({ regel: 'W', text: `${name} „${wert}“ ungültig (${liste.join(', ')})` });
  };
  imBereich(b.anwendbarkeit, ANWENDBARKEIT, 'Anwendbarkeit');
  imBereich(b.erfuellung, ERFUELLUNG, 'Erfüllung');
  imBereich(b.umsetzung, UMSETZUNG, 'Umsetzung');
  imBereich(b.wirksamkeit, WIRKSAMKEIT, 'Wirksamkeit');
  imBereich(b.evidenzlage, EVIDENZLAGE, 'Evidenzlage');
  imBereich(b.freigabe, FREIGABE, 'Freigabe');
  imBereich(b.pruefbezug, PRUEFBEZUG, 'Prüfbezug');
  imBereich(b.pruefstatus, PRUEFSTATUS, 'Prüfstatus');
  if (b.art === 'anforderung' && (b.umsetzung || b.wirksamkeit)) {
    v.push({ regel: 'W', text: 'Anforderungen haben Erfüllung, keine Umsetzung/Wirksamkeit' });
  }
  if (b.art === 'control' && b.erfuellung) {
    v.push({ regel: 'W', text: 'Controls haben Umsetzung und Wirksamkeit, keine Erfüllung' });
  }
  // R1 – Erfüllung bzw. Umsetzung „vorhanden“ nur mit geeignetem Nachweis berichten (wird über den Berichtsstatus erzwungen);
  //      Evidenzlage „ausreichend“ erfordert mindestens einen geeigneten Nachweis der Art evidence.
  if (b.evidenzlage === 'sufficient' && b.nachweisVorhanden === false) {
    v.push({ regel: 'R1', text: 'Evidenzlage „ausreichend“ ohne geeigneten Nachweis der Art evidence' });
  }
  // R7 (ENT-040) – „ausreichend“ nur mit menschlichem Prüfschritt (E3/E4); kein Upload hebt den Prüfstatus an
  if (b.evidenzlage === 'sufficient' && b.pruefstatus !== undefined && b.pruefstatus !== 'E3' && b.pruefstatus !== 'E4') {
    v.push({ regel: 'R7', text: `Evidenzlage „ausreichend“ bei Prüfstatus ${b.pruefstatus} – erst Prüfschritt protokollieren (E3/E4)` });
  }
  // R8 (ENT-040) – „wirksam“ nur mit protokollierter Stichprobe
  if (b.wirksamkeit === 'effective' && b.stichprobeProtokolliert === false) {
    v.push({ regel: 'R8', text: 'Wirksamkeit „wirksam“ ohne protokollierten Prüfschritt mit Stichprobe' });
  }
  // R9 (ENT-040) – außerhalb des Prüfauftrags nur begründet; ungeklärter Prüfbezug ist nicht abschließbar
  if (b.pruefbezug === 'out_of_scope' && !b.pruefbezugNotiz?.trim()) {
    v.push({ regel: 'R9', text: 'außerhalb des Prüfauftrags ohne Begründung' });
  }
  if (b.pruefbezug === 'unclear' && (b.freigabe === 'verifiziert' || b.freigabe === 'freigegeben' || b.freigabe === 'abgelegt')) {
    v.push({ regel: 'R9', text: 'Prüfbezug ungeklärt – nicht prüf- oder freigebbar' });
  }
  // R2 – Wirksamkeitsaussage nur bei (teilweiser) Umsetzung und mit Nachweis der Art evidence
  if (b.wirksamkeit === 'not_demonstrated' && b.umsetzung !== 'partial' && b.umsetzung !== 'present') {
    v.push({ regel: 'R2', text: 'Wirksamkeit „nicht nachgewiesen“, obwohl die Umsetzung nicht (teilweise) vorhanden ist' });
  }
  if (b.wirksamkeit === 'effective' || b.wirksamkeit === 'ineffective') {
    if (b.umsetzung !== 'partial' && b.umsetzung !== 'present') {
      v.push({ regel: 'R2', text: 'Wirksamkeit bewertet, obwohl die Umsetzung nicht (teilweise) vorhanden ist' });
    }
    if (b.nachweisVorhanden === false) v.push({ regel: 'R2', text: 'Wirksamkeit ohne Nachweis der Art evidence' });
  }
  // R3 – Tiefe 1–4
  if (b.art === 'control' && b.tiefe !== undefined && ![1, 2, 3, 4].includes(b.tiefe)) {
    v.push({ regel: 'R3', text: `Tiefe „${b.tiefe}“ ungültig (1–4)` });
  }
  // R4 – Nichtanwendbarkeit nur begründet, freigegeben, nie für Pflichtanforderungen
  if (b.anwendbarkeit === 'not_applicable') {
    if (b.pflichtanforderung) v.push({ regel: 'R4', text: 'Pflichtanforderung (ISO 4–10 bzw. anwendbares Gesetz) kann nicht „nicht anwendbar“ sein' });
    if (!b.begruendung) v.push({ regel: 'R4', text: 'Nichtanwendbarkeit ohne Begründung' });
    if (b.freigabe !== 'freigegeben' && b.freigabe !== 'abgelegt') v.push({ regel: 'R4', text: 'Nichtanwendbarkeit nicht freigegeben' });
  }
  // R5 – widersprüchliche Nachweise erzwingen menschliche Klärung
  if (b.evidenzlage === 'conflicting' && (b.freigabe === 'verifiziert' || b.freigabe === 'freigegeben' || b.freigabe === 'abgelegt')) {
    v.push({ regel: 'R5', text: 'widersprüchliche Nachweise können nicht verifiziert oder freigegeben sein – erst klären' });
  }
  return v;
}

/** Zuordnung der Listen aus den Eingangsdokumenten vom 2026-11-12 (Prüfbericht P-01). */
export const ALTWERTE: Record<string, Berichtsstatus> = {
  conforming: 'met',
  nonconforming: 'not_met',
  not_evidenced: 'evidence_missing',
};

/**
 * Ergebnisbezeichnung nach Verbindlichkeit (F-023, Lastenheft 7.2.2): Eine Abweichung von einer
 * Empfehlung oder Best Practice ohne bestätigte Verbindlichkeit ist keine Nichterfüllung und nie
 * eine Nichtkonformität. „Nichtkonformität“ nur in Audit-Mandaten bei verbindlicher Anforderung.
 */
export function ergebnisBezeichnung(status: Berichtsstatus, opt: { verbindlichkeit?: Verbindlichkeit; auditMandat?: boolean } = {}): string {
  const v = opt.verbindlichkeit;
  if (status === 'not_met' && v === 'guidance') return 'Abweichung von der Empfehlung';
  if (status === 'met' && v === 'guidance') return 'Empfehlung umgesetzt';
  if (opt.auditMandat && (v === undefined || v === 'mandatory') && BEZEICHNUNG_AUDIT[status]) return BEZEICHNUNG_AUDIT[status]!;
  return BEZEICHNUNG[status] ?? status;
}
