import { describe, expect, it } from 'vitest';
import { decideProfile, deriveAssuranceProfile } from '../src/proportionality/profile.js';
import { LARGE_LOW_RISK, MANUFACTURER, SOLO_DEV_A, SOLO_DEV_B, SOLO_DEV_B_HIGH, facts } from './fixtures.js';

describe('Assurance Profile – Beispiele aus §7', () => {
  it('Einzelentwickler A → Profil 1 (Lean)', () => {
    const d = deriveAssuranceProfile(SOLO_DEV_A);
    expect(d.recommended).toBe(1);
    expect(d.floors).toEqual([]);
  });

  it('Einzelentwickler B → Profil 2 oder 3, abhängig von den Fakten', () => {
    const b = deriveAssuranceProfile(SOLO_DEV_B);
    expect([2, 3]).toContain(b.recommended);
    expect(b.floors.map((f) => f.id)).toContain('F8');
    // Grenzfall wird markiert, Entscheidung beim Engagement Lead
    expect(b.borderline).toBeDefined();
    expect([2, 3]).toContain(b.borderline!.alternative);

    const bHigh = deriveAssuranceProfile(SOLO_DEV_B_HIGH);
    expect(bHigh.recommended).toBe(3);
    // keine Dimension kritisch (Stufe 4) → Profil 4 wird nicht als Grenzfall angeboten
    expect(bHigh.borderline).toBeUndefined();
  });

  it('Produktionsunternehmen (250 MA, OT, NIS2) → Profil 4', () => {
    const d = deriveAssuranceProfile(MANUFACTURER);
    expect(d.recommended).toBe(4);
    expect(d.floors.map((f) => f.id)).toEqual(expect.arrayContaining(['F3', 'F4', 'F5']));
    expect(d.borderline).toBeUndefined();
  });
});

describe('Profile sind keine Größenklassen', () => {
  it('Größe allein erzeugt höchstens eine Anhebung um eine Stufe', () => {
    const d = deriveAssuranceProfile(LARGE_LOW_RISK);
    expect(d.ratings.organization.level).toBe(4);
    expect(d.complexityLift).toBe(1);
    expect(d.recommended).toBeLessThanOrEqual(2);
  });

  it('Komplexität hebt nie über Profil 3', () => {
    const d = deriveAssuranceProfile(facts({
      ...LARGE_LOW_RISK,
      information: { highestClassification: 'confidential', personalData: 'large_scale' },
      threatExposure: { internetExposure: 'core_business_online' },
    }));
    expect(d.complexityLift).toBe(0);
    expect(d.recommended).toBe(3);
  });

  it('Reifegrad beeinflusst das Profil nicht', () => {
    const mature = facts({
      ...SOLO_DEV_B,
      existingMaturity: {
        existingIsms: 'certified', definedRoles: true, policies: true, documentedProcesses: true,
        riskManagement: true, audit: true, monitoring: true, securityTools: 'advanced',
      },
    });
    expect(deriveAssuranceProfile(mature).recommended).toBe(deriveAssuranceProfile(SOLO_DEV_B).recommended);
  });
});

describe('Regulatorische Untergrenzen', () => {
  it.each([
    [{ regulation: { kritis: true } }, 4],
    [{ regulation: { nis2: 'essential_entity' as const } }, 4],
    [{ regulation: { nis2: 'important_entity' as const } }, 3],
    [{ regulation: { iso27001: 'certification_target' as const } }, 2],
    [{ information: { specialCategoryData: 'large_scale' as const } }, 3],
  ])('%j → mindestens Profil %i', (override, min) => {
    expect(deriveAssuranceProfile(facts(override)).recommended).toBeGreaterThanOrEqual(min);
  });

  it('ungeklärte NIS2-Betroffenheit wird als offene Frage geführt', () => {
    const d = deriveAssuranceProfile(facts({ regulation: { nis2: 'unclear' } }));
    expect(d.openQuestions.join()).toMatch(/NIS2/);
  });

  it('Ergebnis ist mit Policy-Version und Begründung nachvollziehbar', () => {
    const d = deriveAssuranceProfile(MANUFACTURER);
    expect(d.policyVersion).toMatch(/^\d{4}-\d{2}\.\d+$/);
    expect(d.rationale.some((r) => r.includes('F4'))).toBe(true);
  });
});

describe('Profilentscheidung', () => {
  const lead = { personId: 'paul', role: 'engagement_lead' };
  const qa = { personId: 'thomas', role: 'independent_reviewer' };
  const why = 'Scope auf Produktentwicklung begrenzt, Kundenzugriffe über PAM abgesichert.';

  it('Empfehlung übernehmen durch Engagement Lead', () => {
    const r = decideProfile(deriveAssuranceProfile(SOLO_DEV_A), { profile: 1, decidedBy: lead });
    expect(r.ok && r.value.deviation).toBe('none');
  });

  it('Untergrenze kann nicht unterschritten werden', () => {
    const r = decideProfile(deriveAssuranceProfile(MANUFACTURER), { profile: 3, justification: why, decidedBy: lead, reviewedBy: qa });
    expect(r.ok).toBe(false);
  });

  it('Grenzfall: Alternative mit Begründung ohne QA zulässig', () => {
    const d = deriveAssuranceProfile(SOLO_DEV_B);
    const r = decideProfile(d, { profile: d.borderline!.alternative, justification: why, decidedBy: lead });
    expect(r.ok && r.value.deviation).toBe('borderline');
  });

  it('Herabstufung außerhalb eines Grenzfalls erfordert Begründung und QA-Review', () => {
    const d = deriveAssuranceProfile(SOLO_DEV_B_HIGH);
    expect(d.recommended).toBe(3);
    expect(decideProfile(d, { profile: 2, justification: why, decidedBy: lead }).ok).toBe(false);
    expect(decideProfile(d, { profile: 2, decidedBy: lead, reviewedBy: qa }).ok).toBe(false);
    const r = decideProfile(d, { profile: 2, justification: why, decidedBy: lead, reviewedBy: qa });
    expect(r.ok && r.value.deviation).toBe('downgrade');
  });

  it('nur der Engagement Lead entscheidet', () => {
    const r = decideProfile(deriveAssuranceProfile(SOLO_DEV_A), { profile: 1, decidedBy: { personId: 'anna', role: 'junior_consultant' } });
    expect(r.ok).toBe(false);
  });
});
