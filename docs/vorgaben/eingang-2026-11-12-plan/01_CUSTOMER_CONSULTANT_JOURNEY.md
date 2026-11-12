# 01 – Customer Journey, Consultant Journey und Service Blueprint

**Version 1.0 – 12.11.2026 | DT Agency Intelligent Assessment Platform**

## 1. Ausgangspunkt und Designversprechen

Die Plattform bedient drei Perspektiven gleichzeitig:

- **Kunde:** „Ich moechte ein belastbares Ergebnis mit wenig Aufwand und ohne Compliance-Fachjargon.“
- **Consultant:** „Ich moechte keine Informationen doppelt erheben, sondern fokussiert Entscheidungen treffen.“
- **DT Agency:** „Ich moechte professionelle Assessments skalierbar, konsistent, sicher und mit nachvollziehbarer Marge durchfuehren.“

**North Star:** Zeitaufwand fuer Kunden und Berater je fachlich verifiziertem Befund reduzieren, ohne Qualitaet, Evidenzabdeckung oder Unabhaengigkeit zu verschlechtern.

### 1.1 Die vereinbarte Einstiegsauswahl (Variante C)

Der Nutzer sieht genau zwei primaere Wege:

**A. „Ich weiss, was ich benoetige.“** – Ein konkretes Ziel waehlen (z. B. ISO-27001-Readiness, NIS2-Orientierung, EASA Part-IS, KI-/AI-Act-Assessment, Softwareprodukt/CRA, Supplier-/3PA, Sonstiges).

**B. „Ich moechte meinen Bedarf ermitteln.“** – Anliegen in Alltagssprache schildern; KI schlaegt Untersuchungsthema, moegliche Regeln und Rueckfragen vor.

Die beiden Wege erzeugen dieselben Basisobjekte: `IntakeCase`, `AssessmentObject`, `AssessmentGoal`, `ContextFact`, `FrameworkCandidate`, `OpenQuestion`. Der Weg darf jederzeit gewechselt werden; Auswahl ist kein rechtlich verbindliches Ergebnis.

### 1.2 Was nicht in einer einzigen Auswahl vermischt werden darf

| Dimension | Beispiel | Fachliche Konsequenz |
|---|---|---|
| Anliegen/Ziel | Zertifizierung vorbereiten, Kundennachweis erbringen | Gewuenschtes Ergebnis |
| Gegenstand/Objekt | Organisation, Standort, Produkt, KI-System, Lieferant | Grenzen der Erhebung |
| Framework-Kandidat | ISO 27001, NIS2/BSIG, Part-IS, CRA, AI Act | Nur vorlaeufige Anwendbarkeit |
| Assessment-Typ | Screening, Gap, Readiness, 3PA, internes Audit | Methodik / Beweisniveau |
| Bearbeitungsmodus | Digital Self, Assisted, Managed | Rollen und Leistungsumfang |
| Untersuchungstiefe | Basic, Standard, Enhanced | Sampling, Nachweisarten, Interviews |
| Assurance-Aussage | Indikativ, fachlich reviewed, unabhaengig geprueft | Erlaubte Berichtsaussagen |

Insbesondere ist „Part-IS vs. NIS2 vs. ISO 27001“ **kein exklusives Gateway**. Mehrere Rahmen koennen parallel relevant sein, sogar fuer unterschiedliche Assessment-Objekte eines Kunden.

## 2. Service Blueprint (End-to-End)

**Bezeichnungen:** C = Kunde, P = Plattform/Agenten, J = Junior/Analyst, L = Engagement Lead/Senior, Q = Reviewer/QA. Der Customer Journey entspricht dieselbe Case-ID wie den internen Ansichten.

