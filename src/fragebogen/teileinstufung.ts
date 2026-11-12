/**
 * Einstufung mit Teilfakten – ENT-033 (Option 1, freigegeben 2026-11-12).
 *
 * Fehlende Angaben werden nicht geraten. Stattdessen wird für jede fehlende Angabe
 * jeder mögliche Wert durchgespielt:
 *  - Ergibt jede Belegung dasselbe Profil, sind die Lücken für das Profil **unwesentlich**:
 *    das Profil steht fest (vorläufig, bis die Angaben vorliegen).
 *  - Sonst sind die Angaben **wesentlich** (Fachkonzept 02 §5.1: materiell). Ausgewiesen werden
 *    die Spanne und die wesentlichen Fragen. Liegt die Spanne auf benachbarten Profilen, ist sie
 *    ein Grenzfall mit konservativem Vorschlag (oberes Profil); bei größerer Spanne bleibt die
 *    Einstufung blockiert, bis die wesentlichen Fragen geklärt sind.
 *
 * Die Suche ist deterministisch (koordinatenweise Maximierung/Minimierung über alle
 * Antwortmöglichkeiten, von mehreren Startpunkten). Das Ergebnis bleibt ein Vorschlag für die
 * menschliche Entscheidung; Tests prüfen, dass die Spanne das tatsächliche Profil enthält.
 */
import type { ComplexityFacts } from '../proportionality/dimensions.js';
import { deriveDepthProfile, type DepthProfile, type ProfileDerivation } from '../proportionality/profile.js';
import type { Frage } from './katalog.js';
import type { Fragebogen } from './fragebogen.js';

type Wert = number | boolean | string | string[];

const ZAHLEN = [0, 1, 3, 9, 10, 49, 50, 249, 250, 999, 1000, 5000, 100000];

function kandidaten(f: Frage): Wert[] {
  switch (f.typ) {
    case 'janein':
      return [false, true];
    case 'zahl':
      return ZAHLEN;
    case 'auswahl':
      return (f.optionen ?? []).map((o) => o.wert);
    case 'mehrfach': {
      const w = (f.optionen ?? []).map((o) => o.wert).filter((x) => x !== 'keine');
      // „keine“ wird beim Einlesen zur leeren Liste (fragebogen.ts) – genauso durchspielen
      return [[], ...w.map((x) => [x]), w];
    }
    default:
      return [];
  }
}

export interface TeilEinstufung {
  /** alle für das Profil nötigen Angaben vorhanden */
  vollstaendig: boolean;
  min: DepthProfile;
  max: DepthProfile;
  /** fehlende Angaben, die das Profil verändern können */
  wesentlich: string[];
  /** fehlende Angaben ohne Einfluss auf das Profil */
  unwesentlich: string[];
  /** Ableitung mit der konservativen (höchsten) Belegung */
  konservativ: ProfileDerivation;
  status: 'fest' | 'grenzfall' | 'blockiert';
}

