import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { erzeugeFragebogen, leseFragebogen, parseZahl, zuFakten } from '../src/fragebogen/fragebogen.js';
import { ALLE_FRAGEN } from '../src/fragebogen/katalog.js';
import { deriveDepthProfile } from '../src/proportionality/profile.js';
import { nis2Vorpruefung } from '../src/regelwerk/nis2.js';
import { einstufung, neu } from '../src/werkzeuge/befehle.js';
import { pruefeFormulierungen } from '../src/werkzeuge/ergebnis.js';
import { leseEntscheidungen, leseVerweise, zitatImText } from '../src/werkzeuge/markdown.js';
import { pruefeArbeitsbereich } from '../src/werkzeuge/pruefen.js';
import { ladeArbeitsbereich } from '../src/werkzeuge/repo.js';
import { mandatStatus } from '../src/werkzeuge/status.js';
import { MANUFACTURER } from './fixtures.js';

const ROOT = join(import.meta.dirname, '..');
const fehler = (b: { schwere: string; text: string }[]) => b.filter((x) => x.schwere === 'fehler').map((x) => x.text);

/** Kreuzt Antworten im Markdown an – wie ein Agent es tut. */
function beantworte(md: string, antworten: Record<string, string | number | string[]>, quelle = 'notizen/interview.md'): string {
  return md.split(/^(?=### )/m).map((block) => {
    const id = block.match(/^### ([A-Z]{2,3}-\d{2}) · /)?.[1];
    if (!id || !(id in antworten)) return block;
    const wert = antworten[id]!;
    let b = block;
    if (b.includes('- [ ] `')) for (const w of [wert].flat()) b = b.replace(`- [ ] \`${w}\``, `- [x] \`${w}\``);
    else b = b.replace(/^Antwort:.*$/m, `Antwort: ${wert}`);
    return wert === 'unbekannt' ? b : b.replace(/^Quelle:.*$/m, `Quelle: ${quelle}`);
  }).join('');
}

/** Fragebogen-Antworten aus ComplexityFacts (Testfall Produktionsunternehmen). */
function antwortenAus(f: typeof MANUFACTURER): Record<string, string | number | string[]> {
  const a: Record<string, string | number | string[]> = {};
  for (const q of ALLE_FRAGEN) {
    const [g, k] = q.feld.split('.') as [keyof typeof f, string];
    if ((g as string) === 'stammdaten') continue;
    const v = (f[g] as unknown as Record<string, unknown>)[k];
    a[q.id] = typeof v === 'boolean' ? (v ? 'ja' : 'nein') : Array.isArray(v) ? (v.length ? v : ['keine']) : (v as string | number);
  }
  return a;
}

describe('Fragebogen', () => {
  it('Vorlage im Repository ist aus dem aktuellen Katalog erzeugt', () => {
    const vorlage = readFileSync(join(ROOT, 'mandanten/_vorlage/fragebogen.md'), 'utf-8');
    expect(vorlage).toBe(erzeugeFragebogen({ kuerzel: '{{kuerzel}}', name: '{{name}}' }));
  });

  it('leerer Fragebogen: alle Fragen offen, keine Fehler', () => {
    const fb = leseFragebogen(erzeugeFragebogen({ kuerzel: 'x', name: 'X' }));
    expect(fb.fehler).toEqual([]);
    expect([...fb.antworten.values()].every((a) => a.status === 'offen')).toBe(true);
  });

  it('vollständig ausgefüllter Fragebogen ergibt dieselben Fakten und dasselbe Profil', () => {
    const md = beantworte(erzeugeFragebogen({ kuerzel: 'x', name: 'X' }), antwortenAus(MANUFACTURER));
    const f = zuFakten(leseFragebogen(md));
    expect(f.fehlend).toEqual([]);
    expect(f.fakten).toEqual(MANUFACTURER);
    expect(deriveDepthProfile(f.fakten!).recommended).toBe(4);
  });

  it('Formfehler werden erkannt: ohne Quelle, ungültige Option, unbekannt + Antwort', () => {
    let md = erzeugeFragebogen({ kuerzel: 'x', name: 'X' });
    md = beantworte(md, { 'ORG-01': 12 }, '');
    md = md.replace('- [ ] `single`', '- [x] `single`').replace(/(### ORG-04[\s\S]*?)- \[ \] `unbekannt`/, '$1- [x] `unbekannt`');
    const fb = leseFragebogen(md);
    expect(fb.antworten.get('ORG-01')!.fehler).toContain('Antwort ohne Quelle');
    expect(fb.antworten.get('ORG-04')!.fehler.join()).toMatch(/schließt andere Optionen aus/);
  });

  it.each([['250', 250], ['1.250', 1250], ['12,5', 12.5], ['12.5', 12.5], ['abc', undefined]])('Zahl "%s" → %s', (roh, wert) => {
    expect(parseZahl(roh)).toBe(wert);
  });
});

describe('NIS2-Vorprüfung nach § 28 BSIG', () => {
  const basis = { entgeltlich: true, kritis: false, verbundeneUnternehmen: false };
  it.each([
    [{ ...basis, einrichtungsarten: ['a2-5.4'], mitarbeiter: 250, umsatzMio: 48, bilanzMio: 30 }, 'wichtig'],
    [{ ...basis, einrichtungsarten: ['a1-6.1.10'], mitarbeiter: 300, umsatzMio: 40, bilanzMio: 20 }, 'besonders_wichtig'],
    [{ ...basis, einrichtungsarten: ['a1-6.1.10'], mitarbeiter: 30, umsatzMio: 60, bilanzMio: 45 }, 'besonders_wichtig'],
    [{ ...basis, einrichtungsarten: ['a1-6.1.10'], mitarbeiter: 30, umsatzMio: 12, bilanzMio: 8 }, 'nicht_betroffen'],
    [{ ...basis, einrichtungsarten: ['a1-6.1.2'], mitarbeiter: 3, umsatzMio: 0.5, bilanzMio: 0.2 }, 'besonders_wichtig'],
    [{ ...basis, einrichtungsarten: ['a1-6.1.9'], mitarbeiter: 20, umsatzMio: 5, bilanzMio: 5 }, 'wichtig'],
    [{ ...basis, einrichtungsarten: ['keine'], mitarbeiter: 5000, umsatzMio: 900, bilanzMio: 700 }, 'nicht_betroffen'],
    [{ ...basis, kritis: true }, 'besonders_wichtig'],
    [{ einrichtungsarten: ['a2-5.4'] }, 'pruefen'],
  ])('%j → %s', (eingabe, erwartet) => {
    expect(nis2Vorpruefung(eingabe).ergebnis).toBe(erwartet);
  });

  it('ungeklärte verbundene Unternehmen machen das Ergebnis vorläufig', () => {
    const v = nis2Vorpruefung({ entgeltlich: true, kritis: false, einrichtungsarten: ['a2-5.4'], mitarbeiter: 60, umsatzMio: 5, bilanzMio: 5 });
    expect(v.hinweise.join()).toMatch(/STA-08 ungeklärt/);
  });
});

describe('Markdown-Bausteine', () => {
  it('Zitate: Teile mit Auslassung in Reihenfolge, Whitespace und Anführungszeichen normalisiert', () => {
    const quelle = 'Als besonders wichtige Einrichtung gelten 1.\nBetreiber kritischer Anlagen, 2.\nqualifizierte „Anbieter“';
    expect(zitatImText('Als besonders wichtige Einrichtung gelten 1. Betreiber kritischer Anlagen,', quelle)).toBe(true);
    expect(zitatImText('Als besonders … qualifizierte "Anbieter"', quelle)).toBe(true);
    expect(zitatImText('qualifizierte … Als besonders', quelle)).toBe(false);
    expect(zitatImText('Betreiber unkritischer Anlagen', quelle)).toBe(false);
  });

  it('Verweise in Inline-Code sind Beispiele, keine Verweise', () => {
    expect(leseVerweise('siehe [E-003] und `[BIB-X]` sowie [ORG-01]').map((v) => v.id)).toEqual(['E-003', 'ORG-01']);
  });

  it('Entscheidungen mit mehrzeiligen Feldern', () => {
    const [e] = leseEntscheidungen('## E-007 · Test\n- **Status:** vorgeschlagen\n- **Typ:** finding\n- **Optionen:**\n  1. a\n  2. b\n- **Vorschlag:** x\n');
    expect(e).toMatchObject({ id: 'E-007', status: 'vorgeschlagen', typ: 'finding' });
    expect(e!.felder['optionen']).toBe('1. a\n2. b');
  });
});

describe('Formulierungen (vorschriften.md §A17)', () => {
  const vorschriften = readFileSync(join(ROOT, 'vorschriften.md'), 'utf-8');
  const bausteine = (vorschriften.split('### A17.3')[1] ?? '').split('### A17.4')[0]!
    .split('\n').filter((z) => z.startsWith('> ')).map((z) => z.slice(2));

  it('alle Satzbausteine aus §A17.3 bestehen die Formulierungsprüfung', () => {
    expect(bausteine.length).toBeGreaterThanOrEqual(9);
    const befunde = pruefeFormulierungen(bausteine.join('\n'), 'vorschriften.md', false);
    expect(befunde.filter((b) => b.schwere === 'fehler')).toEqual([]);
    // einzig zulässige Warnung: „zertifiziert“ im Zertifikats-Baustein
    expect(befunde.map((b) => b.text)).toEqual([expect.stringMatching(/„zertifiziert“/)]);
  });

  it.each([
    'Das ISMS ist vollständig konform.',
    'Die Organisation ist NIS2-konform.',
    'Die Umsetzung ist DSGVO-konform.',
    'Wir garantieren die Sicherheit.',
    'Die Systeme sind lückenlos geschützt.',
    'Das Unternehmen erfüllt alle gesetzlichen Pflichten.',
    'Die Einordnung ist rechtsverbindlich.',
    'Es wurde eine Nichtkonformität festgestellt.',
  ])('„%s“ wird abgelehnt', (satz) => {
    expect(pruefeFormulierungen(satz, 'x', false).some((b) => b.schwere === 'fehler')).toBe(true);
  });

  it('Auditbegriffe sind im Audit-Mandat zulässig', () => {
    expect(pruefeFormulierungen('Es wurde eine Nichtkonformität festgestellt.', 'x', true)).toEqual([]);
  });
});

describe('Repository', () => {
  it('Bibliothek, Entscheidungsseite, plan.md und vorschriften.md sind konsistent; alle Zitate wörtlich belegt', () => {
    const ws = ladeArbeitsbereich(ROOT);
    expect(ws.bibliothek.reduce((n, e) => n + e.zitate.length, 0)).toBeGreaterThan(50);
    expect(fehler(pruefeArbeitsbereich(ws))).toEqual([]);
  });
});

describe('Iterationszyklus an einem fiktiven Mandat', () => {
  let root: string;
  const mandat = () => join(root, 'mandanten', 'muster');
  const lies = (n: string) => readFileSync(join(mandat(), n), 'utf-8');
  const schreibe = (n: string, s: string) => writeFileSync(join(mandat(), n), s);
  const status = () => {
    const ws = ladeArbeitsbereich(root, 'muster');
    return mandatStatus(ws, ws.mandate[0]!);
  };
  const pruefung = () => fehler(pruefeArbeitsbereich(ladeArbeitsbereich(root, 'muster')));

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'isms-'));
    for (const p of ['plan.md', 'entscheidungen.md', 'bibliothek', 'mandanten']) cpSync(join(ROOT, p), join(root, p), { recursive: true });
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('0 · neues Mandat ist formal fehlerfrei; nächster Schritt ist die Erhebung', () => {
    expect(neu(root, 'muster', 'Muster GmbH (fiktiv)')).toMatch(/Angelegt/);
    expect(() => neu(root, 'muster')).toThrow(/existiert bereits/);
    expect(pruefung()).toEqual([]);
    expect(status().schritte[0]).toMatchObject({ agent: 'erhebung' });
  });

  it('1 · Erhebung mit einer Lücke → Klärung und NIS2-Vorschlag werden angefordert', () => {
    const a: Record<string, string | number | string[]> = {
      ...antwortenAus(MANUFACTURER), 'STA-04': ['a2-5.4'], 'STA-05': 'ja', 'STA-06': 48, 'STA-07': 30, 'STA-08': 'unbekannt',
    };
    delete a['REG-02'];
    schreibe('fragebogen.md', beantworte(lies('fragebogen.md'), a));
    const s = status();
    expect(s.unbekanntOhneKlaerung).toEqual(['STA-08']);
    expect(s.nis2?.ergebnis).toBe('wichtig');
    expect(s.schritte.map((x) => x.agent)).toEqual(expect.arrayContaining(['erhebung', 'einstufung']));
    expect(einstufung(root, 'muster')).toMatch(/Noch nicht ableitbar[\s\S]*REG-02/);
  });

  it('2 · Agent darf nicht freigeben', () => {
    const e = lies('entscheidungen.md');
    schreibe('entscheidungen.md', e.replace(/(## E-002[\s\S]*?)- \*\*Status:\*\* offen/, '$1- **Status:** freigegeben')
      .replace(/(## E-002[\s\S]*?)- \*\*Entscheidung:\*\* —/, '$1- **Entscheidung:** wichtige Einrichtung')
      .replace(/(## E-002[\s\S]*?)- \*\*Freigegeben von:\*\* —/, '$1- **Freigegeben von:** Agent einstufung')
      .replace(/(## E-002[\s\S]*?)- \*\*Freigegeben am:\*\* —/, '$1- **Freigegeben am:** 2026-11-12'));
    expect(pruefung().join()).toMatch(/E-002: "Freigegeben von" muss ein Mensch sein/);
  });

  it('3 · Mensch gibt frei, Agent legt ab → Profil 4 wird ableitbar', () => {
    schreibe('entscheidungen.md', lies('entscheidungen.md')
      .replace('- **Freigegeben von:** Agent einstufung', '- **Freigegeben von:** Erika Beispiel, Engagement Lead'));
    expect(status().schritte[0]).toMatchObject({ agent: 'isms-pruefung', text: expect.stringMatching(/ablegen: E-002/) });

    const fb = lies('fragebogen.md').replace('- [ ] `important_entity`', '- [x] `important_entity`')
      .replace(/(### REG-02[\s\S]*?)Quelle:\n/, '$1Quelle: E-002\n');
    schreibe('fragebogen.md', fb);
    schreibe('entscheidungen.md', lies('entscheidungen.md')
      .replace(/(## E-002[\s\S]*?)- \*\*Status:\*\* freigegeben/, '$1- **Status:** abgelegt')
      .replace(/(## E-002[\s\S]*?)- \*\*Abgelegt in:\*\* —/, '$1- **Abgelegt in:** fragebogen.md REG-02'));
    expect(pruefung()).toEqual([]);
    expect(einstufung(root, 'muster')).toMatch(/Profil 4 – Critical \/ Regulated/);
    expect(status().einstufung.empfehlung).toMatch(/^Profil 4/);
  });

  it('4 · isms.md lehnt nicht Freigegebenes ab – außer unter „Offene Punkte“', () => {
    const isms = lies('isms.md');
    schreibe('isms.md', isms.replace('| NIS2 / BSIG | | |', '| NIS2 / BSIG | wichtige Einrichtung | [E-002] |'));
    expect(pruefung()).toEqual([]);
    schreibe('isms.md', isms.replace('| Prüftiefenprofil | | |', '| Prüftiefenprofil | Profil 4 | [E-003], [BIB-BSIG-28], [STA-08] |'));
    expect(pruefung()).toEqual([
      '[E-003] Entscheidung nicht freigegeben (offen)',
      '[BIB-BSIG-28] Bibliothekseintrag nicht freigegeben (quellengeprueft)',
      '[STA-08] Frage ist nicht beantwortet',
    ]);
    schreibe('isms.md', isms);
  });

  it('4b · ISO/IEC 27001 Abschnitte 4–10 kennen keine Nichtanwendbarkeit', () => {
    const isms = lies('isms.md');
    const kopf = '| Abschnitt | Erfüllung | Evidenzlage | Berichtsstatus | Nachweise | Grundlage |\n|---|---|---|---|---|---|';
    schreibe('isms.md', isms.replace(kopf, `${kopf}\n| 6.1.2 | not_applicable | none | not_applicable | – | [E-002] |`));
    expect(pruefung().join()).toMatch(/Erfüllung „not_applicable“ ungültig/);
    schreibe('isms.md', isms);
  });

  it('4c · Berichtsstatus wird nachgerechnet; „ausreichend“ braucht einen geeigneten Nachweis', () => {
    const isms = lies('isms.md');
    const zeile = (ums: string, ev: string, st: string, nw: string) =>
      `| 9 Personal, Zugriffskontrolle, IKT-Verwaltung | applicable | 2 | ${ums} | not_verified | ${ev} | ${st} | ${nw} | [E-002] |`;
    const leer = '| 9 Personal, Zugriffskontrolle, IKT-Verwaltung | | | | | | | | |';
    mkdirSync(join(mandat(), 'notizen'), { recursive: true });
    writeFileSync(join(mandat(), 'notizen', 'interview.md'), '---\nart: claim\nquelle: Interview GF\ndatum: 2026-11-20\nerfasst_von: Anna Beispiel\n---\nMFA ist überall aktiv.\n');
    writeFileSync(join(mandat(), 'notizen', 'mfa-export.md'), '---\nart: evidence\nquelle: Export IdP\ndatum: 2026-11-21\nerfasst_von: Anna Beispiel\npruefung: geeignet\ngeprueft_von: Erika Beispiel, Engagement Lead\ngueltig_bis: —\n---\n');

    schreibe('isms.md', isms.replace(leer, zeile('present', 'claim_only', 'met', 'notizen/interview.md')));
    expect(pruefung().join()).toMatch(/Berichtsstatus „met“ folgt nicht aus den Achsen – berechnet: insufficient_evidence/);

    schreibe('isms.md', isms.replace(leer, zeile('present', 'sufficient', 'met', 'notizen/interview.md')));
    expect(pruefung().join()).toMatch(/R1: Evidenzlage „ausreichend“ ohne geeigneten Nachweis/);

    schreibe('isms.md', isms.replace(leer, zeile('present', 'sufficient', 'met', 'notizen/mfa-export.md')));
    expect(pruefung()).toEqual([]);

    schreibe('isms.md', isms.replace(leer, zeile('present', 'sufficient', 'met', 'notizen/mfa-export.md').replace(' [E-002] |', ' |')));
    expect(pruefung().join()).toMatch(/Ergebniszeile ohne Grundlage/);
    schreibe('isms.md', isms);
  });

  it('4d · Formulierungen: keine Konformitätsbehauptung, Auditbegriffe nur im Audit-Mandat', () => {
    const isms = lies('isms.md');
    const urteil = (t: string) => isms.replace('| Gesamturteil | | |', `| Gesamturteil | ${t} | [E-002] |`);
    schreibe('isms.md', urteil('Das Unternehmen ist NIS2-konform.'));
    expect(pruefung().join()).toMatch(/Formulierung „NIS2-konform“/);
    schreibe('isms.md', urteil('Für Prüfbereich 9 wurde eine Nichtkonformität festgestellt.'));
    expect(pruefung().join()).toMatch(/Auditbegriff außerhalb eines Audit-Mandats/);
    schreibe('isms.md', urteil('Für Prüfbereich 9 wurde eine Nichtkonformität festgestellt.').replace('leistungsart: offen', 'leistungsart: internal_audit'));
    expect(pruefung()).toEqual([]);
    schreibe('isms.md', urteil('Im vereinbarten Prüfumfang lagen für 7 von 10 Prüfbereichen ausreichende Nachweise vor.'));
    expect(pruefung()).toEqual([]);
    schreibe('isms.md', isms);
  });

  it('4e · Lebenszyklen: Feststellung braucht Schwere, Restrisiko nur durch Risk Owner', () => {
    const e = lies('entscheidungen.md');
    const block = (id: string, typ: string, extra: string, status = 'vorgeschlagen', von = '—') =>
      `\n## ${id} · Test\n- **Status:** ${status}\n- **Typ:** ${typ}\n- **Betrifft:** isms.md\n- **Eingaben:** notizen/interview.md\n${extra}- **Vorschlag:** x\n- **Entscheidung:** x\n- **Freigegeben von:** ${von}\n- **Freigegeben am:** 2026-11-12\n- **Abgelegt in:** —\n`;
    schreibe('entscheidungen.md', e + block('E-090', 'finding', '- **Kundenreaktion:** offen\n'));
    expect(pruefung().join()).toMatch(/E-090: Feld „schwere“ fehlt/);
    schreibe('entscheidungen.md', e + block('E-091', 'risiko', '- **Phase:** restrisiko_akzeptiert\n', 'freigegeben', 'Erika Beispiel, Engagement Lead'));
    expect(pruefung().join()).toMatch(/E-091: Risikoakzeptanz nur durch Risk Owner/);
    schreibe('entscheidungen.md', e + block('E-091', 'risiko', '- **Phase:** restrisiko_akzeptiert\n', 'abgelegt', 'Max Muster, Risk Owner').replace('- **Abgelegt in:** —', '- **Abgelegt in:** isms.md §7'));
    expect(pruefung().join()).not.toMatch(/E-091/);
    schreibe('entscheidungen.md', e);
  });

  it('4f · isms.md wird nur mit vollständigem Prüfergebnis und ausgewiesenen offenen Punkten freigegeben', () => {
    const isms = lies('isms.md');
    schreibe('isms.md', isms.replace('status: entwurf', 'status: freigegeben'));
    const f = pruefung().join();
    expect(f).toMatch(/§10 „Gesamturteil“ fehlt/);
    expect(f).toMatch(/§10 „Freigabe DT Agency“ fehlt/);
    schreibe('isms.md', isms);
  });

  it('5 · manipuliertes Zitat in der Bibliothek wird erkannt', () => {
    const p = join(root, 'bibliothek/rechtsquellen/bsig-33-registrierung.md');
    writeFileSync(p, readFileSync(p, 'utf-8').replace('spätestens jedoch binnen zwei Wochen', 'spätestens jedoch binnen vier Wochen'));
    expect(fehler(pruefeArbeitsbereich(ladeArbeitsbereich(root, 'muster'))).join()).toMatch(/nicht wörtlich in de-bsig-p33.txt/);
  });
});