| Phase | Was C erlebt | Was P automatisiert | Was J/L/Q tut | Austrittskriterium / Artefakt |
|---|---|---|---|---|
| 0. Zugang | Website / Einladung / Kundenanfrage | Eingang erfassen, Consent/Datenschutzhinweise, Duplikate erkennen | L koordiniert Inbound | `IntakeCase` erstellt |
| 1. Einstieg | A: Ziel waehlen oder B: Anliegen schildern | Intent-/Objekthypothese, offene Fragen | L nur bei Unsicherheit | Ziel/Objekt vorlaeufig |
| 2. Kurzer Kontext | 3–7 adaptive Kernfragen; bei Bedarf Link/Dokument | Vorhandenes auswerten, Quellen markieren, Vorbelegung | J prueft nur kritische Daten | `ContextFacts` inkl. Herkunft |
| 3. Erste Orientierung | „Das wissen wir / das vermuten wir / das fehlt“ | Framework-Kandidaten und Entscheiderfragen vorschlagen | L prueft rechtlich kritische Aussagen | Pre-Assessment **indikativ** |
| 4. Passenden Weg zeigen | Digital/Assisted/Managed sehen | Methode/Tiefe vorlaeufig rechnen | L qualifiziert Opportunity, Beratung bei Bedarf | Assessment-Empfehlung |
| 5. Vorlaeufige Scope-Abstimmung | Was wird untersucht, was nicht? | Scope-Entwurf, grobe Aufwandsindikatoren | L verifiziert Scope und Methodik | Vorlaeufiger Scope |
| 6. Angebot/Mandat | Angebot, NDA/AVV soweit erforderlich, Auftrag | Dokumente, Angebotsstatus, Fristen | L erstellt/freigibt Angebot | Autorisierter Auftrag + Berechtigungen |
| 7. Kickoff | „Ihre 3 naechsten Schritte“ | Case-Rollen, Aufgaben, Datengrenzen | J betreut, L finalisiert Scope | Freigegebener Assessment-Plan |
| 8. Evidence-first | Bereits vorhandene Unterlagen hochladen/verknuepfen | Klassifizieren, extrahieren, deduplizieren, Vorschlaege | J prueft Zuordnung und Berechtigung | Evidence Inventory |
| 9. Adaptive Erhebung | Nur fehlende Fragen, sicherer Upload, Interviews | Nachweis-Luecken, Fragevorschlaege, Erinnerungen | J koordiniert, L entscheidet Blocker | Entscheidungsfaehige Erhebung oder dokumentierte Grenze |
| 10. Assessment | Fortschritt sichtbar, keine ungeprueften Scores als Urteil | Anforderungen → Kontrollen → Evidenz → Vorschlaege | J recherchiert, L verifiziert Findings | Verifizierte Assessment-Artefakte |
| 11. Fachliches Review | Ggf. sachliche Rueckfragen; keine „Veto-Funktion“ fuer Findings | Konflikt-/Inkonsistenzchecks, Review-Paket | Q reviewt unabhaengig nach Methodik | QA-Entscheidung |
| 12. Ergebnis | Bericht mit Scope, Kriterien, Grenzen, Findings | Freigegebene Version erzeugen/verteilen | L/Q geben frei; C nimmt entgegen | Report-Version gesperrt und publiziert |
| 13. Danach | Optional Massnahmen/Monitoring beauftragen | Priorisierte Remediation-Vorschlaege | L bietet Folgeauftrag an | Neuer Auftrag, nicht stiller Scope-Drift |

**Wesentliche Trennlinie:** Vor Mandatierung nur rechtmaessig erhobene und angemessen reduzierte Daten; nach Mandatierung vertrauliche Evidenz **nur im genehmigten Daten-/Zugriffsrahmen**.

## 3. Customer Journey – konkrete Interaktion

### 3.1 Startscreen

**Ueberschrift:** „Wobei benoetigen Sie Unterstuetzung?“  
**Primaeraktionen:** „Ich weiss bereits, was ich brauche“ | „Helfen Sie mir bei der Einordnung“.  
**Sekundaer:** „Ich habe eine Anfrage meines Kunden“; „Assessment fortsetzen“.

Keine automatische „Sie sind NIS2-pflichtig“-Behauptung. Nach fachlich korrekter Auswahl dient die Normbezeichnung zunaechst nur als **Kundenziel**.

### 3.2 Dynamische Fragen: maximaler Informationsgewinn pro Frage

Gemeinsame minimalen Kontextfragen (in der Regel 3–7, nicht starre 7):

1. Was soll untersucht werden? (Organisation / Produkt / System / Lieferant / unbekannt)
2. Was ist das Ziel? (Kundennachweis, Pflicht, Verbesserung, Zertifizierungsvorbereitung etc.)
3. In welchen Laendern wird der Gegenstand betrieben/angeboten?
4. Welches Unternehmen / welche rechtliche Einheit ist betroffen?
5. Welche Branche und grobe Unternehmensgroesse? **Nur falls relevant.**
6. Gibt es bereits Unterlagen / eine bestehende Zertifizierung / Anforderungen des Auftraggebers?
7. Wer soll die Ergebnisse verwenden und welche Frist besteht?

Danach **branch-spezifische** Fragen statt Framework-Volltext: 

