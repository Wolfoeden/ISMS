import { describe, expect, it } from 'vitest';
import { transitionFinding, visibleToCustomer, type Finding } from '../src/engagement/findings.js';
import { checkAuditIndependence, validateAssignments } from '../src/engagement/governance.js';
import type { Mandate, SegregationException } from '../src/engagement/model.js';
import { ENGAGEMENT_TEMPLATES, validateMandateTeam } from '../src/engagement/templates.js';
import { deriveAssuranceProfile } from '../src/proportionality/profile.js';
import { MANUFACTURER, iso27001Mandate, member } from './fixtures.js';

const template = (id: string) => ENGAGEMENT_TEMPLATES.find((t) => t.id === id)!;
const rules = (v: { rule: string; severity: string }[], severity = 'error') =>
  v.filter((x) => x.severity === severity).map((x) => x.rule);

describe('Work Assignment & Responsibility Model (§20, §21)', () => {
  const m = iso27001Mandate(3);

  it('§20 Beispiel: Junior bearbeitet, Senior reviewt, Engagement Lead gibt frei', () => {
    const v = validateAssignments(m, { type: 'assessment_section', id: 'AS-1', critical: true }, [
      { personId: 'paul', responsibility: 'owner' },
      { personId: 'anna', responsibility: 'assignee' },
      { personId: 'paul', responsibility: 'reviewer' },
      { personId: 'itm', responsibility: 'contributor' },
      { personId: 'paul', responsibility: 'approver' },
    ]);
    expect(v).toEqual([]);
  });

  it('genau ein Owner, nur Teammitglieder', () => {
    const v = validateAssignments(m, { type: 'measure', id: 'MS-1' }, [{ personId: 'stranger', responsibility: 'assignee' }]);
    expect(rules(v)).toEqual(['G1', 'G2']);
  });

  it('kritische Bewertung eines Juniors ohne Senior-Review wird abgelehnt', () => {
    const v = validateAssignments(m, { type: 'finding', id: 'F-1', critical: true }, [
      { personId: 'paul', responsibility: 'owner' },
      { personId: 'anna', responsibility: 'assignee' },
      { personId: 'lisa', responsibility: 'reviewer' },
    ]);
    expect(rules(v)).toEqual(['G4']);
  });

  it('SME bestätigt kritische Bewertungen in seiner Domäne', () => {
    const v = validateAssignments(m, { type: 'finding', id: 'F-2', critical: true, smeDomain: 'cryptography' }, [
      { personId: 'paul', responsibility: 'owner' },
      { personId: 'anna', responsibility: 'assignee' },
      { personId: 'michael', responsibility: 'reviewer' },
    ]);
    expect(v).toEqual([]);
  });

  it('Bericht in Profil 3 braucht Freigabe durch Engagement Lead und Independent Review', () => {
    const v = validateAssignments(m, { type: 'report', id: 'R-1' }, [
      { personId: 'paul', responsibility: 'owner' },
      { personId: 'lisa', responsibility: 'assignee' },
      { personId: 'lisa', responsibility: 'approver' },
    ]);
    expect(rules(v)).toEqual(['G3', 'G5', 'G5']);
  });

  it('Independent Reviewer arbeitet nicht am geprüften Objekt mit', () => {
    const v = validateAssignments(m, { type: 'risk', id: 'RK-1' }, [
      { personId: 'paul', responsibility: 'owner' },
      { personId: 'thomas', responsibility: 'contributor' },
      { personId: 'lisa', responsibility: 'assignee' },
      { personId: 'paul', responsibility: 'reviewer' },
    ]);
    expect(rules(v)).toEqual(['G6']);
  });
});

describe('Multi-Role Support & Segregation not feasible (§18)', () => {
  const solo: Mandate = {
    id: 'M-SOLO', customerId: 'C-9', scope: 'SaaS-Produkt', engagementType: 'security_assessment',
    assuranceProfile: 2, startDate: '2026-11-01',
    team: [
      member('paul', 'agency', 'engagement_lead'),
      member('owner', 'customer', 'executive_sponsor', 'isms_coordinator', 'risk_owner', 'control_owner', 'approver'),
    ],
  };
  const riskAcceptance = { type: 'risk' as const, id: 'RK-7' };
  const assignments = [
    { personId: 'owner', responsibility: 'owner' as const },
    { personId: 'owner', responsibility: 'assignee' as const },
    { personId: 'owner', responsibility: 'approver' as const },
  ];

  it('Einzelunternehmer: Rollentrennung nicht möglich → Fehler ohne Ausnahme', () => {
    expect(rules(validateAssignments(solo, riskAcceptance, assignments))).toEqual(['G3']);
  });

  it('dokumentierte Ausnahme mit kompensierender Maßnahme und Senior Review → Warnung statt Fehler', () => {
    const exception: SegregationException = {
      id: 'SOD-1', mandateId: 'M-SOLO', personId: 'owner', conflict: 'Risikoakzeptanz ohne zweite Person',
      reason: 'Einzelunternehmen ohne weitere Beschäftigte',
      compensatingControl: 'Jährliche Durchsicht aller Risikoakzeptanzen durch den Engagement Lead',
      reviewedBy: 'paul', reviewedAt: '2026-11-05',
    };
    const v = validateAssignments(solo, riskAcceptance, assignments, [exception]);
    expect(rules(v)).toEqual([]);
    expect(rules(v, 'warning')).toEqual(['G3']);
  });

  it('Ausnahme ohne Senior Review ist unwirksam', () => {
    const selfReviewed: SegregationException = {
      id: 'SOD-2', mandateId: 'M-SOLO', personId: 'owner', conflict: 'x', reason: 'x',
      compensatingControl: 'x', reviewedBy: 'owner', reviewedAt: '2026-11-05',
    };
    expect(rules(validateAssignments(solo, riskAcceptance, assignments, [selfReviewed]))).toEqual(['G3']);
  });
});

