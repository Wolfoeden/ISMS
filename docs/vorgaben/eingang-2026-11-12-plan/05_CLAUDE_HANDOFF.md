# 05 – Implementierungsauftrag an Claude / Claude Code

**Projekt:** DT Agency Intelligent Assessment & Assurance Platform  
**Stand:** 12.11.2026  
**Ziel:** Aus einem abgestimmten fachlichen Zielbild eine moeglichst einfache, sichere und testbare Plattform-Umsetzung ableiten. Keine Voll-GRC-Suite als Erstversion.

---

## 1. Rolle und Arbeitsweise

Du bist Solution Architect, BPMN-/DMN-Modellierer, UX-/Service-Designer und Staff Engineer. Arbeite kritisch: Sage, wenn eine Anforderung nicht entscheidbar, nicht lizenzrechtlich geklaert oder auf Basis der vorliegenden Fakten nicht technisch pruefbar ist. Nutze fachliche Quellen und versionsgebundene Entscheidungen. **Uebernimm keine AI-Behauptungen als verifizierte Security-Feststellungen.**

### Verbindliche Eingaben

- `README.md` – Beschluesse, Dateireihenfolge, Begriffskonventionen.
- `01_CUSTOMER_CONSULTANT_JOURNEY.md` – Customer-/Consultant-Journey, Service Blueprint, Screens und Szenarien.
- `02_FACHKONZEPT_UND_DATENMODELL.md` – fachliches Modell, States, Data Objects, Rules, Governance und Datenschutzgrenzen.
- `03_BPMN_L0_COLLABORATION.bpmn` – **deskriptive**, importierbare BPMN 2.0 Referenz mit drei Diagrammen und BPMN-DI.
- `04_MVP_BACKLOG_UND_TESTFAELLE.md` – priorisierte Produkteigenschaften und Tests.
- `06_FACHLICHE_ENTSCHEIDUNGEN.md` – offene Beschluesse, empfohlenes Default-Verhalten.
- `07_BEISPIEL_CASES.json` – fiktive Testdaten fuer drei Assessmenttypen.
- `08_BPMN_TRACEABILITY.md` – Mapping von BPMN-Knoten auf UX, Regeln und Domain.
- `09_QA_REPORT.md` – bereits durchgefuehrte strukturelle Checks und verbleibende Validierungsluecken.

### Nicht verhandlungsfaehige Kernregeln

1. **Variante C** ist verpflichtend: fachkundiger Direktzugang **oder** gefuehrte Bedarfsermittlung, gemeinsame Case-Domain dahinter.
2. ISO 27001, NIS2, Part-IS, CRA, AI Act, 3PA etc. sind **keine exklusiven Alternativen**. Gegenstand, Ziel, Rechtsnormen, Standards, Assessment-Methode, Bearbeitungsmodus, Tiefe und Assurance sind getrennte Dimensionen.
3. `DiscoveryRun 1:n Candidate` und je Candidate / Inbound eine getrennte Opportunity-/Assessment-Case-Instanz.
4. AI extrahiert/vorschlaegt; deterministische Regeln entscheiden, wo geeignet; autorisierte Menschen verifizieren und genehmigen.
5. Ein Dokument beweist nicht automatisch Kontrollwirksamkeit; Evidenz-Reuse erfordert Scope- und Gueltigkeitspruefung.
6. Freigegebene Objekte und Reports versionieren; kein stillschweigendes Ueberschreiben durch Agenten.
7. Ohne gueltigen Daten-/Mandatsrahmen keine vertrauliche Kundenevidenz; bei Self-Screening eigener klarer Nutzungs-/Datenschutzhinweis.
8. Datenschutz, Tenant-Isolation, Review-/Freigabepolicies und Normenlizenzierung sind Architektur-Gates.
9. `isExecutable=false` bei L0 ist **absichtlich**: Kein produktionsfertiger BPMN-/API-/DMN-Vertrag; spaetere L2-Ausfuehrbarkeit explizit erarbeiten.
10. Bewertete Sachverhalte duerfen `unknown`, `not applicable`, `uncertain` und `limited` sein; keine falschen gruenen Compliance-Urteile.

