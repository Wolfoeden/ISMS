import { describe, expect, it } from 'vitest';
import { transitionFinding, visibleToCustomer, type Finding } from '../src/engagement/findings.js';
import { checkAuditIndependence, validateAssignments } from '../src/engagement/governance.js';
import type { Mandate, SegregationException } from '../src/engagement/model.js';
import { ENGAGEMENT_TEMPLATES, validateMandateTeam } from '../src/engagement/templates.js';
import { deriveDepthProfile } from '../src/proportionality/profile.js';
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
    depthProfile: 2, startDate: '2026-11-01',
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

describe('Quality Gate für Feststellungen (§22, ENT-027, ENT-029)', () => {
  const m = iso27001Mandate(3);
  const entwurf: Finding = { id: 'F-9', mandateId: 'M-1', status: 'open', customerResponse: 'pending', severity: 'high', authorId: 'anna', aiAssisted: true };
  const mensch = (personId: string) => ({ kind: 'human' as const, personId });

  it('KI erstellt Entwürfe, löst aber keinen Statuswechsel aus', () => {
    expect(transitionFinding(m, entwurf, 'submit', { kind: 'ai', system: 'assistant' }).ok).toBe(false);
  });

  it('Junior schlägt vor, verifiziert aber nicht', () => {
    expect(transitionFinding(m, entwurf, 'submit', mensch('anna'))).toEqual({ ok: true, state: { status: 'proposed', customerResponse: 'pending' } });
    expect(transitionFinding(m, { ...entwurf, status: 'proposed' }, 'verify', mensch('anna')).ok).toBe(false);
  });

  it('kritische Feststellung: Consultant verifiziert nicht, Engagement Lead schon', () => {
    const vorgeschlagen = { ...entwurf, status: 'proposed' as const };
    expect(transitionFinding(m, vorgeschlagen, 'verify', mensch('lisa')).ok).toBe(false);
    expect(transitionFinding(m, vorgeschlagen, 'verify', mensch('paul'))).toEqual({ ok: true, state: { status: 'verified', customerResponse: 'pending' } });
  });

  it('zwei Stufen: Freigabe erst nach Verifizierung und nur durch den Engagement Lead', () => {
    expect(transitionFinding(m, { ...entwurf, status: 'proposed' }, 'approve', mensch('paul')).ok).toBe(false);
    const verifiziert = { ...entwurf, status: 'verified' as const };
    expect(transitionFinding(m, verifiziert, 'approve', mensch('lisa')).ok).toBe(false);
    expect(transitionFinding(m, verifiziert, 'approve', mensch('thomas')).ok).toBe(false);
    expect(transitionFinding(m, verifiziert, 'approve', mensch('paul'))).toEqual({ ok: true, state: { status: 'approved', customerResponse: 'pending' } });
  });

  it('Vier-Augen: wer verfasst hat, verifiziert und gibt nicht frei', () => {
    expect(transitionFinding(m, { ...entwurf, status: 'proposed', authorId: 'paul' }, 'verify', mensch('paul')).ok).toBe(false);
    expect(transitionFinding(m, { ...entwurf, status: 'verified', authorId: 'paul' }, 'approve', mensch('paul')).ok).toBe(false);
  });

  it('ENT-006: im Lean-Mandat prüft ein zweiter Senior aus dem Pool kritische Findings', () => {
    const lean = iso27001Mandate(1);
    lean.team = lean.team.filter((t) => t.personId !== 'thomas');
    const kritisch = { ...entwurf, status: 'proposed' as const, authorId: 'paul', severity: 'critical' as const };
    expect(transitionFinding(lean, kritisch, 'verify', mensch('paul')).ok).toBe(false);
    lean.team.push({ personId: 'pool', party: 'agency', roles: ['independent_reviewer'] });
    expect(transitionFinding(lean, kritisch, 'verify', mensch('pool'))).toEqual({ ok: true, state: { status: 'verified', customerResponse: 'pending' } });
  });

  it('Kundenreaktion erst nach Ablage; bestritten → erneute Prüfung', () => {
    const abgelegt = { ...entwurf, status: 'filed' as const };
    expect(transitionFinding(m, { ...entwurf, status: 'approved' }, 'discuss', mensch('paul')).ok).toBe(false);
    expect(transitionFinding(m, abgelegt, 'discuss', mensch('lisa'))).toEqual({ ok: true, state: { status: 'filed', customerResponse: 'discussed' } });
    const besprochen = { ...abgelegt, customerResponse: 'discussed' as const };
    expect(transitionFinding(m, besprochen, 'dispute', mensch('md'))).toEqual({ ok: true, state: { status: 'filed', customerResponse: 'disputed' } });
    expect(transitionFinding(m, { ...besprochen, customerResponse: 'disputed' }, 'rereview', mensch('paul')))
      .toEqual({ ok: true, state: { status: 'proposed', customerResponse: 'pending' } });
  });

  it('Kunde sieht Feststellungen erst nach Ablage und Besprechung', () => {
    expect(visibleToCustomer({ status: 'approved', customerResponse: 'pending' })).toBe(false);
    expect(visibleToCustomer({ status: 'filed', customerResponse: 'pending' })).toBe(false);
    expect(visibleToCustomer({ status: 'filed', customerResponse: 'discussed' })).toBe(true);
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
    const v = validateMandateTeam(m, template('nis2-readiness'), { derivation: deriveDepthProfile(MANUFACTURER) });
    expect(rules(v)).toEqual(expect.arrayContaining(['T7', 'T8']));
  });

  it('erforderliche SMEs werden aus dem Complexity Profile abgeleitet', () => {
    const m: Mandate = { ...iso27001Mandate(4), id: 'M-NIS2', engagementType: 'nis2_readiness' };
    m.team.push({ personId: 'ot', party: 'agency', roles: ['subject_matter_expert'], smeDomains: ['ot_security', 'nis2', 'bcm'] });
    const v = validateMandateTeam(m, template('nis2-readiness'), { derivation: deriveDepthProfile(MANUFACTURER) });
    expect(v.filter((x) => x.rule === 'T8')).toEqual([]);
  });
});

describe('Auditunabhängigkeit (§14)', () => {
  const implementation: Mandate = { ...iso27001Mandate(3), endDate: '2026-06-30' };
  const audit: Mandate = {
    id: 'M-AUD', customerId: 'C-1', scope: 'ISMS', engagementType: 'internal_audit', depthProfile: 3,
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

describe('Mandatstypen je Leistungsart (ENT-020)', () => {
  it('jede neue Leistungsart hat ein Template', () => {
    for (const typ of ['initial_assessment', 'gap_assessment', 'product_security_assessment'] as const) {
      expect(ENGAGEMENT_TEMPLATES.some((t) => t.engagementType === typ)).toBe(true);
    }
    expect(template('product-security-assessment').allowedProfiles).toEqual([1, 2, 3, 4]);
  });
});
