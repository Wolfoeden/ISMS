# 02 – Fachkonzept, Zustandsmodell, Datenmodell und Decision Architecture

**Version 1.0 | 12.11.2026 | Regel- und Prozessarchitektur fuer Claude**

## 1. Fachlicher Architekturschnitt

```text
PUBLIC/INBOUND DISCOVERY     INTERNAL ASSESSMENT DELIVERY
         |                              |
  DiscoveryRun                  AssessmentCase
     |  0..n                          | 1..n
     v                               v
 Candidate / Intake ---> Opportunity ---> Mandate ---> AssessmentExecution
                                                |         |
                                                |         +--> Review / Report
                                                +--> Scope / Frameworks / Evidence

UX: Customer Portal + Consultant Workspace + QA Console
Orchestrierung: BPMN (langlaufende Phasen, Fristen, Freigaben)
Entscheidungen: versionierte DMN/Rules (Anwendbarkeit, Materialitaet, Routing)
AI: extrahiert, analysiert, formuliert VORSCHLAEGE mit belegbaren Quellen
Datenkern: Mandant, Cases, Requirement Graph, Evidence Store, Audit Trail
```

**Designentscheidung:** Keine „ein Produkt = ein Prozess“-Architektur. Allgemeine Assessment-Prozeduren sind wiederverwendbar; spezielle Rahmenwerke liefern strukturierte Kriterien, Fragetypen, Kontrolltests und Review-Policies.

## 2. Prozesse und Grenzen

### P0 – Proaktive Discovery Run (getrennte BPMN-Prozessinstanz)

`None Start` (manueller oder Scheduler-gesteuerter Lauf; periodisch separat triggerbar) → Quellenberechtigung pruefen → Marktsignale rechtmaessig erfassen → Organisationen deduplizieren → 0..n Candidate-Messages/Opportunity-Datensaetze erzeugen → End.

**Keine automatische personenbezogene Kontaktaufnahme** ohne getrennten Outreach-Eligibility-Check und menschliche Freigabe. Drittanbieter-Website-Eintraege nicht als Nachweis von Sicherheitsluecken interpretieren.

### P1 – Opportunity-to-Assessment Case (je Vorgang eine Instanz)

Startvarianten: `Message Start: CandidateAccepted` oder `Message Start: InboundRequest`. Dann Eingangsprofil, bei Proaktivkontakt Qualification/Outreach/Antwort; bei Inbound unmittelbar Assessment Discovery; vorlaeufiges Screening/Scope; Angebot/Mandat; gesicherte Datenerhebung; regulatorische Zuordnung; Profil; Requirements; Assessment; Review; Freigabe; Report-Endzustand.

### P2 – Reusable Assessment Execution (Call Activity)

Wird per `assessment_type` und freigegebenem Scope parametrisiert und kann mehrere `AssessmentObject`s innerhalb eines Mandats bearbeiten. Ohne schriftlich definierte Methodik keine hochgestuften Assurance-Claims. Assessment-Instanzen besitzen unverwechselbare IDs und eigene Versionsstaende.

### P3 – Remediation / Continuous Assurance

Eigenstaendiger Folgeauftrag bzw. separates Modul; nicht Teil der allgemeinen Endebedingung „Assessment abgeschlossen“. Findings und Massnahmen koennen nach Projektende als lesbare Referenz verbleiben, sofern vereinbart.

## 3. Fachliche Entitaeten

