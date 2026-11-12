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
| WP-01 | Domain Schema, Tenants, Cases, Audit Events | ✔ `tenant`, `assessment_case` (0005), `assessment_object`, `scope_version`, `audit_event` (0007), RLS auf allen Tabellen (0008) | Intake-Felder (WP-02); Anmeldung (Auth) an `app.person_id` anbinden | ✔ TC-18 (`db/tests/0008_smoke.sql`) |
| WP-02 | Variante-C-Intake | ✔ `src/intake/intake.ts`, Migration 0009 (`intake_case`, `context_fact`, `framework_candidate`, `open_question`); Wechsel A↔B erhält Fakten | API und Screens S01–S03 | ✔ TC-01, TC-02, US-A1, US-A2 |
| WP-03 | Produkt-/Organisationsobjekt, adaptive Kernfragen | ✔ 7 Kernfragen mit Materialität, Objektzweig Produkt/Organisation, Ask once; D-06 Entscheidungsfähigkeit (`src/intake/readiness.ts`, Schema-Trigger); Teilfakten (ENT-033) | Übergabe Intake → Fragebogen (Fakten vorbelegen) | ✔ US-A3, TC-09 |
| WP-04 | Scope, Criteria, Modus, Assurance getrennt | ✔ `scope_version` mit Modus, Assurance-Aussage, Prüftiefenprofil; gesperrt nach Freigabe; Objekte je Scope; Bewertung je Objekt (0007) | Kriterien strukturiert statt Freitext (Framework/Version je Scope) | US-B1 ✔ (Schema), TC-03, US-B3 |
| WP-05 | Mandat mit Scope-Fixierung | ✔ Mandatsstatus (0005); Angebot auf freigegebener Scope-Version, nach Versand unveränderlich, Frist P21D (DEC-10), Leistungsabgrenzung Pflicht; Mandat genau einmal je Angebot (`handle_signed_mandate`, `processed_event`); Storno mit Daten- und Vertragsentscheidung (`src/engagement/offer.ts`, Migration 0011) | Timer-Job für `expire_offers()` mit Hosting; Signatur-Anbindung | ✔ TC-07, TC-08, TC-19, TC-20, TC-22 |
| WP-06 | Evidence Store, Provenienz, Deduplikation | ✔ SHA-256, Dedup je Mandat, Klassifikation, Verknüpfung mit Bewertungsumfang; Wiederverwendung erst nach Prüfung von Geltungsbereich, Stand, Zulassung, Aussagekraft (`src/evidence/evidence.ts`, Migration 0010) | verschlüsselter Dateispeicher (mit Hosting-Entscheidung) | ✔ TC-10, US-C1 |
| WP-07 | Question/Task Engine + Client Portal | ○ | Task-Service (nicht BPMN, 02 §9); Portal S05/S06 | „nur eigene Aufgaben“ |
| WP-08 | AI Proposals + Human Verification + Lock | ✔ `ai_proposal` mit Fundstelle, Modell-/Promptversion, Scope, Unsicherheit; Status 02 §4.4; annehmen/korrigieren/ablehnen/vertagen nur durch Menschen; gesperrte Stände unveränderlich; KI-Sitzung schreibt nur Vorschläge und liest nur ihr Mandat (`src/evidence/proposals.ts`, Migration 0010) | Anbindung eines KI-Dienstes (DEC-16: Opt-in, AVV) | ✔ TC-11, TC-12, TC-21, US-C2 |
| WP-09 | Assessment Workflow, Finding/Risk/Action | ✔ Tabellen und Regeln; berechneter Berichtsstatus | an Case/Objekt binden; D-09/D-10 als Regelverträge | US-C2 |
| WP-10 | Lead Review / QA / Report Release | ✔ D-11 (QA für jeden finalen Bericht, QA ≠ Autor), Review-Paket mit Kriterien-/Nachweisbezug und Versionskonflikten, QA-Ergebnisse nach 01 §4.3, D-12 Nacharbeit in früheste Phase, D-13 Abschluss, gesperrte Berichtsversion mit Hash, Nachweis-Snapshot und Änderungsprotokoll (`src/engagement/report.ts`, Migration 0012) | PDF/HTML-Ausgabe und Signatur (DEC-17) | ✔ TC-13, TC-15, TC-16, US-C3, US-D1, US-D2 |
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
| TC-10, TC-11, TC-12, TC-21 | ✔ Kern (`test/evidence.test.ts`) und Schema (`db/tests/0010_smoke.sql`) | API-Test mit echtem KI-Dienst |
| TC-17 Normenversion | ✔ Version-Pin je Scope, Folgeprüfung bei neuer Version, Entscheidung durch Lead vor QA (0013) | API-Test |
| TC-18 Tenant Isolation | ✔ alle Tabellen (Struktur- und Verhaltenstest, 0008) | ✔ KI-Zugriffspfad (0010) |
| TC-01, TC-02, TC-09 | ✔ Kern (`test/intake.test.ts`) und Schema (`db/tests/0009_smoke.sql`) | API-Test |
| TC-07, TC-08, TC-19, TC-20, TC-22 | ✔ Kern (`test/offer.test.ts`) und Schema (`db/tests/0011_smoke.sql`) | API-Test |
| TC-13, TC-15, TC-16 | ✔ Kern (`test/report.test.ts`) und Schema (`db/tests/0012_smoke.sql`) | API-Test |
| TC-14 Kundenwiderspruch | ✔ Kundenreaktion `bestritten` → erneute Prüfung (Domänenkern) | API-Test |
| TC-03–TC-06 | ○ | TC-03/04 mit Bibliothek (ENT-017), TC-05/06 nach der Testphase (ENT-034) |

Testdaten: nur fiktiv/anonymisiert (`07_BEISPIEL_CASES.json`, Fixtures). DB-Tests gegen echtes PostgreSQL (`db/test.sh`).

## 6. Reihenfolge

1. Gate 0: Entscheidungen ENT-029, ENT-030, ENT-032, ENT-035, ENT-036 (+ ENT-026 für Berichtstexte).
2. ✔ WP-01: Migrationen 0005, 0007, 0008 – Prüfvorgang, Objekte, Scope-Versionen, Audit-Protokoll, RLS für alle Tabellen.
3. ✔ Intake + Objekt + Kernfragen (WP-02/03) in Kern und Schema, getestet mit TC-01/02/09; API folgt mit der Hosting-Entscheidung.
4. ✔ Mandat + Scope-Lock (WP-04/05): Status, Scope-Sperre, Angebotsversionen, idempotente Mandatsanlage, Storno.
5. ✔ Evidence + Proposals + Lock (WP-06/08), TC-10/11/12/21 – Kern und Schema; Dateispeicher und KI-Dienst folgen mit Hosting.
6. ✔ Register + Review + ReportVersion (WP-09/10), TC-13–16 – Kern und Schema.
7. ✔ Etappe 1: Anwendungsschicht (`src/api`, [API_PROTOTYP.md](API_PROTOTYP.md)), Pilotfall über die Schnittstelle getestet; TC-17 Normversion (0013).
8. Etappe 2: Ende-zu-Ende-Test mit allen Negativpfaden (WP-11). Etappe 3: Portal-Screens S01–S07 und Workspace S08–S13 als dünnes UI.
9. E2E mit einem fiktiven, dann einem realen Testmandat (Gate 2).

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
