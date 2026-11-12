import type { ComplexityFacts } from '../src/proportionality/dimensions.js';
import type { Mandate, TeamMember } from '../src/engagement/model.js';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };

/** Ausgangslage: Ein-Personen-Unternehmen ohne nennenswerte Exposition. */
const MINIMAL: ComplexityFacts = {
  organization: { employees: 1, legalEntities: 1, sites: 1, structure: 'single', international: 'none' },
  technology: {
    criticalSystems: 0, cloudUsage: 'saas_only', onPremInfrastructure: 'none', networkComplexity: 'flat',
    ot: false, ownSoftwareDevelopment: 'none', integrations: 'few',
  },
  information: {
    highestClassification: 'internal', personalData: 'none', specialCategoryData: 'none',
    tradeSecrets: false, intellectualProperty: false, processesCustomerConfidentialData: false,
  },
  businessCriticality: {
    criticalProcesses: 0, maxTolerableDowntime: 'days', financialImpact: 'low', customerDependency: 'low', societalImpact: 'none',
  },
  regulation: {
    iso27001: 'none', nis2: 'not_affected', kritis: false, dataProtection: 'basic', sectorRegulation: [], customerRequirements: 'none',
  },
  threatExposure: {
    internetExposure: 'website', privilegedAccess: 'internal_only', remoteAccess: 'none',
    targetAttractiveness: 'low', supplyChainDependency: 'low',
  },
  thirdParties: { criticalSuppliers: 0, cloudProviders: 2, outsourcing: 'none', managedServices: false, developmentProviders: false },
  ai: { aiSystems: 'productivity_tools', criticalUseCases: false, personalDataInAi: false, automatedDecisions: false },
  cryptography: {
    ownPki: false, certificateLandscape: 'small', ownKeyManagement: false, ownCryptoImplementation: false,
    kmsHsm: false, highConfidentialityRequirements: false,
  },
  existingMaturity: {
    existingIsms: 'none', definedRoles: false, policies: false, documentedProcesses: false,
    riskManagement: false, audit: false, monitoring: false, securityTools: 'basic',
  },
};

export function facts(overrides: DeepPartial<ComplexityFacts> = {}): ComplexityFacts {
  const out = structuredClone(MINIMAL) as unknown as Record<string, Record<string, unknown>>;
  for (const [dim, values] of Object.entries(overrides)) Object.assign(out[dim]!, values);
  return out as unknown as ComplexityFacts;
}

/** §7 Einzelentwickler A: Webseitenentwicklung, keine Kundensystemzugriffe, keine sensiblen Daten. */
export const SOLO_DEV_A = facts({
  technology: { ownSoftwareDevelopment: 'customer_facing' },
});

/** §7 Einzelentwickler B: Admin-Zugriff auf Kundensysteme, sensible Daten, Security-relevante SaaS. */
export const SOLO_DEV_B = facts({
  technology: { ownSoftwareDevelopment: 'security_relevant_product', cloudUsage: 'iaas_paas' },
  information: {
    highestClassification: 'confidential', personalData: 'customers', processesCustomerConfidentialData: true,
  },
  businessCriticality: { maxTolerableDowntime: 'one_day', financialImpact: 'moderate', customerDependency: 'moderate' },
  regulation: { customerRequirements: 'contractual_controls' },
  threatExposure: { internetExposure: 'services', privilegedAccess: 'customer_systems', remoteAccess: 'employees' },
});

/** Wie B, aber Kunden hängen stark vom Produkt ab und es ist ein attraktives Angriffsziel. */
export const SOLO_DEV_B_HIGH = facts({
  ...SOLO_DEV_B,
  businessCriticality: { ...SOLO_DEV_B.businessCriticality, customerDependency: 'high', maxTolerableDowntime: 'hours' },
  threatExposure: { ...SOLO_DEV_B.threatExposure, targetAttractiveness: 'elevated' },
});

/** §7 Produktionsunternehmen: 250 MA, ERP, OT, Produktion, kritische Lieferanten, NIS2-relevant. */
export const MANUFACTURER = facts({
  organization: { employees: 250, legalEntities: 1, sites: 2, structure: 'functional', international: 'eu' },
  technology: {
    criticalSystems: 8, cloudUsage: 'iaas_paas', onPremInfrastructure: 'significant', networkComplexity: 'segmented',
    ot: true, integrations: 'many',
  },
  information: {
    highestClassification: 'confidential', personalData: 'employees_only', tradeSecrets: true, intellectualProperty: true,
  },
  businessCriticality: {
    criticalProcesses: 6, maxTolerableDowntime: 'hours', financialImpact: 'high', customerDependency: 'high',
  },
  regulation: { nis2: 'important_entity', customerRequirements: 'contractual_controls' },
  threatExposure: {
    internetExposure: 'services', remoteAccess: 'third_parties', targetAttractiveness: 'elevated', supplyChainDependency: 'high',
  },
  thirdParties: { criticalSuppliers: 8, cloudProviders: 2, outsourcing: 'partial', managedServices: true },
});

/** Großes, aber risikoarmes Unternehmen – Größe allein darf kein hohes Profil erzeugen. */
export const LARGE_LOW_RISK = facts({
  organization: { employees: 3000, legalEntities: 12, sites: 40, structure: 'divisional', international: 'eu' },
  technology: { criticalSystems: 3, cloudUsage: 'saas_only', onPremInfrastructure: 'minimal', networkComplexity: 'segmented', integrations: 'many' },
  thirdParties: { criticalSuppliers: 4, cloudProviders: 3, outsourcing: 'partial', managedServices: true },
});

export const member = (personId: string, party: TeamMember['party'], ...roles: TeamMember['roles']): TeamMember => ({
  personId, party, roles,
});

/** §19 Beispiel-Mandat "ISO 27001 Introduction" */
export function iso27001Mandate(profile: Mandate['assuranceProfile'] = 3): Mandate {
  return {
    id: 'M-1',
    customerId: 'C-1',
    scope: 'ISMS gesamtes Unternehmen',
    engagementType: 'iso27001_implementation',
    assuranceProfile: profile,
    startDate: '2026-11-01',
    templateId: 'iso27001-implementation',
    team: [
      member('paul', 'agency', 'engagement_lead'),
      member('anna', 'agency', 'junior_consultant'),
      member('lisa', 'agency', 'consultant'),
      { personId: 'michael', party: 'agency', roles: ['subject_matter_expert'], smeDomains: ['cryptography'] },
      member('thomas', 'agency', 'independent_reviewer'),
      member('md', 'customer', 'executive_sponsor'),
      member('itm', 'customer', 'primary_contact', 'isms_coordinator', 'isms_manager'),
      member('hr', 'customer', 'control_owner', 'risk_owner'),
      member('infra', 'customer', 'evidence_contributor'),
      member('cfo', 'customer', 'approver'),
    ],
  };
}
