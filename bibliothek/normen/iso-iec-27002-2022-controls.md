---
id: BIB-ISO27002
titel: ISO/IEC 27002:2022 – Control-Index (93 Kennungen), Attribute, Nachweiskategorien
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

**Kein Normtext.** Nur Kennungen, eigene Themenbezeichnungen und eigene Einordnung ([ENT-026]). Die Themenbezeichnungen sind keine Normtitel; maßgeblich für die Zuordnung ist allein die Kennung. Prüfimpulse und Nachweisbeispiele sind DT-Agency-Vorschläge, keine Normanforderungen. Freigabe durch einen Menschen mit Normexemplar ([ENT-014]).

## Kernaussagen (vor Freigabe mit dem Normexemplar abzugleichen)

1. **Leitfaden, keine Zertifizierungsnorm.** ISO/IEC 27002 erläutert Auswahl und Umsetzung von Maßnahmen; die Anforderungen an ein ISMS stehen in ISO/IEC 27001 ([BIB-ISO27001]).
2. **93 Maßnahmen in vier Themen:** 5 organisatorisch (37), 6 personenbezogen (8), 7 physisch (14), 8 technologisch (34). Die Kennungen entsprechen Anhang A der ISO/IEC 27001:2022 (dort mit Präfix „A.“).
3. **Fünf Attribute je Maßnahme** (Abschnitt 4.2): Maßnahmenart (präventiv, detektiv, korrektiv), Informationssicherheitseigenschaften (Vertraulichkeit, Integrität, Verfügbarkeit), Cybersicherheitskonzepte (Identifizieren, Schützen, Erkennen, Reagieren, Wiederherstellen), operative Fähigkeiten, Sicherheitsdomänen (Governance und Ökosystem, Schutz, Verteidigung, Resilienz). Die Zuordnung je Maßnahme ist **noch nicht erfasst** – nicht raten.
4. **Keine Maßnahme ist automatisch für jeden Kunden verpflichtend.** Auswahl risikobasiert; Ausschlüsse im SoA begründen ([BIB-ISO27001], 6.1.3).

## Control-Index

Nachweiskategorien (Beispiele, nicht normativ): **RL** Richtlinie, Versionshistorie, Kommunikation · **RO** Rollen-/Befugnismatrix, Ernennungen · **PR** geregelter Prozess, Umsetzungsbeleg, Stichprobe · **VO** Verfahrensanweisung, Fall-/Ticketbeispiele · **LI** Lieferanteninventar, Verträge, Due Diligence · **IAM** Rechteexporte, Rezertifizierung · **BC** BC-/Backup-Konzept, Wiederherstellungstests · **PE** Personalprozess, Teilnahme- und Vertragsnachweise (datensparsam) · **PH** Standort-/Zonenplan, Zutrittskonzept, Wartungsprotokolle · **TR** technische Richtlinie, Systemkonfiguration · **TS** technische Standards, Logs, Testnachweise · **SD** SDLC-Regeln, Pipeline-Konfiguration, Code Reviews.

¹ Kategorie gegenüber der Projektaufbereitung geändert (Prüfbericht P-15).

### 5 – Organisatorische Maßnahmen

