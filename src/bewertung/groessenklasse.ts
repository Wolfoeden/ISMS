/**
 * Größenklasse nach ENT-019 (Option C, freigegeben 2026-11-12).
 *
 * Grundlage: Empfehlung 2003/361/EG, Anhang Art. 2 (BIB-KMU, quellengeprüft).
 * Die Größenklasse steuert nur die ORGANISATIONSFORM eines Assessments
 * (Gesprächspartner, Rollenbündelung, Freigabewege) – nie Prüfumfang,
 * Anwendbarkeit, Prüftiefe oder Evidenzanforderungen.
 */

export type Groessenklasse = 'kleinst' | 'klein' | 'mittel' | 'gross';

export interface GroessenEingaben {
  /** ORG-01 */
  mitarbeiter?: number;
  /** STA-06, Mio. EUR */
  umsatzMio?: number;
  /** STA-07, Mio. EUR */
  bilanzMio?: number;
  /** STA-08 */
  verbundeneUnternehmen?: boolean;
}

export interface GroessenErgebnis {
  klasse?: Groessenklasse;
  fehlend: string[];
  vorlaeufig: boolean;
  hinweise: string[];
}

export function groessenklasse(e: GroessenEingaben): GroessenErgebnis {
  const fehlend = [
    e.mitarbeiter === undefined && 'ORG-01',
    e.umsatzMio === undefined && 'STA-06',
    e.bilanzMio === undefined && 'STA-07',
  ].filter((x): x is string => !!x);
  const hinweise = ['Mitarbeiterzahl in Jahresarbeitseinheiten nach Empfehlung 2003/361/EG (Anhang Art. 5, noch nicht in der Bibliothek – ENT-016).'];
  if (fehlend.length) return { fehlend, vorlaeufig: true, hinweise };

  const ma = e.mitarbeiter!, u = e.umsatzMio!, b = e.bilanzMio!;
  // Art. 2 Abs. 3: < 10 Personen und Jahresumsatz bzw. Jahresbilanz ≤ 2 Mio. EUR
  // Art. 2 Abs. 2: < 50 Personen und Jahresumsatz bzw. Jahresbilanz ≤ 10 Mio. EUR
  // Art. 2 Abs. 1: < 250 Personen und Jahresumsatz ≤ 50 Mio. EUR oder Jahresbilanzsumme ≤ 43 Mio. EUR
  const klasse: Groessenklasse =
    ma < 10 && (u <= 2 || b <= 2) ? 'kleinst'
      : ma < 50 && (u <= 10 || b <= 10) ? 'klein'
      : ma < 250 && (u <= 50 || b <= 43) ? 'mittel'
      : 'gross';

  let vorlaeufig = false;
  if (e.verbundeneUnternehmen === undefined) {
    vorlaeufig = true;
    hinweise.push('STA-08 ungeklärt: Partner-/verbundene Unternehmen können die Größenklasse erhöhen.');
  } else if (e.verbundeneUnternehmen) {
    vorlaeufig = true;
    hinweise.push('Partner-/verbundene Unternehmen: Werte nach Anhang Art. 3–6 zurechnen (ENT-016) – Größenklasse vorläufig.');
  }
  return { klasse, fehlend: [], vorlaeufig, hinweise };
}

export interface Organisationsform {
  gespraechspartner: string;
  rollenbuendelung: string;
  vierAugen: string;
  freigabewege: string;
}

/** Wie geprüft wird – unabhängig davon, was und wie tief (Prüftiefenprofil). */
export const ORGANISATIONSFORM: Record<Groessenklasse, Organisationsform> = {
  kleinst: {
    gespraechspartner: '1–2 Personen (Inhaber/Geschäftsführung, ggf. technische Ansprechperson); Gespräche gebündelt',
    rollenbuendelung: 'erwartet – SoD-Ausnahmen mit kompensierender Maßnahme werden bei Mandatsanlage vorbereitet',
    vierAugen: 'zweite Person in der Regel extern (DT Agency) statt intern',
    freigabewege: 'eine freigebende Person beim Kunden; schriftliche Freigabe per Entscheidungsseite',
  },
  klein: {
    gespraechspartner: '2–4 Schlüsselpersonen (Geschäftsführung, IT, ggf. Personal)',
    rollenbuendelung: 'zulässig mit dokumentierter SoD-Ausnahme',
    vierAugen: 'intern, wo zwei geeignete Personen vorhanden sind, sonst extern',
    freigabewege: 'Geschäftsführung gibt frei; Risk Owner je Risiko',
  },
  mittel: {
    gespraechspartner: 'je Prüfbereich verantwortliche Person (Control Owner)',
    rollenbuendelung: 'eingeschränkt – Kontrollverantwortung und Freigabe getrennt',
    vierAugen: 'intern',
    freigabewege: 'Rollenträger gemäß Mandatsteam; Geschäftsleitung für Profil, Scope und Restrisiken',
  },
  gross: {
    gespraechspartner: 'Control Owner und operative Teams je Standort/Gesellschaft, Stichproben',
    rollenbuendelung: 'nur mit SoD-Ausnahme',
    vierAugen: 'intern, formalisiert',
    freigabewege: 'formale Gremien bzw. Freigabeworkflows des Kunden',
  },
};
