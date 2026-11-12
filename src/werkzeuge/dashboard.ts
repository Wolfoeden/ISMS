/**
 * Fortschrittsübersicht je Mandat (ENT-037, freigegeben 2026-11-12):
 * eine Sicht für Kunde und Berater – gleiche Daten, gleiche Darstellung (Dual View, ADR-004).
 *
 * Regeln:
 *  - Fortschritt getrennt nach Phasen, als „x von y“ – kein Gesamtprozentwert
 *    (kein kalibriertes Verfahren; Service Blueprint §1).
 *  - Feststellungen erscheinen nur als Anzahl, bis sie abgelegt sind (ENT-007).
 *  - Keine Bewertung des Sicherheitsniveaus; Berichtsstatus nur aus isms.md (freigegeben, berechnet).
 *  - Die Seite ist lokal und eigenständig (keine externen Ressourcen) und gehört in das
 *    Kundenrepository (ENT-012) – nie in ein Artefakt oder einen externen Dienst (CLAUDE.md Regel 7).
 */
import { ALLE_FRAGEN } from '../fragebogen/katalog.js';
import { BEZEICHNUNG, BERICHTSSTATUS } from '../bewertung/modell.js';
import { bewertungsobjekte, leseTabellen } from './ergebnis.js';
import { fmString, leseFrontmatter } from './markdown.js';
import type { Arbeitsbereich, Mandat } from './repo.js';
import { mandatStatus } from './status.js';

export type PhasenStand = 'erledigt' | 'in_arbeit' | 'wartet_auf_freigabe' | 'offen';

export interface Phase {
  name: string;
  stand: PhasenStand;
  detail: string;
}

export interface Aufgabe {
  wer: 'Kunde' | 'DT Agency' | 'Freigabe';
  text: string;
}

export interface DashboardDaten {
  kuerzel: string;
  name: string;
  stand: string;
  ismsStatus: string;
  objekte: string[];
  phasen: Phase[];
  fragebogen: { beantwortet: number; unbekannt: number; offen: number; gesamt: number };
  entscheidungen: Record<string, number>;
  nachweise: { aussagen: number; nachweise: number; geeignet: number; eingegangen: number; ungeeignet: number; abgelaufen: number };
  bewertung: { bewertet: number; gesamt: number; verteilung: Array<{ code: string; label: string; anzahl: number }> };
  feststellungen: { abgelegt: number; inBearbeitung: number };
  aufgaben: Aufgabe[];
  offenePunkte: string[];
  pruefung: { fehler: number; warnungen: number };
}

const FRAGE = new Map(ALLE_FRAGEN.map((f) => [f.id, f.frage]));
const istProfil = (titel: string) => /profil/i.test(titel);

