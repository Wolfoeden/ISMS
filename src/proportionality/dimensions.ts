/**
 * Organization Complexity Profile – Bewertungsdimensionen (Fachkonzept §2).
 *
 * Jede Dimension wird aus strukturierten Fakten (nicht aus freien Scores)
 * auf eine Stufe 0–4 abgebildet. Jede Stufe trägt die auslösenden Treiber,
 * damit jede Profilentscheidung erklärbar und prüfbar bleibt.
 */

/** 0 = nicht relevant, 1 = gering, 2 = moderat, 3 = hoch, 4 = sehr hoch / kritisch */
export type Level = 0 | 1 | 2 | 3 | 4;

export type Dimension =
  | 'organization'
  | 'technology'
  | 'information'
  | 'businessCriticality'
  | 'regulation'
  | 'threatExposure'
  | 'thirdParties'
  | 'ai'
  | 'cryptography'
  | 'existingMaturity';

export interface OrganizationFacts {
  employees: number;
  legalEntities: number;
  sites: number;
  structure: 'single' | 'functional' | 'divisional' | 'matrix' | 'group';
  international: 'none' | 'eu' | 'global';
}

export interface TechnologyFacts {
  criticalSystems: number;
  cloudUsage: 'none' | 'saas_only' | 'iaas_paas' | 'multi_cloud';
  onPremInfrastructure: 'none' | 'minimal' | 'significant' | 'datacenter';
  networkComplexity: 'flat' | 'segmented' | 'complex';
  /** OT / Produktionsanlagen im Scope */
  ot: boolean;
  ownSoftwareDevelopment: 'none' | 'internal_tools' | 'customer_facing' | 'security_relevant_product';
  integrations: 'few' | 'many' | 'extensive';
}

export interface InformationFacts {
  highestClassification: 'public' | 'internal' | 'confidential' | 'strictly_confidential';
  personalData: 'none' | 'employees_only' | 'customers' | 'large_scale';
  /** Besondere Kategorien nach Art. 9/10 DSGVO */
  specialCategoryData: 'none' | 'limited' | 'large_scale';
  tradeSecrets: boolean;
  intellectualProperty: boolean;
  /** Verarbeitet vertrauliche Informationen im Auftrag von Kunden */
  processesCustomerConfidentialData: boolean;
}

export interface BusinessCriticalityFacts {
  criticalProcesses: number;
  /** Maximal tolerierbare Ausfallzeit der kritischsten Prozesse */
  maxTolerableDowntime: 'weeks' | 'days' | 'one_day' | 'hours' | 'minutes';
  financialImpact: 'low' | 'moderate' | 'high' | 'existential';
  customerDependency: 'low' | 'moderate' | 'high';
  societalImpact: 'none' | 'local' | 'regional' | 'national';
}

export interface RegulationFacts {
  iso27001: 'none' | 'aligned' | 'certification_target' | 'certified';
  nis2: 'not_affected' | 'unclear' | 'important_entity' | 'essential_entity';
  /** Betreiber kritischer Anlagen (KRITIS) */
  kritis: boolean;
  /** extended = z. B. DSB-Pflicht, DSFA-pflichtige Verarbeitungen */
  dataProtection: 'basic' | 'extended';
  /** z. B. DORA, TISAX, MDR, KHZG */
  sectorRegulation: string[];
  customerRequirements: 'none' | 'questionnaires' | 'contractual_controls' | 'customer_audits';
}

export interface ThreatExposureFacts {
  internetExposure: 'none' | 'website' | 'services' | 'core_business_online';
  privilegedAccess: 'internal_only' | 'customer_systems';
  remoteAccess: 'none' | 'employees' | 'third_parties';
  targetAttractiveness: 'low' | 'elevated' | 'high';
  supplyChainDependency: 'low' | 'moderate' | 'high';
}

export interface ThirdPartyFacts {
  criticalSuppliers: number;
  cloudProviders: number;
  outsourcing: 'none' | 'partial' | 'extensive';
  managedServices: boolean;
  developmentProviders: boolean;
}

export interface AiFacts {
  aiSystems: 'none' | 'productivity_tools' | 'integrated' | 'own_models';
  /** inkl. Hochrisiko-Systeme im Sinne der KI-VO */
  criticalUseCases: boolean;
  personalDataInAi: boolean;
  automatedDecisions: boolean;
}

export interface CryptographyFacts {
  ownPki: boolean;
  certificateLandscape: 'small' | 'medium' | 'large';
  ownKeyManagement: boolean;
  ownCryptoImplementation: boolean;
  kmsHsm: boolean;
  highConfidentialityRequirements: boolean;
}

