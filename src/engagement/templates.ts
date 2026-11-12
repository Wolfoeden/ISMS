/**
 * Engagement Templates (Fachkonzept §23) und Teamvalidierung (§11–§19).
 */
import { PROFILE_PARAMETERS, requiredExperts } from '../proportionality/parameters.js';
import { isValidSegregationException } from './governance.js';
import type { DepthProfile, ProfileDerivation } from '../proportionality/profile.js';
import {
  AGENCY_DELIVERY_ROLES,
  holdersOf,
  type AgencyRole,
  type CustomerRole,
  type EngagementType,
  type Mandate,
  type SegregationException,
  type Violation,
} from './model.js';

export interface TemplateTeamSlot {
  role: AgencyRole;
  requirement: 'required' | 'optional';
}

export interface EngagementTemplate {
  id: string;
  name: string;
  engagementType: EngagementType;
  allowedProfiles: DepthProfile[];
  profileSource: 'pre_assessment' | 'third_party_pre_assessment';
  team: TemplateTeamSlot[];
  deliverables: string[];
}

export const ENGAGEMENT_TEMPLATES: EngagementTemplate[] = [
  {
    id: 'solo-developer-security-assessment',
    name: 'Solo Developer Security Assessment',
    engagementType: 'security_assessment',
    allowedProfiles: [1],
    profileSource: 'pre_assessment',
    team: [
      { role: 'engagement_lead', requirement: 'required' },
      { role: 'junior_consultant', requirement: 'optional' },
    ],
    deliverables: ['Kurzbericht mit priorisierten Maßnahmen', 'vereinfachtes Risk Register'],
  },
  {
    id: 'sme-iso27001-readiness',
    name: 'SME ISO 27001 Readiness',
    engagementType: 'iso27001_readiness',
    allowedProfiles: [2],
    profileSource: 'pre_assessment',
    team: [
      { role: 'engagement_lead', requirement: 'required' },
      { role: 'junior_consultant', requirement: 'required' },
      { role: 'subject_matter_expert', requirement: 'optional' },
    ],
    deliverables: ['Gap-Analyse', 'Maßnahmen-Roadmap', 'Management Summary'],
  },
  {
    id: 'iso27001-implementation',
    name: 'ISO 27001 Implementation',
    engagementType: 'iso27001_implementation',
    allowedProfiles: [2, 3],
    profileSource: 'pre_assessment',
    team: [
      { role: 'engagement_lead', requirement: 'required' },
      { role: 'consultant', requirement: 'required' },
      { role: 'subject_matter_expert', requirement: 'optional' },
      { role: 'independent_reviewer', requirement: 'required' },
    ],
    deliverables: ['ISMS-Dokumentation', 'Risk Register', 'Statement of Applicability', 'Internes Audit', 'Management Review'],
  },
  {
    id: 'nis2-readiness',
    name: 'NIS2 Readiness',
    engagementType: 'nis2_readiness',
    allowedProfiles: [3, 4],
    profileSource: 'pre_assessment',
    team: [
      { role: 'engagement_lead', requirement: 'required' },
      { role: 'consultant', requirement: 'required' },
      { role: 'subject_matter_expert', requirement: 'required' },
    ],
    deliverables: ['Betroffenheitsanalyse', 'Gap-Analyse NIS2 Art. 21', 'Meldeprozess', 'Roadmap', 'Geschäftsleitungs-Briefing'],
  },
  {
    id: 'third-party-assessment',
    name: 'Third-Party Assessment',
    engagementType: 'third_party_assessment',
    allowedProfiles: [1, 2, 3, 4],
    profileSource: 'third_party_pre_assessment',
    team: [
      { role: 'engagement_lead', requirement: 'required' },
      { role: 'consultant', requirement: 'optional' },
    ],
    deliverables: ['Lieferantenbewertung', 'Findings mit Auflagen'],
  },
];

