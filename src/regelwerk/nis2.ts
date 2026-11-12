/**
 * NIS2-/BSIG-Vorprüfung nach § 28 BSIG (Fassung vom 22.10.2026).
 * Grundlage: bibliothek/rechtsquellen/nis2-bsig-betroffenheit.md (BIB-BSIG-28).
 *
 * Ergebnis ist immer ein VORSCHLAG für eine Entscheidung – nie eine
 * abschließende rechtliche Bewertung.
 */

export type Nis2Ergebnis = 'besonders_wichtig' | 'wichtig' | 'nicht_betroffen' | 'pruefen';

export const NIS2_FAKT: Record<Nis2Ergebnis, string> = {
  besonders_wichtig: 'essential_entity',
  wichtig: 'important_entity',
  nicht_betroffen: 'not_affected',
  pruefen: 'unclear',
};

export interface Nis2Eingaben {
  einrichtungsarten?: string[];
  entgeltlich?: boolean;
  mitarbeiter?: number;
  umsatzMio?: number;
  bilanzMio?: number;
  kritis?: boolean;
  verbundeneUnternehmen?: boolean;
}

export interface Nis2Vorpruefung {
  ergebnis: Nis2Ergebnis;
  begruendung: string[];
  fehlend: string[];
  hinweise: string[];
}

const TK = ['a1-6.1.8', 'a1-6.1.9'];
const OHNE_GROESSE = { 'a1-6.1.7q': 'qualifizierter Vertrauensdiensteanbieter', 'a1-6.1.3': 'Top Level Domain Name Registry', 'a1-6.1.2': 'DNS-Diensteanbieter' } as const;

