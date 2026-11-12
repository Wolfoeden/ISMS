# Architecture Gap Analysis – Intelligent Assessment & Assurance Platform

| | |
|---|---|
| Stand | 2026-11-12 · Rev. 2 nach Eingang von 01, 02, 04, 06, 08 |
| Eingänge | `docs/vorgaben/eingang-2026-11-12-plan/` (README, 01–08, BPMN, 07 Beispiel-Cases, validate_bpmn.py); weiterhin fehlen `build_bpmn.py` und 09 (nicht blockierend) |
| Folgedokumente | [`SERVICE_BLUEPRINT_IMPLEMENTATION.md`](SERVICE_BLUEPRINT_IMPLEMENTATION.md), [`MVP_TECHNICAL_PLAN.md`](MVP_TECHNICAL_PLAN.md) |
| Entscheidungen | [`DECISION_LOG.md`](DECISION_LOG.md) |

## 1. Repository-Inventur

| Bereich | Stand | Beleg |
|---|---|---|
| Stack | TypeScript (Node 22, strict), Vitest; PostgreSQL-Schema (ab 15), getestet gegen PostgreSQL 16; **keine Anwendung, kein UI, kein Server, kein Deployment** | `package.json`, `src/`, `db/` |
| Domänenlogik | Prüftiefenprofil (Ableitung, Untergrenzen, Entscheidung), Control-Tiefe, Mandat/Rollen/SoD, Quality Gate Feststellungen, Bewertungsmodell mit berechnetem Berichtsstatus, Größenklasse, NIS2-Vorprüfung § 28 BSIG | `src/proportionality`, `src/engagement`, `src/bewertung`, `src/regelwerk` |
| Datenmodell | Organisation, Person, Complexity Assessment, Profilentscheidung, Mandat, Teilnehmer/Rollen, SoD-Ausnahmen, Work Assignment, Control-/Requirement-Assessment, Evidence, Risk, Measure, Finding mit Kundenreaktion, Transition-Log (append-only), Effort | `db/migrations/0001`, `0002` |
| AuthN/AuthZ | **keine Authentifizierung**; Mandantentrennung als RLS-Muster (`app.person_id`), getestet | `db/tests/0001_smoke.sql` |
| AI-Anbindung | keine Plattform-AI; Claude-Code-Agents mit Arbeitsregeln (Vorschlag ≠ Freigabe, Prompt-Injection-Regel) im dateibasierten Arbeitssystem | `.claude/agents`, `CLAUDE.md` |
| BPMN/DMN | **keine Engine, keine DMN**; Regeln als deterministischer TypeScript-Code mit Policy-Version | `src/proportionality/profile.ts` |
| Wissensbasis | 17 Bibliothekseinträge, 27 amtliche Snapshots, wörtliche Zitatprüfung | `bibliothek/` |
| Tests | 120 TypeScript-Tests, 2 DB-Smoke-Tests (Constraints, RLS, Berichtsstatus SQL = TS) | `test/`, `db/tests/` |
| Arbeitssystem | dateibasierte Mandate (Fragebogen, Entscheidungsseite, `isms.md`, Notizen), Prüfwerkzeug für auditsichere Endergebnisse | `mandanten/_vorlage`, `npm run isms` |

## 2. Prüfung der gelieferten Artefakte

| Artefakt | Ergebnis | Befund |
|---|---|---|
| `03_BPMN_L0_COLLABORATION.bpmn` | mit `validate_bpmn.py` reproduziert: 4 Prozesse, 3 Teilnehmer, 90 Flow-Nodes, 95 Sequence Flows, 13 Message Flows, 4 Event-Based Gateways, 15 End Events, 12 User Tasks; alle Prozesse `isExecutable=false` | strukturell konsistent |
| `validate_bpmn.py` / `09_QA_REPORT.md` | **zwei Aussagen im erzeugten Bericht sind nicht durch Code gedeckt:** „keine Achsenrechteck-Überlappung“ (das Skript prüft keine Geometrie) und „davon 2 im Collaboration“ (fester Text, nicht gezählt) | Bericht korrigieren oder Prüfung ergänzen (G-17) |
| `07_BEISPIEL_CASES.json` | 3 fiktive Cases, gültiges JSON | eigenes Statusvokabular (`UNVERIFIED`, `PROVISIONAL`, `POSSIBLY_APPLICABLE`, `REQUIRES_EXPERT_REVIEW` …) – Abgleich nötig (G-10) |