| Objekt | Schluesselfelder | Beziehung / Besonderheit |
|---|---|---|
| `Tenant` | tenant_id, name, region, legal_entity | Mandantengrenze fuer Berechtigungen, Daten und Audit |
| `Organization` | organization_id, jurisdiction, sector, company_size_band | 1..n Legal Entities, Kontextdatum und Evidenzstatus |
| `Contact` | contact_id, role, channel, lawful_basis_ref, suppression_status | getrennte personenbezogene Kontaktverwaltung |
| `DiscoveryRun` | run_id, source_policy_version, source_refs, started_at | erzeugt 0..n Candidates |
| `IntakeCase` | intake_id, route=A/B, customer_goal, object_guess, phase | kann aus Inbound oder Candidate entstehen |
| `Candidate` | candidate_id, organization_id, signals[], source_references[] | keine pauschale Security-Bewertung |
| `Opportunity` | opportunity_id, intake_id, lead_id, stage, reason_codes | auch ohne Mandat abschliessbar |
| `Mandate` | mandate_id, customer_entity, contract_ref, services, data_authority, signed_at | 0..n Assessments, Freigabe fuer Datenrahmen |
| `AssessmentCase` | assessment_id, mandate_id, assessment_type, mode, status | 1..n Assessment Objects und Scope Versionen |
| `AssessmentObject` | object_id, type, name, owner, boundaries, dependency_refs[] | Unternehmen, Standort, KI, Produkt, Lieferant etc. |
| `AssessmentGoal` | goal_id, assurance_purpose, audience, deadline | Ziel und Empfaenger klar |
| `ScopeVersion` | scope_id, version, included, excluded, assumptions, approved_by | unveraenderliche genehmigte Fassung, Delta-Workflow |
| `RegulatoryDetermination` | decision_id, jurisdiction, framework_version, status, rationale, approver | separate von Assessment-Tiefe |
| `Framework` | framework_id, provider, version, effective_from, legal_status, license_policy | normativ vs. regulatorisch vs. vertraglich |
| `Requirement` | requirement_id, framework_id, local_ref, effective_date, applicability | n:m Beziehung zu Controls |
| `Control` | control_id, method_version, objective, implementation_owner, status | n:m Requirements und Evidence |
| `Evidence` | evidence_id, source, date, validity, classification, hash, tenant, version | Quelle, Besitz, Rechte, Provenienz |
| `EvidenceLink` | link_id, evidence_id, control_id, requirement_id?, use_context, reviewer | Mehrfachverwendung nur kontextuell valide |
| `ContextFact` | fact_id, value, scope, source, confidence, state, verified_by | Fakten haben Quellen und Status |
| `OpenQuestion` | question_id, materiality, owner, due, resolution_state | unknown vs. N/A strikt trennen |
| `AssessmentDecision` | decision_id, rule_version, inputs_hash, output, human_status | maschinelle und menschliche Entscheidung trennen |
| `Finding` | finding_id, criteria_ref, statement, evidence_links, severity, state | keine unbelegte Feststellung |
| `Risk` | risk_id, scenario, consequence, likelihood, criteria_version, risk_owner | nicht automatisch gleich Finding |
| `Action` | action_id, linked_finding, recommendation, owner?, priority, approval | Vorschlag != Managemententscheidung |
| `Review` | review_id, reviewer_id, scope_version, method, result, timestamp | SoD/Unabhaengigkeit |
| `ReportVersion` | report_id, approved_at, signatories, boundaries, evidence_snapshot | unveraenderlicher finaler Bericht |
| `AuditEvent` | event_id, entity_id, change, actor, reason, time, trace | append-only / nachvollziehbar |
| `Task` | task_id, case_id, role, priority, due_at, status, created_from | dynamische Fragelisten ausserhalb BPMN |

**Wichtige Datenbeziehungen:** `Requirement n:m Control`, `Control n:m Evidence`, `AssessmentCase 1:n ScopeVersion`, `AssessmentCase 1:n ReportVersion`, `Finding 1:n EvidenceLink`, `Organization 1:n AssessmentObject`. Der wiederverwendete Evidenzlink muss den **konkreten Bewertungsumfang** speichern; eine global verifizierte Datei ist kein globaler Erfuellungsnachweis.

## 4. Objektstatus und Transitionen

### 4.1 Opportunity

`new` → `screened` → `qualified` → `contact_approved` → `contacted` → `interested` → `proposal_sent` → `won`

Alternative Endzustaende: `disqualified`, `outreach_not_permitted`, `declined`, `no_response`, `offer_expired`, `withdrawn`.

Inbound muss nicht zuerst proaktiv kontaktiert werden. Ein Kunde kann von `new` direkt in `interested` bzw. Discovery wechseln. Ereignisse und ausloesende Entscheidung bleiben dokumentiert.

### 4.2 Mandate

`draft` → `offered` → `signed` → `active` → `closed`; Alternativen `rejected`, `expired`, `terminated`. Kein vertrauliches Assessment-Upload ohne erforderliche Rechts- und Freigabegrundlage. `draft` ist kein Mandat.

### 4.3 AssessmentCase

`intake` → `scope_draft` → `scope_approved` → `collecting_evidence` → `ready_for_assessment` → `assessing` → `internal_review` → `qa` → `approved` → `published` → `closed`.

Ausnahmen: `on_hold`, `waiting_customer`, `blocked_material_unknown`, `rework`, `cancelled`, `closed_with_limitations`.

**„Closed with limitations“ ist kein positives Compliance-Urteil.** Der Bericht nennt die nicht beurteilten Sachverhalte, Grenzen und betroffenen Kriterien. Materiale Unbekannte duerfen nicht per `N/A` beseitigt werden.

### 4.4 Artefaktstatus

`ai_proposed` → `in_review` → `verified` → `persisted_locked` → `superseded`.

