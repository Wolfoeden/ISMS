# Prüfbericht – Eingangsdokumente vom 2026-11-12

| | |
|---|---|
| Geprüft | `Vorschriften.md`, `ISO-27001-Anforderungen.md`, `ISO-27002-Controls.md` (unverändert in [`eingang-2026-11-12/`](eingang-2026-11-12/README.md), SHA256 dort) |
| Prüfmaßstab | innere Widerspruchsfreiheit, Übereinstimmung mit dem bestehenden Modell (`docs/01`, `plan.md`, Bibliothek), Umsetzbarkeit im Repository, Fachwissen zu ISO/IEC 27001/27002 |
| Grenze | Ein Abgleich mit dem Normtext war nicht möglich (kein Normexemplar verfügbar). „Bestätigt“ heißt plausibilisiert, nicht verifiziert – Verifikation über [ENT-014] |
| Ergebnis | Grundsätzlich solide und mit dem Arbeitssystem vereinbar. 20 Befunde: 2 hoch (Widersprüche), 9 mittel, 8 gering, 1 Hinweis. Übernommen in `vorschriften.md` Revision 2 und die Bibliothek; 8 Punkte als Entscheidungen ENT-018 bis ENT-025 vorgelegt |

## Befunde

| # | Schwere | Fundstelle | Befund | Umgang |
|---|---|---|---|---|
| P-01 | hoch | Vorschriften §9; ISO-27001 §2 Nr. 11 und §6; ISO-27002 §2 Nr. 5 und §4 | **Drei unvereinbare Statusmodelle:** 8 Werte (`evidence_missing` …), 6 Werte (`conforming`, `not_evidenced` …) und eine 10-Werte-Liste, die laut derselben Regel eigentlich drei getrennte Felder sein soll. | Harmonisiert in `vorschriften.md` §A8 mit Zuordnungstabelle; [ENT-018] |
| P-02 | hoch | Vorschriften §14 | Steuerungsprofile `micro` / `sme` / `enterprise` sind **Größenklassen** – Widerspruch zu §3 Nr. 2 derselben Datei und zum Grundsatz „Profile sind keine Größenklassen“. | Ersetzt durch Assurance Profile (§A13); Größe nur Eingangsgröße; [ENT-019] |
| P-03 | mittel | Vorschriften §4 | Leistungsarten und Mandatstypen des Modells decken sich nur teilweise (Product Security, Gap, Initial fehlen im Modell; Implementierung, NIS2 Readiness im Dokument). | Zuordnungstabelle §A3; [ENT-020] |
| P-04 | mittel | Vorschriften §4 Pilotfall, §15 | Organisation und Produkt sollen getrennte, verknüpfte Scopes sein; ein Mandat hat heute genau einen Freitext-Scope. | [ENT-021] |
| P-05 | mittel | Vorschriften §7 | Konfigurierbare, reproduzierbare Risikomethode gefordert; im Repository nicht vorhanden. | §A6; [ENT-022] |
| P-06 | mittel | ISO-27001 §6 (YAML) | SoA-Eintrag referenziert `ISO_IEC_27002_2022_8_4`. Das SoA ist eine Anforderung aus ISO/IEC 27001 6.1.3 und bezieht sich auf **deren Anhang A**. | §A7 Nr. 6; [ENT-023] |
| P-07 | mittel | ISO-27002 §5 | Prüfimpulse aller 93 Controls stammen aus 5 Satzvorlagen; 38 enthalten klein eingesetzte Titel; 4 sind grammatisch fehlerhaft (5.9, 5.10, 5.11, 7.9 – „Welche rückgabe von werten sind …“). Für Kundengespräche ungeeignet. | Nicht übernommen; [ENT-024] |
| P-08 | gering | ISO-27002 §5 | „Bewertungsregel“ ist bei allen 93 Controls identisch und trägt keine controlspezifische Information. | einmal in §A7 formuliert |
| P-09 | gering | ISO-27002 5.2, 6.3 | Titel ohne Ergänzungsstrich („… und verantwortlichkeiten“, „…, ausbildung und schulung“) – vermutlich Extraktionsfehler. | im Index korrigiert; gegen Norm prüfen |
| P-10 | mittel | Vorschriften §11 Nr. 6 | Prompt-Injection-Schutz war im Arbeitssystem nicht als Regel verankert, obwohl Agents Kundendokumente aus `notizen/` lesen. | `CLAUDE.md` Regel 8, Notiz-README |
| P-11 | mittel | Vorschriften §9 | Trennung `claim` / `evidence` / `observation` / `inference` / `decision` fehlte; Fragebogen-Antworten (Aussagen) hätten als Nachweis missverstanden werden können. | §A8 mit Zuordnung zu den Artefakten; `CLAUDE.md` Regel 9; Notiz-Kopf mit `art` |
| P-12 | gering | Vorschriften §11 Nr. 9 | KI-Vorschläge ohne Angabe der Eingaben. | Feld „Eingaben“ auf allen Entscheidungsseiten; Warnung in `pruefen` |
| P-13 | gering | Vorschriften §2.2 Nr. 2 | Verbindlichkeitsarten (Anforderung, Empfehlung, Definition …) waren im Bibliotheksmodell nicht abgebildet. | Pflichtfeld `verbindlichkeit`, von `pruefen` erzwungen |
| P-14 | gering | Vorschriften, Abschnitt „Ergänzende ISO-Fachspezifikationen“ | Verweise auf `./ISO-27001-Anforderungen.md` und `./ISO-27002-Controls.md` zeigen im Repository ins Leere. | ersetzt durch [BIB-ISO27001], [BIB-ISO27002] |
| P-15 | gering | ISO-27002 7.7, 7.10, 6.5 | Nachweiskategorien unpassend: Bildschirmsperren und Speichermedien als „Standort-/Zonenplan“, Beendigung der Beschäftigung als „Rollenmatrix“. | im Index geändert (TR, TR, PE), markiert ¹ |
| P-16 | mittel | ISO-27001 Kopf, ISO-27002 §1 | Quelle sind E-Books der TÜV Süd Akademie. Solche Lizenzen sind häufig personen- oder arbeitsplatzgebunden; die Nutzung als Grundlage einer gemeinsamen Wissensbasis für Berater und Agents ist nicht belegt. | [ENT-014] |
| P-17 | Hinweis | ISO-27001 Kopf | Amd 1:2024 korrekt als nicht enthalten gekennzeichnet. | bestätigt; in §B7 und [BIB-ISO27001] |
| P-18 | gering | Vorschriften §16 | NIS2 und DSGVO erst für P2 geplant – im Repository bereits quellengeprüft vorhanden. | §A15 aktualisiert |
| P-19 | gering | Vorschriften Kopf | Quellenbasis ISO/IEC 27000:2018; Aktualität der Ausgabe nicht geprüft (vom Dokument selbst gefordert). | offen in [BIB-ISO27000] |
| P-20 | mittel | Vorschriften §5, §6 | Gegenüber dem geforderten Ablauf fehlen im Repository Asset-Register, Evidenzregister mit Metadaten und Berichtserzeugung. | in §A4/§A5 als ○ markiert; Ausbau P0 |