export interface MaturityFacts {
  existingIsms: 'none' | 'partial' | 'established' | 'certified';
  definedRoles: boolean;
  policies: boolean;
  documentedProcesses: boolean;
  riskManagement: boolean;
  audit: boolean;
  monitoring: boolean;
  securityTools: 'basic' | 'standard' | 'advanced';
}

export interface ComplexityFacts {
  organization: OrganizationFacts;
  technology: TechnologyFacts;
  information: InformationFacts;
  businessCriticality: BusinessCriticalityFacts;
  regulation: RegulationFacts;
  threatExposure: ThreatExposureFacts;
  thirdParties: ThirdPartyFacts;
  ai: AiFacts;
  cryptography: CryptographyFacts;
  existingMaturity: MaturityFacts;
}

export interface DimensionRating {
  dimension: Dimension;
  level: Level;
  /** Treiber, die die Stufe bestimmt haben (nur die auf höchster Stufe). */
  drivers: string[];
}

type Contribution = readonly [Level, string] | false;

function rate(dimension: Dimension, contributions: Contribution[], floor: Level = 0): DimensionRating {
  const active = contributions.filter((c): c is readonly [Level, string] => c !== false);
  const level = active.reduce<Level>((max, [l]) => (l > max ? l : max), floor);
  const drivers = active.filter(([l]) => l === level).map(([, reason]) => reason);
  return { dimension, level, drivers };
}

export function rateOrganization(f: OrganizationFacts): DimensionRating {
  return rate('organization', [
    f.employees >= 1000 ? [4, `${f.employees} Beschäftigte`]
      : f.employees >= 250 ? [3, `${f.employees} Beschäftigte`]
      : f.employees >= 50 ? [2, `${f.employees} Beschäftigte`]
      : [1, `${f.employees} Beschäftigte`],
    f.legalEntities >= 10 ? [4, `${f.legalEntities} Gesellschaften`]
      : f.legalEntities >= 3 ? [3, `${f.legalEntities} Gesellschaften`]
      : f.legalEntities === 2 && [2, '2 Gesellschaften'],
    f.sites >= 10 ? [4, `${f.sites} Standorte`]
      : f.sites >= 3 ? [3, `${f.sites} Standorte`]
      : f.sites === 2 && [2, '2 Standorte'],
    (f.structure === 'matrix' || f.structure === 'group') && [3, `Organisationsstruktur: ${f.structure}`],
    f.structure === 'divisional' && [2, 'Spartenorganisation'],
    f.international === 'global' ? [3, 'global tätig'] : f.international === 'eu' && [2, 'EU-weit tätig'],
  ], 1);
}

export function rateTechnology(f: TechnologyFacts): DimensionRating {
  return rate('technology', [
    f.ot && [4, 'OT / Produktionsanlagen im Scope'],
    f.criticalSystems >= 20 ? [4, `${f.criticalSystems} kritische Systeme`]
      : f.criticalSystems >= 5 ? [3, `${f.criticalSystems} kritische Systeme`]
      : f.criticalSystems >= 1 && [2, `${f.criticalSystems} kritische Systeme`],
    f.onPremInfrastructure === 'datacenter' ? [3, 'eigenes Rechenzentrum']
      : f.onPremInfrastructure === 'significant' && [2, 'relevante On-Prem-Infrastruktur'],
    f.cloudUsage === 'multi_cloud' ? [3, 'Multi-Cloud'] : f.cloudUsage === 'iaas_paas' && [2, 'IaaS/PaaS-Betrieb'],
    f.networkComplexity === 'complex' ? [3, 'komplexe Netzwerkarchitektur']
      : f.networkComplexity === 'segmented' && [2, 'segmentiertes Netzwerk'],
    f.ownSoftwareDevelopment === 'security_relevant_product' ? [3, 'Entwicklung sicherheitsrelevanter Software']
      : f.ownSoftwareDevelopment === 'customer_facing' ? [2, 'Entwicklung kundenseitiger Software']
      : f.ownSoftwareDevelopment === 'internal_tools' && [1, 'interne Softwareentwicklung'],
    f.integrations === 'extensive' ? [3, 'umfangreiche APIs / Integrationen']
      : f.integrations === 'many' && [2, 'zahlreiche APIs / Integrationen'],
  ], 1);
}

