# ISO/IEC 27002 – Control-Katalog und KI-Prüfregeln

> **Projekt:** DT Agency – KI-gestützte ISMS-/GRC-/3PA-Plattform  
> **Status:** Fachliche Entwicklungsrichtlinie und Arbeitskatalog (keine Normabschrift)  
> **Quelle:** DIN EN ISO/IEC 27002:2024-01, deutsche Fassung von ISO/IEC 27002:2022, TÜV-Süd-Akademie-E-Book  
> **Stand der Aufbereitung:** 2026-11-12  
> **Verbindlich für:** Control Engine, Fragenkatalog, Evidence Engine, 3PA, SoA, Berichte

## 1. Einordnung und Grenzen

- **ISO/IEC 27002** ist ein Leitfaden zur Auswahl und Umsetzung von Informationssicherheitsmaßnahmen. **ISO/IEC 27001**, nicht 27002, enthält die Zertifizierungsanforderungen an ein ISMS.
- Die 93 Maßnahmen sind in vier Bereiche gegliedert: 5 (37 organisatorische), 6 (8 personenbezogene), 7 (14 physische) und 8 (34 technologische).
- Die 27001-Anhang-A-Maßnahmen dienen nach ISO/IEC 27001:2022 Abschnitt 6.1.3 als **Vollständigkeitsabgleich** für die risikobasiert ermittelten Maßnahmen. Ein Anhang-A-Control ist nicht automatisch für jeden Kunden verbindlich anzuwenden; Nichtanwendbarkeit ist im SoA zu begründen.
- Dieser Katalog enthält **nur Kontrollkennungen und knappe Bezeichnungen**, ergänzt um **eigenständig formulierte Prüfimpulse** und **Belegbeispiele**. Die Fragen und Nachweise sind **DT-Agency-Entwicklungsvorschläge**, keine ISO-Wortlautzitate, keine vollständige Umsetzungshilfe und keine automatische Konformitätsbewertung.
- Die PDF-Quelle unterliegt Nutzungsrechten. **Keine Volltextübernahme oder Weitergabe in öffentliche Repositories, Kundenprompts, RAG-Indizes oder Softwareprodukte ohne gesondert geprüfte Lizenz.**
- Der E-Book-Stand bildet nicht automatisch spätere Änderungen ab. Normen- und Änderungsstand vor produktiver Nutzung prüfen (siehe ISO-27001-Datei).

## 2. Verbindliche Plattformregeln (Projektentscheidungen)

1. Die Anwendung **MUSS** alle 93 Control-IDs stabil mit Framework, Edition und Abschnitt speichern.
2. Die Anwendung **MUSS** jeden Control-Eintrag mit Kunden-Scope, Assets, Risiken, Status, Verantwortlichen und Evidenzen verbinden können.
3. Ein Control **DARF NICHT** allein aufgrund eines Ja/Nein-Interviews als wirksam oder konform gelten.
4. Die KI **MUSS** fehlende, veraltete oder unzureichende Evidenzen ausweisen und gezielte Rückfragen ermöglichen.
5. Folgende Zustände **MÜSSEN** getrennt bleiben: `not_assessed`, `applicable`, `not_applicable`, `implementation_unknown`, `not_implemented`, `partially_implemented`, `implemented`, `effectiveness_unverified`, `effective`, `ineffective`. Anwendbarkeit, Umsetzung und Wirksamkeit sind **getrennte Felder**, keine einzige Zustandsliste.
6. Jede Nichtanwendbarkeit **MUSS** eine Scope-/Risikobegründung, Quelle, verantwortliche Person und Freigabe erhalten.
7. Jede Bewertung **MUSS** die Prüfkriterien, Quelle/Normversion, Evidenzen, Bewertungsmethode, Unsicherheit und prüfende Person festhalten.
8. Ein Control kann mehrere Anforderungen aus verschiedenen Frameworks unterstützen; die Abdeckung **DARF NICHT** allein aus der Control-ID als vollständig angenommen werden.
9. Dokumentierte Absicht, tatsächlich implementierte Maßnahme und nachgewiesene Wirksamkeit **MÜSSEN** unterscheidbar bleiben.
10. Die Plattform **SOLL** für Kleinstunternehmen einfache Nachweise und kompakte Dialoge anbieten, ohne risikorelevante Anforderungen pauschal auszuschließen.