- **Softwareprodukt:** Produktfunktion, Bereitstellung/Vertrieb, Zielmarkt, Herstellerrolle, Komponenten, Entwicklungs-/Patch-/Vulnerability-Prozess, kritische Integrationen.
- **KI-System:** konkreter Use Case, Rolle Anbieter/Betreiber, Einsatzfeld, Betroffene, Entscheidungsauswirkung, Modell-/Datenkette, menschliche Aufsicht.
- **Part-IS:** Genehmigungs-/Organisationsart, luftfahrtsicherheitsrelevante Aktivitaeten, Schnittstellen zu Safety/externen Organisationen, relevante regulatorische Teilregelung.
- **NIS2/BSIG:** Rechtsraum, Einheit, Sektortaetigkeit, Unternehmensgroessen/-strukturen, Sondertatbestaende, Abhaengigkeiten.
- **3PA:** wer beauftragt, wer ist Gegenstand, Verwendungszweck des Berichts, vertragliche Kriterien, Unabhaengigkeit/Pruefrechte.

### 3.3 Erste Orientierung – Zieloberflaeche

**Sektion 1: Bekannte Fakten** – Quelle, Datum, Verifizierungsstatus.  
**Sektion 2: Vorlaeufig relevante Rahmen** – warum moeglicherweise relevant; warum noch unklar.  
**Sektion 3: Fehlende entscheidende Angaben** – max. drei aktuell wichtigste Rueckfragen.  
**Sektion 4: Empfohlenes Assessment** – Ziel, Objekt, vorlaeufiger Scope, Bearbeitungsmodus, erwartetes Ergebnis.  
**Sektion 5: Naechster Schritt** – „Assessment beauftragen“ oder „Erstgespraech vereinbaren“.

Anzeige von Vertrauen/Unsicherheit: `bestaetigt`, `vorlaeufig`, `nicht entscheidbar`, `nicht anwendbar (begruendet)`; keine Prozentscores, wenn nicht kalibriert.

### 3.4 Kundenportal nach Mandatierung

Der Kunde sieht hoechstens die vier Kernnavigationen **Uebersicht**, **Meine Aufgaben**, **Unterlagen**, **Ergebnisse**.

- Ein Dashboard zeigt „Das benoetigen wir von Ihnen jetzt“, naechste Frist, zust. Kontakt und letzten Stand.
- Fragen erscheinen kontextbezogen mit „Warum fragen wir das?“ und „Welcher Nachweis waere hilfreich?“.
- Antwortoptionen: `Ja / Nein / Teilweise / Unbekannt / Nicht anwendbar` nur, soweit fachlich sinnvoll; `Nicht anwendbar` benoetigt Begruendung.
- „Weiss ich nicht“ ist zulaessig und loest bei materialem Einfluss einen kontrollierten Klärungsvorgang aus.
- Upload nicht als Pflicht darstellen, falls Interview, Evidenzlink oder ausdruecklich dokumentierte Nichtverfuegbarkeit methodisch ausreichen.
- Speicherbare Entwuerfe, sichere Session, einfache Mobilgeraet-Nutzung, Barrierearmut und klare Vertraulichkeitsanzeige.
- Keine ungeprueften AI-Feststellungen an den Kunden senden; Zwischenstatus ist keine Assurance-Aussage.

### 3.5 Kunden-Faktencheck vor Report

Bei geeigneten Mandaten: Kunde kann **Tatsachen** (z. B. Systemumfang, Systemowner, Datum, Dokument) korrigieren. Er darf Findings nicht durch blosses Ablehnen entfernen. Korrekturwunsch erzeugt `Dispute/Clarification`, das fachlich bewertet und im Audit Trail entschieden wird.

## 4. Consultant Journey – Arbeitsplaetze und Entscheidungsrechte

### 4.1 Junior Consultant / Analyst

**Ziel:** wenige Klicks, eine priorisierte Queue, keine selbststaendigen verbindlichen Einstufungen.

1. Mandatsueberblick und vorgeprueften Scope sehen.
2. Evidenzanfragen in Batches erstellen/versenden; Quellenmaterial klassifizieren.
3. Interviewleitfaeden aus offenen Anforderungen und bisheriger Evidenz generieren, menschlich plausibilisieren.
4. KI-Extraktionen nachvollziehen: Quelle, Fundstelle, Zeitbezug, Unsicherheiten, Widersprueche.
5. Fragen an Fachverantwortliche richten; Deadline und Reminder verwalten.
6. Findings/Reports vorbereiten, ohne sie selbst freizugeben, wenn fehlende Autorisierung.
7. Auf Blocker/PII/Sicherheitsvorfaelle eskalieren.

