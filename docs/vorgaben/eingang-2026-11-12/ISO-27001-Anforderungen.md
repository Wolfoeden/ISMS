# ISO/IEC 27001 – ISMS-Anforderungen und Entwicklungsregeln

> **Projekt:** DT Agency – KI-gestützte ISMS-/GRC-/3PA-Plattform  
> **Status:** Fachliche Entwicklungsrichtlinie (keine Normabschrift)  
> **Quelle:** DIN EN ISO/IEC 27001:2024-01, deutsche Fassung EN ISO/IEC 27001:2023 / ISO/IEC 27001:2022, TÜV-Süd-Akademie-E-Book  
> **Stand der Aufbereitung:** 2026-11-12  
> **Gültigkeitsvorbehalt:** Die hochgeladene Ausgabe enthält das internationale Amendment **ISO/IEC 27001:2022/Amd 1:2024** nicht als integrierten Zusatz. Dessen Relevanz (insbesondere klimabezogene Kontext-/Stakeholder-Aspekte) ist **separat** zu prüfen und bei Aktivierung des Frameworks versioniert zu berücksichtigen.

## 1. Zweck und Quellenhierarchie

Diese Datei übersetzt die Managementsystem-Anforderungen der Abschnitte 4–10 in **implementierbare DT-Agency-Projektregeln**. Sie ersetzt weder den Normtext noch eine unabhängige Konformitätsprüfung.

- **ISO/IEC 27001, Abschnitte 4–10** enthalten die für einen 27001-Konformitätsanspruch relevanten Managementsystemanforderungen. Keine dieser Anforderungen darf pauschal wegen geringer Unternehmensgröße ausgeschlossen werden.
- **ISO/IEC 27001, Anhang A** ist ein normativer Referenzkatalog zur Kontrolle der Vollständigkeit der aus der Risikobehandlung gewählten Sicherheitsmaßnahmen (siehe 6.1.3).
- **ISO/IEC 27002** liefert ausführlichere Erläuterungen zu diesen 93 Maßnahmen, ist aber keine eigenständige ISO-27001-Zertifizierungsnorm.
- Die konkrete Auswahl und Umsetzung von Maßnahmen ist **risikobasiert und scopebezogen**; im **Statement of Applicability (SoA)** sind Auswahl, Umsetzungsstatus und Ausschlussgründe nachvollziehbar zu dokumentieren.
- **MUSS/SOLL/KANN** in dieser Datei sind, sofern nicht ausdrücklich als Normzitat deklariert, **Projektanforderungen**; keine Behauptung über den exakten Normwortlaut.
- **Lizenz:** Keine geschützten Normtexte ohne passende Rechte in öffentliche Repositories, Kundenantworten oder mandantenübergreifende RAG-Indizes übernehmen.

## 2. Projektpflichten für die KI und Anwendungslogik

1. Jede Aussage über ISO-Konformität **MUSS** Scope, Normedition, konkretes Kriterium, Evidenz, Bewertungsstatus und freigebende Person besitzen.
2. Die KI **DARF NICHT** ein ISMS als zertifiziert, auditiert oder konform ausgeben, solange hierfür keine unabhängige, zutreffende Feststellung vorliegt.
3. **Abschnitte 4–10** sind bei einem vollständigen 27001-Assessment als eigenständige Prüfdomäne abzudecken; ein reines Annex-A-Assessment reicht nicht aus.
4. Die Systemarchitektur **MUSS** Risiken des ISMS (6.1.1) und konkrete Informationssicherheitsrisiken (6.1.2) fachlich getrennt speichern können.
5. Die Risk Engine **MUSS** dokumentierte, reproduzierbare Risikokriterien, Bewertungsmethode, Risk Owner und Risikoakzeptanz unterstützen.
6. Der SoA-Generator **MUSS** die ausgewählten Controls mit Anhang A vergleichen; nicht gewählte Annex-A-Controls benötigen eine nachvollziehbare Ausschlussbegründung.
7. **Risk Owner** genehmigen Behandlungspläne und akzeptieren Restrisiken nach kundenspezifischen Befugnissen; die KI schlägt lediglich vor.
8. Dokumentierte Informationen **MÜSSEN** versioniert, zugriffsgesteuert, nachverfolgbar und mit Review-/Freigabevermerken speicherbar sein.
9. **Interne Audits** benötigen Auditkriterien, Scope, kompetente und objektive Prüfer, Ergebnisse und Bericht an zuständige Leitung; Projekt-Reviews dürfen nicht automatisch als Audit bezeichnet werden.
10. Managementreviews, Abweichungen, Ursachenanalyse, Korrekturen, Wirksamkeitsprüfung und Verbesserung **MÜSSEN** als wiederholbare Workflows abbildbar sein.
11. Einstufungen `not_assessed`, `not_evidenced`, `nonconforming`, `conforming`, `not_applicable` und `needs_review` **MÜSSEN** semantisch sauber unterschieden werden. `not_applicable` für 27001-Abschnitt-4–10-Anforderungen ist bei vollständigem Konformitätsanspruch grundsätzlich keine zulässige pauschale Ausnahme.
12. Plattform- und Normpflichten **MÜSSEN** im Datenmodell unterschiedliche Herkunftskennzeichen (`source_type`) erhalten.

