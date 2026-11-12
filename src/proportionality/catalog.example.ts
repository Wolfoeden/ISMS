/**
 * Beispielkatalog: zeigt das Muster "ein Control, vier Umsetzungstiefen".
 * Kein vollständiger Annex-A-Katalog.
 */
import type { ControlDefinition } from './controls.js';

export const ACCESS_REVIEW: ControlDefinition = {
  id: 'ACC-REV',
  title: 'Access Review',
  requirementRefs: ['ISO 27001:2022 A.5.18', 'ISO 27001:2022 A.8.2', 'NIS2 Art. 21(2)(i)'],
  depthDrivers: [
    {
      when: ({ facts }) => facts.threatExposure.privilegedAccess === 'customer_systems',
      minDepth: 3,
      reason: 'privilegierter Zugriff auf Kundensysteme',
    },
    {
      when: ({ ratings }) => ratings.threatExposure.level === 4,
      minDepth: 4,
      reason: 'sehr hohe Bedrohungsexposition',
    },
  ],
  depths: {
    1: {
      practice: 'Owner überprüft Zugriffe und dokumentiert das Ergebnis.',
      frequency: 'halbjährlich',
      evidence: ['Kurzprotokoll mit Datum und Ergebnis'],
      roles: ['Control Owner'],
      fourEyes: false,
    },
    2: {
      practice: 'Strukturierter Review anhand Benutzerliste je kritischem System; Abweichungen werden als Aufgabe verfolgt.',
      frequency: 'halbjährlich, privilegierte Konten quartalsweise',
      evidence: ['Benutzerliste je System', 'Review-Protokoll', 'Ticket je Abweichung'],
      roles: ['Control Owner', 'System Owner'],
      fourEyes: false,
    },
    3: {
      practice: 'Review je System durch System Owner auf Basis eines IAM-Exports; Ergebnis durch zweite Person bestätigt.',
      frequency: 'quartalsweise, privilegierte Konten monatlich',
      evidence: ['IAM-Export mit Zeitstempel', 'Review-Entscheidung je Konto', 'Bestätigung Reviewer', 'Nachweis Entzug'],
      roles: ['Control Owner', 'System Owner', 'Reviewer'],
      fourEyes: true,
    },
    4: {
      practice: 'Formalisierter Access Review mit System Owner, IAM-Export, Reviewer, Vier-Augen-Prüfung, Finding Workflow und Evidence.',
      frequency: 'quartalsweise, privilegierte Konten monatlich, zusätzlich anlassbezogen',
      evidence: ['IAM-Export (unveränderbar abgelegt)', 'Review-Entscheidung je Konto', 'Vier-Augen-Freigabe', 'Findings mit Fristen', 'Nachweis Entzug', 'Wirksamkeitskennzahlen'],
      roles: ['Control Owner', 'System Owner', 'Reviewer', 'Approver'],
      fourEyes: true,
    },
  },
};

export const SECURE_DEVELOPMENT: ControlDefinition = {
  id: 'SDLC',
  title: 'Secure Development Lifecycle',
  requirementRefs: ['ISO 27001:2022 A.8.25', 'ISO 27001:2022 A.8.28', 'NIS2 Art. 21(2)(e)'],
  applicability: {
    when: ({ facts }) => facts.technology.ownSoftwareDevelopment !== 'none',
    notApplicableReason: 'Keine eigene Softwareentwicklung im Scope.',
  },
  depthDrivers: [
    {
      when: ({ facts }) => facts.technology.ownSoftwareDevelopment === 'security_relevant_product',
      minDepth: 3,
      reason: 'Entwicklung sicherheitsrelevanter Software',
    },
  ],
  depths: {
    1: { practice: 'Abhängigkeiten aktuell halten, Secrets nicht im Code, Code-Hosting mit MFA.', frequency: 'laufend', evidence: ['Repository-Einstellungen', 'Dependency-Update-Nachweis'], roles: ['Entwickler'], fourEyes: false },
    2: { practice: 'Definierte Secure-Coding-Regeln, automatisierte Dependency- und Secret-Scans in der Pipeline.', frequency: 'je Build', evidence: ['Richtlinie', 'Pipeline-Konfiguration', 'Scan-Ergebnisse'], roles: ['Entwicklungsleitung'], fourEyes: false },
    3: { practice: 'Threat Modeling für relevante Änderungen, verpflichtender Code Review, SAST/DAST, Schwachstellenbehandlung mit SLAs.', frequency: 'je Release', evidence: ['Threat Models', 'Review-Nachweise', 'Scan-Reports', 'Schwachstellen-SLA-Reporting'], roles: ['Entwicklungsleitung', 'Reviewer'], fourEyes: true },
    4: { practice: 'Wie Tiefe 3, zusätzlich unabhängige Penetrationstests, Release-Freigabe durch Security, SBOM und Coordinated Vulnerability Disclosure.', frequency: 'je Release, Pentest jährlich', evidence: ['Pentest-Berichte', 'Release-Freigaben', 'SBOM', 'CVD-Prozess'], roles: ['Entwicklungsleitung', 'Security', 'Approver'], fourEyes: true },
  },
};

