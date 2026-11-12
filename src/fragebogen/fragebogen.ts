/**
 * Fragebogen als Markdown-Artefakt: erzeugen, einlesen, in Fakten überführen.
 *
 * Format je Frage:
 *   ### ORG-04 · Wie ist die Organisation strukturiert?
 *   `organization.structure` · Auswahl (eine)
 *   - [x] `functional` – funktionale Organisation
 *   - [ ] `unbekannt` – noch nicht geklärt
 *   Quelle: Interview GF 2026-11-20
 */
import type { ComplexityFacts } from '../proportionality/dimensions.js';
import { ALLE_FRAGEN, KATALOG, KATALOG_VERSION, KURZFORM_DRITTPARTEI, type Frage, type FragebogenVariante } from './katalog.js';

export const UNBEKANNT = 'unbekannt';

const TYP_LABEL: Record<Frage['typ'], string> = {
  zahl: 'Zahl',
  text: 'Text',
  janein: 'Ja/Nein',
  auswahl: 'Auswahl (eine)',
  mehrfach: 'Mehrfachauswahl',
};

export function erzeugeFragebogen(meta: { kuerzel: string; name: string; variante?: FragebogenVariante }): string {
  const kurz = meta.variante === 'drittpartei';
  const out: string[] = [
    '---',
    `mandant: ${meta.kuerzel}`,
    'dokument: fragebogen',
    `katalog_version: ${KATALOG_VERSION}`,
    ...(kurz ? ['variante: drittpartei'] : []),
    '---',
    `# Fragebogen – ${meta.name}`,
    '',
    '> Pre-Assessment (Triage), für alle Profile gleich. Jede Antwort braucht eine **Quelle**',
    '> (z. B. `Interview GF 2026-11-20`, `Dokument: IT-Inventar v3`, `E-004`).',
    '> Nicht geklärt → `unbekannt` ankreuzen bzw. `Antwort: unbekannt`. **Niemals raten.**',
    '> Unbekannte Antworten werden über Klärungs-Entscheidungen in `entscheidungen.md` aufgelöst.',
  ];
  if (kurz) out.push('> **Verkürzter Fragebogen – Third-Party Pre-Assessment (ENT-008).** Nicht gestellte Fragen gelten als offen;', '> die Einstufung zeigt, ob sie für das Ergebnis wesentlich sind (ENT-033), und dann werden sie gezielt nachgefragt.');
  for (const abschnitt of KATALOG) {
    const fragen = kurz ? abschnitt.fragen.filter((f) => KURZFORM_DRITTPARTEI.includes(f.id)) : abschnitt.fragen;
    if (!fragen.length) continue;
    out.push('', `## ${abschnitt.titel}`);
    for (const f of fragen) {
      out.push('', `### ${f.id} · ${f.frage}`, `\`${f.feld}\` · ${TYP_LABEL[f.typ]}`);
      if (f.hinweis) out.push(`> ${f.hinweis}`);
      if (f.optionen) {
        for (const opt of f.optionen) out.push(`- [ ] \`${opt.wert}\` – ${opt.label}`);
        out.push(`- [ ] \`${UNBEKANNT}\` – noch nicht geklärt`);
      } else {
        out.push('Antwort:');
      }
      out.push('Quelle:');
    }
  }
  return out.join('\n') + '\n';
}

export type AntwortStatus = 'offen' | 'unbekannt' | 'beantwortet';

export interface Antwort {
  id: string;
  frage: Frage;
  status: AntwortStatus;
  /** zahl → number, janein → boolean, mehrfach → string[], sonst string */
  wert?: number | boolean | string | string[];
  quelle?: string;
  fehler: string[];
}

export interface Fragebogen {
  meta: Record<string, string>;
  antworten: Map<string, Antwort>;
  /** Formatfehler, die keiner Frage zuzuordnen sind */
  fehler: string[];
}