## 3. Attribute der ISO/IEC 27002 (Abschnitt 4.2)

Die Norm beschreibt fünf Filter-/Sichtdimensionen. Für **jeden** Control-Datensatz sind diese als versionierte, mehrfach belegbare Tags vorzusehen:

| Attribut | Beispiele / Wertebereich |
|---|---|
| `control_type` | `preventive`, `detective`, `corrective` |
| `security_properties` | `confidentiality`, `integrity`, `availability` |
| `cybersecurity_concepts` | `identify`, `protect`, `detect`, `respond`, `recover` |
| `operational_capabilities` | z. B. `governance`, `asset_management`, `application_security`, `supplier_relationship_security` |
| `security_domains` | `governance_and_ecosystem`, `protection`, `defence`, `resilience` |

**Wichtig:** Die vollständige, maßnahmenspezifische Zuordnung der ISO-Attributwerte wird **nicht** aus allgemeinen Kategorien geraten. Sie ist bei lizenzkonformer Datenübernahme individuell aus der jeweiligen Attributtabelle (Normabschnitte 5–8) zu erfassen und fachlich zu prüfen. Bis dahin `mapping_review_status: pending` setzen.

## 4. Mindest-Datenmodell

```yaml
control_definition:
  framework: ISO_IEC_27002
  edition: '2022'
  national_edition: DIN_EN_ISO_IEC_27002_2024_01
  id: '8.4'
  name: 'Zugriff auf den Quellcode'
  source_clause: '8.4'
  control_tags: [] # nur nach quellengestützter Erfassung
  mapping_review_status: pending
  derived_assessment_prompt: null
control_assessment:
  assessment_id: null
  control_definition_id: null
  scope_id: null
  applicability: undecided # applicable | not_applicable | undecided
  applicability_justification: null
  implementation: unknown # absent | partial | present | unknown
  effectiveness: not_verified # effective | ineffective | not_verified
  evidence_ids: []
  risk_ids: []
  assessor_id: null
  reviewed_by: null
  reviewed_at: null
```

## 5. Vollständiger Control-Index (93 Maßnahmen)

Die Seitenangaben sind **PDF-Seiten der vorliegenden E-Book-Datei** (1-basiert), nicht die norminterne Seitennummer. Die nachstehenden Prüffragen und Nachweisbeispiele sind **nicht normativ**.


### 5. Organisatorische Maßnahmen