## 3. Traceability-Matrix

`Spec Requirement → Existing → Missing → Impact → Implementation Step → Test`. Risikograd: **H** hoch · **M** mittel · **N** niedrig.

| # | Anforderung (Quelle) | Vorhanden | Fehlt | Risiko | Umsetzungsschritt | Test |
|---|---|---|---|---|---|---|
| G-01 | Variante C: Direktzugang oder geführte Bedarfsermittlung, gemeinsame Case-Domain (ADR-001, Handoff R1) | Triage-Fragebogen, NIS2-Vorprüfung | Intake-Case mit `entryRoute`, gemeinsame Case-ID | H | Case-Entität + Intake-Zustandsmaschine (Slice 2–3) | Intake KNOWN_NEED und GUIDED_DISCOVERY erzeugen dieselbe Case-Struktur |
| G-02 | Frameworks nicht exklusiv; Gegenstand, Ziel, Rechtsnorm, Standard, Methode, Modus, Tiefe, Assurance getrennt (ADR-002, ADR-007) | Regelwerke je Eintrag (`vorschriften.md` Teil B); Prüftiefenprofil; Tiefe | Assessment-**Objekt**, **Handling Mode**, Framework-Kandidaten je Case mit Status | H | Objekt- und Kandidatenmodell (Slice 1) | Case mit 2 Kandidaten unterschiedlichen Status |
| G-03 | DiscoveryRun 1:n Candidate, je Candidate eigene Case-Instanz (ADR-003, R3) | – | vollständig | M | nach MVP; erst Rechtsgrundlage Kontaktaufnahme ([ENT-034]) | getrennte Case-Daten je Candidate |
| G-04 | Kontaktaufnahme nur rechtlich zulässig; keine Cold-E-Mail als Default (Handoff §6) | – | Rechtsgrundlage in der Bibliothek, Regel `T_OutreachRules` | **H (rechtlich)** | Wissen erfassen ([ENT-034]); Funktion standardmäßig gesperrt | Outreach ohne Freigabe technisch blockiert |
| G-05 | Kundenoberfläche und Consultant Workspace getrennt, gleiche Daten/Regeln (ADR-004); Screens S01–S13 | – | vollständig | H | Spezifikation S01–S13 im Service Blueprint | je Screen Rechte- und Fehlerzustandstest |
| G-06 | Evidence-first, progressive Fragen statt starrer Fragebögen (ADR-005) | 65-Fragen-Katalog; Einstufung verlangt alle 57 Faktfragen | adaptive Fragenauswahl, Materialität je Frage | M | Fragen als Pool mit Materialität; Einstufung mit Teilfakten + Unsicherheit ([ENT-033]) | Einstufung mit fehlenden nicht-materiellen Fakten |
| G-07 | AI schlägt vor, Regeln berechnen, Berechtigte verifizieren (ADR-006, R4) | deterministische Regeln mit Policy-Version; Agent darf nie freigeben (Werkzeug, Schema) | DMN-Verträge D-03…D-13; Plattform-AI-Dienst | M | Regelverträge D-01…D-13 nach 02 §5 (Zuordnung im MVP-Plan §4) | Regel-Ein-/Ausgaben versioniert, reproduzierbar |
| G-08 | Verifizierte Artefakte versioniert, unveränderlich (ADR-008, R6) | Git-Historie; append-only Transition-Log; Policy-Version | Versionstabellen für Scope, Profil, Kriterien, Bericht | H | Versionierung je Fachobjekt (Slice 2) | Update eines freigegebenen Objekts erzeugt neue Version |
| G-09 | MVP 3PA Einzelunternehmer + Softwareprodukt (ADR-009) | Templates „Solo Developer“, „Third-Party Assessment“; Profil-Beispiele | getrennte Objekte Organisation/Produkt ([ENT-021]) | M | Objektmodell löst ENT-021 | Beispiel-Case INT-DEMO-0001 durchspielen |
| G-10 | Statusvokabular der Cases (`07`) | Achsenmodell (ENT-018), Freigabe (ENT-027/029) | Zuordnung `UNVERIFIED/PROVISIONAL/DRAFT/POSSIBLY_APPLICABLE/REQUIRES_EXPERT_REVIEW/OPTIONAL_…` | M | Abbildungstabelle ([ENT-031]) | Roundtrip Beispiel-Cases |
| G-11 | „Assurance Profile“ in `07` = {reviewRequired, independenceClaim} | „Assurance Profile“ = Profil 1–4 (Proportionalität) | **Begriffskonflikt** | H | ✔ erledigt: Profil 1–4 heißt „Prüftiefenprofil“ (`DepthProfile`, `depth_profile`), „Assurance“ nur Aussagequalität ([ENT-030]) | – |
| G-12 | BPMN steuert Geschäftsvorfälle, Case-/Task-Service für dynamische Fragen (ADR-010) | – | Engine/Service | M | erst L1-Modelle; Engine-Wahl offen ([ENT-032]) | – |
| G-13 | Mandantentrennung, Least Privilege (R8) | RLS-Muster, getestet | Authentifizierung, Rollenmodell Plattform | H | AuthN + RLS je Tabelle (Slice 1) | Cross-Tenant-Zugriff abgewiesen |
| G-14 | Evidenzspeicher mit Hash, Quelle, Scope, Version, Zeitpunkt, Zugriff (Slice 5) | Tabelle `evidence`, Notiz-Kopf, Prüfstufe, Gültigkeit | Datei-Upload, Verschlüsselung, Scope-Bezug, Reuse-Prüfung | H | Upload-Dienst + Scope-Feld | Reuse ohne Scope-Prüfung abgewiesen |
| G-15 | Finding / Risk / Recommendation getrennt (Slice 7) | getrennte Tabellen und Abläufe | – | N | – | vorhanden (`db/tests/0002_smoke.sql`) |
| G-16 | Lead/QA mit SoD, unveränderliche Berichtsfreigabe (Slice 8) | Regeln G3–G6, Quality Gate, Freigabe-DoD `isms.md` | Berichtsobjekt mit Version und Sperre | M | Berichtsentität + Freigabe-Workflow | Freigabe durch Ersteller abgewiesen |
| G-17 | Nachweis der Umsetzung ohne Scheinvollständigkeit (Handoff §7) | Prüfwerkzeug, Tests | korrekter QA-Report des BPMN-Skripts | N | Bericht an tatsächliche Prüfungen koppeln | Bericht nennt nur geprüfte Punkte |
| G-18 | Begriff „verifizieren“ vs. „freigeben“ (ADR-006/008, BPMN) | nur „freigegeben“ (ENT-027) | zweistufige Prüfung | M | [ENT-029] Option 3 | Verifizierer ≠ Freigebender bei Berichten ab Profil 3 |
| G-19 | Regulatorik: Part-IS, CRA, AI Act, ISO 42001 als Kandidaten (`07`) | NIS2/BSIG, DSGVO, BDSG, UrhG, RDG quellengeprüft | Einträge für Part-IS, CRA, AI Act, ISO 42001 | M | nur bei Bedarf des Pilots ([ENT-017]) | – |
| G-20 | P0-Tests aus Dokument 04 als Release-Gate | TC-13, TC-14, TC-18 im Domänenkern/Schema; TC-12, TC-16, TC-17, TC-22 teilweise | übrige TC | H | Stand je Test im MVP-Plan §5 | TC-01…TC-22 |
| G-21 | Mandats- und Case-Status nach 02 §4.2/§4.3 | Mandat `planned/active/closed/cancelled` | `draft/offered/signed`, Case-Status, `closed_with_limitations` | H | Migration 0003 ([ENT-036]) | Upload vor `active` abgewiesen |
| G-22 | Prüftiefe Basis/Standard/Enhanced (DEC-11) | Profil 1–4 mit Untergrenzen | Abbildung | M | [ENT-035] | Abbildung 4 → 3 eindeutig |
| G-23 | Artefaktstatus 02 §4.4, AI überschreibt nie `persisted_locked` | Regel „Agent gibt nie frei“ | Statusspalte, Sperre | H | WP-08 | TC-12 |

