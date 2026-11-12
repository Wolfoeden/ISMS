# Entscheidungsseite – Methodik und Bibliothek

Hier landet alles, was für **alle Mandate** fehlt oder offen ist: Methodikfragen, fehlendes Wissen, Organisation von DT Agency. Mandatsspezifische Entscheidungen stehen in `mandanten/<kürzel>/entscheidungen.md` (IDs `E-001` …).

## Ablauf

```
offen ──▶ vorgeschlagen ──▶ freigegeben ──▶ abgelegt
  Lücke      Agent/Berater     Mensch           Ergebnis übertragen
  erkannt    mit Grundlagen    entscheidet      (Bibliothek, plan.md, vorschriften.md, Code)
                         └──▶ verworfen
```

| Status | Bedeutung | Wer |
|---|---|---|
| `offen` | Lücke erkannt, noch kein Vorschlag | Agent oder Mensch |
| `vorgeschlagen` | Optionen und Empfehlung mit Grundlagen (`BIB-…`) | Agent oder Mensch |
| `freigegeben` | Entscheidung getroffen, Grundlagen geprüft; Name + Datum | **nur Mensch** |
| `abgelegt` | Ergebnis ist im Zielartefakt übernommen; „Abgelegt in“ gesetzt | Agent oder Mensch |
| `verworfen` | nicht weiter verfolgt, mit Begründung | Mensch |

Typen: `klaerung` · `scope` · `einstufung` · `anwendbarkeit` · `wissen` · `methodik` · `risiko` · `finding` · `massnahme` · `organisation` – Pflichtfelder für `finding`, `risiko`, `massnahme`: siehe `mandanten/_vorlage/entscheidungen.md`.

„Freigegeben“ heißt überall: Ein namentlich benannter, berechtigter Mensch hat geprüft und genehmigt ([ENT-027]). „Freigegeben von“ nennt Name und Rolle.

Neue Entscheidung: Abschnitt mit nächster freier ID nach diesem Muster anlegen und `npm run isms -- pruefen` ausführen.

```
## ENT-0xx · Titel
- **Status:** offen
- **Typ:** methodik
- **Ausgelöst durch:** was fehlt / wo es aufgefallen ist
- **Betrifft:** Artefakte, Fragen, Code
- **Grundlagen:** BIB-…
- **Eingaben:** Notizen, Fragebogen-IDs, Dokumente, auf die sich der Vorschlag stützt
- **Optionen:**
  1. …
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —
```

---

## ENT-001 · Policy 2026-11.1 als Startkalibrierung freigeben
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** docs/01 §11 O1 – Schwellwerte, Gewichte und Profilparameter sind eine Erstkalibrierung
- **Betrifft:** src/proportionality/profile.ts, src/proportionality/parameters.ts, BIB-MET-PROFIL, plan.md §5
- **Grundlagen:** BIB-BSIG-30, BIB-MET-PROFIL
- **Optionen:**
  1. Freigeben als vorläufig; nach 10 abgeschlossenen Mandaten mit Ist-Daten nachkalibrieren
  2. Vor Freigabe an 10–20 historischen Kundenfällen rückwirkend testen
- **Vorschlag:** Option 2 light: an 5 bekannten Kunden rückwirkend durchrechnen, Abweichungen vom Bauchgefühl als Kalibrierungsfälle dokumentieren, dann vorläufig freigeben.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-002 · Untergrenze für NIS2 „wichtige Einrichtung“
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** docs/01 §11 O2
- **Betrifft:** Untergrenzen F2–F4, src/proportionality/profile.ts, vorschriften.md §B2
- **Grundlagen:** BIB-BSIG-28, BIB-BSIG-30
- **Optionen:**
  1. wichtig → mind. Profil 3; besonders wichtig → 4; wichtig + OT oder sehr hohe Kritikalität → 4 (aktueller Stand)
  2. jede NIS2-Einrichtung → Profil 4
- **Vorschlag:** Option 1. § 30 Abs. 1 Satz 2 BSIG verlangt ausdrücklich, die Größe der Einrichtung bei der Verhältnismäßigkeit zu berücksichtigen; eine pauschale Einstufung aller wichtigen Einrichtungen in Profil 4 widerspräche dem. Die gesetzlichen Pflichten (Meldewege, Registrierung, Geschäftsleitung) gelten unabhängig davon über [ENT-009].
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-003 · ISO-27001-Zertifizierungsziel → mindestens Profil 2
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** docs/01 §11 O3
- **Betrifft:** Untergrenze F7
- **Grundlagen:** BIB-ISO27001
- **Optionen:**
  1. Untergrenze Profil 2 beibehalten
  2. Untergrenze streichen; Lean-Profil um zertifizierungsrelevante Pflichtartefakte ergänzen
- **Vorschlag:** Option 1. Hinweis: BIB-ISO27001 ist noch nicht freigegeben ([ENT-014]).
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-004 · Kundenrollen ISMS Manager/CISO und ISMS Coordinator getrennt führen
- **Status:** vorgeschlagen
- **Typ:** organisation
- **Ausgelöst durch:** docs/01 §11 O4 – Konzept nennt beide Rollen
- **Betrifft:** src/engagement/model.ts, src/proportionality/parameters.ts
- **Grundlagen:** —
- **Optionen:**
  1. getrennt (fachlich verantwortlich vs. operativ koordinierend), dürfen dieselbe Person sein
  2. zusammenlegen