#### 5.1 – Informationssicherheitspolitik und -richtlinien

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.1; DIN-Ausgabe 2024-01; PDF-Seite 27.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für informationssicherheitspolitik und -richtlinien, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigte Richtlinie, Versionshistorie, Kommunikations- und Reviewnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.2 – Informationssicherheitsrollen und verantwortlichkeiten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.2; DIN-Ausgabe 2024-01; PDF-Seite 29.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für informationssicherheitsrollen und verantwortlichkeiten, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Rollen-/Befugnismatrix, Ernennungen, Freigaben und Kommunikationsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.3 – Aufgabentrennung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.3; DIN-Ausgabe 2024-01; PDF-Seite 30.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Aufgabentrennung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.4 – Verantwortlichkeiten der Leitung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.4; DIN-Ausgabe 2024-01; PDF-Seite 32.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Verantwortlichkeiten der Leitung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Rollen-/Befugnismatrix, Ernennungen, Freigaben und Kommunikationsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.5 – Kontakt mit Behörden

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.5; DIN-Ausgabe 2024-01; PDF-Seite 33.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Kontakt mit Behörden“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.6 – Kontakt mit speziellen Interessengruppen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.6; DIN-Ausgabe 2024-01; PDF-Seite 34.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Kontakt mit speziellen Interessengruppen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.7 – Informationen über die Bedrohungslage

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.7; DIN-Ausgabe 2024-01; PDF-Seite 34.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Informationen über die Bedrohungslage“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Verfahrensanweisung, Fall-/Ticketbeispiele, Auswertungen, Reaktions- und Verbesserungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.8 – Informationssicherheit im Projektmanagement

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.8; DIN-Ausgabe 2024-01; PDF-Seite 36.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für informationssicherheit im projektmanagement, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.9 – Inventar der Informationen und anderer damit verbundener Werte

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.9; DIN-Ausgabe 2024-01; PDF-Seite 38.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche inventar der informationen und anderer damit verbundener werte sind im Scope erfasst, wem sind sie zugeordnet und wie wird die Aktualität geprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.10 – Zulässiger Gebrauch von Informationen und anderen damit verbundenen Werten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.10; DIN-Ausgabe 2024-01; PDF-Seite 40.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche zulässiger gebrauch von informationen und anderen damit verbundenen werten sind im Scope erfasst, wem sind sie zugeordnet und wie wird die Aktualität geprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.11 – Rückgabe von Werten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.11; DIN-Ausgabe 2024-01; PDF-Seite 42.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche rückgabe von werten sind im Scope erfasst, wem sind sie zugeordnet und wie wird die Aktualität geprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.12 – Klassifizierung von Informationen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.12; DIN-Ausgabe 2024-01; PDF-Seite 43.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Klassifizierung von Informationen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.13 – Kennzeichnung von Informationen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.13; DIN-Ausgabe 2024-01; PDF-Seite 45.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Kennzeichnung von Informationen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.14 – Informationsübermittlung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.14; DIN-Ausgabe 2024-01; PDF-Seite 46.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Informationsübermittlung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.15 – Zugangssteuerung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.15; DIN-Ausgabe 2024-01; PDF-Seite 49.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Zugangssteuerung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.16 – Identitätsmanagement

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.16; DIN-Ausgabe 2024-01; PDF-Seite 52.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Identitätsmanagement“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.17 – Authentisierungsinformationen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.17; DIN-Ausgabe 2024-01; PDF-Seite 53.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Authentisierungsinformationen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.18 – Zugangsrechte

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.18; DIN-Ausgabe 2024-01; PDF-Seite 56.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Zugangsrechte“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.19 – Informationssicherheit in Lieferantenbeziehungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.19; DIN-Ausgabe 2024-01; PDF-Seite 58.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für informationssicherheit in lieferantenbeziehungen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Lieferanteninventar, Verträge, Due-Diligence-Unterlagen, Reviews und Maßnahmen.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.20 – Behandlung von Informationssicherheit in Lieferantenvereinbarungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.20; DIN-Ausgabe 2024-01; PDF-Seite 60.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für behandlung von informationssicherheit in lieferantenvereinbarungen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Lieferanteninventar, Verträge, Due-Diligence-Unterlagen, Reviews und Maßnahmen.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.21 – Umgang mit der Informationssicherheit in der IKT-Lieferkette

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.21; DIN-Ausgabe 2024-01; PDF-Seite 63.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für umgang mit der informationssicherheit in der ikt-lieferkette, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Lieferanteninventar, Verträge, Due-Diligence-Unterlagen, Reviews und Maßnahmen.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.22 – Überwachung, Überprüfung und Änderungsmanagement von Lieferantendienstleistungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.22; DIN-Ausgabe 2024-01; PDF-Seite 65.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie wird überwachung, überprüfung und änderungsmanagement von lieferantendienstleistungen umgesetzt, mit welchen Prüfintervallen und welchen dokumentierten Ergebnissen?
- **Mögliche Nachweise (Beispiele):** Lieferanteninventar, Verträge, Due-Diligence-Unterlagen, Reviews und Maßnahmen.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.23 – Informationssicherheit für die Nutzung von Cloud-Diensten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.23; DIN-Ausgabe 2024-01; PDF-Seite 67.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für informationssicherheit für die nutzung von cloud-diensten, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Lieferanteninventar, Verträge, Due-Diligence-Unterlagen, Reviews und Maßnahmen.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.24 – Planung und Vorbereitung der Handhabung von Informationssicherheitsvorfällen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.24; DIN-Ausgabe 2024-01; PDF-Seite 70.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für planung und vorbereitung der handhabung von informationssicherheitsvorfällen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.25 – Beurteilung und Entscheidung über Informationssicherheitsereignisse

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.25; DIN-Ausgabe 2024-01; PDF-Seite 72.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für beurteilung und entscheidung über informationssicherheitsereignisse, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Verfahrensanweisung, Fall-/Ticketbeispiele, Auswertungen, Reaktions- und Verbesserungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.26 – Reaktion auf Informationssicherheitsvorfälle

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.26; DIN-Ausgabe 2024-01; PDF-Seite 73.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für reaktion auf informationssicherheitsvorfälle, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.27 – Erkenntnisse aus Informationssicherheitsvorfällen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.27; DIN-Ausgabe 2024-01; PDF-Seite 74.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für erkenntnisse aus informationssicherheitsvorfällen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.28 – Sammeln von Beweismaterial

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.28; DIN-Ausgabe 2024-01; PDF-Seite 75.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Sammeln von Beweismaterial“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.29 – Informationssicherheit bei Störungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.29; DIN-Ausgabe 2024-01; PDF-Seite 76.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für informationssicherheit bei störungen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** BC-/Backup-Konzept, Konfigurations-/Statusauszug, Testprotokolle, Wiederherstellungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.30 – IKT-Bereitschaft für Business-Continuity

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.30; DIN-Ausgabe 2024-01; PDF-Seite 77.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „IKT-Bereitschaft für Business-Continuity“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** BC-/Backup-Konzept, Konfigurations-/Statusauszug, Testprotokolle, Wiederherstellungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.31 – Juristische, gesetzliche, regulatorische und vertragliche Anforderungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.31; DIN-Ausgabe 2024-01; PDF-Seite 78.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Juristische, gesetzliche, regulatorische und vertragliche Anforderungen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.32 – Geistige Eigentumsrechte

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.32; DIN-Ausgabe 2024-01; PDF-Seite 80.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Geistige Eigentumsrechte“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.33 – Schutz von Aufzeichnungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.33; DIN-Ausgabe 2024-01; PDF-Seite 82.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für schutz von aufzeichnungen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.34 – Datenschutz und Schutz personenbezogener Daten (pbD)

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.34; DIN-Ausgabe 2024-01; PDF-Seite 84.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für datenschutz und schutz personenbezogener daten (pbd), für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.35 – Unabhängige Überprüfung der Informationssicherheit

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.35; DIN-Ausgabe 2024-01; PDF-Seite 85.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie wird unabhängige überprüfung der informationssicherheit umgesetzt, mit welchen Prüfintervallen und welchen dokumentierten Ergebnissen?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.36 – Einhaltung von Richtlinien, Vorschriften und Normen für die Informationssicherheit

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.36; DIN-Ausgabe 2024-01; PDF-Seite 86.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für einhaltung von richtlinien, vorschriften und normen für die informationssicherheit, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigte Richtlinie, Versionshistorie, Kommunikations- und Reviewnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 5.37 – Dokumentierte Betriebsabläufe

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 5.37; DIN-Ausgabe 2024-01; PDF-Seite 87.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Dokumentierte Betriebsabläufe“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