## 3. Anforderungsstruktur – Abschnitte 4 bis 10

Nachfolgend die **vollständige Liste der relevanten Unterabschnitte** als Entwicklungs- und Mapping-Index. Die Beschreibungen sind eigenständige Zusammenfassungen, nicht ISO-Originaltext. PDF-Seiten beziehen sich auf die bereitgestellte Datei.


### 4. Kontext der Organisation


#### 4.1 – Organisationskontext

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 4.1; PDF-Seite 12.
- **Fachliche Ableitung:** Externe/interne Einflussfaktoren erfassen und ihre Bedeutung für die ISMS-Ziele bestimmen.
- **Zu erfassende Daten:** `context_register`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Kontextanalyse; Aktualisierungsprotokoll.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 4.2 – Interessierte Parteien

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 4.2; PDF-Seite 12.
- **Fachliche Ableitung:** Relevante Stakeholder und Anforderungen sowie deren ISMS-Behandlung dokumentieren.
- **Zu erfassende Daten:** `stakeholder_register`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Stakeholder-/Anforderungsmatrix.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 4.3 – ISMS-Scope

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 4.3; PDF-Seite 13.
- **Fachliche Ableitung:** Grenzen, Anwendbarkeit, Schnittstellen und Abhängigkeiten festlegen und dokumentieren.
- **Zu erfassende Daten:** `scope_definition`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Freigegebener Scope inkl. Abhängigkeiten.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 4.4 – ISMS und Wechselwirkungen

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 4.4; PDF-Seite 13.
- **Fachliche Ableitung:** ISMS-Prozesse definieren, einführen, erhalten und verbessern.
- **Zu erfassende Daten:** `isms_process`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Prozesslandschaft; Verantwortlichkeiten.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


### 5. Führung


#### 5.1 – Führung und Verpflichtung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 5.1; PDF-Seite 13.
- **Fachliche Ableitung:** Unterstützung, Ressourcen, Integration und Wirkung der Leitung nachvollziehbar machen.
- **Zu erfassende Daten:** `management_commitment`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Managementfreigaben; Ressourcenentscheidungen.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 5.2 – Informationssicherheitspolitik

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 5.2; PDF-Seite 14.
- **Fachliche Ableitung:** Geeignete, genehmigte, bekannt gemachte und verfügbare Policy verwalten.
- **Zu erfassende Daten:** `security_policy`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Freigegebene Policy; Verteilungsnachweise.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 5.3 – Rollen und Befugnisse

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 5.3; PDF-Seite 14.
- **Fachliche Ableitung:** ISMS-Verantwortlichkeiten und Berichtspflichten benennen und kommunizieren.
- **Zu erfassende Daten:** `role_assignment`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Rollenmatrix; Bestellungen.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


### 6. Planung


