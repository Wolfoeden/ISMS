/**
 * Prüfung der Endergebnisse eines Mandats auf Auditsicherheit (vorschriften.md §A2 Nr. 0, §A8, §A17):
 *  - Bewertungszeilen: Werte gültig, Regeln R1–R5, Berichtsstatus = berechneter Wert
 *  - jede Ergebniszeile hat eine Grundlage
 *  - Nachweise: Kopf, Prüfstufe, Gültigkeit
 *  - Lebenszyklen von Feststellungen, Risiken, Korrekturmaßnahmen (ENT-028)
 *  - Formulierungen (ENT-026)
 *  - Freigabe von isms.md nur bei erfüllter Definition of Done
 */
import {
  ANWENDBARKEIT,
  berichtsstatus,
  BERICHTSSTATUS,
  ERFUELLUNG,
  EVIDENZLAGE,
  pruefeBewertung,
  UMSETZUNG,
  WIRKSAMKEIT,
  type Bewertung,
} from '../bewertung/modell.js';
import { fmString, gesetzt, leseFrontmatter, ohneAbschnitt, type Entscheidung, type Frontmatter } from './markdown.js';
import type { Befund } from './pruefen.js';
import type { Mandat } from './repo.js';

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const MASCHINE = /\b(agent|claude|ki|ai|bot|assistent)\b/i;
const REF = /\[(?:BIB-[A-Z0-9-]+|ENT-\d{3}|E-\d{3}|[A-Z]{2,3}-\d{2})\]/;

// ---------------------------------------------------------------------------
// Tabellen
// ---------------------------------------------------------------------------

export interface Tabelle {
  abschnitt: string;
  kopf: string[];
  zeilen: Array<{ zellen: string[]; zeile: number }>;
}

