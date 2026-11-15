/**
 * Etappe 1 (Umsetzungsplan 3PA-Pilot): Fachmodell über die Schnittstelle.
 * Lastenheft A-04, A-15, A-29 – A-31, A-44 – A-46; ENT-040, ENT-045. Nur fiktive Daten.
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Api, aufbauen, CONSULTANT, LEAD, pruefschritt, QA } from './helpers.js';

const api = new Api();
beforeAll(() => api.start());
afterAll(() => api.stop());

/** Katalogeintrag des freigegebenen Testprofils (aus dem ersten Test) */
let katalog = '';
const profilDatei = JSON.parse(readFileSync('bibliothek/methodik/pilotprofil-3pa-v1.json', 'utf-8'));

describe('Etappe 1 · Fachmodell 3PA', () => {
  it('Pilotprofil: Import als Entwurf, Freigabe je Kriterium nur durch DT Agency, Katalog erst nach Profilfreigabe (ENT-045, A-04)', async () => {
    const f = await aufbauen(api, 'intake', 'Profil');
    const l = api.als(LEAD);
    expect((await api.als(f.kunde).post('/profiles/import', profilDatei)).status).toBe(403);
    const p = await api.ok(l.post('/profiles/import', profilDatei));
    expect(p).toMatchObject({ criteria: 28, status: 'draft' });
    const profil = await api.ok(l.get(`/profiles/${p.id}`));
    const prd02 = profil.criteria.find((c: { code: string }) => c.code === 'PRD-02');
    // Vorschläge werden nicht übernommen, nur vermerkt; Kennung mit Ausgabe (A-04)
    expect(prd02).toMatchObject({ status: 'proposed', level: null, allowed_methods: [], refs: ['ISO/IEC 27002:2022 5.15', 'ISO/IEC 27002:2022 5.18', 'ISO/IEC 27002:2022 8.3'] });
    expect(prd02.interpretation).toMatch(/Ebene \(Vorschlag\): product/);
    expect(JSON.stringify(profil)).not.toMatch(/proALPHA|Thomas/);

    // unvollständig freigeben scheitert; vollständig nur durch DT Agency
    expect((await l.post(`/profile-criteria/${prd02.id}/decide`, { decision: 'approve' })).status).toBe(422);
    expect((await api.als(f.kunde).post(`/profile-criteria/${prd02.id}/decide`, { decision: 'approve', level: 'product' })).status).toBeGreaterThanOrEqual(403);
    await api.ok(l.post(`/profile-criteria/${prd02.id}/decide`, {
      decision: 'approve', level: 'product', allowedMethods: ['examine', 'test'], ratingRule: 'erfüllt nur mit Negativtest je Rolle (E4)', ownerRole: 'Lead Assessor',
    }));
    expect((await l.post(`/profiles/${p.id}/approve`)).status).toBe(422); // 27 Kriterien noch offen
    for (const c of profil.criteria.filter((x: { code: string }) => x.code !== 'PRD-02')) await api.ok(l.post(`/profile-criteria/${c.id}/decide`, { decision: 'reject' }));
    expect(await api.ok(l.post(`/profiles/${p.id}/approve`))).toMatchObject({ catalogEntries: 1 });
    expect((await l.post(`/profile-criteria/${prd02.id}/decide`, { decision: 'reject' })).status).toBe(422); // gesperrt nach Freigabe
    katalog = '3PA-PILOT@1:PRD-02';
  });

  it('A-29 – A-31: Prüfstatus wird abgeleitet; „ausreichend“ und „wirksam“ nur mit protokolliertem Prüfschritt', async () => {
    const f = await aufbauen(api, 'aktiv', 'Matrix');
    const l = api.als(LEAD);
    const ca = (await api.ok(l.post(`/mandates/${f.mandat}/control-assessments`, { controlId: 'A.5.17', objectId: f.o1, baseDepth: 2, requiredDepth: 2, implementation: 'unknown', level: 'supplier' }))).id;
    await api.ok(l.post('/evidence-links', { evidenceId: f.nachweis, controlAssessmentId: ca, scopeVersionId: f.scope }));
    expect((await l.patch(`/control-assessments/${ca}`, { evidenceGrade: 'E3' })).status).toBe(422);
    expect((await l.patch(`/control-assessments/${ca}`, { evidenceState: 'sufficient' })).status).toBe(422);

    // A-31: Kunde und KI protokollieren keinen Prüfschritt
    expect((await api.als(f.kunde).post('/assessment-steps', pruefschritt(ca))).status).toBeGreaterThanOrEqual(403);
    expect((await api.als(LEAD, f.mandat).post('/assessment-steps', pruefschritt(ca))).status).toBe(403);
    expect((await api.ok(l.post('/assessment-steps', pruefschritt(ca, f.nachweis)))).evidenceGrade).toBe('E3');

    // A-30: Dokument geprüft, Umsetzung offen → nicht bewertet
    expect(await api.ok(l.patch(`/control-assessments/${ca}`, { evidenceState: 'sufficient' }))).toMatchObject({ report_status: 'not_assessed', evidence_grade: 'E3' });
    await api.ok(l.patch(`/control-assessments/${ca}`, { implementation: 'present' }));
    expect((await l.patch(`/control-assessments/${ca}`, { effectiveness: 'effective' })).status).toBe(422);
    expect((await api.ok(l.patch(`/control-assessments/${ca}`, { effectiveness: 'not_demonstrated' }))).report_status).toBe('insufficient_evidence');

    // Arbeitspapiere sieht der Kunde nicht
    const kundensicht = await api.ok(api.als(f.kunde).get(`/cases/${f.fall}/workspace`));
    expect(kundensicht.steps).toEqual([]);
    const beratersicht = await api.ok(l.get(`/cases/${f.fall}/workspace`));
    expect(beratersicht.steps.filter((s: { control_assessment_id: string }) => s.control_assessment_id === ca)).toHaveLength(1);

    // Prüfbezug: außerhalb ist eigener Status, ungeklärt nicht freigebbar
    const aus = (await api.ok(l.post(`/mandates/${f.mandat}/control-assessments`, { controlId: 'A.8.13', objectId: f.o1, scopeRelation: 'out_of_scope', scopeNote: 'Betrieb nicht beauftragt', level: 'operation' }))).id;
    expect((await api.ok(l.get(`/cases/${f.fall}/workspace`))).assessments.find((a: { id: string }) => a.id === aus).report_status).toBe('out_of_scope');
  });

  it('A-46: Freigabe nach Mandatsrolle; F-023: Kriterium erst mit bestätigter Verbindlichkeit; zulässige Prüfmethoden', async () => {
    const f = await aufbauen(api, 'aktiv', 'Rollen');
    const l = api.als(LEAD);
    expect(katalog).toBe('3PA-PILOT@1:PRD-02');
    const ca = (await api.ok(l.post(`/mandates/${f.mandat}/control-assessments`, { controlId: katalog, objectId: f.o2, implementation: 'partial', level: 'product' }))).id;
    expect((await l.patch(`/control-assessments/${ca}`, { approval: 'verified' })).status).toBe(422); // Verbindlichkeit offen
    await api.ok(l.patch(`/control-assessments/${ca}`, { binding: 'guidance' }));
    await api.ok(l.post('/evidence-links', { evidenceId: f.nachweis, controlAssessmentId: ca, scopeVersionId: f.scope }));
    expect((await l.patch(`/control-assessments/${ca}`, { evidenceState: 'sufficient' })).status).toBe(422); // noch kein Prüfschritt
    expect((await l.post('/assessment-steps', { ...pruefschritt(ca), method: 'interview' })).status).toBe(422); // Methode nicht zugelassen
    await api.ok(l.post('/assessment-steps', { ...pruefschritt(ca), method: 'test', sample: '3 Rollen × 4 Endpunkte', result: '2 von 12 Aufrufen nicht abgewiesen' }));
    await api.ok(l.patch(`/control-assessments/${ca}`, { evidenceState: 'sufficient' }));

    expect((await api.als(CONSULTANT).patch(`/control-assessments/${ca}`, { approval: 'verified' })).status).toBe(200);
    expect((await api.als(CONSULTANT).patch(`/control-assessments/${ca}`, { approval: 'approved' })).status).toBe(403);
    expect((await api.als(QA).patch(`/control-assessments/${ca}`, { approval: 'approved' })).status).toBe(403);
    expect((await api.als(f.kunde).patch(`/control-assessments/${ca}`, { approval: 'approved' })).status).toBe(403); // Zahler
    expect((await api.ok(l.patch(`/control-assessments/${ca}`, { approval: 'approved' }))).report_status).toBe('partially_met');
  });

  it('A-44: Beteiligte getrennt, Unbekanntes bleibt offen; Kunde bestätigt, ändert nicht', async () => {
    const f = await aufbauen(api, 'mandat', 'Parteien');
    const l = api.als(LEAD);
    const k = api.als(f.kunde);
    const lieferant = await api.ok(l.post(`/cases/${f.fall}/parties`, { role: 'assessee', name: 'Lieferant (fiktiv)', basis: 'Angabe Auftraggeber' }));
    const betreiber = await api.ok(l.post(`/cases/${f.fall}/parties`, { role: 'operator' }));
    expect(betreiber.status).toBe('open');
    expect((await l.post(`/parties/${betreiber.id}/confirm`, { basis: 'Vermutung' })).status).toBe(422);
    await api.ok(l.post(`/cases/${f.fall}/relations`, { partyId: betreiber.id, objectId: f.o2, relation: 'operates' }));
    expect((await k.post(`/cases/${f.fall}/parties`, { role: 'operator', name: 'x' })).status).toBe(403);
    expect((await api.ok(k.post(`/parties/${lieferant.id}/confirm`, { basis: 'Kunde bestätigt im Portal' }))).status).toBe('confirmed');
    const ws = await api.ok(l.get(`/cases/${f.fall}/workspace`));
    expect(ws.parties.map((p: { role: string; status: string }) => `${p.role}:${p.status}`)).toEqual(['assessee:confirmed', 'operator:open']);
    expect(ws.relations[0]).toMatchObject({ relation: 'operates', status: 'open' });
    expect(ws.scopeConfirmations.map((c: { kind: string }) => c.kind).sort()).toEqual(['assessor_scope', 'customer_facts']);
  });
});
