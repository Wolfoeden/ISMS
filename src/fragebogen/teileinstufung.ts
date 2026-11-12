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
 * Antwortmöglichkeiten). Sie findet die Spanne, die durch einzelne Angaben erreichbar ist;
 * das Ergebnis bleibt ein Vorschlag für die menschliche Entscheidung.
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
      return [['keine'], ...w.map((x) => [x]), w];
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

  const suche = (richtung: 1 | -1) => {
    const bel = new Map<string, Wert>(offen.map((f) => [f.id, kandidaten(f)[0]!]));
    for (let runde = 0; runde < 3; runde++) {
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

  if (offen.length === 0) {
    const d = deriveDepthProfile(mitBelegung(new Map()));
    return { vollstaendig: true, min: d.recommended, max: d.recommended, wesentlich: [], unwesentlich: [], konservativ: d, status: 'fest' };
  }

  const hoch = suche(1);
  const tief = suche(-1);
  const dHoch = bewerte(hoch).d;
  const dTief = bewerte(tief).d;

  // Wesentlich: eine Angabe, die – bei sonst konservativer oder günstiger Belegung – das Profil verschiebt.
  const wesentlich = offen.filter((f) =>
    [hoch, tief].some((bel) => {
      const ref = bewerte(bel).d.recommended;
      const kopie = new Map(bel);
      return kandidaten(f).some((k) => {
        kopie.set(f.id, k);
        return bewerte(kopie).d.recommended !== ref;
      });
    }),
  ).map((f) => f.id);
  const unwesentlich = offen.map((f) => f.id).filter((id) => !wesentlich.includes(id));

  const min = Math.min(dTief.recommended, dHoch.recommended) as DepthProfile;
  const max = Math.max(dTief.recommended, dHoch.recommended) as DepthProfile;
  const status = min === max ? 'fest' : max - min === 1 ? 'grenzfall' : 'blockiert';
  return { vollstaendig: false, min, max, wesentlich, unwesentlich, konservativ: dHoch, status };
}