#### 6.1.1 – Risiken und Chancen des ISMS

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 6.1.1; PDF-Seite 14.
- **Fachliche Ableitung:** ISMS-bezogene Risiken/Chancen und Maßnahmen zur Zielerreichung planen.
- **Zu erfassende Daten:** `isms_opportunity`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Planungs-/Maßnahmenregister.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 6.1.2 – Risikobeurteilung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 6.1.2; PDF-Seite 15.
- **Fachliche Ableitung:** Bewertungskriterien und Akzeptanzgrenzen festlegen; CIA-Risiken identifizieren, analysieren, bewerten und Risikoeigentümer zuordnen.
- **Zu erfassende Daten:** `risk_assessment`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Freigegebene Methode; Risikoregister; Bewertungsergebnisse.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 6.1.3 – Risikobehandlung und SoA

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 6.1.3; PDF-Seite 15.
- **Fachliche Ableitung:** Optionen wählen; erforderliche Controls bestimmen; mit Annex A abgleichen; SoA, Behandlungsplan, Zustimmung der Risk Owner und Restrisikoakzeptanz dokumentieren.
- **Zu erfassende Daten:** `risk_treatment`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** SoA; Behandlungsplan; Eigentümerfreigaben.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 6.2 – Informationssicherheitsziele

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 6.2; PDF-Seite 16.
- **Fachliche Ableitung:** Messbare, überwachte und verantwortete Ziele einschließlich Maßnahmen, Terminen und Ressourcen definieren.
- **Zu erfassende Daten:** `isms_objective`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Zielregister; Kennzahlen; Maßnahmenplan.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 6.3 – Geplante Änderungen

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 6.3; PDF-Seite 17.
- **Fachliche Ableitung:** Notwendige Änderungen am ISMS kontrolliert planen.
- **Zu erfassende Daten:** `isms_change`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Change-Anträge; Freigaben.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


### 7. Unterstützung


#### 7.1 – Ressourcen

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 7.1; PDF-Seite 17.
- **Fachliche Ableitung:** Für Aufbau, Betrieb, Erhalt und Verbesserung benötigte Ressourcen festlegen.
- **Zu erfassende Daten:** `resource_plan`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Budget-/Kapazitätsplanung.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 7.2 – Kompetenz

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 7.2; PDF-Seite 17.
- **Fachliche Ableitung:** Kompetenzbedarf, Befähigung und angemessene Nachweise steuern.
- **Zu erfassende Daten:** `competence_record`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Kompetenzmatrix; Trainingsnachweise.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 7.3 – Bewusstsein

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 7.3; PDF-Seite 17.
- **Fachliche Ableitung:** Bewusstsein für Policy, Beiträge und Folgen von Nichterfüllung sicherstellen.
- **Zu erfassende Daten:** `awareness_record`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Awareness-Nachweise.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 7.4 – Kommunikation

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 7.4; PDF-Seite 18.
- **Fachliche Ableitung:** Themen, Zeitpunkte, Zielgruppen und Kommunikationswege festlegen.
- **Zu erfassende Daten:** `communication_plan`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Kommunikationsmatrix.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 7.5.1 – Dokumentationsumfang

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 7.5.1; PDF-Seite 18.
- **Fachliche Ableitung:** Erforderliche dokumentierte Information festlegen.
- **Zu erfassende Daten:** `document_record`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Dokumentenregister.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 7.5.2 – Erstellung und Aktualisierung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 7.5.2; PDF-Seite 18.
- **Fachliche Ableitung:** Kennzeichnung, Format, Review und Genehmigung sicherstellen.
- **Zu erfassende Daten:** `document_revision`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Dokument-Metadaten und Freigaben.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 7.5.3 – Dokumentenlenkung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 7.5.3; PDF-Seite 18.
- **Fachliche Ableitung:** Verfügbarkeit, Schutz, Zugriff, Versionen, Aufbewahrung und externe Dokumente steuern.
- **Zu erfassende Daten:** `document_control`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Zugriffsprotokolle; Revisionen; Retention.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


### 8. Betrieb