export const OT_SEGMENTATION: ControlDefinition = {
  id: 'OT-SEG',
  title: 'Segmentierung OT / IT',
  requirementRefs: ['ISO 27001:2022 A.8.22', 'IEC 62443-3-2', 'NIS2 Art. 21(2)(a)'],
  applicability: {
    when: ({ facts }) => facts.technology.ot,
    notApplicableReason: 'Keine OT / Produktionsanlagen im Scope.',
  },
  depthDrivers: [
    { when: ({ ratings }) => ratings.businessCriticality.level >= 3, minDepth: 3, reason: 'hohe Geschäftskritikalität der Produktion' },
  ],
  depths: {
    1: { practice: 'OT-Netz logisch vom Büronetz getrennt.', frequency: 'jährliche Prüfung', evidence: ['Netzplan'], roles: ['Control Owner'], fourEyes: false },
    2: { practice: 'Zonen und Übergänge dokumentiert, Firewall-Regeln restriktiv.', frequency: 'halbjährliche Prüfung', evidence: ['Zonenmodell', 'Regelwerk'], roles: ['Control Owner', 'OT-Verantwortlicher'], fourEyes: false },
    3: { practice: 'Zonen/Conduits nach IEC 62443, kontrollierter Fernwartungszugang, Regel-Review mit zweiter Person.', frequency: 'quartalsweises Regel-Review', evidence: ['Zonen-/Conduit-Modell', 'Regel-Review-Protokolle', 'Fernwartungsprotokolle'], roles: ['Control Owner', 'OT-Verantwortlicher', 'Reviewer'], fourEyes: true },
    4: { practice: 'Wie Tiefe 3, zusätzlich Anomalieerkennung im OT-Netz und regelmäßige unabhängige Überprüfung.', frequency: 'kontinuierlich, unabhängige Prüfung jährlich', evidence: ['Monitoring-Nachweise', 'Prüfberichte'], roles: ['Control Owner', 'OT-Verantwortlicher', 'Reviewer', 'Approver'], fourEyes: true },
  },
};

export const KEY_MANAGEMENT: ControlDefinition = {
  id: 'CRY-KEY',
  title: 'Kryptographie & Schlüsselmanagement',
  requirementRefs: ['ISO 27001:2022 A.8.24', 'NIS2 Art. 21(2)(h)'],
  depthDrivers: [
    { when: ({ facts }) => facts.cryptography.ownPki || facts.cryptography.kmsHsm, minDepth: 3, reason: 'eigene PKI bzw. KMS/HSM' },
    { when: ({ facts }) => facts.cryptography.ownCryptoImplementation, minDepth: 4, reason: 'eigene Kryptographie-Implementierung' },
  ],
  depths: {
    1: { practice: 'Verschlüsselung über Standarddienste (TLS, Festplattenverschlüsselung), Zertifikate mit automatischer Erneuerung.', frequency: 'jährliche Prüfung', evidence: ['Konfigurationsnachweis'], roles: ['Control Owner'], fourEyes: false },
    2: { practice: 'Kryptorichtlinie mit zulässigen Verfahren, Zertifikatsinventar mit Ablaufüberwachung.', frequency: 'halbjährlich', evidence: ['Richtlinie', 'Zertifikatsinventar'], roles: ['Control Owner'], fourEyes: false },
    3: { practice: 'Schlüssellebenszyklus definiert (Erzeugung, Rotation, Widerruf), Rollentrennung bei Schlüsselzugriff.', frequency: 'quartalsweise', evidence: ['Schlüsselinventar', 'Rotationsnachweise', 'Zugriffsprotokolle KMS/HSM'], roles: ['Control Owner', 'Key Custodian', 'Reviewer'], fourEyes: true },
    4: { practice: 'Wie Tiefe 3, zusätzlich Krypto-Agilitätsplanung und unabhängige Prüfung eigener Implementierungen.', frequency: 'laufend, unabhängige Prüfung je Major Release', evidence: ['Krypto-Inventar (CBOM)', 'Prüfberichte'], roles: ['Control Owner', 'Key Custodian', 'Reviewer', 'Approver'], fourEyes: true },
  },
};

export const EXAMPLE_CATALOG: ControlDefinition[] = [ACCESS_REVIEW, SECURE_DEVELOPMENT, OT_SEGMENTATION, KEY_MANAGEMENT];
