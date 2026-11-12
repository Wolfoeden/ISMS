# Entscheidungsseite – Methodik und Bibliothek

Hier landet alles, was für **alle Mandate** fehlt oder offen ist: Methodikfragen, fehlendes Wissen, Organisation von DT Agency. Mandatsspezifische Entscheidungen stehen in `mandanten/<kürzel>/entscheidungen.md` (IDs `E-001` …).

## Ablauf

```
offen ──▶ vorgeschlagen ──▶ verifiziert ──▶ abgelegt
  Lücke      Agent/Berater     Mensch           Ergebnis übertragen
  erkannt    mit Grundlagen    entscheidet      (Bibliothek, plan.md, vorschriften.md, Code)
                         └──▶ verworfen
```

| Status | Bedeutung | Wer |
|---|---|---|
| `offen` | Lücke erkannt, noch kein Vorschlag | Agent oder Mensch |
| `vorgeschlagen` | Optionen und Empfehlung mit Grundlagen (`BIB-…`) | Agent oder Mensch |
| `verifiziert` | Entscheidung getroffen, Grundlagen geprüft; Name + Datum | **nur Mensch** |
| `abgelegt` | Ergebnis ist im Zielartefakt übernommen; „Abgelegt in“ gesetzt | Agent oder Mensch |
| `verworfen` | nicht weiter verfolgt, mit Begründung | Mensch |

Typen: `klaerung` · `scope` · `einstufung` · `anwendbarkeit` · `wissen` · `methodik` · `risiko` · `finding` · `massnahme` · `organisation`

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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Vorschlag:** Option 1. Hinweis: BIB-ISO27001 ist noch nicht verifiziert ([ENT-014]).
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-013 · Wer darf verifizieren?
- **Status:** offen
- **Typ:** organisation
- **Ausgelöst durch:** Statusmodell von Bibliothek und Entscheidungen verlangt benannte Menschen
- **Betrifft:** plan.md §6, CLAUDE.md
- **Grundlagen:** —
- **Eingaben:** Chat 2026-11-12: Paul verifiziert die ISO-Bibliothekseinträge
- **Optionen:**
  1. Bibliothek und Methodik: Methodik-Verantwortliche/r; Mandatsentscheidungen: Engagement Lead; Risikoakzeptanz und Scope: Kunde (Executive Sponsor / Risk Owner)
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-014 · Zugang zu lizenzierten Normen und Verifikation der ISO-Einträge
- **Status:** vorgeschlagen
- **Typ:** wissen
- **Ausgelöst durch:** BIB-ISO27001 ohne Normexemplar nicht verifizierbar; am 2026-11-12 Projektaufbereitungen aus DIN EN ISO/IEC 27001:2024-01, DIN EN ISO/IEC 27002:2024-01 (TÜV-Süd-Akademie-E-Book) und ISO/IEC 27000:2018 geliefert
- **Betrifft:** bibliothek/normen/, vorschriften.md §B4, §B5
- **Grundlagen:** BIB-ISO27000, BIB-ISO27001, BIB-ISO27002
- **Eingaben:** docs/vorgaben/eingang-2026-11-12/, docs/vorgaben/pruefbericht-2026-11-12.md; Chat 2026-11-12: Paul übernimmt den Abgleich
- **Optionen:**
  1. Ein Mensch mit Zugriff auf die E-Books gleicht die drei Einträge ab (Kurztitel, Abschnittsnummern, Kernaussagen) und verifiziert sie
  2. zusätzlich Amd 1:2024 beschaffen und als eigenen Eintrag erfassen