| ID | Thema (DT-Agency-Bezeichnung) | Nachweis |
|---|---|---|
| 5.1 | Sicherheitsleitlinie und themenspezifische Richtlinien | RL |
| 5.2 | Zuständigkeiten für Informationssicherheit festlegen | RO |
| 5.3 | Unvereinbare Aufgaben trennen | PR |
| 5.4 | Leitung fordert Einhaltung ein | RO |
| 5.5 | Verbindung zu Behörden halten | PR |
| 5.6 | Austausch mit Fachgremien und Sicherheitsforen | PR |
| 5.7 | Erkenntnisse zu Bedrohungen gewinnen und auswerten | VO |
| 5.8 | Sicherheit in Projekten berücksichtigen | PR |
| 5.9 | Verzeichnis der Informationswerte und ihrer Verantwortlichen | PR |
| 5.10 | Regeln für den Umgang mit Informationswerten | PR |
| 5.11 | Herausgabe von Werten bei Austritt oder Vertragsende | PR |
| 5.12 | Schutzbedarf von Informationen einstufen | PR |
| 5.13 | Einstufung an Informationen sichtbar machen | PR |
| 5.14 | Sichere Weitergabe von Informationen | PR |
| 5.15 | Regeln für Zugang und Zugriff | IAM |
| 5.16 | Lebenszyklus digitaler Identitäten | IAM |
| 5.17 | Umgang mit Passwörtern und anderen Anmeldedaten | IAM |
| 5.18 | Vergabe, Überprüfung und Entzug von Berechtigungen | IAM |
| 5.19 | Sicherheitsanforderungen an Lieferanten | LI |
| 5.20 | Sicherheitsregelungen in Lieferantenverträgen | LI |
| 5.21 | Sicherheit in der IKT-Lieferkette | LI |
| 5.22 | Lieferantenleistungen überwachen und Änderungen steuern | LI |
| 5.23 | Sichere Nutzung von Cloud-Diensten | LI |
| 5.24 | Vorbereitung auf Sicherheitsvorfälle | PR |
| 5.25 | Ereignisse bewerten und als Vorfall einstufen | VO |
| 5.26 | Bearbeitung von Sicherheitsvorfällen | PR |
| 5.27 | Lernen aus Sicherheitsvorfällen | PR |
| 5.28 | Beweissicherung | PR |
| 5.29 | Sicherheit während Störungen aufrechterhalten | BC |
| 5.30 | IKT-Vorsorge für die Geschäftsfortführung | BC |
| 5.31 | Rechtliche, regulatorische und vertragliche Vorgaben ermitteln und einhalten | PR |
| 5.32 | Schutz von Urheber- und Schutzrechten | PR |
| 5.33 | Schutz von Aufzeichnungen und Nachweisen | PR |
| 5.34 | Schutz personenbezogener Daten | PR |
| 5.35 | Überprüfung durch unabhängige Stellen | PR |
| 5.36 | Einhaltung interner Sicherheitsvorgaben prüfen | RL |
| 5.37 | Betriebsabläufe dokumentieren und bereitstellen | PR |

### 6 – Personenbezogene Maßnahmen

| ID | Thema (DT-Agency-Bezeichnung) | Nachweis |
|---|---|---|
| 6.1 | Überprüfung von Bewerbern und Beschäftigten | PR |
| 6.2 | Sicherheitspflichten im Arbeits- bzw. Vertragsverhältnis | PE |
| 6.3 | Sensibilisierung und Schulung | PE |
| 6.4 | Konsequenzen bei Verstößen | PR |
| 6.5 | Pflichten bei Austritt oder Rollenwechsel | PE ¹ |
| 6.6 | Verschwiegenheitsvereinbarungen | PE |
| 6.7 | Sicheres Arbeiten außerhalb der Räumlichkeiten | PR |
| 6.8 | Melden von Sicherheitsereignissen durch Beschäftigte | VO |

### 7 – Physische Maßnahmen

| ID | Thema (DT-Agency-Bezeichnung) | Nachweis |
|---|---|---|
| 7.1 | Abgrenzung geschützter Bereiche | PH |
| 7.2 | Zutrittskontrolle | IAM |
| 7.3 | Schutz von Büros und Räumen | PH |
| 7.4 | Überwachung von Gebäuden und Bereichen | TS |
| 7.5 | Schutz vor Feuer, Wasser und anderen Umweltgefahren | PH |
| 7.6 | Regeln für Sicherheitsbereiche | PH |
| 7.7 | Aufgeräumter Arbeitsplatz und Sperren unbeaufsichtigter Geräte | TR ¹ |
| 7.8 | Standort und Schutz von Geräten | PH |
| 7.9 | Schutz mobiler Werte außerhalb des Standorts | PH |
| 7.10 | Umgang mit Datenträgern | TR ¹ |
| 7.11 | Strom und andere Versorgung absichern | BC |
| 7.12 | Schutz von Leitungen und Verkabelung | PH |
| 7.13 | Wartung von Geräten | PH |
| 7.14 | Daten vor Entsorgung oder Wiederverwendung von Geräten entfernen | PH |