- **Vorschlag:** Option 1 (aktueller Stand).
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-005 · Wer bestätigt kritische Findings?
- **Status:** vorgeschlagen
- **Typ:** organisation
- **Ausgelöst durch:** docs/01 §11 O5
- **Betrifft:** src/engagement/findings.ts, src/engagement/governance.ts (Regel G4)
- **Grundlagen:** —
- **Optionen:**
  1. Engagement Lead, Independent Reviewer, SME der Domäne
  2. zusätzlich erfahrene (nicht-junior) Consultants
- **Vorschlag:** Option 1 (aktueller Stand).
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-006 · Zweitprüfung kritischer Findings in Lean-Mandaten mit nur einem Senior
- **Status:** offen
- **Typ:** organisation
- **Ausgelöst durch:** docs/01 §11 O6 / E9
- **Betrifft:** Solo Developer Security Assessment, Regel G3
- **Grundlagen:** —
- **Optionen:**
  1. Pool-Review: ein anderer Senior von DT Agency prüft kritische Findings (Aufwand ca. 30–60 min je Mandat)
  2. Selbstprüfung mit dokumentierter Begründung, stichprobenhafte QA quartalsweise
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-007 · Ab wann sieht der Kunde Findings?
- **Status:** vorgeschlagen
- **Typ:** organisation
- **Ausgelöst durch:** docs/01 §11 O7
- **Betrifft:** Quality Gate, RLS-Regel finding_customer
- **Grundlagen:** —
- **Optionen:**
  1. ab Status `customer_discussion`
  2. bereits ab `confirmed`
- **Vorschlag:** Option 1 (aktueller Stand) – Findings werden immer zuerst besprochen, nicht zugestellt.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-008 · Third-Party Pre-Assessment
- **Status:** offen
- **Typ:** methodik
- **Ausgelöst durch:** docs/01 §11 O8 – Template „Third-Party Assessment“ ohne eigenen Fragebogen
- **Betrifft:** src/fragebogen/katalog.ts
- **Grundlagen:** BIB-BSIG-30
- **Optionen:**
  1. verkürzte Teilmenge des Triage-Fragebogens
  2. eigener Katalog entlang § 30 Abs. 2 Nr. 4 BSIG (Lieferkette)
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-009 · Gesetzliche Pflichten als profilunabhängige Pflichtmodule
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** docs/01 §11 O9; Quellenauswertung BSIG §§ 30, 32, 33, 38, 39
- **Betrifft:** vorschriften.md, isms.md §3/§6, Prüfbereiche
- **Grundlagen:** BIB-BSIG-30, BIB-BSIG-32, BIB-BSIG-33, BIB-BSIG-38, BIB-BSIG-39, BIB-DSGVO-32
- **Optionen:**
  1. Pflichtmodule je Vorschrift, unabhängig vom Profil; das Profil steuert nur die Tiefe
  2. Pflichten in die Profilparameter einrechnen
- **Vorschlag:** Option 1. NIS2-Modul: Registrierung (3 Monate, Änderungen 2 Wochen), Meldeworkflow 24 h / 72 h / 1 Monat, Geschäftsleitung umsetzen/überwachen/Schulung plus dokumentierte Billigung, alle zehn Bereiche nach § 30 Abs. 2 als Pflicht-Prüfbereiche. KRITIS-Modul: Nachweis alle 3 Jahre. DSGVO-Modul: Meldung 72 h, TOM-Wirksamkeitsprüfung.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-010 · Anlässe für eine Neubewertung des Profils
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** docs/01 §11 O10
- **Betrifft:** plan.md §4 Phase 6
- **Grundlagen:** BIB-BSIG-33
- **Optionen:**
  1. jährlich und anlassbezogen
  2. nur anlassbezogen
