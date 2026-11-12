/**
 * Fragebogen-Katalog (Pre-Assessment / Triage) – einzige Quelle für
 * Vorlage, Parser und Einstufung. Für alle Profile gleich.
 *
 * `feld` verweist auf ComplexityFacts (src/proportionality/dimensions.ts)
 * oder auf `stammdaten.*` (für die Vorschriften-Prüfung).
 */

export const KATALOG_VERSION = '2026-11.1';

export type FrageTyp = 'zahl' | 'text' | 'janein' | 'auswahl' | 'mehrfach';

export interface Option {
  wert: string;
  label: string;
}

export interface Frage {
  id: string;
  frage: string;
  feld: string;
  typ: FrageTyp;
  optionen?: Option[];
  hinweis?: string;
}

export interface Abschnitt {
  titel: string;
  fragen: Frage[];
}

const o = (wert: string, label: string): Option => ({ wert, label });

/** BSIG Anlage 1 und 2 (Stand 22.10.2026), siehe bibliothek/quellen/de-bsig-anlage*.txt */
export const BSIG_EINRICHTUNGSARTEN: Option[] = [
  o('a1-1.1', 'Anlage 1 · Energie – Stromversorgung'),
  o('a1-1.2', 'Anlage 1 · Energie – Fernwärme-/Fernkälteversorgung'),
  o('a1-1.3', 'Anlage 1 · Energie – Kraftstoff- und Heizölversorgung'),
  o('a1-1.4', 'Anlage 1 · Energie – Gasversorgung'),
  o('a1-2.1', 'Anlage 1 · Transport und Verkehr – Luftverkehr'),
  o('a1-2.2', 'Anlage 1 · Transport und Verkehr – Schienenverkehr'),
  o('a1-2.3', 'Anlage 1 · Transport und Verkehr – Schifffahrt'),
  o('a1-2.4', 'Anlage 1 · Transport und Verkehr – Straßenverkehr'),
  o('a1-3.1', 'Anlage 1 · Finanzwesen – Bankwesen'),
  o('a1-3.2', 'Anlage 1 · Finanzwesen – Finanzmarktinfrastrukturen'),
  o('a1-4', 'Anlage 1 · Gesundheit'),
  o('a1-5.1', 'Anlage 1 · Wasser – Trinkwasserversorgung'),
  o('a1-5.2', 'Anlage 1 · Wasser – Abwasserbeseitigung'),
  o('a1-6.1.1', 'Anlage 1 · Digitale Infrastruktur – Internet Exchange Point'),
  o('a1-6.1.2', 'Anlage 1 · Digitale Infrastruktur – DNS-Diensteanbieter'),
  o('a1-6.1.3', 'Anlage 1 · Digitale Infrastruktur – Top Level Domain Name Registry'),
  o('a1-6.1.4', 'Anlage 1 · Digitale Infrastruktur – Cloud-Computing-Dienste'),
  o('a1-6.1.5', 'Anlage 1 · Digitale Infrastruktur – Rechenzentrumsdienste'),
  o('a1-6.1.6', 'Anlage 1 · Digitale Infrastruktur – Content Delivery Network'),
  o('a1-6.1.7', 'Anlage 1 · Digitale Infrastruktur – Vertrauensdiensteanbieter (nicht qualifiziert)'),
  o('a1-6.1.7q', 'Anlage 1 · Digitale Infrastruktur – qualifizierter Vertrauensdiensteanbieter'),
  o('a1-6.1.8', 'Anlage 1 · Digitale Infrastruktur – Betreiber öffentlicher Telekommunikationsnetze'),
  o('a1-6.1.9', 'Anlage 1 · Digitale Infrastruktur – öffentlich zugängliche Telekommunikationsdienste'),
  o('a1-6.1.10', 'Anlage 1 · Digitale Infrastruktur – Managed Services Provider'),
  o('a1-6.1.11', 'Anlage 1 · Digitale Infrastruktur – Managed Security Services Provider'),
  o('a1-7', 'Anlage 1 · Weltraum'),
  o('a2-1.1', 'Anlage 2 · Transport und Verkehr – Post- und Kurierdienste'),
  o('a2-2', 'Anlage 2 · Abfallbewirtschaftung'),
  o('a2-3', 'Anlage 2 · Chemische Stoffe'),
  o('a2-4', 'Anlage 2 · Lebensmittel'),
  o('a2-5.1', 'Anlage 2 · Verarbeitendes Gewerbe – Medizinprodukte / In-vitro-Diagnostika'),
  o('a2-5.2', 'Anlage 2 · Verarbeitendes Gewerbe – Datenverarbeitungsgeräte, elektronische/optische Erzeugnisse (NACE C 26)'),
  o('a2-5.3', 'Anlage 2 · Verarbeitendes Gewerbe – elektrische Ausrüstungen (NACE C 27)'),
  o('a2-5.4', 'Anlage 2 · Verarbeitendes Gewerbe – Maschinenbau (NACE C 28)'),
  o('a2-5.5', 'Anlage 2 · Verarbeitendes Gewerbe – Kraftwagen und Kraftwagenteile (NACE C 29)'),
  o('a2-5.6', 'Anlage 2 · Verarbeitendes Gewerbe – sonstiger Fahrzeugbau (NACE C 30)'),
  o('a2-6.1.1', 'Anlage 2 · Digitale Dienste – Online-Marktplätze'),
  o('a2-6.1.2', 'Anlage 2 · Digitale Dienste – Online-Suchmaschinen'),
  o('a2-6.1.3', 'Anlage 2 · Digitale Dienste – Plattformen sozialer Netzwerke'),
  o('a2-7', 'Anlage 2 · Forschung'),
  o('keine', 'keiner der Einrichtungsarten zuzuordnen'),
];