### 6. Personenbezogene Maßnahmen


#### 6.1 – Sicherheitsüberprüfung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.1; DIN-Ausgabe 2024-01; PDF-Seite 89.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie wird sicherheitsüberprüfung umgesetzt, mit welchen Prüfintervallen und welchen dokumentierten Ergebnissen?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 6.2 – Beschäftigungs- und Vertragsbedingungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.2; DIN-Ausgabe 2024-01; PDF-Seite 90.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Beschäftigungs- und Vertragsbedingungen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Personal-/Schulungsprozess, Teilnahme- und Vertragsnachweise (datensparsam).
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 6.3 – Informationssicherheitsbewusstsein, ausbildung und schulung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.3; DIN-Ausgabe 2024-01; PDF-Seite 92.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für informationssicherheitsbewusstsein, ausbildung und schulung, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Personal-/Schulungsprozess, Teilnahme- und Vertragsnachweise (datensparsam).
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 6.4 – Maßregelungsprozess

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.4; DIN-Ausgabe 2024-01; PDF-Seite 94.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Maßregelungsprozess“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 6.5 – Verantwortlichkeiten bei Beendigung oder Änderung der Beschäftigung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.5; DIN-Ausgabe 2024-01; PDF-Seite 95.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Verantwortlichkeiten bei Beendigung oder Änderung der Beschäftigung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Rollen-/Befugnismatrix, Ernennungen, Freigaben und Kommunikationsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 6.6 – Vertraulichkeits- oder Geheimhaltungsvereinbarungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.6; DIN-Ausgabe 2024-01; PDF-Seite 96.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Vertraulichkeits- oder Geheimhaltungsvereinbarungen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Personal-/Schulungsprozess, Teilnahme- und Vertragsnachweise (datensparsam).
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 6.7 – Remote-Arbeit

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.7; DIN-Ausgabe 2024-01; PDF-Seite 97.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Remote-Arbeit“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Genehmigter Prozess bzw. Regelung, Umsetzungsbeleg, Stichprobe und Reviewprotokoll.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 6.8 – Meldung von Informationssicherheitsereignissen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 6.8; DIN-Ausgabe 2024-01; PDF-Seite 99.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist meldung von informationssicherheitsereignissen organisatorisch und technisch geregelt und welcher reale oder getestete Fall belegt die Anwendung?
- **Mögliche Nachweise (Beispiele):** Verfahrensanweisung, Fall-/Ticketbeispiele, Auswertungen, Reaktions- und Verbesserungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