- **Vorschlag:** Option 1. Anlässe: Umstrukturierung/M&A, Wechsel der Größenklasse, neue Einrichtungsart, Einführung von OT oder kritischer KI, neue kritische Lieferanten, Gesetzesänderung. Änderungen der Registrierungsdaten lösen zusätzlich die 2-Wochen-Meldung aus.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-011 · Nur DT Agency oder mehrere Beratungshäuser?
- **Status:** offen
- **Typ:** organisation
- **Ausgelöst durch:** docs/01 §11 O11
- **Betrifft:** Datenmodell, Rechte
- **Grundlagen:** —
- **Optionen:**
  1. nur DT Agency
  2. mehrere Beratungshäuser (Mehrmandantenfähigkeit)
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-012 · Wo liegen Mandatsdaten?
- **Status:** offen
- **Typ:** organisation
- **Ausgelöst durch:** Fragebogen, Notizen und isms.md enthalten vertrauliche Kundendaten
- **Betrifft:** mandanten/, Zugriffsrechte, Löschfristen
- **Grundlagen:** BIB-DSGVO-32
- **Optionen:**
  1. in diesem privaten Repository unter mandanten/ (einfach; alle mit Repo-Zugriff sehen alle Kunden)
  2. ein privates Repository je Kunde, Methodik und Bibliothek als Abhängigkeit (Trennung, Löschung je Kunde möglich)
  3. Mandatsdaten außerhalb von Git (z. B. Plattform-Datenbank), nur Methodik im Repo
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-013 · Wer darf freigeben?
- **Status:** offen
- **Typ:** organisation
- **Ausgelöst durch:** Statusmodell von Bibliothek und Entscheidungen verlangt benannte Menschen
- **Betrifft:** plan.md §6, CLAUDE.md
- **Grundlagen:** —
- **Eingaben:** Chat 2026-11-12: Paul (zertifizierter CISO) gibt die ISO-Bibliothekseinträge frei und hat ENT-018, ENT-019, ENT-027, ENT-028 freigegeben – offen bleibt, wer außer ihm freigeben darf (z. B. Engagement Lead je Mandat, Risk Owner beim Kunden)
- **Optionen:**
  1. Bibliothek und Methodik: Methodik-Verantwortliche/r; Mandatsentscheidungen: Engagement Lead; Risikoakzeptanz und Scope: Kunde (Executive Sponsor / Risk Owner)
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-014 · Zugang zu lizenzierten Normen und Freigabe der ISO-Einträge
- **Status:** vorgeschlagen
- **Typ:** wissen
- **Ausgelöst durch:** BIB-ISO27001 ohne Normexemplar nicht verifizierbar; am 2026-11-12 Projektaufbereitungen aus DIN EN ISO/IEC 27001:2024-01, DIN EN ISO/IEC 27002:2024-01 (TÜV-Süd-Akademie-E-Book) und ISO/IEC 27000:2018 geliefert
- **Betrifft:** bibliothek/normen/, vorschriften.md §B4, §B5
- **Grundlagen:** BIB-ISO27000, BIB-ISO27001, BIB-ISO27002
- **Eingaben:** docs/vorgaben/eingang-2026-11-12/, docs/vorgaben/pruefbericht-2026-11-12.md; Chat 2026-11-12: Paul übernimmt den Abgleich
- **Optionen:**
  1. Ein Mensch mit Zugriff auf die E-Books gleicht die drei Einträge ab (Kennungen, eindeutige Zuordnung der Themenbezeichnungen, Kernaussagen) und gibt sie frei
  2. zusätzlich Amd 1:2024 beschaffen und als eigenen Eintrag erfassen
- **Vorschlag:** Option 1 durch Paul, Option 2 danach. Lizenz- und Urheberrechtsfrage getrennt in [ENT-026].
- **Zuständig:** Paul, zertifizierter CISO (laut Chat 2026-11-12)
- **Vorgeschlagen von:** Agent bibliothek, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-015 · Wissen fehlt: „kritische Anlage“ und KRITIS-Dachgesetz
- **Status:** offen
- **Typ:** wissen
- **Ausgelöst durch:** BIB-BSIG-28, Grenzen
- **Betrifft:** Fragebogen REG-03, Untergrenze F1
- **Grundlagen:** BIB-BSIG-28
- **Optionen:**
  1. § 2 Nr. 22 BSIG, KRITIS-Dachgesetz und zugehörige Rechtsverordnung als Snapshots erfassen
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-016 · Wissen fehlt: KMU-Anhang Art. 3–5 (verbundene Unternehmen, Jahresarbeitseinheiten)
- **Status:** offen
- **Typ:** wissen
- **Ausgelöst durch:** BIB-KMU, Grenzen
- **Betrifft:** Fragebogen ORG-01, STA-08; NIS2-Vorprüfung
- **Grundlagen:** BIB-KMU
- **Optionen:**
  1. Snapshot von Art. 3–6 des Anhangs ziehen, Eintrag BIB-KMU erweitern
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-017 · Wissen fehlt: weitere Regelwerke
- **Status:** offen
- **Typ:** wissen
- **Ausgelöst durch:** vorschriften.md §B7 – DORA, KI-Verordnung, Cyber Resilience Act, TISAX, BSI IT-Grundschutz sind nicht erfasst
- **Betrifft:** vorschriften.md, Fragebogen REG-05, KI-01–KI-04
- **Grundlagen:** —
- **Optionen:**
  1. nach Kundenbedarf priorisieren: erst erfassen, wenn ein Mandat sie braucht
  2. vorab vollständig erfassen
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-018 · Einheitliches Bewertungsstatusmodell
- **Status:** abgelegt
- **Typ:** methodik
- **Ausgelöst durch:** Prüfbericht P-01; Auftrag Paul 2026-11-12: Statusmodell muss in die gesamte Logik passen
- **Betrifft:** vorschriften.md §A8, isms.md §6, db/migrations (künftige Tabellen)
- **Grundlagen:** BIB-ISO27001, BIB-ISO27002
- **Eingaben:** docs/vorschlaege/2026-11-12-statusmodell-und-groessenklassen.md
- **Optionen:**
  A. eine Liste mit 8 Werten (Stand vorschriften.md §A8)
  B. Achsenmodell: Anwendbarkeit, Erfüllung bzw. Umsetzung/Wirksamkeit, Evidenzlage, Freigabe getrennt
  C. wie B, der 8-Werte-Status wird für Berichte berechnet (Regeln R1–R6, Ableitungstabelle)
  Teilfragen: 018.1 Sprache der Werte · 018.2 Lücke schon auf Aussage hin berichten · 018.3 Wirksamkeitspflicht ab Tiefe 3
