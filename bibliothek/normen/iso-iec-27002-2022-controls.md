---
id: BIB-ISO27002
titel: ISO/IEC 27002:2022 – Control-Katalog (93 Maßnahmen), Attribute, Nachweiskategorien
art: norm
verbindlichkeit: empfehlung
rechtsraum: international
status: entwurf
quellen:
  - DIN EN ISO/IEC 27002:2024-01 (Deutsche Fassung EN ISO/IEC 27002:2022), lizenziertes E-Book (TÜV Süd Akademie)
  - docs/vorgaben/eingang-2026-11-12/ISO-27002-Controls.md (Projektaufbereitung, SHA256 a36d621e…)
stand_der_quelle: 2024-01-01
erfasst_von: Agent bibliothek aus Projektaufbereitung, 2026-11-12
freigegeben_von:
freigegeben_am:
naechste_pruefung: 2027-05-12
---
# ISO/IEC 27002:2022 – Control-Katalog

**Kein Normtext.** Nur Kennungen, Kurztitel und eigene Einordnung. Prüfimpulse und Nachweisbeispiele sind DT-Agency-Vorschläge, keine Normanforderungen. Freigabe durch einen Menschen mit Normexemplar ([ENT-014]).

## Kernaussagen (vor Freigabe mit dem Normexemplar abzugleichen)

1. **Leitfaden, keine Zertifizierungsnorm.** ISO/IEC 27002 erläutert Auswahl und Umsetzung von Maßnahmen; die Anforderungen an ein ISMS stehen in ISO/IEC 27001 ([BIB-ISO27001]).
2. **93 Maßnahmen in vier Themen:** 5 organisatorisch (37), 6 personenbezogen (8), 7 physisch (14), 8 technologisch (34). Die Kennungen entsprechen Anhang A der ISO/IEC 27001:2022 (dort mit Präfix „A.“).
3. **Fünf Attribute je Maßnahme** (Abschnitt 4.2): Maßnahmenart (präventiv, detektiv, korrektiv), Informationssicherheitseigenschaften (Vertraulichkeit, Integrität, Verfügbarkeit), Cybersicherheitskonzepte (Identifizieren, Schützen, Erkennen, Reagieren, Wiederherstellen), operative Fähigkeiten, Sicherheitsdomänen (Governance und Ökosystem, Schutz, Verteidigung, Resilienz). Die Zuordnung je Maßnahme ist **noch nicht erfasst** – nicht raten.
4. **Keine Maßnahme ist automatisch für jeden Kunden verpflichtend.** Auswahl risikobasiert; Ausschlüsse im SoA begründen ([BIB-ISO27001], 6.1.3).

## Control-Index

Nachweiskategorien (Beispiele, nicht normativ): **RL** Richtlinie, Versionshistorie, Kommunikation · **RO** Rollen-/Befugnismatrix, Ernennungen · **PR** geregelter Prozess, Umsetzungsbeleg, Stichprobe · **VO** Verfahrensanweisung, Fall-/Ticketbeispiele · **LI** Lieferanteninventar, Verträge, Due Diligence · **IAM** Rechteexporte, Rezertifizierung · **BC** BC-/Backup-Konzept, Wiederherstellungstests · **PE** Personalprozess, Teilnahme- und Vertragsnachweise (datensparsam) · **PH** Standort-/Zonenplan, Zutrittskonzept, Wartungsprotokolle · **TR** technische Richtlinie, Systemkonfiguration · **TS** technische Standards, Logs, Testnachweise · **SD** SDLC-Regeln, Pipeline-Konfiguration, Code Reviews.

¹ Kategorie gegenüber der Projektaufbereitung geändert (Prüfbericht P-15). PDF-S. = Seite im lizenzierten E-Book.

### 5 – Organisatorische Maßnahmen

