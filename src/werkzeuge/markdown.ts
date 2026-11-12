/**
 * Lesen der Markdown-Artefakte: Frontmatter, Entscheidungen, Zitate, Verweise.
 */

export type Frontmatter = Record<string, string | string[]>;

/** Minimaler YAML-Teil: `schluessel: wert` und Listen mit `  - eintrag`. */
export function leseFrontmatter(md: string): { fm: Frontmatter; rest: string } {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: {}, rest: md };
  const fm: Frontmatter = {};
  let liste: string[] | undefined;
  for (const zeile of m[1]!.split('\n')) {
    const item = zeile.match(/^\s+-\s+(.*)$/);
    if (item && liste) {
      liste.push(unquote(item[1]!));
      continue;
    }
    const kv = zeile.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1]!;
    const wert = kv[2]!.replace(/\s+#.*$/, '').replace(/^#.*$/, '');
    if (wert === '') {
      liste = [];
      fm[key] = liste;
    } else {
      liste = undefined;
      fm[key] = unquote(wert);
    }
  }
  return { fm, rest: md.slice(m[0].length) };
}

const unquote = (s: string) => s.trim().replace(/^["'](.*)["']$/, '$1');

export const fmString = (fm: Frontmatter, key: string): string => {
  const v = fm[key];
  return Array.isArray(v) ? v.join(', ') : (v ?? '');
};

export const fmListe = (fm: Frontmatter, key: string): string[] => {
  const v = fm[key];
  return Array.isArray(v) ? v : v ? [v] : [];
};

// ---------------------------------------------------------------------------
// Entscheidungen
// ---------------------------------------------------------------------------

export const ENTSCHEIDUNG_STATUS = ['offen', 'vorgeschlagen', 'freigegeben', 'abgelegt', 'verworfen'] as const;
export type EntscheidungStatus = (typeof ENTSCHEIDUNG_STATUS)[number];

export const ENTSCHEIDUNG_TYPEN = [
  'klaerung', 'scope', 'einstufung', 'anwendbarkeit', 'wissen', 'methodik', 'risiko', 'finding', 'massnahme', 'organisation',
] as const;

export interface Entscheidung {
  id: string;
  titel: string;
  felder: Record<string, string>;
  status: string;
  typ: string;
  zeile: number;
}

export const ENTSCHEIDUNG_ID = /^(ENT-\d{3}|E-\d{3})$/;

/**
 * Abschnitte der Form
 *   ## E-001 · Titel
 *   - **Status:** offen
 *   - **Optionen:**
 *     1. …
 */
export function leseEntscheidungen(md: string): Entscheidung[] {
  const zeilen = md.split('\n');
  const result: Entscheidung[] = [];
  let aktuell: Entscheidung | undefined;
  let feld: string | undefined;
  zeilen.forEach((z, i) => {
    const kopf = z.match(/^## ((?:ENT|E)-\d{3}) · (.+)$/);
    if (kopf) {
      aktuell = { id: kopf[1]!, titel: kopf[2]!.trim(), felder: {}, status: '', typ: '', zeile: i + 1 };
      result.push(aktuell);
      feld = undefined;
      return;
    }
    if (!aktuell) return;
    if (/^#{1,2} /.test(z)) {
      aktuell = undefined;
      return;
    }
    const kv = z.match(/^- \*\*([^*:]+):\*\*\s*(.*)$/);
    if (kv) {
      feld = kv[1]!.trim().toLowerCase();
      aktuell.felder[feld] = kv[2]!.trim();
    } else if (feld && /^\s+\S/.test(z)) {
      aktuell.felder[feld] = (aktuell.felder[feld] + '\n' + z.trim()).trim();
    } else if (z.trim() === '') {
      feld = undefined;
    }
  });
  for (const e of result) {
    e.status = (e.felder['status'] ?? '').toLowerCase();
    e.typ = (e.felder['typ'] ?? '').toLowerCase();
  }
  return result;
}

/** Leer oder Platzhalter („—“, „-“) gilt als nicht gesetzt. */
export const gesetzt = (v: string | undefined): boolean => !!v && !/^[—–-]?$/.test(v.trim());

// ---------------------------------------------------------------------------
// Zitate und Verweise
// ---------------------------------------------------------------------------

export interface Zitat {
  datei: string;
  fundstelle?: string;
  text: string;
  zeile: number;
}

/** Zeilen der Form `> [de-bsig-p28.txt · Abs. 1 Nr. 4] Wortlaut … Wortlaut` */
export function leseZitate(md: string): Zitat[] {
  const out: Zitat[] = [];
  md.split('\n').forEach((z, i) => {
    const m = z.match(/^\s*> \[([a-z0-9-]+\.txt)(?: · ([^\]]+))?\] (.+)$/);
    if (m) out.push({ datei: m[1]!, ...(m[2] ? { fundstelle: m[2] } : {}), text: m[3]!.trim(), zeile: i + 1 });
  });
  return out;
}

export const normalisiere = (s: string): string =>
  s.replace(/ /g, ' ').replace(/[„“”"]/g, '"').replace(/[‚‘’']/g, "'").replace(/\s+/g, ' ').trim();

/** Prüft, ob alle durch „…“ getrennten Teile des Zitats in dieser Reihenfolge im Quelltext stehen. */
export function zitatImText(zitat: string, quelle: string): boolean {
  const q = normalisiere(quelle);
  let pos = 0;
  for (const teil of zitat.split('…').map((t) => normalisiere(t)).filter(Boolean)) {
    const i = q.indexOf(teil, pos);
    if (i < 0) return false;
    pos = i + teil.length;
  }
  return true;
}

export const VERWEIS = /\[((?:BIB-[A-Z0-9-]+)|(?:ENT-\d{3})|(?:E-\d{3})|(?:[A-Z]{2,3}-\d{2}))\]/g;

export function leseVerweise(md: string): Array<{ id: string; zeile: number }> {
  const out: Array<{ id: string; zeile: number }> = [];
  md.split('\n').forEach((z, i) => {
    // Inline-Code (`[E-003]`) ist ein Beispiel, kein Verweis.
    for (const m of z.replace(/`[^`]*`/g, '').matchAll(VERWEIS)) out.push({ id: m[1]!, zeile: i + 1 });
  });
  return out;
}

/** Text eines Abschnitts (## …) ohne Unterabschnitte anderer ##-Ebenen. */
export function ohneAbschnitt(md: string, titelMuster: RegExp): string {
  const zeilen = md.split('\n');
  let skip = false;
  return zeilen
    .map((z) => {
      if (/^## /.test(z)) skip = titelMuster.test(z);
      return skip ? '' : z;
    })
    .join('\n');
}