- **Vorschlag:** C mit 018.1 englische Codes / deutsche Bezeichnungen, 018.2 ja, 018.3 ja – Begründung und Beispiele in der Entscheidungsvorlage. Die 8-Werte-Liste mischt Anwendbarkeit, Bearbeitungsstand, Beweislage und Ergebnis und lässt das Assurance Profile in der Bewertung folgenlos.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** Option C, Teilfragen 018.1–018.3 wie vorgeschlagen (Chat 2026-11-12)
- **Freigegeben von:** Paul, zertifizierter CISO
- **Freigegeben am:** 2026-11-12
- **Abgelegt in:** vorschriften.md §A8; src/bewertung/modell.ts; mandanten/_vorlage/isms.md §6/§6a/§6b; src/werkzeuge/ergebnis.ts; db/migrations/0002 (report_status, control_assessment, requirement_assessment)

## ENT-019 · Größenklassen: Rolle von micro / sme / enterprise
- **Status:** abgelegt
- **Typ:** methodik
- **Ausgelöst durch:** Prüfbericht P-02: Eingangsdokument Vorschriften §14 steuert die Tiefe über Größenklassen – Widerspruch zu „Profile sind keine Größenklassen“
- **Betrifft:** vorschriften.md §A13
- **Grundlagen:** BIB-BSIG-30, BIB-KMU, BIB-MET-PROFIL
- **Eingaben:** docs/vorschlaege/2026-11-12-statusmodell-und-groessenklassen.md
- **Optionen:**
  A. Größenklassen streichen, nur Assurance Profile
  B. Größenklasse kleinst / klein / mittel / gross nach KMU-Empfehlung als berechnete Eingangsgröße (NIS2-Vorprüfung, Dimension Organization, Aufwand)
  C. wie B; zusätzlich steuert die Größenklasse die Organisationsform (Gesprächspartner, Rollenbündelung, Freigabewege) – nie Prüfumfang oder Prüftiefe
- **Vorschlag:** C. micro/sme/enterprise verwischt die NIS2-Schwelle bei 50 Beschäftigten (sme = klein + mittel); die KMU-Klassen tun das nicht. Größe beeinflusst, wie geprüft wird, nie was und wie tief.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** Option C (Chat 2026-11-12)
- **Freigegeben von:** Paul, zertifizierter CISO
- **Freigegeben am:** 2026-11-12
- **Abgelegt in:** vorschriften.md §A13; src/bewertung/groessenklasse.ts; Werkzeug status/einstufung; isms.md §2

## ENT-020 · Leistungsarten und Mandatstypen zusammenführen
- **Status:** vorgeschlagen
- **Typ:** organisation
- **Ausgelöst durch:** Prüfbericht P-03: Eingangsdokument nennt 7 Leistungsarten, das Mandatsmodell 7 Mandatstypen mit anderer Schnittmenge
- **Betrifft:** src/engagement/model.ts (EngagementType), src/engagement/templates.ts, db/migrations
- **Grundlagen:** —
- **Eingaben:** docs/vorgaben/pruefbericht-2026-11-12.md
- **Optionen:**
  1. Mandatstypen um initial_assessment, gap_assessment, product_security_assessment erweitern; Templates je Typ
  2. Leistungsart nur als Berichtstyp führen
- **Vorschlag:** Option 1; Product Security Assessment zuerst, weil es der Pilotfall braucht ([ENT-021]).
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-021 · Getrennte, verknüpfte Scopes für Organisation und Produkt (Pilotfall)
- **Status:** vorgeschlagen
- **Typ:** scope
- **Ausgelöst durch:** Prüfbericht P-04: Pilotfall Einzelunternehmer mit Softwareprodukt; Mandat hat heute genau einen Freitext-Scope
- **Betrifft:** mandanten/_vorlage (isms.md §1, E-001), Fragebogen, Datenmodell
- **Grundlagen:** —
- **Eingaben:** Chat 2026-11-12: Paul legt einen überarbeiteten plan.md vor – Entscheidung danach; neuer Plan 02 §3 (`AssessmentObject`, `Organization 1:n AssessmentObject`), 02 §2 P2 (ein Mandat, mehrere Objekte), 07 (`assessmentObject` je Case)
- **Optionen:**
  1. mehrere Scopes je Mandat (Organisation, Produkt), jeder mit eigener Bewertung, gemeinsamer Fragebogen
  2. je Scope ein eigenes Mandat, verknüpft über die Organisation
  3. ein Mandat mit mehreren Bewertungsobjekten (Organisation, Produkt …) nach 02; je Objekt eigene Grenzen, Kriterien und Bewertung, gemeinsame Fakten (Ask once), ein Bericht mit getrennten Aussagen je Objekt