#### 8.1 – Betriebliche Planung/Steuerung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 8.1; PDF-Seite 19.
- **Fachliche Ableitung:** ISMS-Prozesse ausführen, externe Leistungen steuern und Änderungen kontrollieren.
- **Zu erfassende Daten:** `operational_control`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Prozessnachweise; Dienstleisterreviews.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 8.2 – Operative Risikobeurteilung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 8.2; PDF-Seite 19.
- **Fachliche Ableitung:** Risiken in festgelegten Intervallen und bei wesentlichen Änderungen erneut bewerten.
- **Zu erfassende Daten:** `risk_review`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Datiertes Risk Review.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 8.3 – Operative Risikobehandlung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 8.3; PDF-Seite 19.
- **Fachliche Ableitung:** Behandlungsplan umsetzen und Ergebnisse dokumentieren.
- **Zu erfassende Daten:** `treatment_execution`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Maßnahmenstatus; Wirksamkeitsnachweise.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


### 9. Bewertung der Leistung


#### 9.1 – Monitoring und Messung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 9.1; PDF-Seite 19.
- **Fachliche Ableitung:** Messobjekte, Methoden, Zeitpunkte, Rollen, Auswertung und Ergebnisse festlegen.
- **Zu erfassende Daten:** `performance_measure`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** KPI-Definitionen; Messergebnisse.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 9.2.1 – Internes Audit

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 9.2.1; PDF-Seite 20.
- **Fachliche Ableitung:** Konformität und wirksamen Betrieb durch interne Audits beurteilen.
- **Zu erfassende Daten:** `internal_audit`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Auditfeststellungen.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 9.2.2 – Auditprogramm

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 9.2.2; PDF-Seite 20.
- **Fachliche Ableitung:** Programm, Umfang, Kriterien, Objektivität, Ergebnisse und Berichtslinie steuern.
- **Zu erfassende Daten:** `audit_program`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Auditprogramm; Prüfplan; Bericht.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 9.3.1 – Managementbewertung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 9.3.1; PDF-Seite 21.
- **Fachliche Ableitung:** Regelmäßige Bewertung durch die oberste Leitung sicherstellen.
- **Zu erfassende Daten:** `management_review`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Management-Review-Protokoll.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 9.3.2 – Eingaben zum Managementreview

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 9.3.2; PDF-Seite 21.
- **Fachliche Ableitung:** Änderungen, Leistung, Audits, Risiken, Stakeholderfeedback und Verbesserungen einbeziehen.
- **Zu erfassende Daten:** `management_review_input`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Eingabe- und Entscheidungsunterlagen.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 9.3.3 – Ergebnisse des Managementreviews

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 9.3.3; PDF-Seite 21.
- **Fachliche Ableitung:** Verbesserungs- und Änderungsentscheidungen nachvollziehbar festhalten.
- **Zu erfassende Daten:** `management_review_output`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Beschlüsse; Folgeaufgaben.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


### 10. Verbesserung


#### 10.1 – Fortlaufende Verbesserung

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 10.1; PDF-Seite 21.
- **Fachliche Ableitung:** Eignung, Angemessenheit und Wirksamkeit systematisch verbessern.
- **Zu erfassende Daten:** `improvement_action`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** Verbesserungsregister.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


#### 10.2 – Nichtkonformität und Korrektur

- **Quelle:** ISO/IEC 27001:2022, Abschnitt 10.2; PDF-Seite 21.
- **Fachliche Ableitung:** Abweichungen behandeln, Ursachen prüfen, Abhilfe umsetzen und Wirksamkeit nachweisen.
- **Zu erfassende Daten:** `nonconformity`; Scope/Verantwortlicher, Status, Datum, verknüpfte Anforderungen und Quellenversion.
- **Mögliche Nachweise (Beispiele):** NC-Register; Ursachenanalyse; Wirksamkeitsprüfung.
- **KI-Prüfregel (Projektentscheidung):** Offene Punkte gezielt erfragen; Belegqualität prüfen; keine automatische Erfüllungsbestätigung ohne dokumentierte Kriterien und Review.


## 4. Anhang A und der Control-Katalog

