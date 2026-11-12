import { describe, expect, it } from 'vitest';
import {
  EINSCHRAENKUNG_KERNSATZ, publish, qaDecide, reviewPackage, reviewRequirement, reworkTarget, type ReportDraft, type Reviewer,
} from '../src/engagement/report.js';
import { pruefeFormulierungen } from '../src/werkzeuge/ergebnis.js';

const PFLICHT = `Die Bewertung beruht auf den bis zum 20.11.2026 vorgelegten Nachweisen und auf Angaben der befragten Personen. Stichproben erlauben keinen Schluss auf eine vollständige Fehlerfreiheit. Die Aussagen gelten nur für den genannten Prüfumfang und Zeitpunkt. ${EINSCHRAENKUNG_KERNSATZ}`;
const entwurf = (o: Partial<ReportDraft> = {}): ReportDraft => ({
  id: 'R-1', caseId: 'C-1', version: 1, scopeVersionId: 'SV-2', authorId: 'P-LEAD', asOf: '2026-11-20',
  scope: 'Produkt App 2.3: Backend, App, Build-Pipeline', method: 'Interviews, Dokumentprüfung, Stichproben', sampling: '5 von 23 Admin-Konten',
  criteriaVersions: { 'ISO/IEC 27001': '2022' },
  findings: [{ id: 'F-1', criterionRef: 'ISO/IEC 27001 A.8.5', criterionVersion: '2022', evidenceRefs: ['E-1'], status: 'assessed', statement: 'MFA für 2 von 5 geprüften Admin-Konten nicht nachgewiesen' }],
  recommendations: ['MFA für alle Admin-Konten'], materialUnknowns: [], limitations: '', text: `Bericht … ${PFLICHT}`, ...o,
});
const qa: Reviewer = { personId: 'P-QA', party: 'agency', kind: 'human', roles: ['independent_reviewer'] };

describe('D-11 Review-Anforderung', () => {
  it('im MVP immer QA und Funktionstrennung; Stufe nach Tiefe und Aussage', () => {
    expect(reviewRequirement({ engagementType: 'product_security_assessment', assuranceStatement: 'professionally_reviewed', depthProfile: 2, depthDowngraded: false }))
      .toMatchObject({ reviewRequired: true, sodRequired: true, level: 'qa' });
    expect(reviewRequirement({ engagementType: 'gap_assessment', assuranceStatement: 'professionally_reviewed', depthProfile: 3, depthDowngraded: false }).level).toBe('senior_qa');
    expect(reviewRequirement({ engagementType: 'internal_audit', assuranceStatement: 'independently_assessed', depthProfile: 2, depthDowngraded: false }).level).toBe('independent');
  });
});

describe('Review-Paket (US-C3)', () => {
  it('erkennt fehlende Nachweise, fehlende Kriterien und Versionskonflikte', () => {
    const d = entwurf({ findings: [
      { id: 'F-1', criterionRef: 'ISO/IEC 27001 A.8.5', criterionVersion: '2013', evidenceRefs: ['E-1'], status: 'assessed', statement: 'x' },
      { id: 'F-2', criterionRef: 'ISO/IEC 27001 A.5.15', evidenceRefs: [], status: 'assessed', statement: 'y' },
      { id: 'F-3', evidenceRefs: [], status: 'not_assessable', statement: 'z' },
    ] });
    const i = reviewPackage(d);
    expect(i.map((x) => `${x.ref}:${x.kind}`)).toEqual(['F-1:requirements', 'F-2:missing_evidence', 'F-3:requirements']);
    expect(reviewPackage(entwurf())).toEqual([]);
  });
});

