/**
 * Profile → Prozessumfang (Fachkonzept §8).
 *
 * Werte sind Richtwerte der Policy 2026-11.1 und mit Ist-Daten aus
 * abgeschlossenen Mandaten zu kalibrieren.
 */
import type { Dimension } from './dimensions.js';
import type { AssuranceProfile, ProfileDerivation } from './profile.js';

export type CustomerRole =
  | 'executive_sponsor'
  | 'primary_contact'
  | 'isms_manager'
  | 'isms_coordinator'
  | 'risk_owner'
  | 'control_owner'
  | 'evidence_contributor'
  | 'approver';

export type FourEyesScope = 'critical_findings' | 'findings' | 'risk_acceptance' | 'policies' | 'evidence_reviews' | 'final_report';

export interface ProfileParameters {
  questionSet: 'core' | 'standard' | 'extended' | 'full';
  mandatoryAssessmentAreas: string[];
  interviewDepth: 'combined_owner_interview' | 'key_functions' | 'all_control_owners' | 'all_control_owners_and_operations';
  evidence: 'targeted' | 'key_controls' | 'all_applicable_controls' | 'all_controls_with_sampling';
  documentation: 'compact_handbook' | 'policy_structure' | 'full_document_hierarchy' | 'controlled_documents_with_approval';
  riskAssessment: 'simplified_register' | 'formal_register' | 'formal_register_with_scenarios' | 'formal_register_with_scenarios_and_quantification';
  requiredCustomerRoles: CustomerRole[];
  /** Ob eine Person mehrere Rollen ohne SoD-Ausnahme halten darf. */
  combinedResponsibilities: 'allowed' | 'allowed_documented' | 'restricted' | 'exception_only';
  approvalWorkflow: 'single_approval' | 'owner_and_lead' | 'four_eyes' | 'four_eyes_and_independent';
  fourEyesRequiredFor: FourEyesScope[];
  independentReviewRequired: boolean;
  /** Review-Frequenz für Policies, Risk Register, Supplier Register (Monate) */
  reviewCycleMonths: number;
  internalAuditCycleMonths: number;
  managementReviewCycleMonths: number;
  reportingDepth: 'summary' | 'management_report' | 'management_report_with_kpis' | 'board_and_regulatory_reporting';
  expertInvolvement: 'none' | 'on_demand' | 'for_high_rated_dimensions' | 'mandatory_for_high_rated_dimensions';
}

