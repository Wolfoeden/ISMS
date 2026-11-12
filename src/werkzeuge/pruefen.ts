/**
 * Konsistenzprüfung des Arbeitsbereichs – erzwingt die Regeln aus plan.md:
 *  - Zitate in der Bibliothek stehen wörtlich in den Quellen-Snapshots.
 *  - „verifiziert“ setzt ein Mensch (Name + Datum), nie ein Agent.
 *  - isms.md enthält nur Verweise auf verifiziertes Wissen und verifizierte Entscheidungen.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frageById } from '../fragebogen/katalog.js';
import {
  ENTSCHEIDUNG_STATUS,
  ENTSCHEIDUNG_TYPEN,
  fmString,
  gesetzt,
  leseVerweise,
  ohneAbschnitt,
  zitatImText,
  type Entscheidung,
} from './markdown.js';
import { BIBLIOTHEK_STATUS, type Arbeitsbereich, type BibEintrag, type Mandat } from './repo.js';

export interface Befund {
  schwere: 'fehler' | 'warnung';
  datei: string;
  zeile?: number;
  text: string;
}

const MASCHINE = /\b(agent|claude|ki|ai|bot|assistent)\b/i;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

export function istMenschlicherPruefer(name: string | undefined): boolean {
  return gesetzt(name) && !MASCHINE.test(name!);
}

function pruefeBibliothek(ws: Arbeitsbereich, heute: string): Befund[] {
  const b: Befund[] = [];
  const ids = new Map<string, string>();
  for (const e of ws.bibliothek) {
    const f = (text: string, zeile?: number, schwere: Befund['schwere'] = 'fehler') =>
      b.push({ schwere, datei: e.datei, ...(zeile ? { zeile } : {}), text });
    if (!/^BIB-[A-Z0-9-]+$/.test(e.id)) f(`ungültige oder fehlende id "${e.id}"`);
    if (ids.has(e.id)) f(`id ${e.id} doppelt (auch in ${ids.get(e.id)})`);
    ids.set(e.id, e.datei);
    if (!(BIBLIOTHEK_STATUS as readonly string[]).includes(e.status)) f(`status "${e.status}" ungültig (${BIBLIOTHEK_STATUS.join(', ')})`);
    for (const k of ['titel', 'art']) if (!gesetzt(fmString(e.fm, k))) f(`Pflichtfeld "${k}" fehlt`);

    let ungueltig = 0;
    for (const z of e.zitate) {
      const quelle = ws.quellen.get(z.datei);
      if (!quelle) {
        f(`Zitat verweist auf fehlenden Snapshot bibliothek/quellen/${z.datei}`, z.zeile);
        ungueltig++;
      } else if (!zitatImText(z.text, quelle)) {
        f(`Zitat steht nicht wörtlich in ${z.datei}: "${z.text.slice(0, 80)}…"`, z.zeile);
        ungueltig++;
      }
    }
    if (e.status === 'quellengeprueft' && e.zitate.length === 0) {
      f('Status "quellengeprueft" erfordert mindestens ein belegtes Zitat');
    }
    if (e.status === 'verifiziert') {
      if (!istMenschlicherPruefer(fmString(e.fm, 'verifiziert_von'))) f('"verifiziert" erfordert verifiziert_von (Name eines Menschen)');
      if (!DATUM.test(fmString(e.fm, 'verifiziert_am'))) f('"verifiziert" erfordert verifiziert_am (JJJJ-MM-TT)');
    }
    const naechste = fmString(e.fm, 'naechste_pruefung');
    if (DATUM.test(naechste) && naechste < heute && e.status !== 'veraltet') {
      f(`Prüftermin ${naechste} überschritten – Quelle auf Änderungen prüfen`, undefined, 'warnung');
    }
    if (ungueltig === 0 && e.status === 'entwurf' && e.zitate.length > 0 && fmString(e.fm, 'art') === 'rechtsquelle') {
      f('alle Zitate belegt – kann auf "quellengeprueft" gesetzt werden', undefined, 'warnung');
    }
  }
  return b;
}

function pruefeEntscheidungen(liste: Entscheidung[], datei: string, ws: Arbeitsbereich, prefix: RegExp): Befund[] {
  const b: Befund[] = [];
  const ids = new Set<string>();
  const bib = new Map(ws.bibliothek.map((e) => [e.id, e]));
  for (const e of liste) {
    const f = (text: string, schwere: Befund['schwere'] = 'fehler') => b.push({ schwere, datei, zeile: e.zeile, text: `${e.id}: ${text}` });
    if (!prefix.test(e.id)) f(`ID-Schema passt nicht zu dieser Entscheidungsseite`);
    if (ids.has(e.id)) f('ID doppelt');
    ids.add(e.id);
    if (!(ENTSCHEIDUNG_STATUS as readonly string[]).includes(e.status)) f(`Status "${e.status}" ungültig (${ENTSCHEIDUNG_STATUS.join(', ')})`);
    if (!(ENTSCHEIDUNG_TYPEN as readonly string[]).includes(e.typ)) f(`Typ "${e.typ}" ungültig (${ENTSCHEIDUNG_TYPEN.join(', ')})`);
    if (e.status === 'vorgeschlagen' && !gesetzt(e.felder['vorschlag'])) f('"vorgeschlagen" ohne Vorschlag');
    if (e.status === 'verifiziert' || e.status === 'abgelegt') {
      if (!gesetzt(e.felder['entscheidung'])) f('Entscheidung fehlt');
      if (!istMenschlicherPruefer(e.felder['verifiziert von'])) f('"Verifiziert von" muss ein Mensch sein (Name, Rolle)');
      if (!DATUM.test(e.felder['verifiziert am'] ?? '')) f('"Verifiziert am" fehlt (JJJJ-MM-TT)');
    }
    if (e.status === 'abgelegt' && !gesetzt(e.felder['abgelegt in'])) f('"Abgelegt in" fehlt');
    if (e.status === 'verifiziert') f('verifiziert, aber noch nicht abgelegt', 'warnung');
    for (const m of (e.felder['grundlagen'] ?? '').matchAll(/BIB-[A-Z0-9-]+/g)) {
      const eintrag = bib.get(m[0]);
      if (!eintrag) f(`Grundlage ${m[0]} existiert nicht in der Bibliothek`);
      else if ((e.status === 'verifiziert' || e.status === 'abgelegt') && eintrag.status !== 'verifiziert') {
        f(`Grundlage ${m[0]} ist noch nicht verifiziert (${eintrag.status})`, 'warnung');
      }
    }
  }
  return b;
}

function pruefeVerweise(md: string, datei: string, ws: Arbeitsbereich, m: Mandat | undefined, streng: boolean): Befund[] {
  const b: Befund[] = [];
  const bib = new Map<string, BibEintrag>(ws.bibliothek.map((e) => [e.id, e]));
  const global = new Map(ws.entscheidungen.map((e) => [e.id, e]));
  const lokal = new Map((m?.entscheidungen ?? []).map((e) => [e.id, e]));
  for (const { id, zeile } of leseVerweise(md)) {
    const f = (text: string, schwere: Befund['schwere'] = 'fehler') => b.push({ schwere, datei, zeile, text: `[${id}] ${text}` });
    if (id.startsWith('BIB-')) {
      const e = bib.get(id);
      if (!e) f('unbekannter Bibliothekseintrag');
      else if (streng && e.status !== 'verifiziert') f(`Bibliothekseintrag nicht verifiziert (${e.status})`);
    } else if (/^E-\d{3}$/.test(id) || id.startsWith('ENT-')) {
      const e = (id.startsWith('ENT-') ? global : lokal).get(id);
      if (!e) f('unbekannte Entscheidung');
      else if (streng && e.status !== 'verifiziert' && e.status !== 'abgelegt') f(`Entscheidung nicht verifiziert (${e.status})`);
    } else if (m) {
      if (!frageById(id)) f('unbekannte Frage-ID');
      else if (streng) {
        const a = m.fragebogen?.antworten.get(id);
        if (!a || a.status !== 'beantwortet') f('Frage ist nicht beantwortet');
      }
    }
  }
  return b;
}

function pruefeMandat(ws: Arbeitsbereich, m: Mandat): Befund[] {
  const b: Befund[] = [];
  const pfad = (n: string) => `mandanten/${m.kuerzel}/${n}`;
  for (const [teil, da] of Object.entries(m.vorhanden)) {
    if (!da) b.push({ schwere: 'fehler', datei: pfad(`${teil}.md`), text: 'Datei fehlt' });
  }
  if (m.fragebogen) {
    for (const t of m.fragebogen.fehler) b.push({ schwere: 'fehler', datei: pfad('fragebogen.md'), text: t });
    for (const a of m.fragebogen.antworten.values()) {
      for (const t of a.fehler) b.push({ schwere: 'fehler', datei: pfad('fragebogen.md'), text: `${a.id}: ${t}` });
    }
  }
  b.push(...pruefeEntscheidungen(m.entscheidungen, pfad('entscheidungen.md'), ws, /^E-\d{3}$/));
  if (m.ismsMd) {
    // Offene Punkte dürfen auf Unverifiziertes verweisen – alles andere nicht.
    const kern = ohneAbschnitt(m.ismsMd, /^## .*Offene Punkte/i);
    b.push(...pruefeVerweise(kern, pfad('isms.md'), ws, m, true));
  }
  return b;
}

export function pruefeArbeitsbereich(ws: Arbeitsbereich, heute = new Date().toISOString().slice(0, 10)): Befund[] {
  const b: Befund[] = [...pruefeBibliothek(ws, heute)];
  b.push(...pruefeEntscheidungen(ws.entscheidungen, 'entscheidungen.md', ws, /^ENT-\d{3}$/));
  for (const doc of ['plan.md', 'vorschriften.md']) {
    const p = join(ws.root, doc);
    if (existsSync(p)) b.push(...pruefeVerweise(readFileSync(p, 'utf-8'), doc, ws, undefined, false));
  }
  for (const m of ws.mandate) b.push(...pruefeMandat(ws, m));
  return b;
}