/** Akzeptiert 250 · 1.250 (Tausenderpunkt) · 12,5 · 1.250,5 · 12.5 */
export function parseZahl(roh: string): number | undefined {
  let s = roh.replace(/\s/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = s === '' ? NaN : Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function leseFragebogen(markdown: string): Fragebogen {
  const meta: Record<string, string> = {};
  const fm = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (fm) for (const line of fm[1]!.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]!] = m[2]!.trim();
  }

  const antworten = new Map<string, Antwort>();
  const fehler: string[] = [];
  const bloecke = markdown.split(/^### /m).slice(1);
  for (const block of bloecke) {
    const kopf = block.match(/^([A-Z]{2,3}-\d{2}) · /);
    if (!kopf) continue;
    const id = kopf[1]!;
    const frage = ALLE_FRAGEN.find((f) => f.id === id);
    if (!frage) {
      fehler.push(`${id}: unbekannte Frage-ID (nicht im Katalog ${KATALOG_VERSION})`);
      continue;
    }
    const a: Antwort = { id, frage, status: 'offen', fehler: [] };
    const quelle = block.match(/^Quelle:[ \t]*(.*)$/m)?.[1]?.trim();
    if (quelle) a.quelle = quelle;

    if (frage.optionen) {
      const gewaehlt = [...block.matchAll(/^- \[[xX]\] `([^`]+)`/gm)].map((m) => m[1]!);
      const erlaubt = new Set([...frage.optionen.map((x) => x.wert), UNBEKANNT]);
      for (const g of gewaehlt) if (!erlaubt.has(g)) a.fehler.push(`ungültige Option \`${g}\``);
      if (gewaehlt.includes(UNBEKANNT)) {
        a.status = 'unbekannt';
        if (gewaehlt.length > 1) a.fehler.push('`unbekannt` schließt andere Optionen aus');
      } else if (gewaehlt.length > 0) {
        a.status = 'beantwortet';
        if (frage.typ === 'mehrfach') {
          if (gewaehlt.includes('keine') && gewaehlt.length > 1) a.fehler.push('`keine` schließt andere Optionen aus');
          a.wert = gewaehlt.filter((g) => g !== 'keine');
        } else {
          if (gewaehlt.length > 1) a.fehler.push('nur eine Option zulässig');
          a.wert = frage.typ === 'janein' ? gewaehlt[0] === 'ja' : gewaehlt[0]!;
        }
      }
    } else {
      const roh = block.match(/^Antwort:[ \t]*(.*)$/m)?.[1]?.trim() ?? '';
      if (roh.toLowerCase() === UNBEKANNT) a.status = 'unbekannt';
      else if (roh) {
        a.status = 'beantwortet';
        if (frage.typ === 'zahl') {
          const n = parseZahl(roh);
          if (n === undefined || n < 0) a.fehler.push(`keine gültige Zahl: "${roh}"`);
          else a.wert = n;
        } else a.wert = roh;
      }
    }
    if (a.status === 'beantwortet' && !a.quelle) a.fehler.push('Antwort ohne Quelle');
    if (antworten.has(id)) fehler.push(`${id}: doppelt vorhanden`);
    antworten.set(id, a);
  }
  const kurz = meta['variante'] === 'drittpartei';
  for (const f of ALLE_FRAGEN) {
    if (antworten.has(f.id)) continue;
    // Kurzform (ENT-008): nicht gestellte Fragen sind offen, kein Formfehler
    if (kurz && !KURZFORM_DRITTPARTEI.includes(f.id)) antworten.set(f.id, { id: f.id, frage: f, status: 'offen', fehler: [] });
    else fehler.push(`${f.id}: fehlt im Fragebogen`);
  }
  return { meta, antworten, fehler };
}

export interface FaktenErgebnis {
  fakten?: ComplexityFacts;
  /** Fragen, die für die Einstufung beantwortet sein müssen, es aber nicht sind */
  fehlend: string[];
  stammdaten: Record<string, unknown>;
}

/** Überführt die Antworten in ComplexityFacts – nur wenn alle Pflichtfelder beantwortet sind. */
export function zuFakten(fb: Fragebogen): FaktenErgebnis {
  const ziel: Record<string, Record<string, unknown>> = {};
  const fehlend: string[] = [];
  for (const a of fb.antworten.values()) {
    const [gruppe, feld] = a.frage.feld.split('.') as [string, string];
    const bucket = (ziel[gruppe] ??= {});
    if (a.status === 'beantwortet' && a.fehler.length === 0) bucket[feld] = a.wert;
    else if (gruppe !== 'stammdaten') fehlend.push(a.id);
  }
  const { stammdaten = {}, ...rest } = ziel;
  return fehlend.length
    ? { fehlend, stammdaten }
    : { fakten: rest as unknown as ComplexityFacts, fehlend, stammdaten };
}