export const PROFILE_PARAMETERS: Record<AssuranceProfile, ProfileParameters> = {
  1: {
    questionSet: 'core',
    mandatoryAssessmentAreas: ['Scope & Kontext', 'Zugänge & Identitäten', 'Endgeräte', 'Backup', 'Lieferanten (Cloud)', 'Incident-Grundprozess'],
    interviewDepth: 'combined_owner_interview',
    evidence: 'targeted',
    documentation: 'compact_handbook',
    riskAssessment: 'simplified_register',
    requiredCustomerRoles: ['executive_sponsor'],
    combinedResponsibilities: 'allowed',
    approvalWorkflow: 'single_approval',
    fourEyesRequiredFor: ['critical_findings'],
    independentReviewRequired: false,
    reviewCycleMonths: 12,
    internalAuditCycleMonths: 24,
    managementReviewCycleMonths: 12,
    reportingDepth: 'summary',
    expertInvolvement: 'none',
  },
  2: {
    questionSet: 'standard',
    mandatoryAssessmentAreas: ['Scope & Kontext', 'Governance & Rollen', 'Risikomanagement', 'Asset Management', 'Zugriffssteuerung', 'Betrieb', 'Lieferanten', 'Incident Management', 'Backup & Wiederherstellung', 'Awareness'],
    interviewDepth: 'key_functions',
    evidence: 'key_controls',
    documentation: 'policy_structure',
    riskAssessment: 'formal_register',
    requiredCustomerRoles: ['executive_sponsor', 'primary_contact', 'isms_coordinator', 'control_owner'],
    combinedResponsibilities: 'allowed_documented',
    approvalWorkflow: 'owner_and_lead',
    fourEyesRequiredFor: ['critical_findings', 'risk_acceptance'],
    independentReviewRequired: false,
    reviewCycleMonths: 12,
    internalAuditCycleMonths: 12,
    managementReviewCycleMonths: 12,
    reportingDepth: 'management_report',
    expertInvolvement: 'on_demand',
  },
  3: {
    questionSet: 'extended',
    mandatoryAssessmentAreas: ['alle Bereiche Profil 2', 'BCM / DR', 'Vulnerability Management', 'Secure Development', 'Third-Party Assurance', 'Wirksamkeitsmessung'],
    interviewDepth: 'all_control_owners',
    evidence: 'all_applicable_controls',
    documentation: 'full_document_hierarchy',
    riskAssessment: 'formal_register_with_scenarios',
    requiredCustomerRoles: ['executive_sponsor', 'primary_contact', 'isms_manager', 'risk_owner', 'control_owner', 'approver'],
    combinedResponsibilities: 'restricted',
    approvalWorkflow: 'four_eyes',
    fourEyesRequiredFor: ['findings', 'risk_acceptance', 'policies', 'final_report'],
    independentReviewRequired: true,
    reviewCycleMonths: 12,
    internalAuditCycleMonths: 12,
    managementReviewCycleMonths: 12,
    reportingDepth: 'management_report_with_kpis',
    expertInvolvement: 'for_high_rated_dimensions',
  },
  4: {
    questionSet: 'full',
    mandatoryAssessmentAreas: ['alle Bereiche Profil 3', 'regulatorische Meldewege', 'Krisenmanagement', 'Supply-Chain-Assurance', 'kontinuierliches Monitoring', 'Management Accountability'],
    interviewDepth: 'all_control_owners_and_operations',
    evidence: 'all_controls_with_sampling',
    documentation: 'controlled_documents_with_approval',
    riskAssessment: 'formal_register_with_scenarios_and_quantification',
    requiredCustomerRoles: ['executive_sponsor', 'primary_contact', 'isms_manager', 'isms_coordinator', 'risk_owner', 'control_owner', 'evidence_contributor', 'approver'],
    combinedResponsibilities: 'exception_only',
    approvalWorkflow: 'four_eyes_and_independent',
    fourEyesRequiredFor: ['critical_findings', 'findings', 'risk_acceptance', 'policies', 'evidence_reviews', 'final_report'],
    independentReviewRequired: true,
    reviewCycleMonths: 6,
    internalAuditCycleMonths: 12,
    managementReviewCycleMonths: 6,
    reportingDepth: 'board_and_regulatory_reporting',
    expertInvolvement: 'mandatory_for_high_rated_dimensions',
  },
};

export type SmeDomain =
  | 'iso27001'
  | 'nis2'
  | 'ai_governance'
  | 'cryptography'
  | 'ot_security'
  | 'cloud_security'
  | 'data_protection'
  | 'bcm';

export interface ExpertNeed {
  domain: SmeDomain;
  need: 'required' | 'recommended';
  reason: string;
}

/** Leitet aus Dimensionen ≥ 3 ab, welche SMEs einzubinden sind (Fachkonzept §13). */
export function requiredExperts(derivation: ProfileDerivation, profile: AssuranceProfile): ExpertNeed[] {
  const mode = PROFILE_PARAMETERS[profile].expertInvolvement;
  if (mode === 'none') return [];
  const r = derivation.ratings;
  const high = (d: Dimension) => r[d].level >= 3;
  const driverMatch = (d: Dimension, re: RegExp) => r[d].drivers.some((x) => re.test(x));

  const candidates: Array<[SmeDomain, boolean, string]> = [
    ['cryptography', high('cryptography'), 'Kryptographie-Dimension hoch'],
    ['ai_governance', high('ai'), 'KI-Dimension hoch'],
    ['ot_security', driverMatch('technology', /OT/), 'OT im Scope'],
    ['data_protection', r.information.drivers.some((x) => /personenbezogen|besondere Kategorien/.test(x)) && high('information'), 'hohe Datenschutzrelevanz'],
    ['nis2', driverMatch('regulation', /NIS2: (besonders )?wichtige/), 'NIS2-relevante Einrichtung'],
    ['bcm', r.businessCriticality.level >= 3, 'hohe Verfügbarkeitsanforderungen'],
    ['cloud_security', driverMatch('technology', /Multi-Cloud|IaaS/) && high('threatExposure'), 'exponierter Cloud-Betrieb'],
  ];
  const need: ExpertNeed['need'] = mode === 'mandatory_for_high_rated_dimensions' ? 'required' : 'recommended';
  return candidates.filter(([, applies]) => applies).map(([domain, , reason]) => ({ domain, need, reason }));
}