### 8 – Technologische Maßnahmen

| ID | Thema (DT-Agency-Bezeichnung) | Nachweis |
|---|---|---|
| 8.1 | Schutz von Endgeräten | TR |
| 8.2 | Privilegierte Konten | IAM |
| 8.3 | Zugriff auf Informationen beschränken | IAM |
| 8.4 | Zugriff auf Quellcode und Entwicklungswerkzeuge | IAM |
| 8.5 | Sichere Anmeldung (z. B. Mehr-Faktor-Authentisierung) | IAM |
| 8.6 | Kapazitätsplanung und -überwachung | TR |
| 8.7 | Abwehr von Schadsoftware | TR |
| 8.8 | Schwachstellenmanagement | VO |
| 8.9 | Sichere Konfiguration und Konfigurationsverwaltung | TS |
| 8.10 | Löschen nicht mehr benötigter Informationen | TR |
| 8.11 | Maskierung und Pseudonymisierung von Daten | TR |
| 8.12 | Verhinderung von Datenabfluss | TR |
| 8.13 | Datensicherung und Wiederherstellung | BC |
| 8.14 | Redundanz kritischer Systeme | BC |
| 8.15 | Protokollierung von Ereignissen | TS |
| 8.16 | Überwachung auf ungewöhnliches Verhalten | TS |
| 8.17 | Einheitliche Zeitquelle | TR |
| 8.18 | Werkzeuge mit Administratorrechten kontrollieren | IAM |
| 8.19 | Softwareinstallation auf produktiven Systemen steuern | TR |
| 8.20 | Absicherung von Netzwerken | TS |
| 8.21 | Absicherung von Netzwerkdiensten | TS |
| 8.22 | Netzwerksegmentierung | TS |
| 8.23 | Filterung von Webzugriffen | TR |
| 8.24 | Einsatz von Kryptographie und Schlüsselverwaltung | TS |
| 8.25 | Sicherer Entwicklungsprozess | SD |
| 8.26 | Sicherheitsanforderungen an Anwendungen | SD |
| 8.27 | Sichere Architektur- und Entwicklungsprinzipien | SD |
| 8.28 | Sichere Programmierung | SD |
| 8.29 | Sicherheitstests in Entwicklung und Abnahme | SD |
| 8.30 | Steuerung ausgelagerter Entwicklung | LI |
| 8.31 | Getrennte Entwicklungs-, Test- und Produktionsumgebungen | SD |
| 8.32 | Änderungsmanagement | TR |
| 8.33 | Umgang mit Testdaten | SD |
| 8.34 | Systemschutz bei Audit- und Prüftests | TR |

## Bedeutung für die ISMS-Parameter

*Auslegung – verbindlich erst nach Freigabe.*

- Je Control drei **getrennte** Bewertungsfelder: Anwendbarkeit · Umsetzung · Wirksamkeit (`vorschriften.md` §A8).
- Erforderliche Umsetzungstiefe 1–4 nach Prüftiefenprofil und Risikotreibern (`src/proportionality/controls.ts`).
- Zuordnung zu den zehn Pflicht-Prüfbereichen des § 30 BSIG: `vorschriften.md` §B5.3 (Vorschlag).

## Grenzen und offene Punkte

- Themenbezeichnungen beim Abgleich mit dem Normexemplar auf eindeutige Zuordnung prüfen ([ENT-014]).
- Attributzuordnung je Maßnahme fehlt.
- Prüfimpulse je Maßnahme sind noch zu formulieren ([ENT-024]); die Vorlagen aus der Projektaufbereitung sind generisch und teils grammatisch fehlerhaft.