describe('QA-Entscheidung', () => {
  it('TC-13 · Reviewer ist Autor → blockiert; Kunde und KI geben nie fachlich frei', () => {
    expect(qaDecide(entwurf(), 'approve', { ...qa, personId: 'P-LEAD' }, { level: 'qa' })).toMatchObject({ ok: false, error: expect.stringMatching(/Autor/) });
    expect(qaDecide(entwurf(), 'approve', { ...qa, party: 'customer' }, { level: 'qa' }).ok).toBe(false);
    expect(qaDecide(entwurf(), 'approve', { ...qa, kind: 'ai' }, { level: 'qa' }).ok).toBe(false);
    expect(qaDecide(entwurf(), 'approve', { ...qa, roles: ['consultant'] }, { level: 'qa' }).ok).toBe(false);
  });

  it('TC-15 · QA weist zurück → Nacharbeit in die früheste betroffene Phase, kein Versand', () => {
    const r = qaDecide(entwurf(), 'return_for_rework', qa, { level: 'qa', reworkIssues: [
      { kind: 'assessment', ref: 'F-1', text: 'Schwere nicht begründet' },
      { kind: 'missing_evidence', ref: 'F-1', text: 'Export unvollständig' },
    ] });
    expect(r).toMatchObject({ ok: true, result: { caseStatus: 'rework', reworkTarget: 'collecting_evidence', sendAllowed: false } });
    if (!r.ok) throw new Error();
    expect(() => publish(entwurf(), r.result, 'P-QA', [], '2026-11-21')).toThrow(/QA-Freigabe/);
    expect(reworkTarget([{ kind: 'report' }, { kind: 'scope' }])).toBe('scope_draft');
  });

  it('TC-16 · nicht prüfbare Daten → nur Freigabe mit ausdrücklich genannten Grenzen', () => {
    const d = entwurf({ materialUnknowns: ['Updateprozess Mobil-App'] });
    expect(qaDecide(d, 'approve', qa, { level: 'qa' })).toMatchObject({ ok: false, error: expect.stringMatching(/Einschränkungen/) });
    expect(qaDecide({ ...d, limitations: 'Build-Pipeline nicht geprüft' }, 'approve_with_explicit_limitations', qa, { level: 'qa' }).ok).toBe(false);
    const r = qaDecide({ ...d, limitations: 'Nicht beurteilt: Updateprozess Mobil-App (keine Nachweise vorgelegt).' }, 'approve_with_explicit_limitations', qa, { level: 'qa' });
    expect(r).toMatchObject({ ok: true, result: { finalStatus: 'closed_with_limitations', sendAllowed: true } });
  });

  it('Freigabe nur mit vollständigem Paket und Pflichtbaustein Einschränkungen', () => {
    expect(qaDecide(entwurf({ text: 'Bericht ohne Grenzen' }), 'approve', qa, { level: 'qa' }).ok).toBe(false);
    expect(qaDecide(entwurf(), 'approve', qa, { level: 'qa' })).toMatchObject({ ok: true, result: { finalStatus: 'closed' } });
    expect(pruefeFormulierungen(entwurf().text, 'bericht', false).filter((b) => b.schwere === 'fehler')).toEqual([]);
  });
});

describe('US-D2 · gesperrte Berichtsversion', () => {
  it('veröffentlichter Bericht ist unveränderlich; Änderung nur als neue Version mit Änderungsprotokoll', () => {
    const r = qaDecide(entwurf(), 'approve', qa, { level: 'qa' });
    if (!r.ok) throw new Error(r.error);
    const v1 = publish(entwurf(), r.result, 'P-QA', [{ evidenceId: 'E-1', sha256: 'a'.repeat(64) }], '2026-11-21');
    expect(v1.signatories).toEqual([{ personId: 'P-LEAD', role: 'author' }, { personId: 'P-QA', role: 'qa' }]);
    expect(Object.isFrozen(v1)).toBe(true);
    expect(() => { (v1 as { version: number }).version = 9; }).toThrow();
    expect(() => publish(entwurf({ version: 2 }), r.result, 'P-QA', [], '2026-11-25', v1)).toThrow(/Änderungsprotokoll/);
    const v2 = publish(entwurf({ version: 2, recommendations: ['MFA für alle Admin-Konten', 'Notfallzugang dokumentieren'] }), r.result, 'P-QA', [], '2026-11-25', v1, 'Empfehlung ergänzt nach Kundenrückfrage');
    expect(v2).toMatchObject({ version: 2, previousVersion: 1 });
    expect(v1.version).toBe(1);
  });
});