**Startdashboard:** „Meine 5 wichtigsten Aufgaben“, „ueberfaellige Kundeingaben“, „AI-Vorschlaege mit Reviewbedarf“, „Evidenz ohne Zuordnung“, „entscheidungsrelevante Unbekannte“.

### 4.2 Engagement Lead / Senior Consultant

**Ziel:** fachliche Verantwortung uebernehmen statt Daten manuell umkopieren.

1. Opportunity triagieren; Pre-Assessment/Ansprache unter Legal-Grenzen qualifizieren.
2. Assessment-Ziel, Objekt, vorlaeufigen Scope, kommerziellen Vertrag und Leistungsgraenzen klaeren.
3. Erst nach Auftrag: Scope, Kriterien, Probe-/Nachweisstrategie und Untersuchungsmodus fixieren.
4. Vorschlaege zur regulatorischen Einordnung, Framework-Anwendbarkeit und Assessment-Tiefe verifizieren.
5. Anwendbare Anforderungen und genehmigte Ausschluesse festlegen; Materialitaet der Unbekannten bewerten.
6. Fachliche Risikobewertung und Findings genehmigen, wenn berechtigt.
7. Bei wesentlichen Luecken: Scope aendern, nachfordern, begrenzt abschliessen oder abbrechen (mit Nachweis).
8. Reviewpaket an QA geben; Bericht erst nach der notwendigen Freigabe publizieren.

**Dashboard:** offene Entscheidungen mit Risiko-/Fristprioritaet, Einstufungskonflikte, Scope-Aenderungen, laufende Mandate, QA-Rejects.

### 4.3 Reviewer / QA

**Ziel:** unabhaengige, reproduzierbare Qualitaetsbeurteilung nach dokumentierter Methodik.

- Umfang, Kriterien, angewandte Framework-Versionen und Evidenzabdeckung pruefen.
- Stichprobe bis auf Originalevidenz/Fundstelle zurueckverfolgen.
- Ergebnis- und Risiko-Einstufungen auf Konsistenz pruefen.
- AI-generierte Behauptungen auf Evidenzdeckung pruefen.
- Konflikte der Unabhaengigkeit/SoD kontrollieren; bei bestimmten Assessmenttypen darf `creator == approver` nicht moeglich sein.
- Ergebnis: `approve`, `approve_with_explicit_limitations`, `return_for_rework`, `reject/stop`.

Wichtiger Unterschied: **Kunde kann Fakten bestaetigen, QA genehmigt Fachurteil; der Kunde erteilt nicht die fachliche Freigabe fuer unsere Schlussfolgerungen.**

### 4.4 Plattformadministrator / Methodikverantwortlicher

Nicht mit Consulting-Rollen gleichsetzen. Er verwaltet Framework-Metadaten, Entscheidungsmodelle, Formular-/Question-Bank, Rollenrechte, Versionsfreigaben und Auditlogs; er darf nicht stillschweigend eine laufende verifizierte Bewertung veraendern.

## 5. Konkrete End-to-End-Szenarien

### Szenario S1 – Einzelunternehmer und Softwareprodukt (MVP / 3PA)

1. Kunde waehlt „Ich weiss, was ich benoetige → Security Assessment fuer Softwareprodukt“.
2. Plattform identifiziert `Softwareprodukt` als Objekt und `Kundennachweis` als Ziel; CRA wird nur als **Anwendbarkeitspruefung**, nicht als pauschale Pflicht, vorgeschlagen.
3. Kunde beschreibt Produkt und liefert Produkt-/Entwicklungsdokumentation.
4. Lead klaert Berichtsempfaenger, Kriterien, Berichtsverwendung, Unabhaengigkeit und Beweisniveau.
5. Kunde beauftragt; Assessor erzeugt Evidence Inventory, fehlende Fragen und Interviews.
6. KI erstellt Kontrollbewertungsvorschlaege mit Fundstellen; Lead verifiziert; QA reviewt nach Profil.
7. Ergebnis: `Third-Party Security Assessment Report` mit Scope, Kriterien, Nachweisen, Grenzen, Findings und empfohlenen Massnahmen; keine „akkreditierte Zertifizierung“.

### Szenario S2 – Luftfahrtfertigung / Part-IS