Bei Ablehnung: `rejected_with_reason`. Bei Vertagung: `deferred_with_owner_impact_trigger`. Ein AI-Agent darf `persisted_locked` nicht stillschweigend aktualisieren.

## 5. Decision Architecture (DMN-/Rules-Katalog)

Die Regeln werden als versionierte, testbare Modelle gefuehrt. LLM-Ergebnisse sind **Input-Fakten mit Provenienz**, nicht die DMN-Engine.

| Decision ID | Input | Output | Wer verantwortet? |
|---|---|---|---|
| D-01 `IntakeClassifier` | Kundenanliegen, Objekt-Hypothese, Region | Ziel, Objekt-Typ-Kandidaten, offene Fragen | Kunde korrigiert, Lead bei Konflikt |
| D-02 `DiscoveryIndicator` | oeffentliche Marktsignale mit Quellen | Indikatorliste/kein Ansatz | Lead fuer Ansprache |
| D-03 `OutreachEligibility` | Kanal, Land, Einwilligung/andere Rechtsgrundlage, Opt-out | erlaubt / blockiert / legal review | Berechtigte Person + ggf. Legal |
| D-04 `FrameworkCandidates` | Objekt, Land, Branche, Rechtsform, Aktivitaet | Kandidaten + fehlende Fakten | Lead verifiziert, Spezialist bei Bedarf |
| D-05 `RegulatoryApplicability` | verifizierte Fakten, effektiver Rechtsstand | applicable / not_applicable / uncertain / review_required | autorisierter Experte |
| D-06 `MaterialityAndReadiness` | fehlende Fakten, Entscheidungsauswirkung | ready / conditional / blocked + reason | Lead nach Methodik |
| D-07 `AssessmentProfile` | Ziel, Objekt, Kritikalitaet, Verpflichtung, Kundenvertrag | Sampling, Tiefe, Review-Level | Lead und ggf. QA |
| D-08 `RequirementSelection` | verifizierter Scope, Frameworks, Versionen, Ausnahmen | anwendbares Criteria Set | Lead / Regulatory Expert |
| D-09 `EvidenceSufficiency` | Evidence, Alter, Zuordnung, Umfang | sufficient / insufficient / expired / unsupported | Lead/Assessor |
| D-10 `FindingSeverity` | Kriterien, Defizit, Auswirkung, Risiko-/Rating-Methodik | vorgeschlagene Severity | Lead verifiziert |
| D-11 `ReviewRequirement` | Assessment-Typ, Assurance, Konflikte, Abweichung nach unten | Reviewer-Level, SoD erforderlich? | QA Policy |
| D-12 `ReworkRouter` | offene QA-Punkte, Blocker, Artefaktfehler | Erhebung / Scope / Regulatorik / Requirements / Assessment / QA | Lead unter QA-Aufsicht |
| D-13 `CompletionCriteria` | Pflichtreviews, Scope, Evidence Coverage, Unbekannte, Freigaben | approve / limitations / rework / cancel | Q faellt letzte Freigabe |

### 5.1 Beispiel: Entscheidungsfaehigkeit

| Materialer fehlender Fakt? | Beweisniveau ausreichend? | Alle Pflichtentscheidungen verifiziert? | Ergebnis |
|---|---|---|---|
| nein | ja | ja | `ready` |
| ja | beliebig | beliebig | `blocked` oder explizite Scope-/Limitation-Entscheidung |
| nein | nein | beliebig | `clarify` |
| nein | ja | nein | `human_review` |

`unknown` ist ein Faktenstatus und keine automatisch akzeptierte Entscheidungsregel. `not_applicable` bedarf eigenstaendiger fachlicher Begruendung.

### 5.2 Beispiel: Assurance und Bearbeitungsmodus getrennt

| Bearbeitungsmodus | Typische Bearbeitung | Berichtsaussage |
|---|---|---|
| Digital / Self | Kunde erfasst, AI unterstuetzt | nur indikativ / nicht unabhaengig verifiziert |
| Assisted | Kunde + Analyst/Lead + AI | pruefbasierter Beratungsbericht nach vereinbarter Methodik |
| Managed | DT Agency plant/erhebt/prueft + Kunde liefert Evidenz | professionelles Assessment; Unabhaengigkeit nur nach tatsaechlicher Governance |

Das „Abo“ oder „Preispaket“ darf **nicht** die Rechtsanforderungen oder das erforderliche Evidenzniveau heruntersetzen. Ein Upgrade von Self auf Managed kann Nachpruefung und zusaetzliche Evidenz erfordern.

## 6. Normen- und Rechtsrahmen

### 6.1 Fachliche Ebenen