export function mandatDashboard(ws: Arbeitsbereich, m: Mandat, heute = new Date().toISOString().slice(0, 10)): DashboardDaten {
  const st = mandatStatus(ws, m);
  const fm = m.ismsMd ? leseFrontmatter(m.ismsMd).fm : {};
  const name = /^# ISMS – (.+)$/m.exec(m.ismsMd ?? '')?.[1]?.trim() ?? m.kuerzel;
  const ismsStatus = fmString(fm, 'status') || 'entwurf';
  const e = m.entscheidungen;
  const zaehl = (f: (x: (typeof e)[number]) => boolean) => e.filter(f).length;

  // Entscheidungen nach Status (Feststellungen nur gezählt)
  const entscheidungen: Record<string, number> = {};
  for (const x of e) entscheidungen[x.status] = (entscheidungen[x.status] ?? 0) + 1;

  // Nachweise aus notizen/ (ENT-028)
  const n = [...m.notizen.values()];
  const pr = (w: string) => n.filter((x) => fmString(x, 'art') === 'evidence' && fmString(x, 'pruefung') === w).length;
  const nachweise = {
    aussagen: n.filter((x) => fmString(x, 'art') === 'claim').length,
    nachweise: n.filter((x) => fmString(x, 'art') === 'evidence').length,
    geeignet: pr('geeignet'), eingegangen: pr('eingegangen'), ungeeignet: pr('ungeeignet'), abgelaufen: pr('abgelaufen'),
  };

  // Bewertung: nur Zeilen mit Berichtsstatus-Spalte in isms.md (dort steht nur Freigegebenes)
  const verteilung = new Map<string, number>();
  let gesamt = 0;
  let bewertet = 0;
  for (const t of leseTabellen(m.ismsMd ?? '')) {
    const i = t.kopf.findIndex((k) => /^Berichtsstatus$/i.test(k));
    if (i < 0) continue;
    for (const z of t.zeilen) {
      gesamt++;
      const code = (z.zellen[i] ?? '').trim();
      if ((BERICHTSSTATUS as readonly string[]).includes(code)) {
        bewertet++;
        verteilung.set(code, (verteilung.get(code) ?? 0) + 1);
      }
    }
  }

  const feststellungen = {
    abgelegt: zaehl((x) => x.typ === 'finding' && x.status === 'abgelegt'),
    inBearbeitung: zaehl((x) => x.typ === 'finding' && ['offen', 'vorgeschlagen', 'freigegeben'].includes(x.status)),
  };

  // Phasen
  const f = st.fragebogen;
  const profil = e.find((x) => x.typ === 'einstufung' && istProfil(x.titel));
  const anwendbarkeit = e.filter((x) => x.typ === 'anwendbarkeit');
  const stufe = (status?: string): PhasenStand =>
    status === 'abgelegt' ? 'erledigt' : status === 'vorgeschlagen' || status === 'freigegeben' ? 'wartet_auf_freigabe' : 'offen';
  const phasen: Phase[] = [
    {
      name: 'Erhebung',
      stand: f.gesamt && f.offen === 0 ? 'erledigt' : f.beantwortet ? 'in_arbeit' : 'offen',
      detail: `${f.beantwortet} von ${f.gesamt} Fragen beantwortet${f.unbekannt ? `, ${f.unbekannt} in Klärung` : ''}`,
    },
    {
      name: 'Einstufung',
      stand: stufe(profil?.status),
      detail: profil?.status === 'abgelegt' ? 'Prüftiefenprofil festgelegt' : st.einstufung.moeglich ? 'Vorschlag möglich' : `${st.einstufung.fehlend.length} ${st.einstufung.teil ? 'wesentliche ' : ''}Angaben fehlen`,
    },
    {
      name: 'Vorschriften',
      stand: anwendbarkeit.length === 0 ? 'offen' : anwendbarkeit.every((x) => x.status === 'abgelegt') ? 'erledigt'
        : anwendbarkeit.some((x) => x.status === 'vorgeschlagen' || x.status === 'freigegeben') ? 'wartet_auf_freigabe' : 'in_arbeit',
      detail: `${anwendbarkeit.filter((x) => x.status === 'abgelegt').length} von ${anwendbarkeit.length} bestimmt`,
    },
    {
      name: 'Bewertung',
      stand: gesamt && bewertet === gesamt ? 'erledigt' : bewertet ? 'in_arbeit' : 'offen',
      detail: `${bewertet} von ${gesamt} Prüfpunkten bewertet`,
    },
    {
      name: 'Review',
      stand: ismsStatus === 'freigegeben' ? 'erledigt' : ismsStatus === 'in_pruefung' ? 'in_arbeit' : 'offen',
      detail: ismsStatus === 'in_pruefung' ? 'Verifizierung und Qualitätsprüfung laufen' : ismsStatus === 'freigegeben' ? 'abgeschlossen' : 'noch nicht begonnen',
    },
    {
      name: 'Freigabe',
      stand: ismsStatus === 'freigegeben' ? 'erledigt' : 'offen',
      detail: ismsStatus === 'freigegeben' ? 'Ergebnis freigegeben' : 'Ergebnis noch nicht freigegeben',
    },
  ];

  // Aufgaben in Kundensprache
  const aufgaben: Aufgabe[] = [];
  for (const id of st.unbekannt) aufgaben.push({ wer: 'Kunde', text: `Angabe klären: ${FRAGE.get(id) ?? id} (${id})` });
  if (f.offen) aufgaben.push({ wer: 'Kunde', text: `${f.offen} Fragen beantworten oder Unterlagen bereitstellen` });
  const besprechen = e.filter((x) => x.typ === 'finding' && x.status === 'abgelegt' && /offen/i.test(x.felder['kundenreaktion'] ?? ''));
  if (besprechen.length) aufgaben.push({ wer: 'Kunde', text: `${besprechen.length} Feststellungen besprechen` });
  const wartet = e.filter((x) => x.status === 'vorgeschlagen');
  const wartetSichtbar = wartet.filter((x) => x.typ !== 'finding');
  for (const x of wartetSichtbar) aufgaben.push({ wer: 'Freigabe', text: `${x.id} ${x.titel}` });
  if (wartet.length > wartetSichtbar.length) aufgaben.push({ wer: 'Freigabe', text: `${wartet.length - wartetSichtbar.length} Feststellungen in Prüfung` });
  const vorbereiten = e.filter((x) => x.status === 'offen').length;
  if (vorbereiten) aufgaben.push({ wer: 'DT Agency', text: `${vorbereiten} Entscheidungen vorbereiten` });
  const ablegen = e.filter((x) => x.status === 'freigegeben').length;
  if (ablegen) aufgaben.push({ wer: 'DT Agency', text: `${ablegen} freigegebene Entscheidungen in das ISMS übernehmen` });

  const offenePunkte = (m.ismsMd?.split(/^## .*Offene Punkte.*$/m)[1] ?? '')
    .split('\n').map((z) => z.trim()).filter((z) => z.startsWith('- ')).map((z) => z.slice(2));

  return {
    kuerzel: m.kuerzel, name, stand: heute, ismsStatus, objekte: bewertungsobjekte(m.ismsMd ?? ''), phasen,
    fragebogen: { beantwortet: f.beantwortet, unbekannt: f.unbekannt, offen: f.offen, gesamt: f.gesamt },
    entscheidungen, nachweise,
    bewertung: { bewertet, gesamt, verteilung: [...verteilung].map(([code, anzahl]) => ({ code, label: BEZEICHNUNG[code] ?? code, anzahl })) },
    feststellungen, aufgaben, offenePunkte, pruefung: st.befunde,
  };
}

// ---------------------------------------------------------------------------
// HTML – eigenständig, ohne externe Ressourcen
// ---------------------------------------------------------------------------

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const STAND_DE: Record<PhasenStand, string> = { erledigt: 'erledigt', in_arbeit: 'in Arbeit', wartet_auf_freigabe: 'wartet auf Freigabe', offen: 'offen' };
const ISMS_DE: Record<string, string> = { entwurf: 'Entwurf', in_pruefung: 'in Prüfung', freigegeben: 'freigegeben' };

export function dashboardHtml(d: DashboardDaten): string {
  const kachel = (titel: string, wert: string, unter: string) =>
    `<div class="k"><div class="kt">${esc(titel)}</div><div class="kw">${esc(wert)}</div><div class="ku">${esc(unter)}</div></div>`;
  const liste = (xs: string[], leer: string) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="leer">${esc(leer)}</p>`);
  const e = d.entscheidungen;
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fortschritt ${esc(d.name)}</title>
<style>
:root{--bg:#f4f6f8;--p:#fff;--t:#17202a;--m:#5b6773;--l:#d6dce2;--a:#0f5f73;--ok:#1f7a4a;--okb:#e2f2e9;--w:#9a5d07;--wb:#f8eedb;--h:#3d3a8c;--hb:#e9e8f6;--o:#5b6773;--ob:#eceff2}
@media (prefers-color-scheme:dark){:root{--bg:#11161b;--p:#182028;--t:#e4e9ee;--m:#97a3ae;--l:#2b3641;--a:#5fb6c9;--ok:#6cc79a;--okb:#173326;--w:#e2a64e;--wb:#3a2c14;--h:#a9a5f0;--hb:#25234a;--o:#97a3ae;--ob:#222c36;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--t);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1000px;margin:0 auto;padding:24px 16px 48px;display:grid;gap:20px}
h1{margin:0;font-size:26px}h2{margin:0 0 10px;font-size:17px}.m{color:var(--m);font-size:13px}
section{background:var(--p);border:1px solid var(--l);border-radius:10px;padding:18px}
.ph{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.p{border:1px solid var(--l);border-radius:8px;padding:10px;display:grid;gap:4px}
.p b{font-size:14px}.p small{color:var(--m);font-size:12.5px}
.s{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;width:max-content}
.erledigt{background:var(--okb);color:var(--ok)}.in_arbeit{background:var(--wb);color:var(--w)}.wartet_auf_freigabe{background:var(--hb);color:var(--h)}.offen{background:var(--ob);color:var(--o)}
.ks{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.k{border:1px solid var(--l);border-radius:8px;padding:12px}.kt{font-size:12px;color:var(--m);text-transform:uppercase;letter-spacing:.04em}
.kw{font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}.ku{font-size:12.5px;color:var(--m)}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid var(--l)}th{font-size:12px;color:var(--m)}
td.n{text-align:right;font-variant-numeric:tabular-nums}.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px}
ul{margin:0;padding-left:18px}.leer{color:var(--m);margin:0}.wer{font-size:12px;font-weight:600;color:var(--a);margin-right:6px}
footer{font-size:12.5px;color:var(--m)}
</style></head><body><main>
<header><div class="m">Fortschrittsübersicht · Stand ${esc(d.stand)} · ISMS-Dokument: ${esc(ISMS_DE[d.ismsStatus] ?? d.ismsStatus)}</div>
<h1>${esc(d.name)}</h1>${d.objekte.length > 1 ? `<div class="m">Bewertungsobjekte: ${esc(d.objekte.join(', '))} – Ergebnisse je Objekt getrennt</div>` : ''}<div class="m">Gleiche Ansicht für Kunde und DT Agency. Zeigt den Bearbeitungsstand, keine Bewertung des Sicherheitsniveaus.</div></header>

<section><h2>Phasen</h2><div class="ph">
${d.phasen.map((p) => `<div class="p"><b>${esc(p.name)}</b><span class="s ${p.stand}">${STAND_DE[p.stand]}</span><small>${esc(p.detail)}</small></div>`).join('\n')}
</div></section>

<section><h2>Stand in Zahlen</h2><div class="ks">
${kachel('Fragebogen', `${d.fragebogen.beantwortet} von ${d.fragebogen.gesamt}`, `${d.fragebogen.unbekannt} in Klärung · ${d.fragebogen.offen} offen`)}
${kachel('Entscheidungen', `${(e['abgelegt'] ?? 0)} übernommen`, `${e['vorgeschlagen'] ?? 0} warten auf Freigabe · ${e['offen'] ?? 0} in Vorbereitung`)}
${kachel('Nachweise', `${d.nachweise.geeignet} geeignet`, `${d.nachweise.nachweise} Nachweise · ${d.nachweise.aussagen} Aussagen · ${d.nachweise.abgelaufen} abgelaufen`)}
${kachel('Bewertung', `${d.bewertung.bewertet} von ${d.bewertung.gesamt}`, 'Prüfpunkte mit Ergebnis')}
${kachel('Feststellungen', `${d.feststellungen.abgelegt} abgelegt`, `${d.feststellungen.inBearbeitung} in Bearbeitung (Inhalt erst nach Ablage)`)}
</div></section>

<div class="grid2">
<section><h2>Als Nächstes</h2>${d.aufgaben.length ? `<ul>${d.aufgaben.map((a) => `<li><span class="wer">${a.wer}</span>${esc(a.text)}</li>`).join('')}</ul>` : '<p class="leer">Keine offenen Aufgaben.</p>'}</section>
<section><h2>Ergebnisse der Bewertung</h2>${d.bewertung.verteilung.length ? `<table><thead><tr><th>Berichtsstatus</th><th>Anzahl</th></tr></thead><tbody>${d.bewertung.verteilung.map((v) => `<tr><td>${esc(v.label)}</td><td class="n">${v.anzahl}</td></tr>`).join('')}</tbody></table>` : '<p class="leer">Noch keine freigegebenen Bewertungen.</p>'}</section>
</div>

<section><h2>Offene Punkte</h2>${liste(d.offenePunkte, 'Keine offenen Punkte.')}</section>

<footer>Erzeugt mit <code>npm run isms -- dashboard ${esc(d.kuerzel)}</code>. Formale Prüfung der Unterlagen: ${d.pruefung.fehler} Fehler, ${d.pruefung.warnungen} Hinweise. Vertraulich – nur im Kundenrepository ablegen.</footer>
</main></body></html>
`;
}
