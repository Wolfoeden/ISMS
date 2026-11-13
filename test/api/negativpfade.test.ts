/**
 * WP-11 · Negativpfade über die Anwendungsschicht (bash scripts/with-db.sh npx vitest run test/api).
 * Jeder Pfad: frischer fiktiver Fall, Ablehnung mit Grund, und kein veränderter Zustand danach.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Api, aufbauen, CONSULTANT, LEAD, PFLICHT_ANGEBOT, PFLICHT_BERICHT, QA } from './helpers.js';

describe.skipIf(!process.env['DATABASE_URL'])('WP-11 · Negativpfade', () => {
  const api = new Api();
  beforeAll(() => api.start());
  afterAll(() => api.stop());
  const lead = () => api.als(LEAD);

  it('N-01 · Mandantentrennung: fremder Kunde sieht nichts vom anderen Fall (TC-18)', async () => {
    const a = await aufbauen(api, 'aktiv', 'N01-A');
    const b = await aufbauen(api, 'intake', 'N01-B');
    const fremd = api.als(b.kunde);
    expect((await fremd.get(`/cases/${a.fall}`)).status).toBe(404);
    expect((await fremd.get(`/intakes/${a.intake}/orientation`)).status).toBe(404);
    expect((await fremd.post(`/intakes/${a.intake}/facts`, { key: 'markets', value: ['DE'] })).status).toBeGreaterThanOrEqual(403);
    expect((await fremd.post(`/mandates/${a.mandat}/evidence`, { source: 'x', capturedAt: '2026-11-20', contentBase64: 'eA==' })).status).toBeGreaterThanOrEqual(403);
    // eigener Fall bleibt sichtbar
    expect((await api.als(a.kunde).get(`/intakes/${a.intake}/orientation`)).status).toBe(200);
  });

  it('N-02 · KI-Sitzung: liest kein fremdes Mandat, ändert keine Bewertung, prüft keinen Vorschlag (TC-11, TC-12)', async () => {
    const a = await aufbauen(api, 'aktiv', 'N02-A');
    const b = await aufbauen(api, 'aktiv', 'N02-B');
    const ki = api.als(LEAD, a.mandat);
    expect((await ki.get(`/cases/${b.fall}`)).status).toBe(404);
    expect((await ki.post(`/mandates/${b.mandat}/proposals`, { targetTable: 'control_assessment', targetId: b.bewertung, payload: {}, sources: [{ evidence_id: b.nachweis, locator: 'S. 1' }], model: 'm', promptVersion: 'p', scopeVersionId: b.scope, uncertainty: 'x' })).status).toBeGreaterThanOrEqual(403);
    expect((await ki.patch(`/control-assessments/${a.bewertung}`, { implementation: 'present' })).status).toBe(403);
    const v = await api.ok(ki.post(`/mandates/${a.mandat}/proposals`, { targetTable: 'control_assessment', targetId: a.bewertung, payload: { implementation: 'present' }, sources: [{ evidence_id: a.nachweis, locator: 'Zeile 1' }], model: 'm', promptVersion: 'p', scopeVersionId: a.scope, uncertainty: 'hoch' }));
    expect((await ki.post(`/proposals/${v.id}/review`, { action: 'start_review' })).status).toBe(403);
    expect((await ki.post(`/evidence/${a.nachweis}/review`, { state: 'unsuitable' })).status).toBe(403);
    // Zustand unverändert: Scope-Freigabe hat den Prüfvorgang auf scope_approved gesetzt, die KI-Versuche nichts
    expect((await lead().get(`/cases/${a.fall}`)).data.case.status).toBe('scope_approved');
  });

  it('N-03 · Upload vor aktivem Mandat (DEC-08, TC-07)', async () => {
    const f = await aufbauen(api, 'mandat', 'N03');
    const r = await api.als(f.kunde).post(`/mandates/${f.mandat}/evidence`, { source: 'Export', capturedAt: '2026-11-20', contentBase64: 'eA==' });
    expect(r).toMatchObject({ status: 422, error: { message: expect.stringMatching(/aktivem Mandat/) } });
  });

  it('N-04 · Angebotsfrist abgelaufen: Unterschrift ergibt kein Mandat (TC-07)', async () => {
    const f = await aufbauen(api, 'angebot', 'N04');
    expect((await api.ok(api.system('/system/expire-offers', { today: '2099-01-01' }))).expired).toBeGreaterThanOrEqual(1);
    const r = await api.system(`/offers/${f.angebot}/signed`, { eventId: 'EV-N04' });
    expect(r).toMatchObject({ status: 422, error: { message: expect.stringMatching(/expired/) } });
    expect((await lead().get(`/cases/${f.fall}`)).data.case.mandate_id).toBeNull();
  });

  it('N-05 · Änderungswunsch: altes Angebot ersetzt, Unterschrift darauf abgelehnt (TC-08)', async () => {
    const f = await aufbauen(api, 'angebot', 'N05');
    const neu = await api.ok(lead().post(`/cases/${f.fall}/offers`, { scopeVersionId: f.scope, customerId: f.org, engagementType: 'product_security_assessment', depthProfile: 2, plannedStart: '2027-01-15', serviceDescription: `Erweitert um Build-Pipeline. ${PFLICHT_ANGEBOT}` }));
    expect(neu.version).toBe(2);
    expect((await api.system(`/offers/${f.angebot}/signed`, { eventId: 'EV-N05' })).status).toBe(422);
    const ueberblick = (await lead().get(`/cases/${f.fall}`)).data;
    expect(ueberblick.offers.map((o: { status: string }) => o.status)).toEqual(['superseded', 'draft']);
    expect(ueberblick.case.mandate_id).toBeNull();
  });

  it('N-06 · Mehrfach zugestellte Unterschrift: genau ein Mandat (TC-20)', async () => {
    const f = await aufbauen(api, 'angebot', 'N06');
    const ids = new Set<string>();
    for (const ev of ['EV-N06-a', 'EV-N06-a', 'EV-N06-b']) ids.add((await api.ok(api.system(`/offers/${f.angebot}/signed`, { eventId: ev }))).mandateId);
    expect(ids.size).toBe(1);
    // Startteam: Ersteller des Angebots ist Engagement Lead, anfragender Kunde ist beteiligt – beide sehen den Fall sofort
    expect((await lead().get(`/cases/${f.fall}/workspace`)).status).toBe(200);
    expect((await api.als(f.kunde).get(`/cases/${f.fall}/dashboard`)).status).toBe(200);
    expect((await api.call('POST', `/offers/${f.angebot}/signed`, { eventId: 'EV-N06-c' })).status).toBe(401);
  });

  it('N-07 · Storno nur mit Entscheidung; danach Bearbeitung gestoppt (TC-19)', async () => {
    const f = await aufbauen(api, 'qa', 'N07');
    expect((await lead().post(`/mandates/${f.mandat}/terminate`, { reason: 'Kunde widerruft', dataDecision: 'retain', contractDecision: 'abrechnen' })).status).toBe(422);
    expect((await api.als(f.kunde).post(`/mandates/${f.mandat}/terminate`, { reason: 'x', dataDecision: 'delete', contractDecision: 'x' })).status).toBeGreaterThanOrEqual(403);
    const t = await api.ok(lead().post(`/mandates/${f.mandat}/terminate`, { reason: 'Kunde widerruft Auftrag', dataDecision: 'delete', contractDecision: 'erbrachte Leistungen bis heute abrechnen' }));
    expect(t.status).toBe('terminated');
    expect((await lead().get(`/cases/${f.fall}`)).data.case.status).toBe('cancelled');
    expect((await api.als(f.kunde).post(`/mandates/${f.mandat}/evidence`, { source: 'nach Storno', capturedAt: '2026-11-21', contentBase64: 'eQ==' })).status).toBe(422);
  });

  it('N-08 · Wiederverwendeter Nachweis aus anderem Mandat zählt erst nach Bestätigung (TC-10)', async () => {
    const alt = await aufbauen(api, 'aktiv', 'N08');
    // zweites Mandat derselben Organisation
    const l = lead();
    const intake2 = (await api.ok(api.als(alt.kunde).post('/intakes', { route: 'known_need', goalCode: 'software_product_security', consentGiven: true }))).id;
    const fall2 = (await api.ok(l.post('/cases', { intakeId: intake2 }))).id;
    const sv2 = (await api.ok(l.post(`/cases/${fall2}/scope-versions`, { goal: 'Folgebewertung', criteria: 'ISO/IEC 27001', handlingMode: 'assisted', assuranceStatement: 'professionally_reviewed', criteriaVersions: { 'ISO/IEC 27001': '2022' }, objectIds: [alt.o2] }))).id;
    await api.ok(l.post(`/scope-versions/${sv2}/approve`));
    const of2 = (await api.ok(l.post(`/cases/${fall2}/offers`, { scopeVersionId: sv2, customerId: alt.org, engagementType: 'gap_assessment', depthProfile: 2, plannedStart: '2027-02-01', serviceDescription: `Folgebewertung. ${PFLICHT_ANGEBOT}` }))).id;
    await api.ok(l.post(`/offers/${of2}/send`));
    const m2 = (await api.ok(api.system(`/offers/${of2}/signed`, { eventId: 'EV-N08' }))).mandateId;
    await api.ok(l.post(`/mandates/${m2}/team`, { personId: LEAD, roles: ['engagement_lead'] }));
    const pd = (await api.ok(l.post('/profile-decisions', { organizationId: alt.org, recommendedProfile: 2, minProfile: 1, profile: 2 }))).id;
    await api.ok(l.post(`/mandates/${m2}/activate`, { profileDecisionId: pd }));
    const ca2 = (await api.ok(l.post(`/mandates/${m2}/control-assessments`, { controlId: 'A.8.5', objectId: alt.o2, baseDepth: 2, requiredDepth: 2, implementation: 'partial' }))).id;

    const link = await api.ok(l.post('/evidence-links', { evidenceId: alt.nachweis, controlAssessmentId: ca2 }));
    expect(link).toMatchObject({ link_state: 'pending_review', open_checks: ['scope_fit', 'currency', 'permission', 'applicability'] });
    expect((await l.patch(`/control-assessments/${ca2}`, { evidenceState: 'sufficient' })).status).toBe(422);
    expect((await api.als(alt.kunde).post('/evidence-links/confirm', { evidenceId: alt.nachweis, controlAssessmentId: ca2 })).status).toBeGreaterThanOrEqual(403);
    await api.ok(l.post('/evidence-links/confirm', { evidenceId: alt.nachweis, controlAssessmentId: ca2, note: 'Geltungsbereich, Stand, Zulassung, Aussagekraft geprüft' }));
    expect((await api.ok(l.patch(`/control-assessments/${ca2}`, { evidenceState: 'sufficient', approval: 'approved' }))).report_status).toBe('partially_met');
  });

  it('N-09 · QA: Autor, Consultant und Kunde geben nicht frei; keine Veröffentlichung ohne QA (TC-13, TC-15)', async () => {
    const f = await aufbauen(api, 'qa', 'N09');
    // Funktionstrennung: Lead kann nicht zusätzlich Independent Reviewer werden
    expect((await lead().post(`/mandates/${f.mandat}/team`, { personId: LEAD, roles: ['independent_reviewer'] })).error?.message).toMatch(/Funktionstrennung/);
    const r = await api.ok(lead().post(`/cases/${f.fall}/reports`, { scopeVersionId: f.scope, content: { findings: ['F-1'] }, reportText: `Bericht. ${PFLICHT_BERICHT}` }));
    expect((await lead().post(`/reports/${r.id}/publish`)).status).toBeGreaterThanOrEqual(403);
    await api.ok(lead().post(`/reports/${r.id}/submit`));
    expect((await lead().post(`/reports/${r.id}/qa`, { decision: 'approve' })).status).toBe(422);
    expect((await api.als(CONSULTANT).post(`/reports/${r.id}/qa`, { decision: 'approve' })).status).toBe(422);
    expect((await api.als(f.kunde).post(`/reports/${r.id}/qa`, { decision: 'approve' })).status).toBeGreaterThanOrEqual(403);
    expect((await lead().post(`/cases/${f.fall}/status`, { status: 'published' })).status).toBe(422);
    expect((await lead().get(`/cases/${f.fall}`)).data.reports[0].status).toBe('in_qa');
  });

  it('N-10 · Wesentliche Unbekannte blockiert die Bewertung; N/A nur begründet (TC-09, US-B2)', async () => {
    const f = await aufbauen(api, 'aktiv', 'N10');
    const l = lead();
    for (const st of ['collecting_evidence', 'ready_for_assessment']) await api.ok(l.post(`/cases/${f.fall}/status`, { status: st }));
    const q = await api.ok(l.post(`/cases/${f.fall}/questions`, { code: 'PRD-UPD', text: 'Updateprozess der App', materiality: 'material', state: 'unknown' }));
    expect((await l.post(`/cases/${f.fall}/status`, { status: 'assessing' })).error?.message).toMatch(/Materielle Frage offen/);
    expect((await l.patch(`/questions/${q.id}`, { state: 'not_applicable' })).status).toBe(422);
    await api.ok(l.patch(`/questions/${q.id}`, { limitationRef: 'Einschränkung im Bericht: Updateprozess nicht beurteilt' }));
    expect((await api.ok(l.post(`/cases/${f.fall}/status`, { status: 'assessing' }))).status).toBe('assessing');
  });

  it('N-11 · Neue Normversion während des Assessments: keine QA ohne Entscheidung des Leads (TC-17)', async () => {
    const f = await aufbauen(api, 'aktiv', 'N11');
    const l = lead();
    for (const st of ['collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review']) await api.ok(l.post(`/cases/${f.fall}/status`, { status: st }));
    const fw = await api.ok(l.post('/framework-versions', { framework: 'ISO/IEC 27001', version: `2022-N11-${f.fall.slice(0, 8)}`, effectiveFrom: '2026-12-01', supersedes: '2022', note: 'fiktive Folgeversion' }));
    const impact = fw.impacts.find((i: { case_id: string }) => i.case_id === f.fall);
    expect(impact).toBeTruthy();
    expect((await l.post(`/cases/${f.fall}/status`, { status: 'qa' })).error?.message).toMatch(/Normversion/);
    expect((await api.als(CONSULTANT).post(`/version-impacts/${impact.id}/decide`, { decision: 'keep_pinned', rationale: 'x' })).status).toBe(422);
    await api.ok(l.post(`/version-impacts/${impact.id}/decide`, { decision: 'keep_pinned', rationale: 'Bewertung nach der vereinbarten Fassung 2022; der Bericht nennt die Version' }));
    expect((await api.ok(l.post(`/cases/${f.fall}/status`, { status: 'qa' }))).status).toBe('qa');
  });

  it('N-12 · Veröffentlichter Bericht ist gesperrt; neue Version nur mit Änderungsprotokoll (US-D2, TC-16)', async () => {
    const f = await aufbauen(api, 'qa', 'N12');
    const l = lead();
    const r = await api.ok(l.post(`/cases/${f.fall}/reports`, { scopeVersionId: f.scope, content: { findings: ['F-1'] }, reportText: `Bericht. ${PFLICHT_BERICHT}` }));
    await api.ok(l.post(`/reports/${r.id}/submit`));
    await api.ok(api.als(QA).post(`/reports/${r.id}/qa`, { decision: 'approve' }));
    await api.ok(l.post(`/cases/${f.fall}/status`, { status: 'approved' }));
    await api.ok(l.post(`/reports/${r.id}/publish`));
    expect((await l.post(`/reports/${r.id}/publish`)).status).toBe(422);
    expect((await l.post(`/cases/${f.fall}/reports`, { scopeVersionId: f.scope, content: { rev: 2 }, reportText: `Bericht v2. ${PFLICHT_BERICHT}` })).error?.message).toMatch(/new_version_has_changelog/);
    const v2 = await api.ok(l.post(`/cases/${f.fall}/reports`, { scopeVersionId: f.scope, content: { rev: 2 }, reportText: `Bericht v2. ${PFLICHT_BERICHT}`, changeLog: 'Empfehlung ergänzt' }));
    expect(v2.version).toBe(2);
    // ohne Einschränkungen veröffentlicht → „closed“ zulässig
    expect((await api.ok(l.post(`/cases/${f.fall}/status`, { status: 'closed' }))).status).toBe('closed');
  });
});
