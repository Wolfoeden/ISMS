/**
 * Status eines Mandats und nächste Schritte – setzt den Iterationszyklus aus plan.md §3 um.
 */
import { zuFakten } from '../fragebogen/fragebogen.js';
import { KATALOG } from '../fragebogen/katalog.js';
import { deriveAssuranceProfile, PROFILE_NAMES } from '../proportionality/profile.js';
import { nis2Vorpruefung, type Nis2Vorpruefung } from '../regelwerk/nis2.js';
import type { Arbeitsbereich, Mandat } from './repo.js';
import { pruefeArbeitsbereich } from './pruefen.js';

export interface Schritt {
  agent: string;
  text: string;
  mensch?: boolean;
}

export interface MandatStatus {
  kuerzel: string;
  fragebogen: { gesamt: number; beantwortet: number; unbekannt: number; offen: number; abschnitte: Array<{ titel: string; beantwortet: number; gesamt: number }> };
  unbekannt: string[];
  unbekanntOhneKlaerung: string[];
  entscheidungen: Record<string, string[]>;
  nis2?: Nis2Vorpruefung;
  einstufung: { moeglich: boolean; fehlend: string[]; empfehlung?: string };
  befunde: { fehler: number; warnungen: number };
  schritte: Schritt[];
}

const hatEntscheidung = (m: Mandat, typ: string, status: string[] = ['verifiziert', 'abgelegt']) =>
  m.entscheidungen.some((e) => e.typ === typ && status.includes(e.status));

export function nis2Eingaben(m: Mandat) {
  const a = (id: string) => {
    const x = m.fragebogen?.antworten.get(id);
    return x?.status === 'beantwortet' && x.fehler.length === 0 ? x.wert : undefined;
  };
  return {
    ...(a('STA-04') !== undefined ? { einrichtungsarten: a('STA-04') as string[] } : {}),
    ...(a('STA-05') !== undefined ? { entgeltlich: a('STA-05') as boolean } : {}),
    ...(a('ORG-01') !== undefined ? { mitarbeiter: a('ORG-01') as number } : {}),
    ...(a('STA-06') !== undefined ? { umsatzMio: a('STA-06') as number } : {}),
    ...(a('STA-07') !== undefined ? { bilanzMio: a('STA-07') as number } : {}),
    ...(a('REG-03') !== undefined ? { kritis: a('REG-03') as boolean } : {}),
    ...(a('STA-08') !== undefined ? { verbundeneUnternehmen: a('STA-08') as boolean } : {}),
  };
}

export function mandatStatus(ws: Arbeitsbereich, m: Mandat): MandatStatus {
  const antworten = [...(m.fragebogen?.antworten.values() ?? [])];
  const zaehle = (s: string) => antworten.filter((a) => a.status === s).length;
  const abschnitte = KATALOG.map((ab) => ({
    titel: ab.titel,
    gesamt: ab.fragen.length,
    beantwortet: ab.fragen.filter((f) => m.fragebogen?.antworten.get(f.id)?.status === 'beantwortet').length,
  }));
  const unbekannt = antworten.filter((a) => a.status === 'unbekannt').map((a) => a.id);
  const betroffen = m.entscheidungen
    .filter((e) => e.status !== 'verworfen')
    .flatMap((e) => (e.felder['betrifft'] ?? '').match(/[A-Z]{2,3}-\d{2}/g) ?? []);
  const unbekanntOhneKlaerung = unbekannt.filter((id) => !betroffen.includes(id));

  const entscheidungen: Record<string, string[]> = {};
  for (const e of m.entscheidungen) (entscheidungen[e.status] ??= []).push(`${e.id} ${e.titel}`);

  const fakten = m.fragebogen ? zuFakten(m.fragebogen) : { fehlend: ['Fragebogen fehlt'], stammdaten: {} };
  const einstufung: MandatStatus['einstufung'] = { moeglich: !!fakten.fakten, fehlend: fakten.fehlend };
  if (fakten.fakten) {
    const d = deriveAssuranceProfile(fakten.fakten);
    einstufung.empfehlung = `Profil ${d.recommended} (${PROFILE_NAMES[d.recommended]})${d.borderline ? `, Grenzfall ${d.borderline.alternative}` : ''}`;
  }
  const nis2 = m.fragebogen ? nis2Vorpruefung(nis2Eingaben(m)) : undefined;

  const befundListe = pruefeArbeitsbereich({ ...ws, mandate: [m] }).filter((b) => b.datei.startsWith(`mandanten/${m.kuerzel}/`));
  const befunde = {
    fehler: befundListe.filter((b) => b.schwere === 'fehler').length,
    warnungen: befundListe.filter((b) => b.schwere === 'warnung').length,
  };

  // --- Nächste Schritte in fester Priorität (plan.md §3) ---
  const s: Schritt[] = [];
  if (befunde.fehler) s.push({ agent: 'qualitaet', text: `${befunde.fehler} Formfehler beheben (npm run isms -- pruefen ${m.kuerzel})` });
  const zuAblegen = m.entscheidungen.filter((e) => e.status === 'verifiziert');
  if (zuAblegen.length) s.push({ agent: 'isms-pruefung', text: `Verifizierte Entscheidungen ablegen: ${zuAblegen.map((e) => e.id).join(', ')}` });
  const offen = zaehle('offen');
  if (offen) s.push({ agent: 'erhebung', text: `${offen} Fragen aus notizen/ beantworten oder auf unbekannt setzen` });
  if (unbekanntOhneKlaerung.length) {
    s.push({ agent: 'erhebung', text: `Klärungs-Entscheidungen anlegen für: ${unbekanntOhneKlaerung.join(', ')}` });
  }
  const nis2Antwort = m.fragebogen?.antworten.get('REG-02');
  const nis2Entscheidung = m.entscheidungen.find((e) => /REG-02/.test(e.felder['betrifft'] ?? ''));
  if (nis2 && nis2.ergebnis !== 'pruefen' && nis2Antwort?.status !== 'beantwortet' && (!nis2Entscheidung || nis2Entscheidung.status === 'offen')) {
    s.push({ agent: 'einstufung', text: `NIS2-Vorprüfung ergibt "${nis2.ergebnis}" – Vorschlag in die Betroffenheits-Entscheidung übernehmen` });
  }
  if (einstufung.moeglich && !m.entscheidungen.some((e) => e.typ === 'einstufung' && /profil/i.test(e.titel) && e.status !== 'offen')) {
    s.push({ agent: 'einstufung', text: `Einstufung möglich (${einstufung.empfehlung}) – Profil-Entscheidung vorschlagen` });
  }
  const profilFest = m.entscheidungen.some((e) => e.typ === 'einstufung' && /profil/i.test(e.titel) && e.status === 'abgelegt');
  if (profilFest && !hatEntscheidung(m, 'anwendbarkeit', ['vorgeschlagen', 'verifiziert', 'abgelegt'])) {
    s.push({ agent: 'vorschriften', text: 'Anwendbare Vorschriften bestimmen und als Anwendbarkeits-Entscheidungen vorschlagen' });
  }
  // Globale Wissenslücken nur, wenn das Mandat auf sie verweist.
  const verwiesen = new Set(m.entscheidungen.flatMap((e) => Object.values(e.felder).join(' ').match(/ENT-\d{3}/g) ?? []));
  const wissen = [...m.entscheidungen, ...ws.entscheidungen.filter((e) => verwiesen.has(e.id))]
    .filter((e) => e.typ === 'wissen' && (e.status === 'offen' || e.status === 'vorgeschlagen'));
  if (wissen.length) s.push({ agent: 'bibliothek', text: `Fehlendes Wissen recherchieren: ${wissen.map((e) => e.id).join(', ')}` });
  if (profilFest && hatEntscheidung(m, 'anwendbarkeit', ['abgelegt'])) {
    s.push({ agent: 'isms-pruefung', text: 'Controls bewerten, Findings und Maßnahmen als Entscheidungen vorschlagen' });
  }
  const warten = m.entscheidungen.filter((e) => e.status === 'vorgeschlagen');
  if (warten.length) s.push({ agent: 'mensch', mensch: true, text: `Verifizieren: ${warten.map((e) => `${e.id} ${e.titel}`).join(' · ')}` });

  return {
    kuerzel: m.kuerzel,
    fragebogen: { gesamt: antworten.length, beantwortet: zaehle('beantwortet'), unbekannt: unbekannt.length, offen, abschnitte },
    unbekannt,
    unbekanntOhneKlaerung,
    entscheidungen,
    ...(nis2 ? { nis2 } : {}),
    einstufung,
    befunde,
    schritte: s,
  };
}

export function formatiereStatus(st: MandatStatus): string {
  const f = st.fragebogen;
  const z: string[] = [
    `# Status ${st.kuerzel}`,
    '',
    `Fragebogen: ${f.beantwortet}/${f.gesamt} beantwortet · ${f.unbekannt} unbekannt · ${f.offen} offen`,
    ...f.abschnitte.map((a) => `  ${a.beantwortet === a.gesamt ? '✔' : '·'} ${a.titel}: ${a.beantwortet}/${a.gesamt}`),
    '',
    'Entscheidungen: ' + (Object.entries(st.entscheidungen).map(([s, l]) => `${s} ${l.length}`).join(' · ') || 'keine'),
    ...Object.entries(st.entscheidungen).flatMap(([s, l]) => l.map((x) => `  [${s}] ${x}`)),
    '',
    `NIS2-Vorprüfung: ${st.nis2 ? st.nis2.ergebnis + (st.nis2.fehlend.length ? ` (fehlt: ${st.nis2.fehlend.join(', ')})` : '') : '—'}`,
    `Einstufung: ${st.einstufung.moeglich ? st.einstufung.empfehlung : `blockiert – ${st.einstufung.fehlend.length} Antworten fehlen`}`,
    `Prüfung: ${st.befunde.fehler} Fehler · ${st.befunde.warnungen} Warnungen`,
    '',
    '## Nächste Schritte',
    ...(st.schritte.length ? st.schritte.map((s, i) => `${i + 1}. [${s.agent}] ${s.text}`) : ['– nichts offen –']),
  ];
  return z.join('\n');
}