- **Vorschlag:** Option 3 – entspricht dem Datenmodell des neuen Plans und dem Pilotfall ADR-009; Option 1 ist darin enthalten, Option 2 würde gemeinsame Fakten doppelt erheben.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-022 · Risikomethode für Mandate
- **Status:** offen
- **Typ:** methodik
- **Ausgelöst durch:** Prüfbericht P-05: Vorschriften §7 verlangen konfigurierbare, reproduzierbare Risikokriterien; im Repository fehlt eine Methode
- **Betrifft:** isms.md §7, Risk Engine
- **Grundlagen:** BIB-ISO27001
- **Eingaben:** docs/vorgaben/pruefbericht-2026-11-12.md
- **Optionen:**
  1. Standardmethode (z. B. 4×4 Wahrscheinlichkeit × Auswirkung) je Mandat anpassbar, Akzeptanzschwellen durch Kunde
  2. Methode des Kunden übernehmen, falls vorhanden; sonst Standardmethode
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-023 · SoA referenziert ISO/IEC 27001 Anhang A, nicht ISO/IEC 27002
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** Prüfbericht P-06: Datenmodell im Eingangsdokument ISO-27001 §6 nutzt control_reference ISO_IEC_27002_2022_8_4
- **Betrifft:** vorschriften.md §A7 Nr. 6, künftiges SoA-Datenmodell
- **Grundlagen:** BIB-ISO27001, BIB-ISO27002
- **Eingaben:** docs/vorgaben/pruefbericht-2026-11-12.md
- **Optionen:**
  1. SoA-Eintrag referenziert ISO_IEC_27001_2022_A_8_4, verknüpft mit der 27002-Erläuterung
  2. Referenz auf 27002 beibehalten
- **Vorschlag:** Option 1 – das SoA ist eine Anforderung der ISO/IEC 27001 (6.1.3) und bezieht sich auf deren Anhang A.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-024 · Prüfimpulse und Nachweise je Control ausarbeiten
- **Status:** offen
- **Typ:** methodik
- **Ausgelöst durch:** Prüfbericht P-07/P-15: Prüfimpulse der 93 Controls aus 5 Satzvorlagen erzeugt, 38 mit klein eingesetzten Titeln, 4 grammatisch fehlerhaft; Bewertungsregel für alle 93 identisch; einzelne Nachweiskategorien unpassend
- **Betrifft:** BIB-ISO27002, künftiger vertiefter Assessment-Katalog
- **Grundlagen:** BIB-ISO27002
- **Eingaben:** docs/vorgaben/pruefbericht-2026-11-12.md
- **Optionen:**
  1. je Control 1–3 eigene Prüffragen und spezifische Nachweise, gestaffelt nach Umsetzungstiefe 1–4, beginnend mit den Controls des Pilotfalls
  2. generische Vorlagen beibehalten
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-025 · Zuordnung § 30 Abs. 2 BSIG → ISO/IEC 27001 Anhang A freigeben
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** Doppelnutzung von Nachweisen in NIS2- und ISO-Mandaten
- **Betrifft:** vorschriften.md §B5.3, isms.md §6
- **Grundlagen:** BIB-BSIG-30, BIB-ISO27002
- **Eingaben:** docs/vorgaben/pruefbericht-2026-11-12.md
- **Optionen:**
  1. Zuordnung wie in vorschriften.md §B5.3
  2. offizielle Zuordnungstabellen (z. B. von BSI oder ENISA) recherchieren und übernehmen
- **Vorschlag:** Erst Option 2 prüfen (Agent bibliothek); bis dahin Option 1 als Arbeitsgrundlage, gekennzeichnet als Auslegung.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-026 · Urheberrecht und Lizenz: Umgang mit Norminhalten
- **Status:** vorgeschlagen
- **Typ:** organisation
- **Ausgelöst durch:** Frage Paul 2026-11-12: „keine ISO-Dokumente, sondern überarbeitete Version – erfüllen wir die gesetzlichen Vorschriften?“
- **Betrifft:** bibliothek/normen/, docs/vorgaben/, künftige Plattform (P1), Kundenberichte
- **Grundlagen:** BIB-URHG
- **Eingaben:** Entscheidungsvorlage docs/vorschlaege/2026-11-12-ENT-026-029-formulierungen-und-begriffe.md (Teilpunkte 026-A bis 026-E); Chat 2026-11-12 (Auftrag Paul: hinreichende, streng auditkonforme Formulierungen ohne rechtliche Konsequenzen); BIB-URHG; BIB-RDG; docs/vorgaben/pruefbericht-2026-11-12.md P-16
- **Optionen:**
  1. Formulierungsregeln wie erarbeitet freigeben: eigene Themenbezeichnungen statt Normtitel, Normbezüge nur über Kennung/Abschnitt, Satzbausteine für Ergebnisse, Liste unzulässiger Formulierungen mit Werkzeugprüfung (vorschriften.md §A17.2–§A17.4)
  2. wie 1, zusätzlich vor kommerzieller Nutzung Lizenzbedingungen der E-Books prüfen und Leistungsbeschreibung/RDG-Abgrenzung anwaltlich bestätigen lassen
  3. Normbezüge nur als Kennungen, ganz ohne Themenbezeichnungen
