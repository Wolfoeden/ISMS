import { describe, expect, it } from 'vitest';
import { groessenklasse, ORGANISATIONSFORM } from '../src/bewertung/groessenklasse.js';
import { berichtsstatus, BEZEICHNUNG, BERICHTSSTATUS, pruefeBewertung, type Bewertung } from '../src/bewertung/modell.js';
import { PROFILE_PARAMETERS } from '../src/proportionality/parameters.js';

const control = (x: Partial<Bewertung>): Bewertung => ({ art: 'control', anwendbarkeit: 'applicable', evidenzlage: 'none', freigabe: 'abgelegt', ...x });
const anforderung = (x: Partial<Bewertung>): Bewertung => ({ art: 'anforderung', anwendbarkeit: 'applicable', evidenzlage: 'none', freigabe: 'abgelegt', ...x });

describe('Berichtsstatus (ENT-018 C) – Beispiele der Entscheidungsvorlage', () => {
  it.each([
    ['MFA nur Aussage, Profil 2', control({ umsetzung: 'present', evidenzlage: 'claim_only', tiefe: 2 }), 'insufficient_evidence'],
    ['MFA mit Export, Profil 2', control({ umsetzung: 'present', evidenzlage: 'sufficient', tiefe: 2 }), 'met'],
    ['Backup ohne Wiederherstellungstest, Tiefe 4', control({ umsetzung: 'present', evidenzlage: 'sufficient', tiefe: 4 }), 'insufficient_evidence'],
    ['Backup mit Test, Tiefe 4', control({ umsetzung: 'present', wirksamkeit: 'effective', evidenzlage: 'sufficient', tiefe: 4 }), 'met'],
    ['teilweise umgesetzt, Tiefe 4', control({ umsetzung: 'partial', evidenzlage: 'sufficient', tiefe: 4 }), 'partially_met'],
    ['ISO 6.1.2 eingestandene Lücke', anforderung({ erfuellung: 'not_met', evidenzlage: 'claim_only' }), 'not_met'],
    ['behauptete Erfüllung ohne Beleg', anforderung({ erfuellung: 'met', evidenzlage: 'claim_only' }), 'insufficient_evidence'],
    ['widersprüchliche Nachweise', control({ umsetzung: 'present', evidenzlage: 'conflicting', freigabe: 'vorgeschlagen' }), 'needs_review'],
    ['Vorschlag wartet auf Freigabe', control({ umsetzung: 'present', evidenzlage: 'sufficient', freigabe: 'vorgeschlagen' }), 'needs_review'],
    ['verifiziert, aber noch nicht freigegeben (ENT-029)', control({ umsetzung: 'present', evidenzlage: 'sufficient', freigabe: 'verifiziert' }), 'needs_review'],
    ['noch nicht bewertet', control({ umsetzung: 'unknown' }), 'not_assessed'],
    ['Umsetzung behauptet, kein Nachweis', control({ umsetzung: 'present', evidenzlage: 'none' }), 'evidence_missing'],
    ['unwirksam', control({ umsetzung: 'present', wirksamkeit: 'ineffective', evidenzlage: 'sufficient' }), 'not_met'],
    ['nicht anwendbar', control({ anwendbarkeit: 'not_applicable', begruendung: 'E-009' }), 'not_applicable'],
  ])('%s → %s', (_, b, erwartet) => {
    expect(berichtsstatus(b)).toBe(erwartet);
  });

  it('jeder Berichtsstatus hat eine deutsche Bezeichnung', () => {
    for (const s of BERICHTSSTATUS) expect(BEZEICHNUNG[s]).toBeTruthy();
  });
});

describe('Regeln R1–R5', () => {
  it('R1: „ausreichend“ ohne geeigneten Nachweis der Art evidence', () => {
    expect(pruefeBewertung(control({ umsetzung: 'present', evidenzlage: 'sufficient', nachweisVorhanden: false })).map((v) => v.regel)).toEqual(['R1']);
  });
  it('R2: Wirksamkeit ohne Umsetzung oder ohne Nachweis', () => {
    expect(pruefeBewertung(control({ umsetzung: 'absent', wirksamkeit: 'effective', evidenzlage: 'sufficient' })).map((v) => v.regel)).toContain('R2');
    expect(pruefeBewertung(control({ umsetzung: 'present', wirksamkeit: 'effective', evidenzlage: 'sufficient', nachweisVorhanden: false })).map((v) => v.regel)).toContain('R2');
  });
  it('R4: Pflichtanforderung nie „nicht anwendbar“; sonst nur begründet und freigegeben', () => {
    expect(pruefeBewertung(anforderung({ anwendbarkeit: 'not_applicable', pflichtanforderung: true, begruendung: 'E-1', freigabe: 'abgelegt' })).map((v) => v.regel)).toEqual(['R4']);
    expect(pruefeBewertung(control({ anwendbarkeit: 'not_applicable', freigabe: 'vorgeschlagen' })).map((v) => v.regel)).toEqual(['R4', 'R4']);
  });
  it('R5: widersprüchliche Nachweise können nicht freigegeben sein', () => {
    expect(pruefeBewertung(control({ umsetzung: 'present', evidenzlage: 'conflicting', freigabe: 'abgelegt' })).map((v) => v.regel)).toEqual(['R5']);
  });
  it('Wertebereiche und Achsen je Art', () => {
    expect(pruefeBewertung(control({ umsetzung: 'vorhanden' as never })).map((v) => v.regel)).toEqual(['W']);
    expect(pruefeBewertung(control({ erfuellung: 'met' })).map((v) => v.regel)).toEqual(['W']);
  });
});

describe('Größenklasse (ENT-019 C)', () => {
  it.each([
    [{ mitarbeiter: 1, umsatzMio: 0.2, bilanzMio: 0.1 }, 'kleinst'],
    [{ mitarbeiter: 6, umsatzMio: 3, bilanzMio: 1.5 }, 'kleinst'],
    [{ mitarbeiter: 6, umsatzMio: 3, bilanzMio: 2.5 }, 'klein'],
    [{ mitarbeiter: 49, umsatzMio: 12, bilanzMio: 9 }, 'klein'],
    [{ mitarbeiter: 50, umsatzMio: 5, bilanzMio: 5 }, 'mittel'],
    [{ mitarbeiter: 249, umsatzMio: 60, bilanzMio: 40 }, 'mittel'],
    [{ mitarbeiter: 249, umsatzMio: 60, bilanzMio: 50 }, 'gross'],
    [{ mitarbeiter: 250, umsatzMio: 48, bilanzMio: 30 }, 'gross'],
  ])('%j → %s', (e, k) => {
    expect(groessenklasse({ ...e, verbundeneUnternehmen: false }).klasse).toBe(k);
  });

  it('fehlende Angaben und ungeklärte verbundene Unternehmen', () => {
    expect(groessenklasse({ mitarbeiter: 5 }).fehlend).toEqual(['STA-06', 'STA-07']);
    expect(groessenklasse({ mitarbeiter: 5, umsatzMio: 1, bilanzMio: 1 }).vorlaeufig).toBe(true);
  });

  it('die Größenklasse verändert keine Prüfparameter des Prüftiefenprofils', () => {
    // Organisationsform enthält keine Felder für Tiefe, Evidenz oder Prüfumfang
    for (const f of Object.values(ORGANISATIONSFORM)) {
      expect(Object.keys(f).sort()).toEqual(['freigabewege', 'gespraechspartner', 'rollenbuendelung', 'vierAugen']);
    }
    expect(Object.keys(PROFILE_PARAMETERS[4])).toContain('evidence');
  });
});