const JA_NEIN: Option[] = [o('ja', 'ja'), o('nein', 'nein')];

export const KATALOG: Abschnitt[] = [
  {
    titel: 'Stammdaten (für die Vorschriften-Prüfung)',
    fragen: [
      { id: 'STA-01', frage: 'Name der Organisation', feld: 'stammdaten.name', typ: 'text' },
      { id: 'STA-02', frage: 'Rechtsform und ggf. Handelsregisternummer', feld: 'stammdaten.rechtsform', typ: 'text' },
      { id: 'STA-03', frage: 'Geschäftstätigkeit: Produkte und Dienstleistungen', feld: 'stammdaten.taetigkeit', typ: 'text' },
      {
        id: 'STA-04', frage: 'Welchen Einrichtungsarten nach BSIG Anlage 1/2 ist die Organisation zuzuordnen?',
        feld: 'stammdaten.bsigEinrichtungsarten', typ: 'mehrfach', optionen: BSIG_EINRICHTUNGSARTEN,
        hinweis: 'Vernachlässigbare Geschäftstätigkeiten können unberücksichtigt bleiben (§ 28 Abs. 3 BSIG). Grundlage: BIB-BSIG-ANL.',
      },
      {
        id: 'STA-05', frage: 'Bietet die Organisation anderen entgeltlich Waren oder Dienstleistungen an?',
        feld: 'stammdaten.entgeltlich', typ: 'janein', optionen: JA_NEIN,
        hinweis: 'Tatbestandsmerkmal in § 28 Abs. 1 Nr. 4 und Abs. 2 Nr. 3 BSIG.',
      },
      { id: 'STA-06', frage: 'Jahresumsatz (Mio. EUR, letzter Abschluss)', feld: 'stammdaten.jahresumsatzMio', typ: 'zahl' },
      { id: 'STA-07', frage: 'Jahresbilanzsumme (Mio. EUR, letzter Abschluss)', feld: 'stammdaten.jahresbilanzMio', typ: 'zahl' },
      {
        id: 'STA-08', frage: 'Gibt es Partner- oder verbundene Unternehmen im Sinne der Empfehlung 2003/361/EG?',
        feld: 'stammdaten.verbundeneUnternehmen', typ: 'janein', optionen: JA_NEIN,
        hinweis: 'Relevant für die Schwellenwerte; Ausnahme bei IT-Unabhängigkeit nach § 28 Abs. 4 Satz 2 BSIG. Grundlage: BIB-KMU.',
      },
    ],
  },
  {
    titel: 'Organization',
    fragen: [
      {
        id: 'ORG-01', frage: 'Wie viele Personen sind beschäftigt?', feld: 'organization.employees', typ: 'zahl',
        hinweis: 'Für NIS2/BSIG zählt die Mitarbeiterzahl nach Empfehlung 2003/361/EG (Jahresarbeitseinheiten).',
      },
      { id: 'ORG-02', frage: 'Wie viele Gesellschaften gehören zum Scope?', feld: 'organization.legalEntities', typ: 'zahl' },
      { id: 'ORG-03', frage: 'Wie viele Standorte gehören zum Scope?', feld: 'organization.sites', typ: 'zahl' },
      {
        id: 'ORG-04', frage: 'Wie ist die Organisation strukturiert?', feld: 'organization.structure', typ: 'auswahl',
        optionen: [
          o('single', 'Einzelunternehmen / eine Einheit'),
          o('functional', 'funktionale Organisation (Abteilungen)'),
          o('divisional', 'Sparten- / Geschäftsbereichsorganisation'),
          o('matrix', 'Matrixorganisation'),
          o('group', 'Unternehmensgruppe / Konzern'),
        ],
      },
      {
        id: 'ORG-05', frage: 'Wie international ist die Organisation tätig?', feld: 'organization.international', typ: 'auswahl',
        optionen: [o('none', 'nur national'), o('eu', 'EU-weit'), o('global', 'global')],
      },
    ],
  },
  {
    titel: 'Technology',
    fragen: [
      { id: 'TEC-01', frage: 'Wie viele geschäftskritische IT-Systeme / Anwendungen gibt es?', feld: 'technology.criticalSystems', typ: 'zahl' },
      {
        id: 'TEC-02', frage: 'Wie wird Cloud genutzt?', feld: 'technology.cloudUsage', typ: 'auswahl',
        optionen: [
          o('none', 'keine Cloud-Nutzung'),
          o('saas_only', 'nur SaaS (z. B. Office-, CRM-Dienste)'),
          o('iaas_paas', 'eigener Betrieb auf IaaS / PaaS'),
          o('multi_cloud', 'mehrere Cloud-Plattformen im eigenen Betrieb'),
        ],
      },
      {
        id: 'TEC-03', frage: 'Welche eigene (On-Prem-)Infrastruktur gibt es?', feld: 'technology.onPremInfrastructure', typ: 'auswahl',
        optionen: [
          o('none', 'keine'),
          o('minimal', 'einzelne Geräte (Router, NAS, Drucker)'),
          o('significant', 'eigene Server und Netzwerk'),
          o('datacenter', 'eigenes Rechenzentrum'),
        ],
      },
      {
        id: 'TEC-04', frage: 'Wie komplex ist das Netzwerk?', feld: 'technology.networkComplexity', typ: 'auswahl',
        optionen: [o('flat', 'flach, nicht segmentiert'), o('segmented', 'segmentiert (Zonen/VLANs)'), o('complex', 'komplex (mehrere Standorte, Zonen, Übergänge)')],
      },
      { id: 'TEC-05', frage: 'Gehören OT / Produktionsanlagen zum Scope?', feld: 'technology.ot', typ: 'janein', optionen: JA_NEIN },
      {
        id: 'TEC-06', frage: 'Entwickelt die Organisation eigene Software?', feld: 'technology.ownSoftwareDevelopment', typ: 'auswahl',
        optionen: [
          o('none', 'nein'),
          o('internal_tools', 'nur interne Werkzeuge'),
          o('customer_facing', 'Software / Webseiten für Kunden'),
          o('security_relevant_product', 'sicherheitsrelevante Software oder Produkte'),
        ],
      },
      {
        id: 'TEC-07', frage: 'Wie viele APIs / Integrationen zwischen Systemen gibt es?', feld: 'technology.integrations', typ: 'auswahl',
        optionen: [o('few', 'wenige'), o('many', 'zahlreiche'), o('extensive', 'umfangreich / Integrationsplattform')],
      },
    ],
  },
  {
    titel: 'Information',
    fragen: [
      {
        id: 'INF-01', frage: 'Höchste Schutzklasse verarbeiteter Informationen?', feld: 'information.highestClassification', typ: 'auswahl',
        optionen: [o('public', 'öffentlich'), o('internal', 'intern'), o('confidential', 'vertraulich'), o('strictly_confidential', 'streng vertraulich')],
      },
      {
        id: 'INF-02', frage: 'Welche personenbezogenen Daten werden verarbeitet?', feld: 'information.personalData', typ: 'auswahl',
        optionen: [
          o('none', 'keine'),
          o('employees_only', 'nur Beschäftigtendaten'),
          o('customers', 'Kunden- / Interessentendaten'),
          o('large_scale', 'personenbezogene Daten in großem Umfang'),
        ],
      },
      {
        id: 'INF-03', frage: 'Werden besondere Kategorien personenbezogener Daten (Art. 9 DSGVO) verarbeitet?',
        feld: 'information.specialCategoryData', typ: 'auswahl',
        optionen: [o('none', 'nein'), o('limited', 'ja, begrenzt'), o('large_scale', 'ja, in großem Umfang')],
        hinweis: 'Grundlage: BIB-DSGVO-09.',
      },
      { id: 'INF-04', frage: 'Gibt es schützenswerte Geschäftsgeheimnisse?', feld: 'information.tradeSecrets', typ: 'janein', optionen: JA_NEIN },
      { id: 'INF-05', frage: 'Gibt es schützenswertes geistiges Eigentum (IP)?', feld: 'information.intellectualProperty', typ: 'janein', optionen: JA_NEIN },
      {
        id: 'INF-06', frage: 'Werden vertrauliche Informationen im Auftrag von Kunden verarbeitet?',
        feld: 'information.processesCustomerConfidentialData', typ: 'janein', optionen: JA_NEIN,
      },
    ],
  },
  {
    titel: 'Business Criticality',
    fragen: [
      { id: 'KRI-01', frage: 'Wie viele kritische Geschäftsprozesse gibt es?', feld: 'businessCriticality.criticalProcesses', typ: 'zahl' },
      {
        id: 'KRI-02', frage: 'Maximal tolerierbare Ausfallzeit der kritischsten Prozesse?', feld: 'businessCriticality.maxTolerableDowntime', typ: 'auswahl',
        optionen: [o('weeks', 'Wochen'), o('days', 'mehrere Tage'), o('one_day', 'ein Tag'), o('hours', 'Stunden'), o('minutes', 'Minuten')],
      },
      {
        id: 'KRI-03', frage: 'Finanzielle Auswirkung eines schweren Vorfalls?', feld: 'businessCriticality.financialImpact', typ: 'auswahl',
        optionen: [o('low', 'gering'), o('moderate', 'moderat'), o('high', 'hoch'), o('existential', 'existenzbedrohend')],
      },
      {
        id: 'KRI-04', frage: 'Wie stark hängen Kunden von den Leistungen ab?', feld: 'businessCriticality.customerDependency', typ: 'auswahl',
        optionen: [o('low', 'gering'), o('moderate', 'moderat'), o('high', 'hoch')],
      },
      {
        id: 'KRI-05', frage: 'Gesellschaftliche Auswirkungen eines Ausfalls?', feld: 'businessCriticality.societalImpact', typ: 'auswahl',
        optionen: [o('none', 'keine'), o('local', 'lokal'), o('regional', 'regional'), o('national', 'national')],
      },
    ],
  },
  {
    titel: 'Regulation',
    fragen: [
      {
        id: 'REG-01', frage: 'Status ISO/IEC 27001?', feld: 'regulation.iso27001', typ: 'auswahl',
        optionen: [o('none', 'kein Bezug'), o('aligned', 'Orientierung an der Norm'), o('certification_target', 'Zertifizierung angestrebt'), o('certified', 'zertifiziert')],
      },
      {
        id: 'REG-02', frage: 'Ergebnis der NIS2-/BSIG-Betroffenheitsprüfung?', feld: 'regulation.nis2', typ: 'auswahl',
        optionen: [
          o('not_affected', 'nicht betroffen'),
          o('unclear', 'ungeklärt'),
          o('important_entity', 'wichtige Einrichtung'),
          o('essential_entity', 'besonders wichtige Einrichtung'),
        ],
        hinweis: 'Nicht raten: Wird über eine Entscheidung festgelegt (Vorprüfung mit `npm run isms -- einstufung`). Grundlage: BIB-BSIG-28.',
      },
      {
        id: 'REG-03', frage: 'Ist die Organisation Betreiber einer kritischen Anlage (KRITIS)?', feld: 'regulation.kritis', typ: 'janein', optionen: JA_NEIN,
        hinweis: 'Betreiber kritischer Anlagen gelten als besonders wichtige Einrichtungen (§ 28 Abs. 1 Nr. 1 BSIG).',
      },
      {
        id: 'REG-04', frage: 'Datenschutzpflichten?', feld: 'regulation.dataProtection', typ: 'auswahl',
        optionen: [o('basic', 'DSGVO-Grundpflichten'), o('extended', 'erweitert (z. B. DSB-Pflicht, DSFA-pflichtige Verarbeitungen)')],
        hinweis: 'Grundlage: BIB-DSB, BIB-DSGVO-09.',
      },
      {
        id: 'REG-05', frage: 'Welche branchenspezifischen Vorgaben gelten zusätzlich?', feld: 'regulation.sectorRegulation', typ: 'mehrfach',
        optionen: [
          o('finanz_dora', 'Finanzsektor (DORA)'),
          o('automobil_tisax', 'Automobilindustrie (TISAX)'),
          o('gesundheit', 'Gesundheitswesen'),
          o('energie', 'Energiewirtschaft'),
          o('telekommunikation', 'Telekommunikation'),
          o('sonstige', 'sonstige (in der Quelle benennen)'),
          o('keine', 'keine'),
        ],
        hinweis: 'Vorgaben, die noch nicht in der Bibliothek erfasst sind, erzeugen eine Entscheidung vom Typ wissen.',
      },
      {
        id: 'REG-06', frage: 'Welche Sicherheitsanforderungen stellen Kunden?', feld: 'regulation.customerRequirements', typ: 'auswahl',
        optionen: [o('none', 'keine'), o('questionnaires', 'Fragebögen'), o('contractual_controls', 'vertraglich geforderte Maßnahmen'), o('customer_audits', 'Kundenaudits')],
      },
    ],
  },
  {
    titel: 'Threat Exposure',
    fragen: [
      {
        id: 'BED-01', frage: 'Was ist aus dem Internet erreichbar?', feld: 'threatExposure.internetExposure', typ: 'auswahl',
        optionen: [o('none', 'nichts'), o('website', 'Webseite'), o('services', 'Dienste / Portale / Schnittstellen'), o('core_business_online', 'das Kerngeschäft')],
      },
      {
        id: 'BED-02', frage: 'Gibt es privilegierten Zugriff auf Systeme von Kunden?', feld: 'threatExposure.privilegedAccess', typ: 'auswahl',
        optionen: [o('internal_only', 'nein, nur eigene Systeme'), o('customer_systems', 'ja, auf Kundensysteme')],
      },
      {
        id: 'BED-03', frage: 'Wer greift aus der Ferne zu?', feld: 'threatExposure.remoteAccess', typ: 'auswahl',
        optionen: [o('none', 'niemand'), o('employees', 'Beschäftigte'), o('third_parties', 'auch Dritte (z. B. Fernwartung)')],
      },
      {
        id: 'BED-04', frage: 'Wie attraktiv ist die Organisation als Angriffsziel?', feld: 'threatExposure.targetAttractiveness', typ: 'auswahl',
        optionen: [o('low', 'gering'), o('elevated', 'erhöht'), o('high', 'hoch / bekannte Zielgruppe')],
      },
      {
        id: 'BED-05', frage: 'Wie stark ist die Abhängigkeit von der Lieferkette?', feld: 'threatExposure.supplyChainDependency', typ: 'auswahl',
        optionen: [o('low', 'gering'), o('moderate', 'moderat'), o('high', 'hoch')],
      },
    ],
  },
  {
    titel: 'Third Parties',
    fragen: [
      { id: 'DRI-01', frage: 'Wie viele kritische Lieferanten gibt es?', feld: 'thirdParties.criticalSuppliers', typ: 'zahl' },
      { id: 'DRI-02', frage: 'Wie viele Cloud Provider werden genutzt?', feld: 'thirdParties.cloudProviders', typ: 'zahl' },
      {
        id: 'DRI-03', frage: 'Umfang des Outsourcings?', feld: 'thirdParties.outsourcing', typ: 'auswahl',
        optionen: [o('none', 'keines'), o('partial', 'teilweise'), o('extensive', 'umfangreich')],
      },
      { id: 'DRI-04', frage: 'Werden Managed Services genutzt?', feld: 'thirdParties.managedServices', typ: 'janein', optionen: JA_NEIN },
      { id: 'DRI-05', frage: 'Werden Entwicklungsdienstleister eingesetzt?', feld: 'thirdParties.developmentProviders', typ: 'janein', optionen: JA_NEIN },
    ],
  },
  {
    titel: 'AI',
    fragen: [
      {
        id: 'KI-01', frage: 'Welche KI-Systeme werden eingesetzt?', feld: 'ai.aiSystems', typ: 'auswahl',
        optionen: [o('none', 'keine'), o('productivity_tools', 'Produktivitätswerkzeuge'), o('integrated', 'in Produkte / Prozesse integriert'), o('own_models', 'eigene Modelle')],
      },
      { id: 'KI-02', frage: 'Gibt es kritische KI-Use-Cases?', feld: 'ai.criticalUseCases', typ: 'janein', optionen: JA_NEIN },
      { id: 'KI-03', frage: 'Werden personenbezogene Daten in KI-Systemen verarbeitet?', feld: 'ai.personalDataInAi', typ: 'janein', optionen: JA_NEIN },
      { id: 'KI-04', frage: 'Trifft KI automatisierte Entscheidungen über Personen?', feld: 'ai.automatedDecisions', typ: 'janein', optionen: JA_NEIN },
    ],
  },
  {
    titel: 'Cryptography',
    fragen: [
      { id: 'KRY-01', frage: 'Wird eine eigene PKI betrieben?', feld: 'cryptography.ownPki', typ: 'janein', optionen: JA_NEIN },
      {
        id: 'KRY-02', frage: 'Wie groß ist die Zertifikatslandschaft?', feld: 'cryptography.certificateLandscape', typ: 'auswahl',
        optionen: [o('small', 'klein'), o('medium', 'mittel'), o('large', 'groß')],
      },
      { id: 'KRY-03', frage: 'Werden Schlüssel selbst verwaltet?', feld: 'cryptography.ownKeyManagement', typ: 'janein', optionen: JA_NEIN },
      { id: 'KRY-04', frage: 'Gibt es eigene Kryptographie-Implementierungen?', feld: 'cryptography.ownCryptoImplementation', typ: 'janein', optionen: JA_NEIN },
      { id: 'KRY-05', frage: 'Werden KMS oder HSM eingesetzt?', feld: 'cryptography.kmsHsm', typ: 'janein', optionen: JA_NEIN },
      { id: 'KRY-06', frage: 'Bestehen hohe Vertraulichkeitsanforderungen?', feld: 'cryptography.highConfidentialityRequirements', typ: 'janein', optionen: JA_NEIN },
    ],
  },
  {
    titel: 'Existing Security Maturity',
    fragen: [
      {
        id: 'REI-01', frage: 'Gibt es bereits ein ISMS?', feld: 'existingMaturity.existingIsms', typ: 'auswahl',
        optionen: [o('none', 'nein'), o('partial', 'teilweise'), o('established', 'etabliert'), o('certified', 'zertifiziert')],
      },
      { id: 'REI-02', frage: 'Sind Sicherheitsrollen definiert?', feld: 'existingMaturity.definedRoles', typ: 'janein', optionen: JA_NEIN },
      { id: 'REI-03', frage: 'Gibt es Sicherheitsrichtlinien?', feld: 'existingMaturity.policies', typ: 'janein', optionen: JA_NEIN },
      { id: 'REI-04', frage: 'Sind Prozesse dokumentiert?', feld: 'existingMaturity.documentedProcesses', typ: 'janein', optionen: JA_NEIN },
      { id: 'REI-05', frage: 'Gibt es ein Risikomanagement?', feld: 'existingMaturity.riskManagement', typ: 'janein', optionen: JA_NEIN },
      { id: 'REI-06', frage: 'Gibt es Audits?', feld: 'existingMaturity.audit', typ: 'janein', optionen: JA_NEIN },
      { id: 'REI-07', frage: 'Gibt es Sicherheitsmonitoring?', feld: 'existingMaturity.monitoring', typ: 'janein', optionen: JA_NEIN },
      {
        id: 'REI-08', frage: 'Ausstattung mit Security Tools?', feld: 'existingMaturity.securityTools', typ: 'auswahl',
        optionen: [o('basic', 'Basis'), o('standard', 'Standard'), o('advanced', 'fortgeschritten')],
      },
    ],
  },
];