describe('Quality Gate für Findings (§22)', () => {
  const m = iso27001Mandate(3);
  const draft: Finding = { id: 'F-9', mandateId: 'M-1', status: 'draft', severity: 'high', authorId: 'anna', aiAssisted: true };

  it('KI erstellt Entwürfe, löst aber keinen Statuswechsel aus', () => {
    expect(transitionFinding(m, draft, 'submit', { kind: 'ai', system: 'assistant' }).ok).toBe(false);
  });

  it('Junior reicht ein, bestätigt aber nicht', () => {
    expect(transitionFinding(m, draft, 'submit', { kind: 'human', personId: 'anna' })).toEqual({ ok: true, status: 'in_review' });
    const inReview = { ...draft, status: 'in_review' as const };
    expect(transitionFinding(m, inReview, 'confirm', { kind: 'human', personId: 'anna' }).ok).toBe(false);
  });

  it('kritisches Finding: Consultant darf nicht bestätigen, Engagement Lead schon', () => {
    const inReview = { ...draft, status: 'in_review' as const };
    expect(transitionFinding(m, inReview, 'confirm', { kind: 'human', personId: 'lisa' }).ok).toBe(false);
    expect(transitionFinding(m, inReview, 'confirm', { kind: 'human', personId: 'paul' })).toEqual({ ok: true, status: 'confirmed' });
  });

  it('Vier-Augen: Autor bestätigt eigenes Finding nicht', () => {
    const own = { ...draft, status: 'in_review' as const, authorId: 'paul' };
    expect(transitionFinding(m, own, 'confirm', { kind: 'human', personId: 'paul' }).ok).toBe(false);
  });

  it('Kunde sieht Findings erst ab Customer Discussion', () => {
    expect(visibleToCustomer('draft')).toBe(false);
    expect(visibleToCustomer('confirmed')).toBe(false);
    expect(visibleToCustomer('customer_discussion')).toBe(true);
  });
});

describe('Engagement Templates & Mandate Team (§19, §23)', () => {
  it('§19 Beispielmandat ist für Profil 3 vollständig besetzt', () => {
    const v = validateMandateTeam(iso27001Mandate(3), template('iso27001-implementation'));
    expect(v).toEqual([]);
  });

  it('Template passt nicht zum Profil', () => {
    const v = validateMandateTeam(iso27001Mandate(4), template('iso27001-implementation'));
    expect(rules(v)).toContain('T1');
  });

  it('Independent Reviewer ohne Durchführungsrolle im selben Mandat', () => {
    const m = iso27001Mandate(3);
    m.team = m.team.map((t) => (t.personId === 'thomas' ? { ...t, roles: ['independent_reviewer', 'consultant'] } : t));
    expect(rules(validateMandateTeam(m, template('iso27001-implementation')))).toContain('T5');
  });

  it('Profil 4: Control Owner + Approver in einer Person nur mit SoD-Ausnahme', () => {
    const m: Mandate = {
      ...iso27001Mandate(4), id: 'M-NIS2', engagementType: 'nis2_readiness',
    };
    m.team = m.team.map((t) => (t.personId === 'hr' ? { ...t, roles: ['control_owner', 'approver'] } : t));
    const v = validateMandateTeam(m, template('nis2-readiness'), { derivation: deriveAssuranceProfile(MANUFACTURER) });
    expect(rules(v)).toEqual(expect.arrayContaining(['T7', 'T8']));
  });

  it('erforderliche SMEs werden aus dem Complexity Profile abgeleitet', () => {
    const m: Mandate = { ...iso27001Mandate(4), id: 'M-NIS2', engagementType: 'nis2_readiness' };
    m.team.push({ personId: 'ot', party: 'agency', roles: ['subject_matter_expert'], smeDomains: ['ot_security', 'nis2', 'bcm'] });
    const v = validateMandateTeam(m, template('nis2-readiness'), { derivation: deriveAssuranceProfile(MANUFACTURER) });
    expect(v.filter((x) => x.rule === 'T8')).toEqual([]);
  });
});

describe('Auditunabhängigkeit (§14)', () => {
  const implementation: Mandate = { ...iso27001Mandate(3), endDate: '2026-06-30' };
  const audit: Mandate = {
    id: 'M-AUD', customerId: 'C-1', scope: 'ISMS', engagementType: 'internal_audit', assuranceProfile: 3,
    startDate: '2027-03-01',
    team: [member('paul', 'agency', 'engagement_lead'), member('nina', 'agency', 'consultant')],
  };

  it('wer beraten hat, auditiert nicht innerhalb der Karenzzeit', () => {
    const v = checkAuditIndependence(audit, [implementation]);
    expect(v.map((x) => x.personId)).toEqual(['paul']);
  });

  it('nach Ablauf der Karenzzeit zulässig', () => {
    expect(checkAuditIndependence({ ...audit, startDate: '2028-07-01' }, [implementation])).toEqual([]);
  });
});
