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
- **Betrifft:** Untergrenzen F2–F4, src/proportionality/profile.ts, vorschriften.md §2
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
- **Optionen:**
  1. Bibliothek und Methodik: Methodik-Verantwortliche/r; Mandatsentscheidungen: Engagement Lead; Risikoakzeptanz und Scope: Kunde (Executive Sponsor / Risk Owner)
- **Vorschlag:** —
- **Vorgeschlagen von:** —
- **Entscheidung:** —
- **Verifiziert von:** —
- **Verifiziert am:** —
- **Abgelegt in:** —

## ENT-014 · Zugang zu lizenzierten Normen
- **Status:** offen
- **Typ:** wissen
- **Ausgelöst durch:** BIB-ISO27001 kann ohne Normexemplar nicht verifiziert werden
- **Betrifft:** bibliothek/normen/
- **Grundlagen:** BIB-ISO27001
- **Optionen:**
  1. Lizenz für ISO/IEC 27001 und 27002 beschaffen; Verifikation durch Mensch mit Normexemplar
- **Vorschlag:** —
- **Vorgeschlagen von:** —
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
- **Ausgelöst durch:** vorschriften.md §6 – DORA, KI-Verordnung, Cyber Resilience Act, TISAX, BSI IT-Grundschutz sind nicht erfasst
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