---

## 2. Dein erster Auftrag – Repository-Inventur und Abgleich

1. Analysiere vorhandenes Repository, bereits implementierte Module, technischen Stack, AuthN/AuthZ, Datenbank, Deployment, AI-Anbindung, BPMN-Engine und bisherige Tests.
2. Erstelle eine **Gap-/Traceability-Matrix** `Spec Requirement -> Existing -> Missing -> Impact -> Implementation Step -> Test`.
3. Liste Abweichungen zwischen bestehender Implementierung und Fachmodell mit Risikograd auf.
4. Erstelle ein leicht verstandliches technisches Zielbild (`context`, `components`, `data`, `security`, `process orchestration`, `AI evidence handling`).
5. Schlage **nur** dort Technologien/Tools vor, wo Repository und Anwendungsfall sie rechtfertigen. Keine voreilige Vollmigration.

**Wenn kein Repository existiert:** Erstelle zuerst ein leichtgewichtiges Architekturkonzept und einen realisierbaren MVP-Scaffold-Plan, ohne unnötige Grosssysteme.

## 3. Dein zweiter Auftrag – Service-Design und UX

Erstelle einen **durchklickbaren Flow oder eindeutig spezifizierte Screens** fuer die drei Rollen:

### Client Portal

- S01 Start/Variante C
- S02 Adaptive Discovery (mit dynamischen Fragen)
- S03 Erste Orientierung: Fakten, Hypothesen, Unsicherheit, naechste Fragen
- S04 Scope/Angebot/Beauftragung (bei Managed/Assisted)
- S05 Dashboard: „Meine Aufgaben“, Fristen, Ansprechpartner
- S06 Evidence Upload + sichere Rueckfragen
- S07 Ergebnisbericht + Grenzen / Massnahmenoptionen

### Consultant Workspace

- S08 Opportunity Triage / Mandatierung / Scope
- S09 Assessment Plan & Regulatory/Assurance Decisions
- S10 Evidence Explorer, AI Proposals, Verified Objects
- S11 Interview-/Question Queue, offene Materialitaet
- S12 Findings / Risks / Actions / Report Draft

### QA View

- S13 Revisionsstand, Evidence Traceability, SoD, Approval/Rework/Limitation

Zu jedem Screen: Use Case, Nutzeraktion, minimale Felder, serverseitige Regeln, Fehlerzustaende, Status, Audit Event und Berechtigung. **Keine „UX“ auf Basis eines Fachfragebogens mit 200 Pflichtfeldern.**

## 4. Dein dritter Auftrag – technische Vertical Slice

Verwende den MVP-Pfad:

`Inbound -> Assessment Discovery -> Scope -> Mandat -> Evidence -> AI Proposal -> Human Verification -> Review -> Report`.

Setze in dieser Reihenfolge um:

1. Datenmodell und sichere Tenant-/Rollenabgrenzung.
2. Gemeinsame Case-IDs, serverseitige Zustandsmaschine, versionierte Fachobjekte.
3. Variante-C-Intake und adaptive Produktfragen fuer den 3PA-Softwarepilot.
4. Mandats-/Scope-Freigabe und formale startberechtigte Assessment-Instanz.
5. Evidenzspeicher/Upload/Provenienz (Hash, Source, Scope, Version, Zeitpunkt, Access Control).
6. Gesicherte AI-Vorschlaege mit Fundstelle, Unsicherheit, Prompt-Injection-Schutz und menschlicher Verifikation.
7. Finding/Risk/Recommendation als **separate** Entitaeten.
8. Lead-/QA-Workflow mit SoD und unveraenderlicher Report-Freigabe.
9. Verifizierten Bericht, Export und Revisionshistorie.
10. End-to-End-Tests inkl. Negativpfade und Idempotenz.

**Nicht erst einmal alle Frameworks und Integrationen bauen.**

## 5. BPMN/DMN-Anforderung

