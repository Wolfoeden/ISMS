# MVP Technical Plan – Thin Vertical Slice

| | |
|---|---|
| Stand | 2026-11-12 · nach `05_CLAUDE_HANDOFF.md` §8 Nr. 3 |
| MVP | 3PA Einzelunternehmer + Softwareprodukt (ADR-009, DEC-03), Inbound only (DEC-09) |
| Slice | `Inbound → Discovery → Scope → Mandat → Evidence → AI Proposal → Human Verification → Review → Report` |
| Voraussetzung | Gate 0 (04 §5): ENT-029, ENT-030, ENT-035, ENT-036 freigegeben; ENT-032 Option 1 (Engine später) – siehe [`DECISION_LOG.md`](DECISION_LOG.md) |

## 1. Ausgangslage

Vorhanden und getestet: Domänenkern (`src/`), PostgreSQL-Schema mit RLS-Muster, Freigabe-, Evidenz-, Risiko-, Maßnahmen- und Finding-Logik (`db/migrations/0001`, `0002`), Formulierungs- und Ergebnisprüfung, quellengeprüfte Rechtsbibliothek. Nicht vorhanden: Anwendung, Authentifizierung, Datei-Speicher, AI-Dienst, Workflow, UI.

**Strategie:** Den Domänenkern weiterverwenden – er ist die einzige Stelle, an der Fachregeln stehen (Arbeitssystem und Plattform rechnen identisch). Die Plattform kommt als dünne Schicht darüber; keine Vollmigration, kein Engine-Bau vor L1.

## 2. Technologie (ENT-032: Option 1, freigegeben 2026-11-12)

**Entschieden:** Regeln bleiben versionierter, getesteter Code im Domänenkern; BPMN bleibt L0/L1-Dokumentation. Die Auswahl von Engine, DMN-Werkzeug und Betriebsplattform wird **erneut vorgelegt, wenn das MVP stabil läuft**. Bis dahin läuft das MVP lokal bzw. in einer Testumgebung gegen PostgreSQL wie in `db/test.sh`; eine Hosting-Entscheidung ist spätestens vor dem ersten realen Testmandat (Gate 2) nötig. Optionen zur Vorlage:

| Option | Inhalt | Für | Gegen |
|---|---|---|---|
| A | **PostgreSQL mit eingebauter Auth, RLS und Objektspeicher als verwalteter Dienst (z. B. Supabase, Region EU)** + TypeScript-Server (Domänenkern) + schlankes Web-UI | Schema und RLS sind bereits so gebaut; Auth inkl. MFA, Storage und EU-Region verfügbar; ein Konto ist vorhanden | Anbieterbindung; AVV und Subprozessoren prüfen (DEC-16); **eigenes Projekt nötig, keine Nutzung bestehender Projekte** |
| B | selbst betriebenes PostgreSQL + eigener Auth-Dienst + S3-kompatibler Speicher | volle Kontrolle | mehr Betriebs- und Sicherheitsaufwand vor dem Pilot |
| C | BPMN-Engine (Camunda/Flowable/Zeebe) von Beginn an | Prozesse ausführbar | widerspricht L0/L1-Stufung (02 §9, Handoff §5); hoher Aufwand vor Nutzen |

**Bisherige Empfehlung: A** für den Pilot, Workflow als serverseitige Zustandsmaschinen im Domänenkern (wie heute `findings.ts`), BPMN bleibt L0/L1-Dokumentation bis zur Engine-Entscheidung. AI-Anbieter austauschbar über eine Schnittstelle; kein Training mit Kundendaten, Opt-in je Mandat (DEC-16).

## 3. Arbeitspakete (04 §2) – Bestand und nächster Schritt