## Bestätigt (plausibilisiert, nicht gegen Normtext verifiziert)

- ISO/IEC 27001: 30 Unterabschnitte der Abschnitte 4–10 vollständig, in der Gliederung der Ausgabe 2022 (u. a. 6.3 neu, 9.2.1/9.2.2, 9.3.1–9.3.3, 10.1 Verbesserung vor 10.2 Nichtkonformität).
- Abschnitte 4–10 nicht ausschließbar; Anhang A als Vollständigkeitsabgleich nach 6.1.3; SoA mit Begründung von Ein- und Ausschlüssen.
- ISO/IEC 27002 ist Leitfaden, keine Zertifizierungsnorm; 93 Controls, 37 / 8 / 14 / 34 (maschinell gezählt); fünf Attribute nach Abschnitt 4.2.
- Grundsätze ohne Befund: Mensch entscheidet, keine Scheinkonformität, keine Zertifikatsbehauptung, `Wahrscheinlichkeit × Auswirkung` nicht universell, 3PA erzeugt nicht automatisch ein SoA, Mandantentrennung, Reproduzierbarkeit.

## Geänderte Dateien

`vorschriften.md` (Revision 2: Teil A Projektvorschriften, Teil B Regelwerke) · `bibliothek/normen/iso-iec-27001-2022.md` (erweitert) · `bibliothek/normen/iso-iec-27002-2022-controls.md` (neu) · `bibliothek/normen/iso-iec-27000-2018.md` (neu) · `entscheidungen.md` (ENT-014 aktualisiert, ENT-018–ENT-025 neu) · `CLAUDE.md` (Regeln 6, 8–10) · `mandanten/_vorlage/isms.md` (Wirksamkeit getrennt, §6a, §6b) · `mandanten/_vorlage/entscheidungen.md` und Notiz-README · Prüfwerkzeug (`verbindlichkeit`, „Eingaben“, Abschnitte 4–10 ohne `not_applicable`).