1. Kunde waehlt „Part-IS“ oder beschreibt eine Genehmigungs-/Safety-Anforderung.
2. Plattform fragt nicht nur Unternehmensgroesse, sondern genehmigte Taetigkeiten, relevante Regulierung, Safety-Schnittstellen und IT/OT-Kontext ab.
3. Parallel werden ISO 27001 oder NIS2 **als getrennte, potenziell zusaetzliche** Dimensionen betrachtet.
4. Lead/Regulatory Expert bestimmt die konkret geltende Part-IS-Unterregel und Scope, danach Assessment-Kriterien.
5. Nachweise werden gegen Informationssicherheits- **und** ggf. Aviation-Safety-Auswirkungen bewertet.
6. Bericht unterscheidet regulatorische Luecken, Risiken und explizite Ausschluesse.

### Szenario S3 – KI-System

1. Kunde schildert einen konkreten KI-Use-Case; „KI“ allein ist keine Rechtskategorie.
2. Plattform fragt Anbieter-/Betreiberrolle, Einsatzkontext, Personenbezug, betroffene Entscheidungen und Zielmaerkte.
3. AI-Act-Risikokategorie wird **vorgeschlagen**; der Rechtsstand/Anwendungsdatum wird mit normativer Version gespeichert.
4. ISO 42001 ist optionaler Managementsystem-Rahmen und keine automatische gesetzliche Verpflichtung.
5. Lead verifiziert Einstufung und gewaehlten Assessment-Typ; Bericht macht Unsicherheiten explizit.

## 6. Usability-Gebote und Anti-Patterns

### Muss-Prinzipien

1. **Progressive Disclosure:** Nur aktuell entscheidungsrelevante Inhalte anzeigen.
2. **Evidence First:** Dokumentanalyse vor neuen Fragen; trotzdem keine Gleichsetzung Dokument = wirksame Kontrolle.
3. **Ask Once:** Fakten im gleichen Mandanten nicht mehrfach abfragen, aber Aktualitaet und Scope pruefen.
4. **Explain Why:** Jede kritische Frage zeigt Zweck und Verwendungsbereich.
5. **Dual View:** Kunde und Consultant sehen dieselben Vorgangsstatus in jeweils passenden Begriffen.
6. **Human Checkpoints:** Verbindliche Einstufungen und Reports haben persoenliche Verantwortliche.
7. **Graceful Unknown:** „Unbekannt“ ist erlaubt, aber Materialitaet wird bewertet.
8. **Safe Progress:** Kein gefaelschter Completion-Wert; Fortschritt getrennt nach Datenerhebung, Bewertung, Review und Freigabe.
9. **Clear Boundaries:** Keine automatischen Schwachstellenbehauptungen aus oeffentlichen Signalen.
10. **No Dark Patterns:** Kein kuenstlicher Verkaufsdruck aufgrund ungesicherter Compliance-Aussagen.

### Vermeiden

- Statischer 200-Fragen-Checklistenstart.
- Exklusivgateway ISO 27001 **oder** NIS2 **oder** Part-IS.
- „Alle Compliance-Anforderungen erfuellt“ allein aufgrund fehlender negativer Evidenz.
- Regelwerks-Text im Prompt ohne gepruefte Nutzungsrechte.
- Eine proaktive Discovery-Instanz, die mehrere Kunden ohne eigene Case-IDs verarbeitet.
- Alle Prozessfehler per generischem „zurueck zum Assessment“ abfangen.
- Kundenzustimmung als Ersatz fuer unabhaengiges Review.

## 7. Kennzahlen fuer einen belegbaren UX-Erfolg

| Kennzahl | Operationalisierung | Pilot-Ziel (Hypothese, noch zu validieren) |
|---|---|---|
| Time to First Value | von Einstieg bis zu einer erklaerten, belegten Orientierung | < 10 Minuten fuer einfache Faelle |
| Wiederholungsfragenquote | bereits belegte Fakten erneut abgefragt / alle Fragen | < 10 % |
| Evidence-Reuse | reuse-faehige Evidenzzuordnungen / alle Zuordnungen | messen, nicht voreilig Ziel setzen |
| Consultant Review Load | manuelle Minuten je verifiziertem Finding | Baseline ermitteln, dann > 25 % Verbesserung testen |
| Evidence Traceability | Findings mit gueltigen, auffindbaren Evidenzreferenzen | 100 % oder explizit als unbelegt markiert |
| Rework Rate | nach QA zurueckgegebene Findings / gepruefte Findings | messen, nach Ursache segmentieren |
| False Assurance | ungepruefte Claims im freigegebenen Bericht | Ziel 0 |
| Customer Effort | aktive Eingabezeit pro Assessment, getrennt von Wartezeit | messen und vergleichbar machen |

*Kennzahlen sind Produkt-Hypothesen; keine bereits nachgewiesenen Effizienzgewinne.*