- **Vorschlag:** Option 1 durch Paul, Option 2 danach. Lizenz- und Urheberrechtsfrage getrennt in [ENT-026].
- **Zuständig:** Paul (laut Chat 2026-11-12) – Rolle für den Verifikationsvermerk noch angeben
- **Vorgeschlagen von:** Agent bibliothek, 2026-11-12
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-018 · Einheitliches Bewertungsstatusmodell
- **Status:** vorgeschlagen
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
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-019 · Größenklassen: Rolle von micro / sme / enterprise
- **Status:** vorgeschlagen
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
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

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
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-021 · Getrennte, verknüpfte Scopes für Organisation und Produkt (Pilotfall)
- **Status:** offen
- **Typ:** scope
- **Ausgelöst durch:** Prüfbericht P-04: Pilotfall Einzelunternehmer mit Softwareprodukt; Mandat hat heute genau einen Freitext-Scope
- **Betrifft:** mandanten/_vorlage (isms.md §1, E-001), Fragebogen, Datenmodell
- **Grundlagen:** —
- **Eingaben:** Chat 2026-11-12: Paul legt einen überarbeiteten plan.md vor – Entscheidung danach
- **Optionen:**
  1. mehrere Scopes je Mandat (Organisation, Produkt), jeder mit eigener Bewertung, gemeinsamer Fragebogen
  2. je Scope ein eigenes Mandat, verknüpft über die Organisation
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
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
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-026 · Urheberrecht und Lizenz: Umgang mit Norminhalten
- **Status:** vorgeschlagen
- **Typ:** organisation
- **Ausgelöst durch:** Frage Paul 2026-11-12: „keine ISO-Dokumente, sondern überarbeitete Version – erfüllen wir die gesetzlichen Vorschriften?“
- **Betrifft:** bibliothek/normen/, docs/vorgaben/, künftige Plattform (P1), Kundenberichte
- **Grundlagen:** BIB-URHG
- **Eingaben:** Chat 2026-11-12; docs/vorgaben/pruefbericht-2026-11-12.md P-16
- **Optionen:**
  1. Interne Nutzung wie heute; Paul prüft die Lizenzbedingungen der E-Books (Nutzerkreis, abgeleitete Werke, KI-Verarbeitung)
  2. DIN-Kurztitel und PDF-Seitenzahlen sofort durch eigene Kurzbezeichnungen ersetzen – nur Nummern und eigene Texte
  3. Vor kommerzieller Nutzung (Katalog in der Plattform, Weitergabe an Kunden) Lizenz beim Rechteinhaber anfragen bzw. anwaltlich prüfen lassen
- **Vorschlag:** 1 sofort, 3 vor P1; 2 nur, falls die Lizenz Auszüge nicht erlaubt. Kundenberichte enthalten bis dahin nur Abschnittsnummern und eigene Texte. Begründung: Gesetze sind frei (§ 5 Abs. 1 UrhG), Normen bleiben geschützt (§ 5 Abs. 3); eine Überarbeitung ist nur frei, wenn sie hinreichenden Abstand hält (§ 23 Abs. 1) – Lizenzbedingungen gelten zusätzlich.
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-027 · Ein Freigabebegriff und ein Finding-Ablauf
- **Status:** vorgeschlagen
- **Typ:** methodik
- **Ausgelöst durch:** Entscheidungsvorlage Statusmodell: „verifiziert“ hat drei Bedeutungen; Findings laufen doppelt (Entscheidungsseite und Plattform-Code)
- **Betrifft:** vorschriften.md §A9, src/engagement/findings.ts, db/migrations, Vorlage entscheidungen.md
- **Grundlagen:** —
- **Eingaben:** docs/vorschlaege/2026-11-12-statusmodell-und-groessenklassen.md
- **Optionen:**
  A. „verifiziert“ überall = benannter, berechtigter Mensch hat geprüft/entschieden; Findings über die Entscheidungsseite, Feld „Kundenreaktion“; Plattform-Code übernimmt die Stufen
  B. eigene Begriffe je Objekt (verifiziert, freigegeben, bestätigt)
  C. nur Zuordnungstabelle
- **Vorschlag:** A
- **Vorgeschlagen von:** Agent, 2026-11-12
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-028 · Lebenszyklen für Nachweis, Risiko, Maßnahme, Mandat und isms.md
- **Status:** vorgeschlagen
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
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —
