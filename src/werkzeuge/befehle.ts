/**
 * Befehle der Werkzeug-Kommandozeile – als Funktionen, damit sie testbar sind.
 */
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { erzeugeFragebogen, zuFakten } from '../fragebogen/fragebogen.js';
import { groessenklasse, ORGANISATIONSFORM } from '../bewertung/groessenklasse.js';
import { deriveAssuranceProfile, PROFILE_NAMES } from '../proportionality/profile.js';
import { NIS2_FAKT, nis2Vorpruefung } from '../regelwerk/nis2.js';
import { fmListe, fmString } from './markdown.js';
import { ladeArbeitsbereich, ladeMandat } from './repo.js';
import { nis2Eingaben } from './status.js';

const heute = () => new Date().toISOString().slice(0, 10);

export class Abbruch extends Error {}
function fail(msg: string): never {
  throw new Abbruch(msg);
}

export function neu(root: string, kuerzel?: string, name?: string): string {
  if (!kuerzel || !/^[a-z0-9][a-z0-9-]{1,40}$/.test(kuerzel)) fail('Kürzel: Kleinbuchstaben, Ziffern, Bindestrich (z. B. "mueller-gmbh").');
  const ziel = join(root, 'mandanten', kuerzel);
  if (existsSync(ziel)) fail(`mandanten/${kuerzel} existiert bereits.`);
  cpSync(join(root, 'mandanten', '_vorlage'), ziel, { recursive: true });
  const ersetze = (p: string) => {
    for (const n of readdirSync(p, { withFileTypes: true })) {
      const f = join(p, n.name);
      if (n.isDirectory()) ersetze(f);
      else if (n.name.endsWith('.md')) {
        writeFileSync(f, readFileSync(f, 'utf-8')
          .replaceAll('{{kuerzel}}', kuerzel).replaceAll('{{name}}', name ?? kuerzel).replaceAll('{{datum}}', heute()));
      }
    }
  };
  ersetze(ziel);
  writeFileSync(join(ziel, 'fragebogen.md'), erzeugeFragebogen({ kuerzel, name: name ?? kuerzel }));
  return `Angelegt: mandanten/${kuerzel}/ (fragebogen, entscheidungen, isms, verlauf, notizen)`;
}

export function einstufung(root: string, kuerzel: string): string {
  const m = ladeMandat(root, kuerzel);
  if (!m.fragebogen) fail('fragebogen.md fehlt');
  const v = nis2Vorpruefung(nis2Eingaben(m));
  const out: string[] = [
    `### NIS2-/BSIG-Vorprüfung (§ 28 BSIG) – Vorschlag, keine abschließende Bewertung`,
    `- Ergebnis: **${v.ergebnis}** → REG-02 \`${NIS2_FAKT[v.ergebnis]}\``,
    ...v.begruendung.map((b) => `- ${b}`),
    ...(v.fehlend.length ? [`- Fehlende Angaben: ${v.fehlend.join(', ')}`] : []),
    ...v.hinweise.map((h) => `- Hinweis: ${h}`),
    `- Grundlagen: BIB-BSIG-28, BIB-KMU, BIB-BSIG-ANL`,
    '',
  ];
  const g = groessenklasse(nis2Eingaben(m));
  out.push('### Größenklasse und Organisationsform (ENT-019) – Vorschlag');
  if (!g.klasse) out.push(`- Noch nicht bestimmbar. Fehlende Angaben: ${g.fehlend.join(', ')}`);
  else {
    const o = ORGANISATIONSFORM[g.klasse];
    out.push(
      `- Größenklasse: **${g.klasse}**${g.vorlaeufig ? ' (vorläufig)' : ''} – nach Empfehlung 2003/361/EG, Anhang Art. 2`,
      `- Gesprächspartner: ${o.gespraechspartner}`,
      `- Rollenbündelung: ${o.rollenbuendelung}`,
      `- Vier-Augen: ${o.vierAugen}`,
      `- Freigabewege: ${o.freigabewege}`,
      '- Steuert nur die Organisationsform – nie Prüfumfang, Anwendbarkeit, Prüftiefe oder Evidenz.',
    );
  }
  out.push(...g.hinweise.map((h) => `- Hinweis: ${h}`), '- Grundlagen: BIB-KMU', '');
  const f = zuFakten(m.fragebogen);
  if (!f.fakten) {
    out.push(`### Assurance Profile`, `- Noch nicht ableitbar. Fehlende Antworten (${f.fehlend.length}): ${f.fehlend.join(', ')}`);
  } else {
    const d = deriveAssuranceProfile(f.fakten);
    out.push(
      `### Assurance Profile – Vorschlag (Policy ${d.policyVersion})`,
      `- Empfehlung: **Profil ${d.recommended} – ${PROFILE_NAMES[d.recommended]}**`,
      ...(d.borderline ? [`- Grenzfall: Profil ${d.borderline.alternative} vertretbar (Abstand ${d.borderline.distance}) – Entscheidung Engagement Lead`] : []),
      `- Exposure ${d.exposureScore} → Band ${d.exposureBand} · Komplexität ${d.complexityScore}${d.complexityLift ? ' → +1' : ''}`,
      ...(d.floors.length ? [`- Untergrenzen: ${d.floors.map((x) => `${x.id} (${x.reason}) → ${x.profile}`).join('; ')}`] : []),
      `- Dimensionen: ${Object.values(d.ratings).map((r) => `${r.dimension} ${r.level}`).join(', ')}`,
      ...d.rationale.map((r) => `- ${r}`),
      ...d.openQuestions.map((q) => `- Offene Frage: ${q}`),
      `- Grundlagen: BIB-MET-PROFIL, ENT-001`,
    );
  }
  return out.join('\n');
}

export function index(root: string): string {
  const ws = ladeArbeitsbereich(root);
  const zeilen = [
    '# Bibliothek – Index',
    '',
    `> Automatisch erzeugt mit \`npm run isms -- index\` am ${heute()}. Nicht von Hand bearbeiten.`,
    '',
    '| ID | Titel | Art | Status | Freigegeben | Nächste Prüfung | Datei |',
    '|---|---|---|---|---|---|---|',
    ...ws.bibliothek
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((e) => `| ${e.id} | ${fmString(e.fm, 'titel')} | ${fmString(e.fm, 'art')} | ${e.status} | ${fmString(e.fm, 'freigegeben_von') || '—'} | ${fmString(e.fm, 'naechste_pruefung') || '—'} | [${e.datei.replace('bibliothek/', '')}](${e.datei.replace('bibliothek/', '')}) |`),
    '',
    '## Quellen-Snapshots',
    '',
    ...[...ws.quellen.keys()].sort().map((q) => {
      const nutzer = ws.bibliothek.filter((e) => e.zitate.some((z) => z.datei === q) || fmListe(e.fm, 'quellen').some((x) => x.includes(q))).map((e) => e.id);
      return `- [quellen/${q}](quellen/${q})${nutzer.length ? ` – ${nutzer.join(', ')}` : ' – noch nicht verwendet'}`;
    }),
  ];
  writeFileSync(join(root, 'bibliothek', 'index.md'), zeilen.join('\n') + '\n');
  return `bibliothek/index.md: ${ws.bibliothek.length} Einträge, ${ws.quellen.size} Snapshots`;
}

export function vorlage(root: string): string {
  writeFileSync(join(root, 'mandanten', '_vorlage', 'fragebogen.md'), erzeugeFragebogen({ kuerzel: '{{kuerzel}}', name: '{{name}}' }));
  return 'mandanten/_vorlage/fragebogen.md erzeugt';
}