export function teilEinstufung(fb: Fragebogen): TeilEinstufung {
  const basis: Record<string, Record<string, unknown>> = {};
  const offen: Frage[] = [];
  for (const a of fb.antworten.values()) {
    const [gruppe, feld] = a.frage.feld.split('.') as [string, string];
    if (gruppe === 'stammdaten') continue;
    const bucket = (basis[gruppe] ??= {});
    if (a.status === 'beantwortet' && a.fehler.length === 0 && a.wert !== undefined) bucket[feld] = a.wert;
    else offen.push(a.frage);
  }

  const mitBelegung = (bel: Map<string, Wert>): ComplexityFacts => {
    const z: Record<string, Record<string, unknown>> = {};
    for (const [g, v] of Object.entries(basis)) z[g] = { ...v };
    for (const f of offen) {
      const [g, feld] = f.feld.split('.') as [string, string];
      (z[g] ??= {})[feld] = bel.get(f.id);
    }
    return z as unknown as ComplexityFacts;
  };
  const bewerte = (bel: Map<string, Wert>) => {
    const d = deriveDepthProfile(mitBelegung(bel));
    return { d, score: d.recommended * 1000 + d.exposureScore * 10 + d.complexityScore };
  };

  // Koordinatenweise Suche von mehreren Startpunkten. Ein einzelner Startpunkt kann auf einem
  // Plateau hängen bleiben (eine Dimension sinkt erst, wenn mehrere Angaben zugleich niedrig sind);
  // deshalb starten wir auch von „jede Angabe für sich am günstigsten/ungünstigsten“.
  const verbessere = (start: Map<string, Wert>, richtung: 1 | -1) => {
    const bel = new Map(start);
    for (let runde = 0; runde < 4; runde++) {
      let geaendert = false;
      for (const f of offen) {
        let best = bel.get(f.id)!;
        let bestScore = richtung * bewerte(bel).score;
        for (const k of kandidaten(f)) {
          bel.set(f.id, k);
          const s = richtung * bewerte(bel).score;
          if (s > bestScore) {
            bestScore = s;
            best = k;
            geaendert = true;
          }
        }
        bel.set(f.id, best);
      }
      if (!geaendert) break;
    }
    return bel;
  };
  const einzelExtrem = (basisBel: Map<string, Wert>, richtung: 1 | -1) => {
    const out = new Map<string, Wert>();
    for (const f of offen) {
      const probe = new Map(basisBel);
      let best = kandidaten(f)[0]!;
      let bestScore = -Infinity;
      for (const k of kandidaten(f)) {
        probe.set(f.id, k);
        const s = richtung * bewerte(probe).score;
        if (s > bestScore) {
          bestScore = s;
          best = k;
        }
      }
      out.set(f.id, best);
    }
    return out;
  };
  const suche = (richtung: 1 | -1) => {
    const erste = new Map<string, Wert>(offen.map((f) => [f.id, kandidaten(f)[0]!]));
    const letzte = new Map<string, Wert>(offen.map((f) => [f.id, kandidaten(f).at(-1)!]));
    const starts = [erste, letzte, einzelExtrem(erste, richtung), einzelExtrem(letzte, richtung)];
    let best = verbessere(starts[0]!, richtung);
    for (const st of starts.slice(1)) {
      const kand = verbessere(st, richtung);
      if (richtung * bewerte(kand).score > richtung * bewerte(best).score) best = kand;
    }
    return best;
  };

  if (offen.length === 0) {
    const d = deriveDepthProfile(mitBelegung(new Map()));
    return { vollstaendig: true, min: d.recommended, max: d.recommended, wesentlich: [], unwesentlich: [], konservativ: d, status: 'fest' };
  }

  const hoch = suche(1);
  const tief = suche(-1);
  const dHoch = bewerte(hoch).d;
  const dTief = bewerte(tief).d;

  // Wesentlich (a): eine Angabe, die allein – bei sonst konservativer oder günstiger Belegung –
  // das Profil verschiebt.
  const einzeln = new Set(offen.filter((f) =>
    [hoch, tief].some((bel) => {
      const ref = bewerte(bel).d.recommended;
      const kopie = new Map(bel);
      return kandidaten(f).some((k) => {
        kopie.set(f.id, k);
        return bewerte(kopie).d.recommended !== ref;
      });
    }),
  ).map((f) => f.id));
  // Wesentlich (b): weicht das Profil zwischen günstigster und ungünstigster Belegung ab, auch die
  // Angaben, die nur gemeinsam wirken – sie unterscheiden sich zwischen beiden Belegungen und
  // verändern den Rechenwert (Exposure/Komplexität).
  if (bewerte(hoch).d.recommended !== bewerte(tief).d.recommended) {
    for (const f of offen) {
      if (einzeln.has(f.id) || JSON.stringify(hoch.get(f.id)) === JSON.stringify(tief.get(f.id))) continue;
      const kopie = new Map(tief);
      kopie.set(f.id, hoch.get(f.id)!);
      if (bewerte(kopie).score !== bewerte(tief).score) einzeln.add(f.id);
    }
  }
  const wesentlich = offen.map((f) => f.id).filter((id) => einzeln.has(id));
  const unwesentlich = offen.map((f) => f.id).filter((id) => !wesentlich.includes(id));

  const min = Math.min(dTief.recommended, dHoch.recommended) as DepthProfile;
  const max = Math.max(dTief.recommended, dHoch.recommended) as DepthProfile;
  const status = min === max ? 'fest' : max - min === 1 ? 'grenzfall' : 'blockiert';
  return { vollstaendig: false, min, max, wesentlich, unwesentlich, konservativ: dHoch, status };
}