### 7. Physische Maßnahmen


#### 7.1 – Physische Sicherheitsperimeter

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.1; DIN-Ausgabe 2024-01; PDF-Seite 100.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für physische sicherheitsperimeter, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.2 – Physischer Zutritt

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.2; DIN-Ausgabe 2024-01; PDF-Seite 101.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Physischer Zutritt“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.3 – Sichern von Büros, Räumen und Einrichtungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.3; DIN-Ausgabe 2024-01; PDF-Seite 103.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sichern von büros, räumen und einrichtungen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.4 – Physische Sicherheitsüberwachung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.4; DIN-Ausgabe 2024-01; PDF-Seite 104.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie wird physische sicherheitsüberwachung umgesetzt, mit welchen Prüfintervallen und welchen dokumentierten Ergebnissen?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.5 – Schutz vor physischen und umweltbedingten Bedrohungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.5; DIN-Ausgabe 2024-01; PDF-Seite 105.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für schutz vor physischen und umweltbedingten bedrohungen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.6 – Arbeiten in Sicherheitsbereichen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.6; DIN-Ausgabe 2024-01; PDF-Seite 107.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für arbeiten in sicherheitsbereichen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.7 – Aufgeräumte Arbeitsumgebung und Bildschirmsperren

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.7; DIN-Ausgabe 2024-01; PDF-Seite 108.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Aufgeräumte Arbeitsumgebung und Bildschirmsperren“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.8 – Platzierung und Schutz von Geräten und Betriebsmitteln

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.8; DIN-Ausgabe 2024-01; PDF-Seite 109.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für platzierung und schutz von geräten und betriebsmitteln, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.9 – Sicherheit von Werten außerhalb der Räumlichkeiten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.9; DIN-Ausgabe 2024-01; PDF-Seite 110.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche sicherheit von werten außerhalb der räumlichkeiten sind im Scope erfasst, wem sind sie zugeordnet und wie wird die Aktualität geprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.10 – Speichermedien

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.10; DIN-Ausgabe 2024-01; PDF-Seite 111.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Speichermedien“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.11 – Versorgungseinrichtungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.11; DIN-Ausgabe 2024-01; PDF-Seite 113.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Versorgungseinrichtungen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** BC-/Backup-Konzept, Konfigurations-/Statusauszug, Testprotokolle, Wiederherstellungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.12 – Sicherheit der Verkabelung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.12; DIN-Ausgabe 2024-01; PDF-Seite 114.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sicherheit der verkabelung, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.13 – Instandhaltung von Geräten und Betriebsmitteln

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.13; DIN-Ausgabe 2024-01; PDF-Seite 115.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Instandhaltung von Geräten und Betriebsmitteln“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 7.14 – Sichere Entsorgung oder Wiederverwendung von Geräten und Betriebsmitteln

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 7.14; DIN-Ausgabe 2024-01; PDF-Seite 116.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sichere entsorgung oder wiederverwendung von geräten und betriebsmitteln, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Standort-/Zonenplan, Zutritts- und Schutzkonzept, Inspektions-/Wartungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


