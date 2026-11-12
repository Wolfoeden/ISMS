/**
 * Arbeitsbereich laden: Bibliothek, globale Entscheidungsseite, Mandate.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { leseFragebogen, type Fragebogen } from '../fragebogen/fragebogen.js';
import { leseEntscheidungen, leseFrontmatter, leseZitate, type Entscheidung, type Frontmatter, type Zitat } from './markdown.js';

export const BIBLIOTHEK_STATUS = ['entwurf', 'quellengeprueft', 'verifiziert', 'veraltet'] as const;
/** vorschriften.md §A1 Nr. 2 */
export const VERBINDLICHKEIT = ['anforderung', 'empfehlung', 'definition', 'erlaeuterung', 'interner_standard', 'vertraglich'] as const;

export interface BibEintrag {
  id: string;
  datei: string;
  fm: Frontmatter;
  status: string;
  zitate: Zitat[];
}

export interface Mandat {
  kuerzel: string;
  ordner: string;
  fragebogen?: Fragebogen;
  entscheidungen: Entscheidung[];
  ismsMd?: string;
  vorhanden: Record<'fragebogen' | 'entscheidungen' | 'isms' | 'verlauf', boolean>;
}

export interface Arbeitsbereich {
  root: string;
  bibliothek: BibEintrag[];
  quellen: Map<string, string>;
  entscheidungen: Entscheidung[];
  mandate: Mandat[];
}

export function findeRoot(start = process.cwd()): string {
  if (process.env.ISMS_ROOT) return process.env.ISMS_ROOT;
  let dir = start;
  while (!existsSync(join(dir, 'plan.md'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error('plan.md nicht gefunden – bitte im Repository ausführen.');
    dir = parent;
  }
  return dir;
}

const lies = (p: string) => readFileSync(p, 'utf-8');

export function snapshotText(datei: string): string {
  const m = datei.match(/^-{20,}$/m);
  return m && m.index !== undefined ? datei.slice(m.index + m[0].length) : datei;
}

function mdDateien(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'quellen' ? [] : mdDateien(p);
    return n.endsWith('.md') && !['README.md', 'index.md'].includes(n) && !n.startsWith('_') ? [p] : [];
  });
}

export function ladeMandat(root: string, kuerzel: string): Mandat {
  const ordner = join(root, 'mandanten', kuerzel);
  const p = (n: string) => join(ordner, n);
  const vorhanden = {
    fragebogen: existsSync(p('fragebogen.md')),
    entscheidungen: existsSync(p('entscheidungen.md')),
    isms: existsSync(p('isms.md')),
    verlauf: existsSync(p('verlauf.md')),
  };
  return {
    kuerzel,
    ordner,
    ...(vorhanden.fragebogen ? { fragebogen: leseFragebogen(lies(p('fragebogen.md'))) } : {}),
    entscheidungen: vorhanden.entscheidungen ? leseEntscheidungen(lies(p('entscheidungen.md'))) : [],
    ...(vorhanden.isms ? { ismsMd: lies(p('isms.md')) } : {}),
    vorhanden,
  };
}

export function ladeArbeitsbereich(root = findeRoot(), nurMandat?: string): Arbeitsbereich {
  const bibDir = join(root, 'bibliothek');
  const bibliothek: BibEintrag[] = mdDateien(bibDir).map((datei) => {
    const md = lies(datei);
    const { fm } = leseFrontmatter(md);
    return {
      id: String(fm['id'] ?? ''),
      datei: relative(root, datei),
      fm,
      status: String(fm['status'] ?? ''),
      zitate: leseZitate(md),
    };
  });

  const quellen = new Map<string, string>();
  const qDir = join(bibDir, 'quellen');
  // Nur der Wortlaut nach der Trennlinie zählt – die Kopfzeilen schreiben wir selbst.
  if (existsSync(qDir)) for (const n of readdirSync(qDir)) if (n.endsWith('.txt')) quellen.set(n, snapshotText(lies(join(qDir, n))));

  const ePfad = join(root, 'entscheidungen.md');
  const entscheidungen = existsSync(ePfad) ? leseEntscheidungen(lies(ePfad)) : [];

  const mDir = join(root, 'mandanten');
  const kuerzel = nurMandat
    ? [nurMandat]
    : existsSync(mDir)
      ? readdirSync(mDir).filter((n) => !n.startsWith('_') && statSync(join(mDir, n)).isDirectory())
      : [];
  return { root, bibliothek, quellen, entscheidungen, mandate: kuerzel.map((k) => ladeMandat(root, k)) };
}