1. **Rechtsnormen** (z. B. deutsches BSIG zur NIS2-Umsetzung, EU AI Act, CRA, EASA) mit Rechtsraum, anwendbarem Adressat, Gueltigkeit und Pflichten.
2. **Normen/Standards** (z. B. ISO/IEC 27001 / ISO/IEC 42001) mit Geltungsumfang und Vertrags-/Zertifizierungsbezug.
3. **Vertragliche Anforderungen** (z. B. Kundenvorgaben fuer Lieferanten).
4. **Empfehlungen/Best Practices** (z. B. technische Sicherheitsmassnahmen, die nicht selbst automatisch Rechtspflichten sind).

Die Plattform muss diese Quellenarten sprachlich und technisch getrennt halten. `applicable=true` fuer eine Norm ist nicht zwingend `legally_required=true`.

### 6.2 Stand und Versionierung (Stand 12.11.2026)

- NIS2-Umsetzung in Deutschland: Seit **06.12.2025** gilt das neue BSIG; entscheidend sind seine konkreten Adressaten-/Scope-Regeln, nicht allein die EU-Richtlinie. Quelle: https://mip2.bsi.bund.de/de/info-nis2-registrierung/
- CRA: Berichtspflichten seit **11.09.2026**, wesentliche weitere Anforderungen ab **11.12.2027**. Quelle: https://digital-strategy.ec.europa.eu/en/policies/cra-reporting
- AI Act: Konsolidierte Rechtslage nach Aenderung 2026; fuer bestimmte Hochrisikokategorien Daten **02.12.2027** bzw. **02.08.2028**. Quelle: https://eur-lex.europa.eu/eli/reg/2024/1689
- EASA Part-IS: differenzierte Organisationstypen und Rechtsakte; 2022/1645 und 2023/203 plus Aenderungen, zu pruefender Part-IS-Unterteil je Genehmigungsart. Quelle: https://www.easa.europa.eu/en/regulations/information-security

Rechtsdaten immer versionieren und vor Ausgabe hochrelevanter Einschraenkungen von einem fachlich Verantwortlichen verifizieren lassen. Diese Auflistung ist **kein** regulatorischer Entscheidungskatalog.

## 7. Governance und Berechtigungsmodell

### 7.1 Matrix (R=bearbeitet, V=fachlich verifiziert, F=freigegeben, I=informiert)

| Aktivitaet | Kunde | Agent | Junior | Lead | QA/Reviewer | Methodikadmin |
|---|---|---|---|---|---|---|
| Anliegen beschreiben | R | Vorschlag | I | V bei Bedarf | – | – |
| Oeffentliche Discovery | – | R (nur erlaubt) | I | F Outreach | – | Regelpflege |
| Scope verifizieren | bestaetigt Gegenstand | Entwurf | R Vorbereitung | **V/F** | kritische Abweichungen | – |
| Regulatorische Einstufung | liefert Fakten | Vorschlag | R Recherche | **V** (ggf. Legal) | kritische Profile | Regelpflege |
| Evidenz strukturieren | liefert | Vorschlag | R | V | Stichprobe | – |
| Findings bewerten | Sachfragen | Vorschlag | R Entwurf | **V** | **Review** | – |
| Report freigeben | erhaelt | erstellt Entwurf | – | F entsprechend Policy | **F/SoD** | – |

Autorisierung wird pro `assessment_type`, `framework`, `assurance_profile` und Interessenkonflikt geprueft, nicht bloss nach Jobtitel.

### 7.2 AI-Schutzregeln

- Jeden Vorschlag mit Quellenreferenz, Prompt-/Modellversion, Zeitbezug, Scope und Unsicherheiten dokumentieren.
- Uploads und Webtexte sind **untrusted input**: Prompt Injection, Datenexfiltration, Script-Inhalte und versteckte Befehle duerfen keine Systemrechte erlangen.
- Kein Agent darf eigenstaendig externe E-Mails ohne Freigabe senden, regulatorische Entscheidungen finalisieren oder Berichte publizieren.
- LLM-Confidence ist kein Beweis fuer Richtigkeit; fehlende Evidenz niemals halluzinieren.
- Automatische Empfehlungen duerfen keine irreversiblen Statuswechsel an verifizierten Objekten vornehmen.
- Wiederholbare DMN-Entscheidungen durch deterministische Inputs/Versionen pruefen; Agent-Vorschlaege getrennt speichern.

### 7.3 Security, Privacy und Lizenzierung