export const ALLE_FRAGEN: Frage[] = KATALOG.flatMap((a) => a.fragen);

/**
 * Kurzform für das Third-Party Pre-Assessment (ENT-008, Option 1, freigegeben 2026-11-12):
 * verkürzte Teilmenge dieses Katalogs. Enthalten sind die Angaben für die NIS2-Vorprüfung
 * (Stammdaten), für die Untergrenzen F1–F8 und für die vier Kerndimensionen der Exposure
 * (Information, Geschäftskritikalität, Bedrohung, Regulierung) sowie Lieferkette und KI.
 * Nicht gestellte Fragen gelten als offen; ob sie für das Profil wesentlich sind, zeigt die
 * Einstufung mit Teilfakten (ENT-033) – dann werden sie gezielt nachgefragt.
 */
export const KURZFORM_DRITTPARTEI: readonly string[] = [
  'STA-01', 'STA-02', 'STA-03', 'STA-04', 'STA-05', 'STA-06', 'STA-07', 'STA-08',
  'ORG-01', 'TEC-05', 'TEC-06',
  'INF-01', 'INF-02', 'INF-03', 'INF-06',
  'KRI-01', 'KRI-02', 'KRI-03', 'KRI-04', 'KRI-05',
  'REG-01', 'REG-02', 'REG-03', 'REG-05', 'REG-06',
  'BED-01', 'BED-02', 'BED-03', 'BED-04', 'BED-05',
  'DRI-03', 'KI-01',
];

export type FragebogenVariante = 'voll' | 'drittpartei';
export const frageById = (id: string): Frage | undefined => ALLE_FRAGEN.find((f) => f.id === id);