## 4. Abweichungen zwischen Repository und Zielbild

| # | Abweichung | Risiko | Empfehlung |
|---|---|---|---|
| A-1 | Repository ist ein dateibasiertes Arbeitssystem für Berater; das Zielbild ist eine Plattform mit Kundenportal | H | beides behalten: das Arbeitssystem liefert die geprüften Regeln, die Plattform nutzt sie (gemeinsamer Domänenkern `src/`) |
| A-2 | „Assurance Profile“ doppelt belegt | – | ✔ erledigt ([ENT-030]) |
| A-3 | Fragebogen verlangt Vollständigkeit vor der Einstufung | M | [ENT-033] |
| A-4 | kein Objekt-/Handling-Mode-Konzept | H | `AssessmentObject` und Modus nach 02 §3/§5.2 ([ENT-021]) |
| A-5 | Regeln als Code statt DMN | M | [ENT-032] – Code ist testbar und versioniert; DMN nur, wenn Fachbereich Tabellen selbst pflegen soll |

## 5. Blocker

1. Gate 0: menschliche Entscheidungen ENT-029, ENT-030, ENT-032, ENT-035, ENT-036 ([`DECISION_LOG.md`](DECISION_LOG.md)).
2. Lizenzlage der Normen ([ENT-026]) – Gate für jeden ISO-Inhalt in der Plattform.
3. Rechtsgrundlage für Kontaktaufnahme ([ENT-034]) – Gate für DiscoveryRun/Outreach.
4. Technologie-Stack und Hosting sind laut README ausdrücklich offen ([ENT-032]).