| WP | Inhalt | Bestand | Nächster Schritt | Tests |
|---|---|---|---|---|
| WP-00 | Inventur, Zielarchitektur | ✔ Gap-Analyse, dieses Dokument | – | – |
| WP-01 | Domain Schema, Tenants, Cases, Audit Events | ◐ Mandat, Rollen, RLS-Muster, append-only Log | Migration 0003: `tenant`, `intake_case`, `assessment_case`, `assessment_object`, `assessment_goal`, `scope_version`, `audit_event`; RLS auf **alle** Tabellen | TC-18, Cross-Tenant für jede Tabelle |
| WP-02 | Variante-C-Intake | ○ | Intake-Zustandsmaschine im Kern; `entryRoute`, Wechsel A↔B | TC-01, TC-02, US-A1 |
| WP-03 | Produkt-/Organisationsobjekt, adaptive Kernfragen | ◐ Triage-Katalog (65 Fragen) | Fragenpool mit Materialität, Kernfragen 3–7, Objektzweig „Softwareprodukt“; Einstufung mit Teilfakten (ENT-033) | US-A3 Ask once, TC-09 |
| WP-04 | Scope, Criteria, Modus, Assurance getrennt | ◐ Prüftiefenprofil, Kriterien, Bewertungsachsen | `handling_mode`, `assurance_statement`, mehrere Objekte/Frameworks je Case, ScopeVersion gesperrt | TC-03, US-B1, US-B3 |
| WP-05 | Mandat mit Scope-Fixierung | ◐ Mandat, Profilentscheidung | Mandatsstatus nach 02 §4.2 (ENT-036); Upload erst bei `active`; **idempotente** Mandatsanlage | TC-07, TC-08, TC-19, TC-20 |
| WP-06 | Evidence Store, Provenienz, Deduplikation | ◐ Tabelle `evidence`, Prüfstufe, R1/R2 im Schema | Upload in verschlüsselten Speicher, Hash, Dedup über Hash; EvidenceLink mit Bewertungsumfang | TC-10, US-C1 |
| WP-07 | Question/Task Engine + Client Portal | ○ | Task-Service (nicht BPMN, 02 §9); Portal S05/S06 | „nur eigene Aufgaben“ |
| WP-08 | AI Proposals + Human Verification + Lock | ◐ Regeln (Agent nie freigebend), Statusmodell | Artefaktstatus 02 §4.4 als Tabelle; Proposal mit Quelle, Modell-/Promptversion, Unsicherheit; Lock verhindert Überschreiben | TC-11, TC-12, TC-21 |
| WP-09 | Assessment Workflow, Finding/Risk/Action | ✔ Tabellen und Regeln; berechneter Berichtsstatus | an Case/Objekt binden; D-09/D-10 als Regelverträge | US-C2 |
| WP-10 | Lead Review / QA / Report Release | ◐ SoD-Regeln, Freigabe-DoD, Formulierungsprüfung | `review`, `report_version` (gesperrt, Snapshot der Evidenz); QA-Ergebnisse nach 01 §4.3; Rework-Router D-12 | TC-13, TC-15, TC-16, US-D2 |
| WP-11 | E2E-Traceability, 10 Negativpfade | ◐ Werkzeug-E2E am fiktiven Mandat | API-E2E über den ganzen Slice | alle P0-Tests |

## 4. Regelverträge (Handoff §5: D-03, D-05, D-06, D-07, D-08, D-11, D-12, D-13 zuerst)

Jede Regel: `decision_id`, `version`, Ein-/Ausgabeschema, Testfälle inkl. Grenz- und Negativfälle; LLM-Ergebnisse nur als Eingabefakten mit Provenienz.

| Regel | Vorhanden | Lücke |
|---|---|---|
| D-03 OutreachEligibility | – | im MVP fest „blockiert“ (DEC-09); Inhalt nach ENT-034 |
| D-05 RegulatoryApplicability | § 28 BSIG-Vorprüfung ✔ (`src/regelwerk/nis2.ts`) | Ausgabe auf `applicable/not_applicable/uncertain/review_required` abbilden; CRA erst nach Bibliothekseintrag |
| D-06 MaterialityAndReadiness | – | Tabelle 02 §5.1 umsetzen |
| D-07 AssessmentProfile | Profilableitung ✔ (Policy 2026-11.1) | Ausgabe Sampling/Review-Level; Stufenzahl ENT-035 |
| D-08 RequirementSelection | Control-Resolver ✔ | an verifizierten Scope und Framework-Version binden |
| D-11 ReviewRequirement | Vier-Augen-/SoD-Regeln ✔ | als Vertrag mit Version kapseln; DEC-05: im MVP QA für jeden finalen Bericht |
| D-12 ReworkRouter | – | Zielphasen nach 02 D-12 |
| D-13 CompletionCriteria | Freigabe-DoD `isms.md` ✔ | auf Case/ReportVersion übertragen; `closed_with_limitations` |

## 5. Teststrategie – Stand der 22 Fachtests (04 §4)