### 8. Technologische Maßnahmen


#### 8.1 – Endpunktgeräte des Benutzers

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.1; DIN-Ausgabe 2024-01; PDF-Seite 118.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Endpunktgeräte des Benutzers“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.2 – Privilegierte Zugangsrechte

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.2; DIN-Ausgabe 2024-01; PDF-Seite 120.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Privilegierte Zugangsrechte“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.3 – Informationszugangsbeschränkung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.3; DIN-Ausgabe 2024-01; PDF-Seite 122.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Informationszugangsbeschränkung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.4 – Zugriff auf den Quellcode

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.4; DIN-Ausgabe 2024-01; PDF-Seite 124.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Zugriff auf den Quellcode“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.5 – Sichere Authentisierung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.5; DIN-Ausgabe 2024-01; PDF-Seite 125.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sichere authentisierung, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.6 – Kapazitätssteuerung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.6; DIN-Ausgabe 2024-01; PDF-Seite 127.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Kapazitätssteuerung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.7 – Schutz gegen Schadsoftware

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.7; DIN-Ausgabe 2024-01; PDF-Seite 129.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für schutz gegen schadsoftware, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.8 – Handhabung von technischen Schwachstellen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.8; DIN-Ausgabe 2024-01; PDF-Seite 131.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Handhabung von technischen Schwachstellen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Verfahrensanweisung, Fall-/Ticketbeispiele, Auswertungen, Reaktions- und Verbesserungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.9 – Konfigurationsmanagement

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.9; DIN-Ausgabe 2024-01; PDF-Seite 135.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Konfigurationsmanagement“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.10 – Löschung von Informationen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.10; DIN-Ausgabe 2024-01; PDF-Seite 137.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Löschung von Informationen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.11 – Datenmaskierung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.11; DIN-Ausgabe 2024-01; PDF-Seite 139.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Datenmaskierung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.12 – Verhinderung von Datenlecks

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.12; DIN-Ausgabe 2024-01; PDF-Seite 141.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Verhinderung von Datenlecks“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.13 – Sicherung von Informationen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.13; DIN-Ausgabe 2024-01; PDF-Seite 142.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sicherung von informationen, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** BC-/Backup-Konzept, Konfigurations-/Statusauszug, Testprotokolle, Wiederherstellungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.14 – Redundanz von informationsverarbeitenden Einrichtungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.14; DIN-Ausgabe 2024-01; PDF-Seite 144.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Redundanz von informationsverarbeitenden Einrichtungen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** BC-/Backup-Konzept, Konfigurations-/Statusauszug, Testprotokolle, Wiederherstellungsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.15 – Protokollierung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.15; DIN-Ausgabe 2024-01; PDF-Seite 145.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Protokollierung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.16 – Überwachung von Aktivitäten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.16; DIN-Ausgabe 2024-01; PDF-Seite 149.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie wird überwachung von aktivitäten umgesetzt, mit welchen Prüfintervallen und welchen dokumentierten Ergebnissen?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.17 – Uhrensynchronisation

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.17; DIN-Ausgabe 2024-01; PDF-Seite 151.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Uhrensynchronisation“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.18 – Gebrauch von Hilfsprogrammen mit privilegierten Rechten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.18; DIN-Ausgabe 2024-01; PDF-Seite 152.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Gebrauch von Hilfsprogrammen mit privilegierten Rechten“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** IAM-/Zutrittsregeln, Rollen-/Rechteexporte, Genehmigungs- und Rezertifizierungsprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.19 – Installation von Software auf Systemen in Betrieb

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.19; DIN-Ausgabe 2024-01; PDF-Seite 153.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Installation von Software auf Systemen in Betrieb“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.20 – Netzwerksicherheit

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.20; DIN-Ausgabe 2024-01; PDF-Seite 155.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für netzwerksicherheit, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.21 – Sicherheit von Netzwerkdiensten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.21; DIN-Ausgabe 2024-01; PDF-Seite 156.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sicherheit von netzwerkdiensten, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.22 – Trennung von Netzwerken

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.22; DIN-Ausgabe 2024-01; PDF-Seite 157.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Trennung von Netzwerken“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.23 – Webfilterung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.23; DIN-Ausgabe 2024-01; PDF-Seite 159.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Webfilterung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.24 – Verwendung von Kryptographie

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.24; DIN-Ausgabe 2024-01; PDF-Seite 160.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Verwendung von Kryptographie“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Standards, Konfigurationsauszüge, Logs, Reviews und Testnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.25 – Lebenszyklus einer sicheren Entwicklung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.25; DIN-Ausgabe 2024-01; PDF-Seite 162.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für lebenszyklus einer sicheren entwicklung, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** SDLC-Regeln, Repository-/Pipeline-Konfigurationen, Code Reviews, Test- und Freigabeprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.26 – Anforderungen an die Anwendungssicherheit

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.26; DIN-Ausgabe 2024-01; PDF-Seite 163.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für anforderungen an die anwendungssicherheit, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** SDLC-Regeln, Repository-/Pipeline-Konfigurationen, Code Reviews, Test- und Freigabeprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.27 – Sichere Systemarchitektur und Entwicklungsgrundsätze

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.27; DIN-Ausgabe 2024-01; PDF-Seite 166.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sichere systemarchitektur und entwicklungsgrundsätze, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** SDLC-Regeln, Repository-/Pipeline-Konfigurationen, Code Reviews, Test- und Freigabeprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.28 – Sichere Codierung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.28; DIN-Ausgabe 2024-01; PDF-Seite 168.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sichere codierung, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** SDLC-Regeln, Repository-/Pipeline-Konfigurationen, Code Reviews, Test- und Freigabeprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.29 – Sicherheitsprüfung bei Entwicklung und Abnahme

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.29; DIN-Ausgabe 2024-01; PDF-Seite 171.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für sicherheitsprüfung bei entwicklung und abnahme, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** SDLC-Regeln, Repository-/Pipeline-Konfigurationen, Code Reviews, Test- und Freigabeprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.30 – Ausgegliederte Entwicklung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.30; DIN-Ausgabe 2024-01; PDF-Seite 173.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Ausgegliederte Entwicklung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Lieferanteninventar, Verträge, Due-Diligence-Unterlagen, Reviews und Maßnahmen.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.31 – Trennung von Entwicklungs-, Test- und Produktionsumgebungen

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.31; DIN-Ausgabe 2024-01; PDF-Seite 174.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Trennung von Entwicklungs-, Test- und Produktionsumgebungen“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** SDLC-Regeln, Repository-/Pipeline-Konfigurationen, Code Reviews, Test- und Freigabeprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.32 – Änderungssteuerung

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.32; DIN-Ausgabe 2024-01; PDF-Seite 176.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Änderungssteuerung“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.33 – Testdaten

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.33; DIN-Ausgabe 2024-01; PDF-Seite 177.
- **Prüfimpuls (DT Agency, nicht normativ):** Wie ist das Thema „Testdaten“ für den definierten Scope geregelt, umgesetzt und nachweisbar überprüft?
- **Mögliche Nachweise (Beispiele):** SDLC-Regeln, Repository-/Pipeline-Konfigurationen, Code Reviews, Test- und Freigabeprotokolle.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


