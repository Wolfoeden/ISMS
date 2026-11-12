/**
 * Risikomethode für Mandate – ENT-022 (Option 2, freigegeben 2026-11-12):
 * Hat der Kunde eine eigene Methode, wird sie übernommen (Kriterien, Skalen, Schwellen
 * dokumentiert in isms.md §7). Sonst gilt diese Standardmethode von DT Agency.
 *
 * Eigene Methodik, keine Normvorgabe (vorschriften.md §A6 Nr. 2): Wahrscheinlichkeit × Auswirkung
 * auf je vier Stufen. Die Akzeptanzschwelle legt der Kunde fest; akzeptieren darf nur der Risk Owner.
 */
export const RISIKOMETHODE_VERSION = 'RM-2026-11.1';

export type Stufe4 = 1 | 2 | 3 | 4;
export const WAHRSCHEINLICHKEIT: Record<Stufe4, string> = { 1: 'selten', 2: 'möglich', 3: 'wahrscheinlich', 4: 'nahezu sicher' };
export const AUSWIRKUNG: Record<Stufe4, string> = { 1: 'gering', 2: 'spürbar', 3: 'erheblich', 4: 'existenzbedrohend' };

export type Risikostufe = 'gering' | 'mittel' | 'hoch' | 'kritisch';

export interface Risikowert {
  wahrscheinlichkeit: Stufe4;
  auswirkung: Stufe4;
  wert: number;
  stufe: Risikostufe;
}

/** Wert 1–16; Bänder: 1–3 gering · 4–6 mittel · 8–9 hoch · 12–16 kritisch. */
export function standardRisiko(wahrscheinlichkeit: Stufe4, auswirkung: Stufe4): Risikowert {
  const wert = wahrscheinlichkeit * auswirkung;
  const stufe: Risikostufe = wert >= 12 ? 'kritisch' : wert >= 8 ? 'hoch' : wert >= 4 ? 'mittel' : 'gering';
  return { wahrscheinlichkeit, auswirkung, wert, stufe };
}

/** Darstellung in isms.md §7, Spalte „Bewertung“: `W3×A4=12 (kritisch)`. */
export const formatRisiko = (r: Risikowert): string => `W${r.wahrscheinlichkeit}×A${r.auswirkung}=${r.wert} (${r.stufe})`;

/** Nachrechnen einer Bewertungszelle nach Standardmethode; undefined, wenn die Zelle nicht dieses Format hat. */
export function pruefeRisikoZelle(zelle: string): string | undefined {
  const m = /W\s*([1-4])\s*[×x*]\s*A\s*([1-4])\s*=\s*(\d+)\s*\(([^)]+)\)/.exec(zelle);
  if (!m) return undefined;
  const soll = standardRisiko(Number(m[1]) as Stufe4, Number(m[2]) as Stufe4);
  const ist = `W${m[1]}×A${m[2]}=${m[3]} (${m[4]!.trim()})`;
  return ist === formatRisiko(soll) ? '' : `Risikobewertung „${ist}“ folgt nicht aus der Standardmethode – berechnet: ${formatRisiko(soll)}`;
}