| ID | Kurztitel (DIN-Ausgabe, zu prüfen) | Nachweis | PDF-S. |
|---|---|---|---|
| 5.1 | Informationssicherheitspolitik und -richtlinien | RL | 27 |
| 5.2 | Informationssicherheitsrollen und -verantwortlichkeiten | RO | 29 |
| 5.3 | Aufgabentrennung | PR | 30 |
| 5.4 | Verantwortlichkeiten der Leitung | RO | 32 |
| 5.5 | Kontakt mit Behörden | PR | 33 |
| 5.6 | Kontakt mit speziellen Interessengruppen | PR | 34 |
| 5.7 | Informationen über die Bedrohungslage | VO | 34 |
| 5.8 | Informationssicherheit im Projektmanagement | PR | 36 |
| 5.9 | Inventar der Informationen und anderer damit verbundener Werte | PR | 38 |
| 5.10 | Zulässiger Gebrauch von Informationen und anderen damit verbundenen Werten | PR | 40 |
| 5.11 | Rückgabe von Werten | PR | 42 |
| 5.12 | Klassifizierung von Informationen | PR | 43 |
| 5.13 | Kennzeichnung von Informationen | PR | 45 |
| 5.14 | Informationsübermittlung | PR | 46 |
| 5.15 | Zugangssteuerung | IAM | 49 |
| 5.16 | Identitätsmanagement | IAM | 52 |
| 5.17 | Authentisierungsinformationen | IAM | 53 |
| 5.18 | Zugangsrechte | IAM | 56 |
| 5.19 | Informationssicherheit in Lieferantenbeziehungen | LI | 58 |
| 5.20 | Behandlung von Informationssicherheit in Lieferantenvereinbarungen | LI | 60 |
| 5.21 | Umgang mit der Informationssicherheit in der IKT-Lieferkette | LI | 63 |
| 5.22 | Überwachung, Überprüfung und Änderungsmanagement von Lieferantendienstleistungen | LI | 65 |
| 5.23 | Informationssicherheit für die Nutzung von Cloud-Diensten | LI | 67 |
| 5.24 | Planung und Vorbereitung der Handhabung von Informationssicherheitsvorfällen | PR | 70 |
| 5.25 | Beurteilung und Entscheidung über Informationssicherheitsereignisse | VO | 72 |
| 5.26 | Reaktion auf Informationssicherheitsvorfälle | PR | 73 |
| 5.27 | Erkenntnisse aus Informationssicherheitsvorfällen | PR | 74 |
| 5.28 | Sammeln von Beweismaterial | PR | 75 |
| 5.29 | Informationssicherheit bei Störungen | BC | 76 |
| 5.30 | IKT-Bereitschaft für Business-Continuity | BC | 77 |
| 5.31 | Juristische, gesetzliche, regulatorische und vertragliche Anforderungen | PR | 78 |
| 5.32 | Geistige Eigentumsrechte | PR | 80 |
| 5.33 | Schutz von Aufzeichnungen | PR | 82 |
| 5.34 | Datenschutz und Schutz personenbezogener Daten (pbD) | PR | 84 |
| 5.35 | Unabhängige Überprüfung der Informationssicherheit | PR | 85 |
| 5.36 | Einhaltung von Richtlinien, Vorschriften und Normen für die Informationssicherheit | RL | 86 |
| 5.37 | Dokumentierte Betriebsabläufe | PR | 87 |

### 6 – Personenbezogene Maßnahmen

| ID | Kurztitel (DIN-Ausgabe, zu prüfen) | Nachweis | PDF-S. |
|---|---|---|---|
| 6.1 | Sicherheitsüberprüfung | PR | 89 |
| 6.2 | Beschäftigungs- und Vertragsbedingungen | PE | 90 |
| 6.3 | Informationssicherheitsbewusstsein, -ausbildung und -schulung | PE | 92 |
| 6.4 | Maßregelungsprozess | PR | 94 |
| 6.5 | Verantwortlichkeiten bei Beendigung oder Änderung der Beschäftigung | PE ¹ | 95 |
| 6.6 | Vertraulichkeits- oder Geheimhaltungsvereinbarungen | PE | 96 |
| 6.7 | Remote-Arbeit | PR | 97 |
| 6.8 | Meldung von Informationssicherheitsereignissen | VO | 99 |

### 7 – Physische Maßnahmen

| ID | Kurztitel (DIN-Ausgabe, zu prüfen) | Nachweis | PDF-S. |
|---|---|---|---|
| 7.1 | Physische Sicherheitsperimeter | PH | 100 |
| 7.2 | Physischer Zutritt | IAM | 101 |
| 7.3 | Sichern von Büros, Räumen und Einrichtungen | PH | 103 |
| 7.4 | Physische Sicherheitsüberwachung | TS | 104 |
| 7.5 | Schutz vor physischen und umweltbedingten Bedrohungen | PH | 105 |
| 7.6 | Arbeiten in Sicherheitsbereichen | PH | 107 |
| 7.7 | Aufgeräumte Arbeitsumgebung und Bildschirmsperren | TR ¹ | 108 |
| 7.8 | Platzierung und Schutz von Geräten und Betriebsmitteln | PH | 109 |
| 7.9 | Sicherheit von Werten außerhalb der Räumlichkeiten | PH | 110 |
| 7.10 | Speichermedien | TR ¹ | 111 |
| 7.11 | Versorgungseinrichtungen | BC | 113 |
| 7.12 | Sicherheit der Verkabelung | PH | 114 |
| 7.13 | Instandhaltung von Geräten und Betriebsmitteln | PH | 115 |
| 7.14 | Sichere Entsorgung oder Wiederverwendung von Geräten und Betriebsmitteln | PH | 116 |