- Importiere `03_BPMN_L0_COLLABORATION.bpmn` und validiere XML, IDs, Sequence-/Message-Flow-Grenzen, Gateway-Targets, Endzustaende, `calledElement`-Referenzen und BPMN-DI.
- Beachte, dass der `DiscoveryRun` **mehrere** unabhaengige Opportunity-/Case-Instanzen ausloest; keine Loop-Instanz fuer mehrere Kunden mit gemeinsamen Case-Daten.
- Die Event-Based Gateways benoetigen ausschliesslich zulassige Message-/Timer-Catch-Events. Keine Task-Gateway-Verwechslung.
- Entwickle L1-Prozessmodelle und Versionierung; L2 Engine-Mapping erst nach Bewertung der vorhandenen Infrastruktur.
- Modellierte User Tasks fuer kritische Verifikation, freigegebene Scope-Objekte und Berichtsfreiheiten duerfen nicht durch reine Service Tasks ersetzt werden.
- Lege DMN-/Regel-Kontrakte samt Input-/Output-Versionierung fuer D-03, D-05, D-06, D-07, D-08, D-11, D-12, D-13 zuerst als fachlich testbare Entscheidungstabellen an. Weitere DMN-Modelle nach Bedarf.

## 6. Methodische und regulatorische Schranken

- Keine definitive NIS2-/Part-IS-/AI-Act-/CRA-Pflicht allein aufgrund KI-Webrecherche. Beruecksichtige die aktuelle Rechtslage, Jurisdiktion, Organisationstyp und Geltungsdatum.
- ISO-Volltexte und vergleichbare geschuetzte Werke ohne geklaerte Lizenz nicht als Prompt-/Embedding-/Produktdatenbestand verwenden.
- Das Ergebnis eines Self-Assessments niemals als durch unabh. Pruefer verifiziert darstellen.
- Keine rechtliche Schlussfolgerung oder Zertifizierungsbehauptung, die nicht durch fachlich verifizierte Kriterien, Befugnisse und Methodik gedeckt ist.
- Keine automatisierte Cold-E-Mail-Funktion als Default. Nicht-zulaessige Kontaktaufnahme technisch blockieren.
- Datenschutz/Security: Threat Model; verschluesselte Evidenz; Least Privilege; Datenminimierung; Audit; Retention; Subprocessor/AVV.

## 7. Pruefung und Nachweis der Umsetzung

Nach jedem Inkrement muss Claude liefern:

- Verweis auf Requirement-ID und betroffene User Story.
- Code-/Dateiaenderungen und Migrationsschritte.
- API-/State-/Berechtigungs-Aenderungen.
- Testnachweis (automatisiert, soweit technisch moeglich; Testdaten anonymisiert).
- Nicht umgesetzte Punkte und Risiken, keine Scheinvollstaendigkeit.
- Visualisierung bzw. Screenshot oder dokumentierte UI-Flow-Pruefung fuer geaenderte Journeys, sofern moeglich.

**Harte Release-Gates:** kein Cross-Tenant Access; kein AI-Override von Verified; kein Publizieren ohne erforderliche QA; keine falschen Compliance- oder Zertifizierungsclaims; klare Scope-/Evidenzherkunft; alle P0-Tests aus Dokument 04 bestanden.

## 8. Sofortige Erstausgabe von Claude

Bevor Implementierung:

1. `ARCHITECTURE_GAP_ANALYSIS.md` – Repo-Inventur, Abweichungen und Blocker.
2. `SERVICE_BLUEPRINT_IMPLEMENTATION.md` – Journeys/Screens/Rollen und ihr Mapping auf Daten und Workflows.
3. `MVP_TECHNICAL_PLAN.md` – Vertikaler Slice, Migrations-/Teststrategie und priorisierte Arbeitspakete.
4. `DECISION_LOG.md` – Offene Fragen (siehe 06), Entscheidungsempfehlung und Konsequenzen.

**Erst dann** Code in einer priorisierten und nachvollziehbaren Sequenz aendern. Keine grosse Implementierungsserie ohne Tests.