| Test | heute | Plan |
|---|---|---|
| TC-12 AI-Overwrite | ◐ Regel „Agent gibt nie frei“ ✔ | Lock-Test auf `persisted_locked` |
| TC-13 QA SoD | ✔ Domänenkern (G6, Vier-Augen) | API-Test |
| TC-14 Kundenwiderspruch | ✔ Kundenreaktion `bestritten` → erneute Prüfung | API-Test |
| TC-16 Report limited | ◐ Freigabe-DoD, Pflicht „Einschränkungen“ | Endstatus `closed_with_limitations` |
| TC-17 Normenversion | ◐ Policy-Version an Einstufung | Version-Pin + Impact-Entscheidung |
| TC-18 Tenant Isolation | ✔ RLS-Test (Mandat, Finding) | für alle Tabellen + AI-Zugriffspfad |
| TC-22 3PA-Bezeichnung | ◐ Sperrliste („zertifiziert“, „konform“) | Angebotsdialog |
| TC-01–TC-11, TC-15, TC-19–TC-21 | ○ | mit WP-02 bis WP-10 |

Testdaten: nur fiktiv/anonymisiert (`07_BEISPIEL_CASES.json`, Fixtures). DB-Tests gegen echtes PostgreSQL (`db/test.sh`).

## 6. Reihenfolge

1. Gate 0: Entscheidungen ENT-029, ENT-030, ENT-032, ENT-035, ENT-036 (+ ENT-026 für Berichtstexte).
2. Migration 0003 (WP-01) + RLS für alle Tabellen + Audit Events.
3. Intake + Objekt + Kernfragen (WP-02/03) als API ohne UI, getestet mit TC-01/02/09.
4. Mandat + Scope-Lock (WP-04/05), Idempotenz TC-20.
5. Evidence + Proposals + Lock (WP-06/08), TC-10/11/12.
6. Register + Review + ReportVersion (WP-09/10), TC-13–16.
7. Portal-Screens S01–S07 und Workspace S08–S13 als dünnes UI.
8. E2E mit einem fiktiven, dann einem realen Testmandat (Gate 2).

Jeder Schritt endet mit: Requirement-/Story-Bezug, Migration, API-/State-/Rechteänderung, Testnachweis, nicht Umgesetztem (Handoff §7).

## 7. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Zwei Regelwelten (Arbeitssystem und Plattform) laufen auseinander | ein Domänenkern, gemeinsame Tests (SQL- und TS-Berichtsstatus werden bereits gegeneinander geprüft) |
| Normlizenz ungeklärt | keine Normtexte im Produkt; nur Kennungen und eigene Bezeichnungen (ENT-026) |
| AI-Anbieter und Kundendaten | Opt-in je Mandat, AVV, kein Training, Logging (DEC-16) |
| Umfang wächst vor Pilot | Discovery, weitere Frameworks, Integrationen ausdrücklich nach Gate 4 |

## 8. Mehrmandantenfähigkeit (ENT-011, freigegeben 2026-11-12)

Zunächst nur DT Agency. Wenn der Prototyp stabil läuft, wird die Plattform als **White-Label** für weitere Beratungshäuser angeboten. Deshalb trägt jede neue Tabelle ab Migration 0005 eine Spalte für das Beratungshaus (`tenant`), und RLS trennt danach – auch wenn es im MVP nur einen Wert gibt. Mandatsdaten des Arbeitssystems liegen je Kunde in einem eigenen privaten Repository (ENT-012).

## 9. Abbildung der Statuswerte (ENT-031, freigegeben 2026-11-12)

| Plan (02 / 07) | Repository |
|---|---|
| `ai_proposed`, `in_review` · `UNVERIFIED`, `PROVISIONAL`, `DRAFT` | Freigabe `vorgeschlagen` / Finding `proposed` |
| `verified` | `verifiziert` / `verified` (ENT-029) |
| `persisted_locked` | `freigegeben` + gesperrt (Änderung nur als neue Version) |
| `superseded` | ersetzt (Versionskette) |
| `rejected_with_reason` | `verworfen` / `rejected` mit Begründung |
| `deferred_with_owner_impact_trigger` | `offen` mit Verantwortlichem und Auslöser |
| D-05 `applicable` / `not_applicable` | Anwendbarkeit `applicable` / `not_applicable` (begründet, freigegeben) |
| D-05 `uncertain`, `review_required` · `POSSIBLY_APPLICABLE`, `REQUIRES_EXPERT_REVIEW` | Anwendbarkeit `undecided` mit Grund |
| `OPTIONAL_ASSESSMENT_CRITERION`, `POTENTIAL_VOLUNTARY_STANDARD` | Kriterium vom Typ „freiwillig“ |
| D-09 `sufficient` / `insufficient` | Evidenzlage `sufficient` / `insufficient` |
| D-09 `expired` / `unsupported` | Nachweis `abgelaufen` / `ungeeignet` |
| Fakt `unknown` | Umsetzung `unknown` bzw. Fragebogen `unbekannt` |