- **Vorschlag:** Option 2. Umgesetzt und werkzeuggeprüft: 93 eigene Themenbezeichnungen (BIB-ISO27002), eigene Bezeichnungen der 30 Unterabschnitte (BIB-ISO27001), PDF-Seitenzahlen entfernt; §A17.3 Satzbausteine (Gesamturteil, Prüfumfang, Einschränkungen, Anwendbarkeit eines Gesetzes als fachliche Einschätzung, Feststellung, Empfehlung); §A17.4 unzulässige Formulierungen. Offen und nicht durch DT Agency selbst lösbar: Lizenzbedingungen (Nutzerkreis, KI-Verarbeitung) und die anwaltliche Bestätigung der Nebenleistung nach § 5 RDG.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-027 · Ein Freigabebegriff und ein Finding-Ablauf
- **Status:** abgelegt
- **Typ:** methodik
- **Ausgelöst durch:** Entscheidungsvorlage Statusmodell: „verifiziert“ hatte drei Bedeutungen; Findings laufen doppelt (Entscheidungsseite und Plattform-Code)
- **Betrifft:** vorschriften.md §A9, src/engagement/findings.ts, db/migrations, Vorlage entscheidungen.md
- **Grundlagen:** —
- **Eingaben:** docs/vorschlaege/2026-11-12-statusmodell-und-groessenklassen.md
- **Optionen:**
  A. ein Begriff überall = benannter, berechtigter Mensch hat geprüft/entschieden; Findings über die Entscheidungsseite, Feld „Kundenreaktion“; Plattform-Code übernimmt die Stufen
  B. eigene Begriffe je Objekt (verifiziert, freigegeben, bestätigt)
  C. nur Zuordnungstabelle
- **Vorschlag:** A
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** Option A mit Auflage: Wording muss zu den fachlichen Inhalten und zu den Normen passen und für Nutzer klar sein (Chat 2026-11-12). Begriffswahl zur Umsetzung der Auflage: [ENT-029]
- **Freigegeben von:** Paul, zertifizierter CISO
- **Freigegeben am:** 2026-11-12
- **Abgelegt in:** vorschriften.md §A9, §A17.1; src/engagement/findings.ts; db/migrations/0002 (finding, customer_response); Vorlagen, Agents, Befehl /freigeben

## ENT-028 · Lebenszyklen für Nachweis, Risiko, Maßnahme, Mandat und isms.md
- **Status:** abgelegt
- **Typ:** methodik
- **Ausgelöst durch:** vorschriften.md §A6, §A8 verlangen Status, die im Repository fehlen
- **Betrifft:** Vorlagen notizen/, entscheidungen.md (Typ risiko, massnahme), isms.md, Werkzeug pruefen
- **Grundlagen:** —
- **Eingaben:** docs/vorschlaege/2026-11-12-statusmodell-und-groessenklassen.md
- **Optionen:**
  A. alle Stufen jetzt in Vorlagen, Werkzeugprüfung schrittweise
  B. Nachweis und Maßnahme jetzt, Risiko nach ENT-022
  C. später
- **Vorschlag:** A
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** Option A (Chat 2026-11-12)
- **Freigegeben von:** Paul, zertifizierter CISO
- **Freigegeben am:** 2026-11-12
- **Abgelegt in:** vorschriften.md §A6, §A8.4, §A12; Vorlagen notizen, entscheidungen.md, isms.md §7–§10; src/werkzeuge/ergebnis.ts; db/migrations/0002 (evidence, risk, measure)

## ENT-029 · Begriffswahl „freigegeben“ zur Umsetzung der Auflage aus ENT-027 bestätigen
- **Status:** abgelegt
- **Typ:** methodik
- **Ausgelöst durch:** ENT-027 Auflage (Paul, 2026-11-12): Wording muss zu Fachinhalten und Normen passen und klar sein
- **Betrifft:** vorschriften.md §A9, §A17.1; alle Status- und Feldnamen (`freigegeben`, „Freigegeben von/am“, `/freigeben`)
- **Grundlagen:** BIB-ISO27001
- **Eingaben:** docs/vorschlaege/2026-11-12-ENT-026-029-formulierungen-und-begriffe.md Teil 3; neuer Plan docs/vorgaben/eingang-2026-11-12-plan (ADR-006, ADR-008, BPMN) trennt „verifizieren“ und „Freigabe“; 02 §7.1 Governance-Matrix mit getrennten Spalten V (fachlich verifiziert) und F (freigegeben); 02 §4.4 Artefaktstatus `ai_proposed → in_review → verified → persisted_locked`
- **Optionen:**
  1. „freigegeben“ für die menschliche Genehmigung; „Verifizierung“/`quellengeprueft` nur für den Abgleich mit Quelle oder Nachweis (umgesetzt)
  2. „verifiziert“ für alles (ursprünglicher Vorschlag in der Entscheidungsvorlage)
  3. zwei Stufen: „verifiziert“ (fachlich gegen Quelle/Nachweise geprüft) und „freigegeben“ (zur Verwendung/Weitergabe genehmigt)