### 8 – Technologische Maßnahmen

| ID | Kurztitel (DIN-Ausgabe, zu prüfen) | Nachweis | PDF-S. |
|---|---|---|---|
| 8.1 | Endpunktgeräte des Benutzers | TR | 118 |
| 8.2 | Privilegierte Zugangsrechte | IAM | 120 |
| 8.3 | Informationszugangsbeschränkung | IAM | 122 |
| 8.4 | Zugriff auf den Quellcode | IAM | 124 |
| 8.5 | Sichere Authentisierung | IAM | 125 |
| 8.6 | Kapazitätssteuerung | TR | 127 |
| 8.7 | Schutz gegen Schadsoftware | TR | 129 |
| 8.8 | Handhabung von technischen Schwachstellen | VO | 131 |
| 8.9 | Konfigurationsmanagement | TS | 135 |
| 8.10 | Löschung von Informationen | TR | 137 |
| 8.11 | Datenmaskierung | TR | 139 |
| 8.12 | Verhinderung von Datenlecks | TR | 141 |
| 8.13 | Sicherung von Informationen | BC | 142 |
| 8.14 | Redundanz von informationsverarbeitenden Einrichtungen | BC | 144 |
| 8.15 | Protokollierung | TS | 145 |
| 8.16 | Überwachung von Aktivitäten | TS | 149 |
| 8.17 | Uhrensynchronisation | TR | 151 |
| 8.18 | Gebrauch von Hilfsprogrammen mit privilegierten Rechten | IAM | 152 |
| 8.19 | Installation von Software auf Systemen in Betrieb | TR | 153 |
| 8.20 | Netzwerksicherheit | TS | 155 |
| 8.21 | Sicherheit von Netzwerkdiensten | TS | 156 |
| 8.22 | Trennung von Netzwerken | TS | 157 |
| 8.23 | Webfilterung | TR | 159 |
| 8.24 | Verwendung von Kryptographie | TS | 160 |
| 8.25 | Lebenszyklus einer sicheren Entwicklung | SD | 162 |
| 8.26 | Anforderungen an die Anwendungssicherheit | SD | 163 |
| 8.27 | Sichere Systemarchitektur und Entwicklungsgrundsätze | SD | 166 |
| 8.28 | Sichere Codierung | SD | 168 |
| 8.29 | Sicherheitsprüfung bei Entwicklung und Abnahme | SD | 171 |
| 8.30 | Ausgegliederte Entwicklung | LI | 173 |
| 8.31 | Trennung von Entwicklungs-, Test- und Produktionsumgebungen | SD | 174 |
| 8.32 | Änderungssteuerung | TR | 176 |
| 8.33 | Testdaten | SD | 177 |
| 8.34 | Schutz der Informationssysteme während Tests im Rahmen von Audits | TR | 178 |

## Bedeutung für die ISMS-Parameter

*Auslegung – verbindlich erst nach Freigabe.*

- Je Control drei **getrennte** Bewertungsfelder: Anwendbarkeit · Umsetzung · Wirksamkeit (`vorschriften.md` §A8).
- Erforderliche Umsetzungstiefe 1–4 nach Assurance Profile und Risikotreibern (`src/proportionality/controls.ts`).
- Zuordnung zu den zehn Pflicht-Prüfbereichen des § 30 BSIG: `vorschriften.md` §B5.3 (Vorschlag).

## Grenzen und offene Punkte

- Kurztitel gegen die DIN-Ausgabe prüfen (Schreibweise; zwei Titel wurden korrigiert: 5.2, 6.3).
- Attributzuordnung je Maßnahme fehlt.
- Prüfimpulse je Maßnahme sind noch zu formulieren ([ENT-024]); die Vorlagen aus der Projektaufbereitung sind generisch und teils grammatisch fehlerhaft.