#### 8.34 – Schutz der Informationssysteme während Tests im Rahmen von Audits

- **Normfundstelle:** ISO/IEC 27002:2022, Abschnitt 8.34; DIN-Ausgabe 2024-01; PDF-Seite 178.
- **Prüfimpuls (DT Agency, nicht normativ):** Welche konkreten Maßnahmen bestehen für schutz der informationssysteme während tests im rahmen von audits, für welche Assets gelten sie und wie wird ihre Wirksamkeit überprüft?
- **Mögliche Nachweise (Beispiele):** Technische Richtlinie, Systemkonfiguration, Stichprobenprüfung und Betriebsnachweise.
- **Bewertungsregel:** Anwendbarkeit begründen; Aussagen anhand von Nachweisen überprüfen; verbleibende Evidenzlücken, Risiken und erforderliche Freigaben dokumentieren.


## 6. Verknüpfung mit ISO/IEC 27001 und Assessments

- `control_definition` ist ein **framework-bezogener Referenzkatalog**, `control_assessment` ist die **kundenspezifische Bewertung**; die Modelle dürfen nicht vermischt werden.
- Bei 27001-Projekten muss ein **Statement of Applicability (SoA)** inklusive begründeter Ein- und Ausschlüsse erzeugbar sein (ISO/IEC 27001:2022, 6.1.3).
- Bei 3PA ist eine Control-Prüfung nur dann ein ISO-27001-Konformitätsnachweis, wenn die Anforderungen 4–10 und der tatsächliche Scope hinreichend geprüft wurden. Sonst als begrenzte Sicherheitsbewertung ausweisen.
- Für Software-3PA gezielt u. a. die Bereiche 5.19–5.23, 5.24–5.30, 8.2–8.5, 8.8–8.9, 8.13–8.16, 8.24–8.34 betrachten; die endgültige Auswahl ergibt sich aus den Risiken und Vertragsanforderungen.
- Produkt-, Organisation- und Dienstleister-Scope **MÜSSEN** getrennt dokumentierbar sein.

## 7. Akzeptanzkriterien

- [ ] Exakt 93 Control-IDs vorhanden und eindeutig (37/8/14/34).
- [ ] Edition/Quellenbezug pro ID vorhanden.
- [ ] Anwendbarkeit, Implementierung und Wirksamkeit separat erfasst.
- [ ] Nichtanwendbarkeit begründet und durch Berechtigte geprüft.
- [ ] Aussagen/Nachweise/Prüfentscheidungen bleiben getrennt.
- [ ] KI behauptet keine zertifizierte Konformität aus Control-Einzelnachweisen.
- [ ] Normative Attribute und Wortlaut nur nach Rechte- und Quellenprüfung übernommen.

## 8. Quellenhinweis

Primärquelle der fachlichen Struktur: **DIN EN ISO/IEC 27002:2024-01**, deutsche Fassung von **ISO/IEC 27002:2022**, insbesondere Abschnitte 4.2–4.3, 5–8 sowie Anhänge A und B. Technische Regeln, Prüffragen und Beispieldokumente sind eigenständige DT-Agency-Ableitungen.