/** Rollenkombinationen auf Kundenseite, die je nach Profil Rollentrennung erfordern. */
const CUSTOMER_ROLE_CONFLICTS: Array<[CustomerRole, CustomerRole]> = [['control_owner', 'approver']];

export function validateMandateTeam(
  mandate: Mandate,
  template: EngagementTemplate,
  options: { derivation?: ProfileDerivation; exceptions?: SegregationException[] } = {},
): Violation[] {
  const v: Violation[] = [];
  const profile = mandate.depthProfile;
  const params = PROFILE_PARAMETERS[profile];

  if (!template.allowedProfiles.includes(profile)) {
    v.push({ rule: 'T1', severity: 'error', message: `Template '${template.name}' ist für Profil ${profile} nicht vorgesehen (zulässig: ${template.allowedProfiles.join(', ')}).` });
  }

  const leads = holdersOf(mandate, 'engagement_lead');
  if (leads.length !== 1) {
    v.push({ rule: 'T2', severity: 'error', message: `Ein Mandat hat genau einen Engagement Lead (gefunden: ${leads.length}).` });
  }

  for (const slot of template.team) {
    if (slot.requirement === 'required' && holdersOf(mandate, slot.role).length === 0) {
      v.push({ rule: 'T3', severity: 'error', message: `Template erfordert Rolle '${slot.role}'.` });
    }
  }

  const reviewers = holdersOf(mandate, 'independent_reviewer');
  if (params.independentReviewRequired && reviewers.length === 0) {
    v.push({ rule: 'T4', severity: 'error', message: `Profil ${profile} erfordert einen Independent Reviewer / QA.` });
  }
  for (const r of reviewers) {
    if (r.roles.some((role) => (AGENCY_DELIVERY_ROLES as readonly string[]).includes(role))) {
      v.push({ rule: 'T5', severity: 'error', personId: r.personId, message: `Independent Reviewer ${r.personId} darf im selben Mandat keine Durchführungsrolle halten.` });
    }
  }

  const customerRoles = new Set(mandate.team.filter((t) => t.party === 'customer').flatMap((t) => t.roles));
  for (const role of params.requiredCustomerRoles) {
    if (!customerRoles.has(role)) {
      v.push({ rule: 'T6', severity: 'warning', message: `Profil ${profile}: Kundenrolle '${role}' ist noch nicht besetzt.` });
    }
  }

  // Multi-Role Support (§18): Kombination erlaubt, aber ab Profil 3 begründungspflichtig.
  if (params.combinedResponsibilities === 'restricted' || params.combinedResponsibilities === 'exception_only') {
    for (const member of mandate.team.filter((t) => t.party === 'customer')) {
      for (const [a, b] of CUSTOMER_ROLE_CONFLICTS) {
        if (!member.roles.includes(a) || !member.roles.includes(b)) continue;
        const excepted = (options.exceptions ?? []).some(
          (e) => e.personId === member.personId && e.objectId === undefined && isValidSegregationException(mandate, e),
        );
        if (!excepted) {
          v.push({
            rule: 'T7',
            severity: params.combinedResponsibilities === 'exception_only' ? 'error' : 'warning',
            personId: member.personId,
            message: `${member.personId} hält '${a}' und '${b}' – Rollentrennung nicht gegeben, SoD-Ausnahme mit kompensierender Maßnahme dokumentieren.`,
          });
        }
      }
    }
  }

  if (options.derivation) {
    const smes = holdersOf(mandate, 'subject_matter_expert');
    for (const need of requiredExperts(options.derivation, profile)) {
      if (!smes.some((s) => s.smeDomains?.includes(need.domain))) {
        v.push({
          rule: 'T8',
          severity: need.need === 'required' ? 'error' : 'warning',
          message: `SME '${need.domain}' ${need.need === 'required' ? 'erforderlich' : 'empfohlen'}: ${need.reason}.`,
        });
      }
    }
  }

  return v;
}