- Physische und logische Tenant-Isolation; mandatsbezogenes RBAC/ABAC (Least Privilege), optionale EU-Datenhaltung, Logging, MFA.
- AVV und Provider-Pruefung je Verarbeitungsmodell; bei KI-APIs Datenfreigabe, Retention und Training-Nutzung vorab klaeren.
- Sensible Security-Evidenz verschluesseln; Zugriff/Export protokollieren; Aufbewahrungs- und Loeschregeln je Mandat/Verpflichtung.
- Datenschutzfolgenabschaetzung pruefen, wenn risikoreiche Verarbeitungen vorliegen; Vertriebsdaten getrennt von vertraulichen Kundendaten.
- Discovery: Quellen-/Nutzungsbedingungen, personenbezogene Daten, Legitimität, Informationspflichten, UWG-/Kanalregeln, Suppression und Widerspruch pruefen.
- Geschuetzte Normtexte nicht ohne gepruefte Lizenz in kommerzielle KI-/Such-/Trainingssysteme uebernehmen.
- Keine technischen Penetrationstests, Scans, Logins oder produktiven Systemzugriffe ohne ausdrueckliche Berechtigung und Scope.

## 8. Prozessfehler und Ausnahmefaelle

| Ereignis | Vorgesehene Behandlung |
|---|---|
| Kandidat ohne zulaessigen Kontaktweg | `outreach_not_permitted`; nur rechtlich zulaessige Minimaldaten/Suppression speichern |
| Kein Kundenfeedback | Event-Based Gateway + Timer → `no_response` |
| Kunde bestreitet Interesse oder widerruft Kontakt | `declined` + Suppression/Privacy-Folgepruefung |
| Angebot ungezeichnet | Event-Based Gateway + Timer/Absage/Aenderung → `expired` oder neue Scope-Version |
| Kunde liefert Evidence nicht | Reminder/Eskalation, Wartefrist, materiality-gesteuerter Abschluss/Abbruch |
| Regelwerksanwendbarkeit unklar | `uncertain`, Expert Review, keine definitive Pflichtbehauptung |
| Materiale Information unbekannt | `blocked` bzw. explizites Limited Assurance mit begruendetem Scope |
| Scope erweitert | schriftlicher Change Request, Aufwands-/Vertragspruefung, neue Scope-Version |
| KI-Befund widerspruechlich | Reviewpflicht und verknuepfte Quellenbewertung |
| Reviewer ist zugleich Autor | SoD-Policy, Ersatzreviewer oder reduzierter Assurance-Claim |
| Aenderung des Regelwerks waehrend Assessment | Version-Pin + Impact Evaluation + Change Decision |
| Kritischer Security-Fund | gesicherte Eskalation, optional separater Incident-/Disclosure-Prozess, kein blindes Publizieren |
| AI-/API-Ausfall | Wiederholung mit Idempotenz, Queue / manueller Fallback, Incident Log |
| Kunde storniert | Cancellation Workflow mit Abschluss-/Loesch-/Aufbewahrungsentscheidung |

## 9. Technikprinzipien fuer spaetere BPMN-Ausfuehrung

- BPMN-Business-Keys: `discoveryRunId`, `intakeId`, `opportunityId`, `mandateId`, `assessmentId`; Message-Correlation auf unverwechselbarem externem Token plus Tenant-ID.
- **Idempotenz:** Discovery-Publishing, Mandatsanlage, Evidence-Import und Report-Publikation muessen bei Retry mehrfachen Aufruf sicher abfangen.
- L0 ist `isExecutable=false`, damit **keine** falsche produktionsfaehige Engine-Konfiguration suggeriert wird.
- Level 1: echte Service Contracts, Fachformulare, Message Schemas, DMN-IDs, Timer, Boundary Error, Retries, Dead Letter/Manual Override und dynamische Task-Erzeugung.
- Nicht jede einzelne Frage als BPMN-Task modellieren. BPMN verwaltet die globalen Freigaben und verbindlichen Phasen; der Question-/Task-Service die variable Erhebung.
- Fachregeln sollen vor Implementierung gegen mindestens die Negativ- und Grenzfaelle aus Dokument 04 getestet werden.

## 10. Empfohlene Prozess-Level

- **L0:** BPMN Collaboration der Teilnehmer Kunde (Blackbox), Discovery Run, Agency Case sowie Assessment Call Activity. Fokus: End-to-End-Zustaende und Uebergaben.
- **L1:** P0 Discovery; P1 Intake/Opportunity/Contracting; P2 Setup/Scope/Regulatory; P3 Evidence & Assessment; P4 Review & Release.
- **L2:** Executable BPMN/DMN/Form-/API-Vertraege je Modul inklusive Timern, Message-Korrelation, SoD, Fehlerbehandlung, Testfaellen.