- **Vorschlag:** Option 3 (geändert nach Eingang des neuen Plans; Begründung und Zuordnung je Objekt in der Entscheidungsvorlage). Bisherige Begründung zu Option 1: In der Normsprache bezeichnet Verifizierung die Bestätigung anhand objektiver Nachweise – das ist die Tätigkeit des Abgleichs, nicht die Genehmigung einer Entscheidung, einer Risikoakzeptanz oder eines Ergebnisses. „Freigegeben“ passt für alle Objekte gleich, entspricht dem Sprachgebrauch für Genehmigung und Freigabe dokumentierter Information und ist für Kunden verständlich. Rücknahme wäre eine reine Umbenennung.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** Option 3: zwei Stufen „verifiziert“ (fachlich gegen Quelle/Nachweise geprüft) und „freigegeben“ (zur Verwendung/Weitergabe genehmigt) (Chat 2026-11-12)
- **Freigegeben von:** Paul, zertifizierter CISO
- **Freigegeben am:** 2026-11-12
- **Abgelegt in:** vorschriften.md §A9, §A17.1; CLAUDE.md Regel 3; src/bewertung/modell.ts (Freigabe-Achse, R5); src/engagement/findings.ts (verify/approve); src/werkzeuge/ergebnis.ts (isms.md §10, Trennung ab Profil 3); mandanten/_vorlage/isms.md; db/migrations/0004; Tests

## ENT-030 · Begriffskonflikt „Assurance Profile“
- **Status:** abgelegt
- **Typ:** methodik
- **Ausgelöst durch:** Gap-Analyse G-11: `07_BEISPIEL_CASES.json` nutzt assuranceProfile für Review-Pflicht und Unabhängigkeitsanspruch; das Repository für die Proportionalitätsstufe 1–4
- **Betrifft:** vorschriften.md, docs/01, src/proportionality, Schema
- **Grundlagen:** BIB-MET-PROFIL
- **Eingaben:** docs/plattform/ARCHITECTURE_GAP_ANALYSIS.md; docs/vorgaben/eingang-2026-11-12-plan/
- **Optionen:**
  1. Stufe 1–4 heißt künftig „Prüftiefenprofil“, „Assurance“ bleibt der Aussagequalität (Review, Unabhängigkeit, Methodik) vorbehalten – passt zur Begriffsdisziplin im README §5
  2. Stufe 1–4 bleibt „Assurance Profile“, das Objekt aus 07 wird umbenannt
- **Vorschlag:** Option 1 – das README des neuen Plans definiert Assurance als begrenzte Aussagequalität; die Stufe 1–4 beschreibt dagegen die Prüftiefe.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** Option 1: Stufe 1–4 heißt „Prüftiefenprofil“; „Assurance“ bleibt der Aussagequalität vorbehalten (Chat 2026-11-12)
- **Freigegeben von:** Paul, zertifizierter CISO
- **Freigegeben am:** 2026-11-12
- **Abgelegt in:** vorschriften.md §A13; src/proportionality (DepthProfile, deriveDepthProfile); db/migrations/0003 (mandate.depth_profile); Vorlagen, Agents, Bibliothek (Prosa); BIB-MET-PROFIL Titel

## ENT-031 · Statusvokabular der Beispiel-Cases abbilden
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** Gap-Analyse G-10
- **Betrifft:** Schema, Plattform-API
- **Grundlagen:** —
- **Eingaben:** docs/plattform/ARCHITECTURE_GAP_ANALYSIS.md; docs/vorgaben/eingang-2026-11-12-plan/
- **Optionen:**
  1. UNVERIFIED/PROVISIONAL/DRAFT → Freigabe offen bzw. vorgeschlagen; POSSIBLY_APPLICABLE/REQUIRES_EXPERT_REVIEW → Anwendbarkeit undecided mit Grund; OPTIONAL_ASSESSMENT_CRITERION/POTENTIAL_VOLUNTARY_STANDARD → eigener Kriterientyp „freiwillig“
  2. eigene Statuswerte der Cases beibehalten
- **Vorschlag:** Option 1. Detailtabelle nach 02: Artefaktstatus `ai_proposed`/`in_review` → Freigabe vorgeschlagen; `verified` → verifiziert (ENT-029); `persisted_locked` → freigegeben und gesperrt; `superseded` → ersetzt; `rejected_with_reason` → abgelehnt; `deferred_with_owner_impact_trigger` → offen mit Verantwortlichem; D-05 `applicable`/`not_applicable` → Anwendbarkeit applicable/not_applicable, `uncertain`/`review_required` → undecided mit Grund; D-09 `sufficient/insufficient/expired/unsupported` → Evidenzlage sufficient/insufficient, Nachweis abgelaufen bzw. ungeeignet; Fakt `unknown` → Umsetzung unknown.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-032 · Technologie, BPMN-Engine und DMN
- **Status:** vorgeschlagen
- **Typ:** organisation
- **Ausgelöst durch:** README §2: Stack ausdrücklich offen; Handoff §2 Nr. 5, §5
- **Betrifft:** gesamte Plattform
- **Grundlagen:** —
- **Eingaben:** docs/plattform/ARCHITECTURE_GAP_ANALYSIS.md; docs/vorgaben/eingang-2026-11-12-plan/
- **Optionen:**
  1. Regeln vorerst als versionierter, getesteter Code (heutiger Domänenkern); BPMN L1 deskriptiv weiter; Engine-Auswahl nach L1
  2. sofort Engine und DMN-Werkzeug festlegen