## 6. Technisches Zielbild (leichtgewichtig, ohne Stack-Festlegung)

| Sicht | Inhalt |
|---|---|
| Kontext | Kunde (Portal) · Consultant/Lead/QA (Workspace) · Plattform · KI-Dienst (nur Vorschläge) · Bibliothek (Rechts- und Normquellen) |
| Komponenten | Case-/Intake-Dienst · Regeldienst (Domänenkern `src/`, versioniert) · Evidenzdienst · Workflow (BPMN L1, Engine offen) · Berichtsdienst · Prüfdienst (auditsichere Endergebnisse, heute `src/werkzeuge`) |
| Daten | PostgreSQL mit RLS (`db/migrations`); Fachobjekte versioniert; Nachweise verschlüsselt außerhalb der Datenbank, Metadaten in `evidence` |
| Sicherheit | AuthN, RLS je Tabelle, Least Privilege, Audit-Log append-only, kein Cross-Tenant-Zugriff, Aufbewahrung je Mandat |
| Prozesssteuerung | L0 deskriptiv (vorhanden) → L1 je Prozess → L2 erst nach Engine-Entscheidung; User Tasks für Verifikation/Freigabe nie durch Service Tasks ersetzt |
| KI-Evidenz | Vorschlag mit Fundstelle, Unsicherheit, Eingaben; Status nie über „vorgeschlagen“; Dokumentinhalte nie als Anweisung |