- **37 organisatorische Controls:** 5.1–5.37.
- **8 personenbezogene Controls:** 6.1–6.8.
- **14 physische Controls:** 7.1–7.14.
- **34 technologische Controls:** 8.1–8.34.
- Detail-IDs, Kontrollthemen sowie nicht-normative Prüfimpulse: [`ISO-27002-Controls.md`](./ISO-27002-Controls.md).
- **Wichtig:** Eine einzelne Annex-A-Maßnahme ist nicht ohne Scope-/Risikoanalyse automatisch verpflichtend. Der dokumentierte Vollständigkeitsabgleich sowie das SoA folgen aus 6.1.3.

## 5. End-to-End-Arbeitsablauf

```text
Organisation/Scope -> Kontext & Stakeholder -> ISMS-Leitung & Politik
  -> Risk Criteria -> Risikobeurteilung -> Risk Treatment
  -> Annex-A-Abgleich -> SoA -> Risk Owner Approval
  -> Umsetzung & Dokumentenlenkung -> Messung -> Internes Audit
  -> Managementreview -> Nichtkonformitäten/Korrektur -> Verbesserung
```

**Prozessgrenzen:** Die Reihenfolge ist ein pragmatischer Implementierungsfluss. Die Normgliederung schreibt keine starre Projektabfolge vor; zahlreiche Aktivitäten laufen iterativ.

## 6. Daten- und Validierungsregeln

```yaml
isms_requirement_assessment:
  framework: ISO_IEC_27001
  edition: '2022'
  amendment: null # ISO/IEC 27001:2022/Amd 1:2024 separat prüfen und erst dann aktivieren
  clause: '6.1.3'
  assessment_id: null
  scope_id: null
  outcome: not_assessed # conforming | nonconforming | not_evidenced | needs_review
  evidence_ids: []
  findings: []
  reviewer_id: null
  reviewed_at: null
statement_of_applicability_entry:
  control_reference: ISO_IEC_27002_2022_8_4
  necessary: undecided
  inclusion_or_exclusion_rationale: null
  implementation_status: unknown
  linked_risks: []
  approved_by: null
```

**Versionshinweis:** Ein Amendment ist ein eigenständiger Quellenstand. Produktiv auf **ISO/IEC 27001:2022/Amd 1:2024** referenzieren, sobald die Quelle separat geprüft wurde.

## 7. Assessment-spezifische Geltung

| Assessment-Typ | 27001-Auswertung |
|---|---|
| Vollständiges ISMS Gap Assessment | Alle relevanten Anforderungen 4–10, Scope und Annex-A-/SoA-Prozess prüfen. |
| Readiness Assessment | Wie vorstehend, aber Vorbereitungsstatus statt Zertifizierungsurteil. |
| Third-Party Security Assessment | Nur explizit vereinbarte Kontrollen/Anforderungen prüfen, keine vollständige 27001-Konformität insinuieren. |
| Software Product Security Assessment | Produkt und Entwicklungs-/Betriebsprozesse abgrenzen; einzelne Controls sind keine Produktzertifizierung. |

## 8. Akzeptanzkriterien

- [ ] 30 Unterabschnitte 4–10 im fachlichen Mapping-Index erfasst.
- [ ] ISMS-Risiken und Informationssicherheitsrisiken getrennt modelliert.
- [ ] Risikoakzeptanzkriterien, Eigentümer, Entscheidungen und Nachweise hinterlegt.
- [ ] SoA vollständig, einschließlich Kontrollabgleich und Ausschlussbegründungen.
- [ ] Wiederholungsbeurteilungen bei planmäßigen Reviews und wesentlichen Änderungen möglich.
- [ ] Audit, Managementreview und Verbesserungsprozess nachvollziehbar ausführbar.
- [ ] 27001:2022/Amd 1:2024 **nicht stillschweigend als geprüft deklarieren**, solange die Quelle fehlt.
- [ ] Normwortlaut/Normrechte und Kundendatenschutz geklärt.

## 9. Quellenangabe

Primärquelle: **DIN EN ISO/IEC 27001:2024-01**, deutsche Fassung **EN ISO/IEC 27001:2023**, basierend auf **ISO/IEC 27001:2022**, Abschnitte 4–10 und Anhang A. Die Formulierungen dieser Datei sind fachliche Ableitungen und Projektentscheidungen; die Norm selbst bleibt maßgeblich.
