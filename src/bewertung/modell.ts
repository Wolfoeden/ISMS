/**
 * Bewertungsmodell nach ENT-018 (Option C, freigegeben 2026-11-12):
 * getrennte Achsen werden gespeichert, der Berichtsstatus wird berechnet.
 *
 * Codes englisch (018.1), Bezeichnungen deutsch – siehe vorschriften.md §A8, §A17.
 */

export const ANWENDBARKEIT = ['undecided', 'applicable', 'not_applicable'] as const;
export const ERFUELLUNG = ['open', 'met', 'partially_met', 'not_met'] as const;
export const UMSETZUNG = ['unknown', 'absent', 'partial', 'present'] as const;
export const WIRKSAMKEIT = ['not_verified', 'effective', 'ineffective'] as const;
export const EVIDENZLAGE = ['none', 'claim_only', 'insufficient', 'sufficient', 'conflicting'] as const;
export const FREIGABE = ['offen', 'vorgeschlagen', 'freigegeben', 'abgelegt'] as const;
export const BERICHTSSTATUS = [
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
  not_verified: 'Wirksamkeit nicht geprüft',
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
  if (b.anwendbarkeit === 'not_applicable') return 'not_applicable';
  if (b.evidenzlage === 'conflicting' || b.freigabe === 'vorgeschlagen') return 'needs_review';
  if (b.anwendbarkeit === 'undecided') return 'not_assessed';
  if (b.art === 'anforderung' ? (b.erfuellung ?? 'open') === 'open' : (b.umsetzung ?? 'unknown') === 'unknown') return 'not_assessed';
  if (b.erfuellung === 'not_met' || b.umsetzung === 'absent' || b.wirksamkeit === 'ineffective') return 'not_met';
  if (b.evidenzlage === 'none') return 'evidence_missing';
  if (b.evidenzlage === 'claim_only' || b.evidenzlage === 'insufficient') return 'insufficient_evidence';
  if (b.art === 'control' && b.umsetzung === 'present' && tiefe >= 3 && b.wirksamkeit !== 'effective') return 'insufficient_evidence';
  if (b.erfuellung === 'partially_met' || b.umsetzung === 'partial') return 'partially_met';
  return 'met';
}

export interface Regelverstoss {
  regel: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'W';
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
  // R2 – Wirksamkeitsaussage nur bei (teilweiser) Umsetzung und mit Nachweis der Art evidence
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
  if (b.evidenzlage === 'conflicting' && (b.freigabe === 'freigegeben' || b.freigabe === 'abgelegt')) {
    v.push({ regel: 'R5', text: 'widersprüchliche Nachweise können nicht freigegeben sein – erst klären' });
  }
  return v;
}

/** Zuordnung der Listen aus den Eingangsdokumenten vom 2026-11-12 (Prüfbericht P-01). */
export const ALTWERTE: Record<string, Berichtsstatus> = {
  conforming: 'met',
  nonconforming: 'not_met',
  not_evidenced: 'evidence_missing',
};