const zellen = (z: string) => z.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function leseTabellen(md: string): Tabelle[] {
  const out: Tabelle[] = [];
  let abschnitt = '';
  let akt: Tabelle | undefined;
  md.split('\n').forEach((z, i) => {
    const h = z.match(/^#{2,3} (.+)$/);
    if (h) abschnitt = h[1]!.trim();
    if (!z.trim().startsWith('|')) {
      akt = undefined;
      return;
    }
    if (!akt) {
      akt = { abschnitt, kopf: zellen(z), zeilen: [] };
      out.push(akt);
      return;
    }
    if (/^\|?\s*:?-{3,}/.test(z.trim())) return;
    akt.zeilen.push({ zellen: zellen(z), zeile: i + 1 });
  });
  return out;
}

const spalte = (t: Tabelle, name: string) => t.kopf.findIndex((k) => k.toLowerCase().startsWith(name.toLowerCase()));
const leer = (c: string | undefined) => !c || /^[—–-]?$/.test(c.trim());
const hatInhalt = (zellen: string[]) => zellen.slice(1).some((c) => !leer(c));

// ---------------------------------------------------------------------------
// Nachweise (Notizen)
// ---------------------------------------------------------------------------

export const NACHWEIS_PRUEFUNG = ['eingegangen', 'geeignet', 'ungeeignet', 'abgelaufen'] as const;

function nachweisGeeignet(fm: Frontmatter | undefined, heute: string): boolean {
  if (!fm) return false;
  const bis = fmString(fm, 'gueltig_bis');
  return fmString(fm, 'art') === 'evidence' && fmString(fm, 'pruefung') === 'geeignet' && !(DATUM.test(bis) && bis < heute);
}

function pruefeNotizen(m: Mandat, heute: string): Befund[] {
  const b: Befund[] = [];
  for (const [name, fm] of m.notizen) {
    const datei = `mandanten/${m.kuerzel}/notizen/${name}`;
    const f = (text: string, schwere: Befund['schwere'] = 'fehler') => b.push({ schwere, datei, text });
    const art = fmString(fm, 'art');
    if (art !== 'claim' && art !== 'evidence') f(`Kopf: art „${art}“ ungültig (claim | evidence)`);
    for (const k of ['quelle', 'datum', 'erfasst_von']) if (!gesetzt(fmString(fm, k))) f(`Kopf: ${k} fehlt`);
    if (art === 'evidence') {
      const p = fmString(fm, 'pruefung');
      if (!(NACHWEIS_PRUEFUNG as readonly string[]).includes(p)) f(`Kopf: pruefung „${p}“ ungültig (${NACHWEIS_PRUEFUNG.join(', ')})`);
      if ((p === 'geeignet' || p === 'ungeeignet') && (!gesetzt(fmString(fm, 'geprueft_von')) || MASCHINE.test(fmString(fm, 'geprueft_von')))) {
        f('Kopf: geprueft_von muss ein Mensch sein');
      }
      const bis = fmString(fm, 'gueltig_bis');
      if (p === 'geeignet' && DATUM.test(bis) && bis < heute) f(`Nachweis seit ${bis} abgelaufen – pruefung auf „abgelaufen“ setzen`, 'warnung');
    }
  }
  return b;
}

// ---------------------------------------------------------------------------
// Bewertungszeilen und Grundlagen in isms.md
// ---------------------------------------------------------------------------

function pruefeTabellen(m: Mandat, md: string, heute: string): Befund[] {
  const b: Befund[] = [];
  const datei = `mandanten/${m.kuerzel}/isms.md`;
  for (const t of leseTabellen(md)) {
    if (/Offene Punkte/i.test(t.abschnitt)) continue;
    const iGrund = spalte(t, 'Grundlage');
    const iStatus = spalte(t, 'Berichtsstatus');
    for (const { zellen: z, zeile } of t.zeilen) {
      if (!hatInhalt(z)) continue;
      const f = (text: string, schwere: Befund['schwere'] = 'fehler') => b.push({ schwere, datei, zeile, text: `${z[0] || 'Zeile'}: ${text}` });
      if (iGrund >= 0 && !REF.test(z[iGrund] ?? '')) f('Ergebniszeile ohne Grundlage ([E-…], [ENT-…], [BIB-…] oder Frage-ID)');
      if (iStatus < 0) continue;

      const wert = (name: string) => {
        const i = spalte(t, name);
        return i >= 0 && !leer(z[i]) ? z[i]!.replace(/`/g, '').trim() : undefined;
      };
      const art: Bewertung['art'] = spalte(t, 'Erfüllung') >= 0 ? 'anforderung' : 'control';
      const nachweise = [...(z[spalte(t, 'Nachweise')] ?? '').matchAll(/notizen\/([\w.-]+\.md)/g)].map((x) => x[1]!);
      for (const n of nachweise) if (!m.notizen.has(n)) f(`Nachweis notizen/${n} existiert nicht`);
      const tiefeRoh = wert('Tiefe');
      const bew: Bewertung = {
        art,
        anwendbarkeit: (wert('Anwendbarkeit') ?? 'applicable') as Bewertung['anwendbarkeit'],
        evidenzlage: (wert('Evidenzlage') ?? 'none') as Bewertung['evidenzlage'],
        freigabe: 'abgelegt',
        nachweisVorhanden: nachweise.some((n) => nachweisGeeignet(m.notizen.get(n), heute)),
        pflichtanforderung: /^6a\./.test(t.abschnitt),
      };
      if (art === 'anforderung') bew.erfuellung = (wert('Erfüllung') ?? 'open') as NonNullable<Bewertung['erfuellung']>;
      if (art === 'control') bew.umsetzung = (wert('Umsetzung') ?? 'unknown') as NonNullable<Bewertung['umsetzung']>;
      const wirk = wert('Wirksamkeit');
      if (art === 'control' && wirk) bew.wirksamkeit = wirk as NonNullable<Bewertung['wirksamkeit']>;
      if (tiefeRoh) bew.tiefe = Number(tiefeRoh) as NonNullable<Bewertung['tiefe']>;
      if (/E-\d{3}|ENT-\d{3}/.test((z[spalte(t, 'Begründung')] ?? '') + (z[iGrund] ?? ''))) bew.begruendung = 'Entscheidung';
      for (const v of pruefeBewertung(bew)) f(`${v.regel}: ${v.text}`);
      const ungueltig =
        !(ANWENDBARKEIT as readonly string[]).includes(bew.anwendbarkeit) ||
        !(EVIDENZLAGE as readonly string[]).includes(bew.evidenzlage) ||
        (bew.erfuellung !== undefined && !(ERFUELLUNG as readonly string[]).includes(bew.erfuellung)) ||
        (bew.umsetzung !== undefined && !(UMSETZUNG as readonly string[]).includes(bew.umsetzung)) ||
        (bew.wirksamkeit !== undefined && !(WIRKSAMKEIT as readonly string[]).includes(bew.wirksamkeit));
      if (ungueltig) continue;
      const soll = berichtsstatus(bew);
      const ist = wert('Berichtsstatus');
      if (!ist) f(`Berichtsstatus fehlt – berechnet: ${soll}`);
      else if (!(BERICHTSSTATUS as readonly string[]).includes(ist)) f(`Berichtsstatus „${ist}“ ungültig`);
      else if (ist !== soll) f(`Berichtsstatus „${ist}“ folgt nicht aus den Achsen – berechnet: ${soll}`);
    }
  }
  return b;
}

// ---------------------------------------------------------------------------
// Formulierungen (ENT-026, vorschriften.md §A17)
// ---------------------------------------------------------------------------

export const UNZULAESSIG: Array<{ muster: RegExp; grund: string; schwere: Befund['schwere']; nurAusserhalbAudit?: boolean }> = [
  { muster: /\b(ist|sind|gilt|gelten|wird|werden|wurde|wurden)\s+(?:\S+\s+){0,2}(konform|compliant|rechtskonform|rechtssicher|zertifizierungsfähig|zertifizierungsreif)\b/i, grund: 'Konformitäts- oder Rechtssicherheitsbehauptung – Ergebnis je Anforderung mit Berichtsstatus angeben', schwere: 'fehler' },
  { muster: /\b(NIS-?2|BSIG|DSGVO|ISO(?:\/IEC)?[ -]?2700[12])-?(konform|compliant)\b/i, grund: 'pauschale Konformitätsaussage zu einem Regelwerk', schwere: 'fehler' },
  { muster: /\bgarantier\w*|\bgewährleiste[nt]?\b/i, grund: 'Garantie- bzw. Gewährleistungsaussage', schwere: 'fehler' },
  { muster: /\b(100\s?%|hundertprozentig|lückenlos|vollumfänglich|vollständig)\s+(sicher|geschützt|konform|erfüllt)\b/i, grund: 'absolute Sicherheits- oder Erfüllungsaussage', schwere: 'fehler' },
  { muster: /\b(erfüllt|erfüllen)\s+(alle|sämtliche)\b/i, grund: 'pauschale Erfüllungsaussage – nur je Anforderung im geprüften Umfang', schwere: 'fehler' },
  { muster: /\brechtsverbindlich\w*|\bRechtsgutachten\b|\brechtlich geprüft\b/i, grund: 'Rechtsdienstleistung oder Rechtsverbindlichkeit wird suggeriert (BIB-RDG)', schwere: 'fehler' },
  { muster: /\bkeine\s+(Risiken|Schwachstellen|Sicherheitslücken|Mängel)\s+(bestehen|vorhanden|gibt)/i, grund: 'absolute Negativaussage – auf Prüfumfang und Stichprobe beschränken', schwere: 'warnung' },
  { muster: /\bzertifiziert\b/i, grund: 'nur als belegte Tatsache (Zertifikat, Stelle, Geltungsbereich, Gültigkeit) zulässig', schwere: 'warnung' },
  { muster: /\bNichtkonformität\w*|\bAuditfeststellung\w*|\bauditiert\b/i, grund: 'Auditbegriff außerhalb eines Audit-Mandats', schwere: 'fehler', nurAusserhalbAudit: true },
];

export function pruefeFormulierungen(text: string, datei: string, auditMandat: boolean): Befund[] {
  const b: Befund[] = [];
  text.split('\n').forEach((z, i) => {
    const klar = z.replace(/`[^`]*`/g, '');
    for (const r of UNZULAESSIG) {
      if (r.nurAusserhalbAudit && auditMandat) continue;
      const t = klar.match(r.muster);
      if (t) b.push({ schwere: r.schwere, datei, zeile: i + 1, text: `Formulierung „${t[0]}“: ${r.grund} (vorschriften.md §A17)` });
    }
  });
  return b;
}

// ---------------------------------------------------------------------------
// Lebenszyklen (ENT-028) auf Entscheidungsseiten
// ---------------------------------------------------------------------------

export const SCHWERE = ['gering', 'mittel', 'hoch', 'kritisch'] as const;
export const KUNDENREAKTION = ['offen', 'besprochen', 'akzeptiert', 'bestritten'] as const;
export const RISIKO_PHASE = ['identifiziert', 'bewertet', 'behandlung_entschieden', 'restrisiko_akzeptiert', 'in_ueberwachung', 'geschlossen'] as const;
export const MASSNAHME_PHASE = ['offen', 'beschlossen', 'in_umsetzung', 'umgesetzt', 'wirksam_bestaetigt', 'verworfen'] as const;

export function pruefeLebenszyklus(e: Entscheidung, datei: string, m: Mandat | undefined, heute: string): Befund[] {
  const b: Befund[] = [];
  const f = (text: string, schwere: Befund['schwere'] = 'fehler') => b.push({ schwere, datei, zeile: e.zeile, text: `${e.id}: ${text}` });
  const freigegeben = e.status === 'freigegeben' || e.status === 'abgelegt';
  const feld = (k: string) => (e.felder[k] ?? '').trim();
  const imBereich = (k: string, liste: readonly string[]) => {
    const v = feld(k).toLowerCase();
    if (!v) f(`Feld „${k}“ fehlt (${liste.join(' · ')})`);
    else if (!liste.includes(v)) f(`${k} „${v}“ ungültig (${liste.join(' · ')})`);
    return v;
  };
  if (e.typ === 'finding') {
    imBereich('schwere', SCHWERE);
    const k = imBereich('kundenreaktion', KUNDENREAKTION);
    if (k && k !== 'offen' && e.status !== 'abgelegt') f('Kundenreaktion erst nach Ablage');
  }
  if (e.typ === 'risiko') {
    const p = imBereich('phase', RISIKO_PHASE);
    if (['restrisiko_akzeptiert', 'in_ueberwachung', 'geschlossen'].includes(p)) {
      if (!freigegeben) f('Restrisiko kann erst nach Freigabe akzeptiert sein');
      if (!/risk owner|risikoeigentümer/i.test(feld('freigegeben von'))) f('Risikoakzeptanz nur durch Risk Owner (Risikoeigentümer) – Rolle in „Freigegeben von“ angeben');
    }
  }
  if (e.typ === 'massnahme') {
    const p = imBereich('phase', MASSNAHME_PHASE);
    if (p && p !== 'offen' && p !== 'verworfen' && !freigegeben) f('Korrekturmaßnahme erst nach Beschluss (Freigabe) in Umsetzung');
    if (['beschlossen', 'in_umsetzung', 'umgesetzt', 'wirksam_bestaetigt'].includes(p)) {
      if (!gesetzt(feld('verantwortlich'))) f('Feld „Verantwortlich“ fehlt');
      if (!DATUM.test(feld('frist'))) f('Feld „Frist“ fehlt (JJJJ-MM-TT)');
    }
    if (p === 'wirksam_bestaetigt') {
      const n = [...feld('nachweis').matchAll(/notizen\/([\w.-]+\.md)/g)].map((x) => x[1]!);
      if (!m || !n.some((x) => nachweisGeeignet(m.notizen.get(x), heute))) f('„wirksam bestätigt“ nur mit geeignetem Nachweis (Feld „Nachweis“: notizen/… mit art: evidence, pruefung: geeignet)');
    }
  }
  return b;
}

// ---------------------------------------------------------------------------
// Gesamtprüfung eines Mandats
// ---------------------------------------------------------------------------

export function pruefeErgebnisse(m: Mandat, heute: string): Befund[] {
  const b: Befund[] = [...pruefeNotizen(m, heute)];
  if (!m.ismsMd) return b;
  const datei = `mandanten/${m.kuerzel}/isms.md`;
  const { fm } = leseFrontmatter(m.ismsMd);
  const audit = fmString(fm, 'leistungsart') === 'internal_audit';
  b.push(...pruefeTabellen(m, m.ismsMd, heute));
  b.push(...pruefeFormulierungen(ohneAbschnitt(m.ismsMd, /^## .*Offene Punkte/i), datei, audit));

  // Definition of Done für die Freigabe von isms.md (ENT-028)
  const status = fmString(fm, 'status');
  if (!['entwurf', 'in_pruefung', 'freigegeben'].includes(status)) b.push({ schwere: 'fehler', datei, text: `status „${status}“ ungültig (entwurf · in_pruefung · freigegeben)` });
  if (status === 'freigegeben') {
    const offenePunkte = m.ismsMd.split(/^## .*Offene Punkte.*$/m)[1] ?? '';
    for (const e of m.entscheidungen.filter((x) => x.status === 'offen' || x.status === 'vorgeschlagen')) {
      if (!offenePunkte.includes(`[${e.id}]`)) b.push({ schwere: 'fehler', datei, text: `Freigabe nicht möglich: ${e.id} ist ${e.status} und nicht als offener Punkt ausgewiesen` });
    }
    const t = leseTabellen(m.ismsMd);
    const ergebnis = t.find((x) => /^10\./.test(x.abschnitt));
    for (const pflicht of ['Gesamturteil', 'Prüfumfang', 'Einschränkungen', 'Freigabe DT Agency']) {
      const zeile = ergebnis?.zeilen.find((z) => z.zellen[0]?.startsWith(pflicht));
      if (!zeile || !hatInhalt(zeile.zellen)) b.push({ schwere: 'fehler', datei, text: `Freigabe nicht möglich: §10 „${pflicht}“ fehlt` });
    }
    for (const tab of t) {
      const i = spalte(tab, 'Berichtsstatus');
      if (i < 0) continue;
      for (const z of tab.zeilen) if (z.zellen[i]?.includes('needs_review')) b.push({ schwere: 'fehler', datei, zeile: z.zeile, text: 'Freigabe nicht möglich: Bewertung in Klärung (needs_review)' });
    }
  }
  return b;
}
