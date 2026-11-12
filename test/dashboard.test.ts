import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { neu } from '../src/werkzeuge/befehle.js';
import { dashboardHtml, mandatDashboard } from '../src/werkzeuge/dashboard.js';
import { ladeArbeitsbereich } from '../src/werkzeuge/repo.js';

const ROOT = join(import.meta.dirname, '..');

describe('Fortschrittsübersicht je Mandat (ENT-037)', () => {
  let root: string;
  const datei = (n: string) => join(root, 'mandanten', 'dash', n);
  const daten = () => {
    const ws = ladeArbeitsbereich(root, 'dash');
    return mandatDashboard(ws, ws.mandate[0]!, '2026-11-12');
  };

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'isms-dash-'));
    for (const p of ['plan.md', 'entscheidungen.md', 'bibliothek', 'mandanten']) cpSync(join(ROOT, p), join(root, p), { recursive: true });
    neu(root, 'dash', 'Dash GmbH (fiktiv)');
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('neues Mandat: alle Phasen offen, Kunde soll Fragen beantworten', () => {
    const d = daten();
    expect(d.name).toBe('Dash GmbH (fiktiv)');
    expect(d.phasen.map((p) => p.name)).toEqual(['Erhebung', 'Einstufung', 'Vorschriften', 'Bewertung', 'Review', 'Freigabe']);
    expect(d.phasen.every((p) => p.stand === 'offen')).toBe(true);
    expect(d.aufgaben.some((a) => a.wer === 'Kunde' && /Fragen beantworten/.test(a.text))).toBe(true);
    expect(d.offenePunkte.length).toBeGreaterThan(0);
  });

  it('Feststellungen erscheinen vor der Ablage nur als Anzahl (ENT-007)', () => {
    const e = readFileSync(datei('entscheidungen.md'), 'utf-8');
    writeFileSync(datei('entscheidungen.md'), `${e}\n## E-090 · Geheimer Befund zur Firewall\n- **Status:** vorgeschlagen\n- **Typ:** finding\n- **Schwere:** hoch\n- **Kundenreaktion:** offen\n`);
    const d = daten();
    const html = dashboardHtml(d);
    expect(html).not.toMatch(/Geheimer Befund/);
    expect(d.aufgaben.some((a) => a.wer === 'Freigabe' && /1 Feststellungen in Prüfung/.test(a.text))).toBe(true);
    expect(d.feststellungen.inBearbeitung).toBe(1);
    writeFileSync(datei('entscheidungen.md'), e);
  });

  it('HTML ist eigenständig, ohne Prozentwert und ohne externe Ressourcen', () => {
    const html = dashboardHtml(daten());
    expect(html).not.toMatch(/https?:\/\//);
    const sichtbar = html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ');
    expect(sichtbar).not.toMatch(/\d\s?%/);
    expect(html).toMatch(/keine Bewertung des Sicherheitsniveaus/);
    expect(html).not.toMatch(/zertifiziert|konform/i);
  });

  it('Inhalte werden maskiert', () => {
    const isms = readFileSync(datei('isms.md'), 'utf-8');
    writeFileSync(datei('isms.md'), isms.replace('# ISMS – Dash GmbH (fiktiv)', '# ISMS – <script>x</script>'));
    expect(dashboardHtml(daten())).not.toMatch(/<script>x/);
    writeFileSync(datei('isms.md'), isms);
  });
});