export function rateInformation(f: InformationFacts): DimensionRating {
  return rate('information', [
    f.highestClassification === 'strictly_confidential' ? [3, 'streng vertrauliche Informationen']
      : f.highestClassification === 'confidential' ? [2, 'vertrauliche Informationen']
      : f.highestClassification === 'internal' ? [1, 'interne Informationen']
      : [0, 'nur öffentliche Informationen'],
    f.personalData === 'large_scale' ? [3, 'personenbezogene Daten in großem Umfang']
      : f.personalData === 'customers' ? [2, 'personenbezogene Kundendaten']
      : f.personalData === 'employees_only' && [1, 'personenbezogene Beschäftigtendaten'],
    f.specialCategoryData === 'large_scale' ? [4, 'besondere Kategorien personenbezogener Daten in großem Umfang']
      : f.specialCategoryData === 'limited' && [3, 'besondere Kategorien personenbezogener Daten'],
    f.tradeSecrets && [2, 'Geschäftsgeheimnisse'],
    f.intellectualProperty && [2, 'Intellectual Property'],
    f.processesCustomerConfidentialData && [3, 'vertrauliche Daten im Auftrag von Kunden'],
  ]);
}

export function rateBusinessCriticality(f: BusinessCriticalityFacts): DimensionRating {
  return rate('businessCriticality', [
    f.maxTolerableDowntime === 'minutes' ? [4, 'tolerierbare Ausfallzeit: Minuten']
      : f.maxTolerableDowntime === 'hours' ? [3, 'tolerierbare Ausfallzeit: Stunden']
      : f.maxTolerableDowntime === 'one_day' ? [2, 'tolerierbare Ausfallzeit: ein Tag']
      : [1, `tolerierbare Ausfallzeit: ${f.maxTolerableDowntime === 'days' ? 'mehrere Tage' : 'Wochen'}`],
    f.financialImpact === 'existential' ? [4, 'existenzbedrohende finanzielle Auswirkungen']
      : f.financialImpact === 'high' ? [3, 'hohe finanzielle Auswirkungen']
      : f.financialImpact === 'moderate' && [2, 'moderate finanzielle Auswirkungen'],
    f.customerDependency === 'high' ? [3, 'hohe Abhängigkeit von Kunden']
      : f.customerDependency === 'moderate' && [2, 'moderate Abhängigkeit von Kunden'],
    f.societalImpact === 'national' || f.societalImpact === 'regional'
      ? [4, `gesellschaftliche Auswirkungen: ${f.societalImpact}`]
      : f.societalImpact === 'local' && [3, 'lokale gesellschaftliche Auswirkungen'],
    f.criticalProcesses >= 10 ? [3, `${f.criticalProcesses} kritische Geschäftsprozesse`]
      : f.criticalProcesses >= 3 && [2, `${f.criticalProcesses} kritische Geschäftsprozesse`],
  ]);
}

export function rateRegulation(f: RegulationFacts): DimensionRating {
  return rate('regulation', [
    f.kritis && [4, 'KRITIS-Betreiber'],
    f.nis2 === 'essential_entity' ? [4, 'NIS2: besonders wichtige Einrichtung']
      : f.nis2 === 'important_entity' ? [3, 'NIS2: wichtige Einrichtung']
      : f.nis2 === 'unclear' && [2, 'NIS2-Betroffenheit ungeklärt'],
    f.sectorRegulation.length >= 2 ? [3, `mehrere Branchenregulierungen: ${f.sectorRegulation.join(', ')}`]
      : f.sectorRegulation.length === 1 && [3, `Branchenregulierung: ${f.sectorRegulation[0]}`],
    (f.iso27001 === 'certification_target' || f.iso27001 === 'certified') && [2, 'ISO 27001 Zertifizierung'],
    f.customerRequirements === 'customer_audits' ? [3, 'Kundenaudits']
      : f.customerRequirements === 'contractual_controls' ? [2, 'vertraglich geforderte Sicherheitsmaßnahmen']
      : f.customerRequirements === 'questionnaires' && [1, 'Kunden-Sicherheitsfragebögen'],
    f.dataProtection === 'extended' ? [2, 'erweiterte Datenschutzpflichten'] : [1, 'DSGVO-Grundpflichten'],
  ]);
}