- **Vorschlag:** Option 1 – keine voreilige Festlegung, wie vom Handoff verlangt.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-033 · Einstufung mit vollständigem Fragebogen oder progressiv
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** Gap-Analyse G-06; ADR-005 (evidence-first, progressive Fragen)
- **Betrifft:** src/fragebogen, src/werkzeuge/status.ts, Agent erhebung
- **Grundlagen:** BIB-MET-PROFIL
- **Eingaben:** docs/plattform/ARCHITECTURE_GAP_ANALYSIS.md; docs/vorgaben/eingang-2026-11-12-plan/
- **Optionen:**
  1. Einstufung schon mit Teilfakten; fehlende materielle Fakten werden als Unsicherheit und Grenzfall ausgewiesen, nicht-materielle mit konservativem Standard
  2. vollständigen Fragebogen beibehalten
- **Vorschlag:** Option 1, Materialität je Frage nach Dokument 02.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-034 · Rechtsgrundlage für proaktive Kontaktaufnahme (DiscoveryRun)
- **Status:** vorgeschlagen
- **Typ:** wissen
- **Ausgelöst durch:** BPMN Process_DiscoveryRun, T_OutreachRules; Handoff §6 (keine Cold-E-Mail als Default)
- **Betrifft:** Plattform-Funktion Outreach
- **Grundlagen:** —
- **Eingaben:** docs/plattform/ARCHITECTURE_GAP_ANALYSIS.md; docs/vorgaben/eingang-2026-11-12-plan/
- **Optionen:**
  1. Rechtsquellen (u. a. Wettbewerbsrecht zu Werbung per E-Mail/Telefon, DSGVO) als Snapshots erfassen, Regel ableiten; bis dahin Outreach technisch gesperrt
  2. Discovery/Outreach aus dem Plattformumfang streichen
- **Vorschlag:** Option 1 mit Sperre; im MVP nicht enthalten.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —

## ENT-035 · Prüftiefe: drei Stufen (Basis/Standard/Enhanced) oder vier Profile
- **Status:** abgelegt
- **Typ:** methodik
- **Ausgelöst durch:** neuer Plan 06 DEC-11 (Basis / Standard / Enhanced als interne Methodik), 02 D-07 (Ausgabe Sampling, Tiefe, Review-Level); Repository: Profil 1–4 mit Untergrenzen F1–F8
- **Betrifft:** vorschriften.md Teil A, src/proportionality, Schema, D-07
- **Grundlagen:** BIB-MET-PROFIL
- **Eingaben:** docs/vorgaben/eingang-2026-11-12-plan/06_FACHLICHE_ENTSCHEIDUNGEN.md; 02_FACHKONZEPT_UND_DATENMODELL.md §5
- **Optionen:**
  1. vier Profile bleiben intern; nach außen drei Tiefen (Profil 1 → Basis, 2 → Standard, 3 und 4 → Enhanced); Untergrenzen F1–F8 unverändert
  2. auf drei Stufen umstellen; Untergrenzen neu zuordnen
  3. vier Stufen auch nach außen
- **Vorschlag:** Option 1 – die getesteten Untergrenzen bleiben, die Angebotssprache folgt DEC-11; die Tiefe bleibt getrennt von Modus und Assurance-Aussage (ENT-030).
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** Option 1: intern vier Profile mit Untergrenzen F1–F8; nach außen Basis (1), Standard (2), Enhanced (3 und 4) (Chat 2026-11-12)
- **Freigegeben von:** Paul, zertifizierter CISO
- **Freigegeben am:** 2026-11-12
- **Abgelegt in:** vorschriften.md §A13; src/proportionality/profile.ts (offeredDepth, OFFERED_DEPTH); db/migrations/0003 (isms.offered_depth, mandate.offered_depth); test/profile.test.ts, db/tests/0003_smoke.sql

## ENT-036 · Mandats- und Case-Status an den neuen Plan angleichen
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** 02 §4.2 Mandat `draft → offered → signed → active → closed` (+ `rejected`, `expired`, `terminated`) und §4.3 AssessmentCase; Schema 0001: `planned/active/closed/cancelled`
- **Betrifft:** db/migrations, src/engagement/model.ts, mandanten/_vorlage
- **Grundlagen:** —
- **Eingaben:** docs/vorgaben/eingang-2026-11-12-plan/02_FACHKONZEPT_UND_DATENMODELL.md §4
- **Optionen:**
  1. Mandatsstatus nach 02 übernehmen (`planned` → `draft`/`offered`/`signed`, `cancelled` → `rejected`/`expired`/`terminated`); Case-Status als eigene Entität; vertrauliche Uploads erst ab `active`
  2. heutige vier Status behalten, 02 nur abbilden
- **Vorschlag:** Option 1 mit Migration 0003; bestehende Regel „aktiv nur mit Profilentscheidung“ bleibt.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Freigegeben von:** —
- **Freigegeben am:** —
- **Abgelegt in:** —
