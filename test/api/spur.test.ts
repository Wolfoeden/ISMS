/**
 * WP-11 · Ende-zu-Ende-Nachvollziehbarkeit: vom veröffentlichten Bericht lückenlos zurück bis zur Anfrage.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Api, aufbauen, LEAD, PFLICHT_BERICHT, QA } from './helpers.js';

describe.skipIf(!process.env['DATABASE_URL'])('WP-11 · Spurprotokoll', () => {
  const api = new Api();
  beforeAll(() => api.start());
  afterAll(() => api.stop());

  it('veröffentlichter Bericht: Kette von der Anfrage bis zum Bericht ohne Lücke', async () => {
    const f = await aufbauen(api, 'aktiv', 'Spur');
    const l = api.als(LEAD);
    // KI-Vorschlag mit Fundstelle, vom Lead geprüft und gesperrt
    const v = await api.ok(api.als(LEAD, f.mandat).post(`/mandates/${f.mandat}/proposals`, {
      targetTable: 'control_assessment', targetId: f.bewertung, payload: { implementation: 'partial' },
      sources: [{ evidence_id: f.nachweis, locator: 'IdP-Export, Zeile 1' }], model: 'modell-x', promptVersion: 'P-2026-11.1', scopeVersionId: f.scope, uncertainty: 'gering',
    }));
    for (const action of ['start_review', 'accept', 'lock']) await api.ok(l.post(`/proposals/${v.id}/review`, { action }));
    for (const st of ['collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review', 'qa']) await api.ok(l.post(`/cases/${f.fall}/status`, { status: st }));
    const r = await api.ok(l.post(`/cases/${f.fall}/reports`, { scopeVersionId: f.scope, content: { findings: ['F-1'] }, reportText: `Bericht. ${PFLICHT_BERICHT}` }));
    await api.ok(l.post(`/reports/${r.id}/submit`));
    await api.ok(api.als(QA).post(`/reports/${r.id}/qa`, { decision: 'approve' }));
    await api.ok(l.post(`/cases/${f.fall}/status`, { status: 'approved' }));
    await api.ok(l.post(`/reports/${r.id}/publish`));

    const t = await api.ok(l.get(`/reports/${r.id}/trace`));
    expect(t.gaps).toEqual([]);
    expect(t.report).toMatchObject({ status: 'published', author_id: LEAD, reviewer_id: QA, qa_decision: 'approve' });
    expect(t.intake).toMatchObject({ entry_route: 'known_need', goal_code: 'software_product_security' });
    expect(t.intake.facts.map((x: { fact_key: string }) => x.fact_key)).toEqual(expect.arrayContaining(['object_type', 'purpose']));
    expect(t.offer).toMatchObject({ status: 'accepted', scope_version_id: f.scope });
    expect(t.mandate).toMatchObject({ status: 'active', offer_id: f.angebot });
    expect(t.scope).toMatchObject({ criteria_versions: { 'ISO/IEC 27001': '2022' }, handling_mode: 'assisted', assurance_statement: 'professionally_reviewed' });
    expect(t.scope.objects).toHaveLength(2);
    expect(t.evidence).toEqual([expect.objectContaining({ link_state: 'confirmed', sha256: expect.stringMatching(/^[0-9a-f]{64}$/) })]);
    expect(t.report.evidence_snapshot).toEqual([expect.objectContaining({ evidence_id: f.nachweis })]);
    expect(t.proposals).toEqual([expect.objectContaining({ status: 'persisted_locked', model: 'modell-x', prompt_version: 'P-2026-11.1', reviewed_by: LEAD })]);
    const ereignisse = t.events.map((e: { event_type: string; actor_kind: string }) => `${e.actor_kind}:${e.event_type}`);
    expect(ereignisse).toEqual(expect.arrayContaining(['system:mandate.created', 'ai:ai_proposal.created', 'human:report_version.status_changed']));

    // Berater ohne Beteiligung am Mandat sieht weder Bericht noch Protokoll
    const fremd = (await api.ok(l.post('/persons', { party: 'agency', displayName: 'Berater ohne Mandat (fiktiv)' }))).id;
    expect((await api.als(fremd).get(`/reports/${r.id}/trace`)).status).toBe(404);
    // Kunde und KI erhalten kein Spurprotokoll
    expect((await api.als(f.kunde).get(`/reports/${r.id}/trace`)).status).toBe(403);
    expect((await api.als(LEAD, f.mandat).get(`/reports/${r.id}/trace`)).status).toBe(403);
  });

  it('Spurprotokoll benennt Lücken statt sie zu verdecken', async () => {
    const f = await aufbauen(api, 'aktiv', 'Spur-Luecke');
    const l = api.als(LEAD);
    // zweite Bewertung „erfüllt“-nah ohne Nachweis ist nicht möglich (R1) – Lücke hier: offene Folgeprüfung zur Normversion
    await api.ok(l.post('/framework-versions', { framework: 'ISO/IEC 27001', version: `2022-Spur-${f.fall.slice(0, 8)}`, effectiveFrom: '2027-01-01', supersedes: '2022', note: 'fiktiv' }));
    const r = await api.ok(l.post(`/cases/${f.fall}/reports`, { scopeVersionId: f.scope, content: {}, reportText: `Entwurf. ${PFLICHT_BERICHT}` }));
    const t = await api.ok(l.get(`/reports/${r.id}/trace`));
    expect(t.gaps).toEqual([expect.stringMatching(/Folgeprüfung ISO\/IEC 27001 .* ohne Entscheidung/)]);
  });
});