export function rateThreatExposure(f: ThreatExposureFacts): DimensionRating {
  return rate('threatExposure', [
    f.internetExposure === 'core_business_online' ? [3, 'Kerngeschäft online exponiert']
      : f.internetExposure === 'services' ? [2, 'Internet-exponierte Dienste']
      : f.internetExposure === 'website' && [1, 'Webseite'],
    f.privilegedAccess === 'customer_systems' && [3, 'privilegierter Zugriff auf Kundensysteme'],
    f.remoteAccess === 'third_parties' ? [3, 'Remote-Zugriff durch Dritte']
      : f.remoteAccess === 'employees' && [1, 'Remote-Zugriff für Beschäftigte'],
    f.targetAttractiveness === 'high' ? [4, 'bekannte Zielgruppe für Angreifer']
      : f.targetAttractiveness === 'elevated' && [3, 'erhöhte Angriffsattraktivität'],
    f.supplyChainDependency === 'high' ? [3, 'hohe Supply-Chain-Abhängigkeit']
      : f.supplyChainDependency === 'moderate' && [2, 'moderate Supply-Chain-Abhängigkeit'],
  ]);
}

export function rateThirdParties(f: ThirdPartyFacts): DimensionRating {
  return rate('thirdParties', [
    f.criticalSuppliers >= 10 ? [4, `${f.criticalSuppliers} kritische Lieferanten`]
      : f.criticalSuppliers >= 3 ? [3, `${f.criticalSuppliers} kritische Lieferanten`]
      : f.criticalSuppliers >= 1 && [2, `${f.criticalSuppliers} kritische Lieferanten`],
    f.cloudProviders >= 3 ? [2, `${f.cloudProviders} Cloud Provider`] : f.cloudProviders >= 1 && [1, 'Cloud Provider'],
    f.outsourcing === 'extensive' ? [3, 'umfangreiches Outsourcing'] : f.outsourcing === 'partial' && [2, 'teilweises Outsourcing'],
    f.managedServices && [2, 'Managed Services'],
    f.developmentProviders && [2, 'Entwicklungsdienstleister'],
  ]);
}

export function rateAi(f: AiFacts): DimensionRating {
  return rate('ai', [
    f.aiSystems === 'own_models' ? [3, 'eigene KI-Modelle']
      : f.aiSystems === 'integrated' ? [2, 'KI in Produkte/Prozesse integriert']
      : f.aiSystems === 'productivity_tools' && [1, 'KI-Produktivitätswerkzeuge'],
    f.criticalUseCases && [4, 'kritische KI-Use-Cases'],
    f.automatedDecisions && [3, 'automatisierte Entscheidungen'],
    f.personalDataInAi && [2, 'personenbezogene Daten in KI-Systemen'],
  ]);
}

export function rateCryptography(f: CryptographyFacts): DimensionRating {
  return rate('cryptography', [
    f.ownCryptoImplementation && [4, 'eigene Kryptographie-Implementierung'],
    f.ownPki && [3, 'eigene PKI'],
    f.kmsHsm && [3, 'KMS / HSM'],
    f.ownKeyManagement && [2, 'eigene Schlüsselverwaltung'],
    f.highConfidentialityRequirements && [3, 'hohe Vertraulichkeitsanforderungen'],
    f.certificateLandscape === 'large' ? [3, 'große Zertifikatslandschaft']
      : f.certificateLandscape === 'medium' ? [2, 'mittlere Zertifikatslandschaft']
      : [1, 'kleine Zertifikatslandschaft'],
  ]);
}

/**
 * Reifegrad: 4 = hoch, 0 = kein ISMS. Fließt bewusst NICHT in das
 * Prüftiefenprofil ein (siehe Fachkonzept, Entscheidung E2), sondern in
 * Aufwandsschätzung und Roadmap.
 */
export function rateExistingMaturity(f: MaturityFacts): DimensionRating {
  const practices = [f.definedRoles, f.policies, f.documentedProcesses, f.riskManagement, f.audit, f.monitoring]
    .filter(Boolean).length;
  const base: Level = f.existingIsms === 'certified' ? 4
    : f.existingIsms === 'established' ? 3
    : f.existingIsms === 'partial' ? 2
    : practices >= 3 ? 1 : 0;
  return {
    dimension: 'existingMaturity',
    level: base,
    drivers: [`ISMS: ${f.existingIsms}`, `${practices}/6 Kernpraktiken etabliert`, `Security Tools: ${f.securityTools}`],
  };
}

export function rateAll(facts: ComplexityFacts): Record<Dimension, DimensionRating> {
  return {
    organization: rateOrganization(facts.organization),
    technology: rateTechnology(facts.technology),
    information: rateInformation(facts.information),
    businessCriticality: rateBusinessCriticality(facts.businessCriticality),
    regulation: rateRegulation(facts.regulation),
    threatExposure: rateThreatExposure(facts.threatExposure),
    thirdParties: rateThirdParties(facts.thirdParties),
    ai: rateAi(facts.ai),
    cryptography: rateCryptography(facts.cryptography),
    existingMaturity: rateExistingMaturity(facts.existingMaturity),
  };
}