export function nis2Vorpruefung(e: Nis2Eingaben): Nis2Vorpruefung {
  const begruendung: string[] = [];
  const hinweise: string[] = [
    '§ 28 Abs. 3 BSIG: vernachlässigbare Geschäftstätigkeiten können bei der Zuordnung unberücksichtigt bleiben.',
    'Mitarbeiterzahl, Umsatz und Bilanzsumme nach Empfehlung 2003/361/EG (§ 28 Abs. 4 BSIG).',
  ];
  if (e.verbundeneUnternehmen === undefined) {
    hinweise.push('STA-08 ungeklärt: Bei Partner-/verbundenen Unternehmen können Mitarbeiter, Umsatz und Bilanz hinzuzurechnen sein – Ergebnis vorläufig.');
  } else if (e.verbundeneUnternehmen) {
    hinweise.push('Partner-/verbundene Unternehmen: Daten sind hinzuzurechnen, außer bei IT-Unabhängigkeit nach § 28 Abs. 4 Satz 2 BSIG – gesondert entscheiden.');
  }
  if (e.einrichtungsarten?.some((a) => TK.includes(a) || a.startsWith('a1-1.'))) {
    hinweise.push('§ 28 Abs. 5 BSIG: Für TK-Netze/-Dienste und Energie nach EnWG §§ 5c–5e gelten §§ 30, 31, 32, 35, 36, 38, 39, 61, 62 nicht (mit Rückausnahmen).');
  }
  if (e.einrichtungsarten?.some((a) => a.startsWith('a1-3.'))) {
    hinweise.push('§ 28 Abs. 6 BSIG: Für Finanzunternehmen nach DORA gelten §§ 30, 31, 32, 35, 36, 38, 39 nicht.');
  }

  if (e.kritis === true) {
    begruendung.push('Betreiber kritischer Anlagen → besonders wichtige Einrichtung (§ 28 Abs. 1 Nr. 1 BSIG).');
    return { ergebnis: 'besonders_wichtig', begruendung, fehlend: [], hinweise };
  }

  const fehlend: string[] = [];
  if (e.einrichtungsarten === undefined) fehlend.push('STA-04');
  if (e.kritis === undefined) fehlend.push('REG-03');
  const arten = (e.einrichtungsarten ?? []).filter((a) => a !== 'keine');

  for (const [art, name] of Object.entries(OHNE_GROESSE)) {
    if (arten.includes(art)) {
      begruendung.push(`${name} → besonders wichtige Einrichtung unabhängig von der Größe (§ 28 Abs. 1 Nr. 2 BSIG).`);
      return { ergebnis: 'besonders_wichtig', begruendung, fehlend: [], hinweise };
    }
  }
  if (e.einrichtungsarten !== undefined && arten.length === 0) {
    if (e.kritis === false) {
      begruendung.push('Keiner Einrichtungsart nach Anlage 1 oder 2 zuzuordnen und kein Betreiber kritischer Anlagen.');
      return { ergebnis: 'nicht_betroffen', begruendung, fehlend: [], hinweise };
    }
    return { ergebnis: 'pruefen', begruendung, fehlend, hinweise };
  }
  if (arten.includes('a1-6.1.7')) {
    begruendung.push('Vertrauensdiensteanbieter → wichtige Einrichtung (§ 28 Abs. 2 Nr. 1 BSIG), sofern nicht besonders wichtig.');
  }

  const groesse = e.mitarbeiter !== undefined && (e.umsatzMio !== undefined && e.bilanzMio !== undefined);
  if (e.mitarbeiter === undefined) fehlend.push('ORG-01');
  if (e.umsatzMio === undefined) fehlend.push('STA-06');
  if (e.bilanzMio === undefined) fehlend.push('STA-07');
  if (e.entgeltlich === undefined) fehlend.push('STA-05');

  const ma = e.mitarbeiter ?? 0, u = e.umsatzMio ?? 0, b = e.bilanzMio ?? 0;
  const ueberKlein = ma >= 50 || (u > 10 && b > 10);
  const ueberMittel = ma >= 250 || (u > 50 && b > 43);

  if (arten.some((a) => TK.includes(a))) {
    if (!groesse) return { ergebnis: 'pruefen', begruendung, fehlend, hinweise };
    begruendung.push(ueberKlein
      ? 'TK-Netz/-Dienst mit ≥ 50 Mitarbeitern oder Umsatz und Bilanz > 10 Mio. EUR → besonders wichtig (§ 28 Abs. 1 Nr. 3 BSIG).'
      : 'TK-Netz/-Dienst unterhalb der Schwellen → wichtig (§ 28 Abs. 2 Nr. 2 BSIG).');
    return { ergebnis: ueberKlein ? 'besonders_wichtig' : 'wichtig', begruendung, fehlend: [], hinweise };
  }

  if (!groesse || e.entgeltlich === undefined) {
    return { ergebnis: 'pruefen', begruendung, fehlend, hinweise };
  }
  if (!e.entgeltlich) {
    begruendung.push('Keine entgeltlichen Waren oder Dienstleistungen – Tatbestand § 28 Abs. 1 Nr. 4 / Abs. 2 Nr. 3 BSIG nicht erfüllt; Sonderfälle prüfen.');
    return { ergebnis: arten.includes('a1-6.1.7') ? 'wichtig' : 'pruefen', begruendung, fehlend: [], hinweise };
  }
  const anlage1 = arten.some((a) => a.startsWith('a1-'));
  if (anlage1 && ueberMittel) {
    begruendung.push('Anlage 1 und ≥ 250 Mitarbeiter oder Umsatz > 50 Mio. EUR und Bilanz > 43 Mio. EUR → besonders wichtig (§ 28 Abs. 1 Nr. 4 BSIG).');
    return { ergebnis: 'besonders_wichtig', begruendung, fehlend: [], hinweise };
  }
  if (ueberKlein) {
    begruendung.push('Anlage 1 oder 2 und ≥ 50 Mitarbeiter oder Umsatz und Bilanz > 10 Mio. EUR → wichtig (§ 28 Abs. 2 Nr. 3 BSIG).');
    return { ergebnis: 'wichtig', begruendung, fehlend: [], hinweise };
  }
  if (arten.includes('a1-6.1.7')) return { ergebnis: 'wichtig', begruendung, fehlend: [], hinweise };
  begruendung.push('Einrichtungsart nach Anlage 1/2, aber unterhalb der Schwellenwerte (< 50 Mitarbeiter, Umsatz oder Bilanz ≤ 10 Mio. EUR).');
  return { ergebnis: 'nicht_betroffen', begruendung, fehlend: [], hinweise };
}
