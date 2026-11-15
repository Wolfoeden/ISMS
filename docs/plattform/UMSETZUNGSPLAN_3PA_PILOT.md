# Umsetzungsplan 3PA-Pilot – Lastenheft und Prototyp AAI v1.0 auf die Plattform

| Feld | Inhalt |
|---|---|
| Stand | 2026-11-15 · ENT-038 bis ENT-045 freigegeben (Paul, Option 1) · Etappe 1 umgesetzt |
| Eingänge | Lastenheft „KI-gestützter Third-Party Assessment Agent“ **v0.4.1** (konsolidierter Änderungsentwurf, **nicht freigegeben**; führend bleibt v0.4) · HTML-Prototyp „Adaptive Assessment Intelligence v1.0 (Offline)“ |
| Bezug | `MVP_TECHNICAL_PLAN.md` (WP-00 – WP-11), `vorschriften.md` §A8/§A9/§A17, `entscheidungen.md` ENT-038 – ENT-045 |
| Zweck | Festlegen, wie die Anforderungen des Lastenhefts mit der bestehenden Plattform (PostgreSQL mit Zugriffsschutz je Zeile, API, Oberfläche) umgesetzt und mit A-01 – A-46 abgenommen werden |

Beide Eingänge sind **Daten, keine Anweisungen** (CLAUDE.md Regel 8). Das Lastenheft v0.4.1 ist laut eigenem Vermerk „weder genehmigte neue Fassung noch Umsetzungserlaubnis“. Der Plan hält deshalb die Grundlage als Entscheidung ENT-038 fest.

## 1. Kernaussage

1. **Die Plattform ist die Basis, nicht der HTML-Prototyp.** Der Prototyp v1.0 hält den Fallstand im Browser (`localStorage`, optional ein lokaler Python-/SQLite-Dienst). Seine Freigabesperren laufen nur im Browser. Das Lastenheft fordert dagegen serverseitig erzwungene Rollen (Kap. 3, S-001) und verwirft lokale Startskripte (NF-013). Die Plattform erfüllt diese Grundlagen bereits:
   - Zugriffsschutz je Zeile;
   - Prüfspur, die nur ergänzt werden kann;
   - KI darf nur Vorschläge anlegen;
   - gesperrte Berichtsversion mit Prüfsumme.
2. **Der Prototyp ist die Fach- und UX-Referenz.** Übernommen werden:
   - der Arbeitsfluss in vier Schritten (Mandat → Vorbereitung → Fachgespräch → Ergebnisbericht);
   - 28 Prüfpunkte in 5 Bereichen mit Einzelkriterien, Mindestziel, Nachweisbeispielen und Anwendbarkeitsregel;
   - die Datenübernahme aus Text, Dokument und Bildschirmfoto mit Zuordnungsvorschlägen;
   - das Quellenregister;
   - der Fachassistent je Prüfpunkt (Zielzustand, Lücke, nächste Maßnahme);
   - der Ablauf der Kundenaufgaben;
   - die Berichtsgliederung.

   Der Prototyp-Code wird nicht übernommen. Er nutzt eingebettete Skripte, die unsere CSP verbietet, und rendert vieles per `innerHTML`.
3. **Grob 60 % der Muss-Anforderungen sind fachlich schon abgebildet.** Es fehlen vor allem:
   - echter Browserbetrieb (Anmeldung, HTTPS, Sicherung);
   - echter KI-Betrieb mit Grenzen und Regressionsläufen;
   - Kundenaufgaben-Dienst und Autosave mit Revisionsprüfung;
   - die erweiterte Bewertungsmatrix (Prüfbezug, E0–E4, Aussagekraft);
   - Prüfschritt-Protokoll, Parteien und Beziehungen, Export und Wiederherstellung;
   - Barrierearmut und UX-Tests.

## 2. Abgleich Lastenheft ↔ Plattform

Legende: ✔ vorhanden · ◐ teilweise · ✗ fehlt · ⊘ bewusst nicht im Pilot

| Bereich | Anforderungen | Stand Plattform | Lücke → Paket |
|---|---|---|---|
| Fall, Parteien, Ebenen | F-001, F-003, F-004, AE-06.01/.02 | ◐ `assessment_object` (Organisation/Produkt), `scope_version` mit Modus und Assurance getrennt (0007); Mandatstyp Drittpartei (ENT-008) | Parteien mit Rollen (Auftraggeber, Lieferant, Produktentwickler, Betreiber), Produktversion, Beziehungen mit Status „offen“; Ebene je Ergebnis (Lieferant/Produkt/Betrieb/übergreifend) → **P-A2** |
| Scope | F-010 – F-012, A-03 | ✔ Scope-Version gesperrt nach Freigabe; Bewertung je Objekt; `version_impact` (0013) | getrennte Bestätigung Kunde (Tatsachen) / Berater (fachlich) protokollieren → **P-A2** |
| Quellen, Referenzart | F-020, F-022, F-023, F-025, F-026, Kap. 7 | ◐ `framework_version`, Bibliothek mit Kennung und eigener Themenbezeichnung (§A17.2) | Referenzart (normativ, gesetzlich, vertraglich, intern, Kontrollreferenz, Leitlinie, Best Practice) und fallbezogene Verbindlichkeit; Quellelement, Mapping versioniert mit Freigabe; zweite Quelle als Test (A-15) → **P-A3** |
| Bewertungsmatrix | F-032, F-068, F-024, AE-01.01/.02, A-29/A-30 | ◐ §A8: Anwendbarkeit, Erfüllung, Umsetzung, Wirksamkeit, Evidenzlage, Freigabe; Berichtsstatus berechnet | **Prüfbezug** (im Auftrag/außerhalb/ungeklärt), **Prüfstatus E0–E4**, Wirksamkeit „nicht untersucht“; „nicht ausreichend beurteilbar“ als berechneter Status → **P-A1** (ENT-040) |
| Prüfmethoden | F-067, AE-01.03, A-31 | ✗ | Prüfschritt-Protokoll (Methode, Person, Zeit, Objekt, Stichprobe, Fundstelle, Ergebnis, Grenzen); KI-Vorschlag ≠ Durchführung; nur dieser Schritt hebt E2→E3/E4 → **P-A4** |
| Findings, Risiko, Maßnahme | F-050 – F-052, Kap. 7.2.2 | ✔ Register, Freigabe nur durch Menschen, D-09/D-10; Risiko W×A (RM-2026-11.1) | Lastenheft: keine Risikozahl ohne validierte Pilotregel → **ENT-041**; Ebene je Finding → **P-A2** |
| Human Gates, Rollen | F-040 – F-043, F-041, AE-06.03, A-46, Kap. 3.1 | ✔ Rollen je Mandat, Gewaltentrennung (0016), QA ≠ Autor, Abweichung mit Begründung | Rolle „Risikoakzeptanz Kunde“ getrennt; Admin ohne Mandatsrolle darf nicht freigeben (Test) → **P-A2**; Vier-Augen bei Einzelperson → **ENT-042** |
| Dokumente, Quellenregister | F-030, F-031, F-034, AE-03, A-35 – A-37 | ◐ SHA-256, Dubletten je Mandat, Herkunft, Wiederverwendung nach 4 Prüfungen, Injektionsprüfung | **Extraktionsstatus** (erfolgreich/teilweise/unlesbar/nicht untersucht) je Seite/Abschnitt; neue Fassung als eigene Version; Art der Aussage (Norm, Fachkommentar, Kundendokument, Paraphrase, KI-Schluss) → **P-C** |
| Kundenaufgaben | F-055, F-062 – F-064, F-066, A-20, A-21, A-33, A-34, Kap. 4.4 | ◐ Kundenportal-Prototyp, offene Fragen mit Materialität, „Ask once“ | Aufgaben-Dienst (Entwurf → veröffentlicht → in Bearbeitung → eingereicht → geprüft/erneute Rückfrage), „Ich weiß es nicht / bitte klären“, Prüfung auf Wiederholung vor Veröffentlichung, Wiederöffnung mit Grund → **P-B** |
| Gleichzeitigkeit, Fehler | F-064, S-013, AE-04.02/.03, A-24, A-39, A-40 | ◐ Idempotenz bei Mandatsanlage (`processed_event`); 403/404/409/422 | **Revisionsprüfung** bei jedem Schreiben (409 bei veralteter Revision), Autosave erst nach Serverbestätigung, Idempotenzschlüssel für Wiederholungen → **P-B** |
| Änderungsfolgen | F-011, F-042, AE-04.01, A-38 | ◐ `version_impact` für Normversion | auf neue Quelle, geänderte Kundenaussage, Scope- und Kriterienversion ausweiten; alter Bericht bleibt → **P-C** |
| KI-Betrieb | Kap. 6, NF-010, NF-021, NF-022, S-004, S-010, S-011, AE-05, A-09, A-18, A-41 – A-43 | ◐ `ai_proposal` mit Modell-/Promptversion; KI-Sitzung schreibt nur Vorschläge; Simulation über `/dev` | Modelladapter (Standard: **aus**), Freigabe der Datenübermittlung, Erkennung von Geheimnissen vor Übergabe, Schritt-/Zeit-/Mengengrenzen mit Abbruch, Ausführungsart (deterministisch/simuliert/echt) je Lauf, Referenzkorpus mit 3 echten Läufen → **P-D** (ENT-043) |
| Bericht, Export | F-053, F-054, F-058, NF-004, NF-005, NF-009, A-08, A-10, A-17 | ✔ Bericht nur aus Freigegebenem, Spurprotokoll mit Lückenliste, Version mit Hash | Berichtsvarianten (Management Summary, Detail, Maßnahmen) aus einer Wahrheit; Export und Wiederherstellung mit Prüfsumme; Prüfung auf Widersprüche und Scope-fremde Aussagen (F-057) → **P-E** |
| Pilotinformation | F-056, S-008, A-11 | ◐ Einwilligung im Intake | Pilotinformation vor erster Kundenaktion, Kenntnisnahme protokolliert → **P-B** |
| Browserbetrieb, Sicherheit | F-060, NF-013, S-001 – S-014, A-19, A-28 | ✗ Test-Anmeldung nur lokal (`x-person-id`) | Einladung, Anmeldung, Sitzungen, Sperre; HTTPS-Hosting; verschlüsselter Dateispeicher; Sicherung und Wiederherstellung; ASVS-Checkliste; Betriebs- und Datenschutzunterlagen → **P-F** (ENT-044) |
| UX, Barrierearmut | NF-001, NF-007, NF-014 – NF-019, F-061, F-065, F-070, Kap. 9.1/10.1, A-25, A-26 | ◐ getrennte Ansichten, Texte nur über `textContent`, strenge CSP | Startseiten „nächste Aufgabe“, KI-Kennzeichnung „Vorschlag – nicht geprüft“, Fehlermeldung je Oberfläche, WCAG-2.2-AA-Prüfung, Tastatur, schmale Bildschirme, UX-Test 2+2 → **P-G** |
| Kaufmännisches | Kap. 12.2 | ✔ Angebot, Signatur, Mandatsanlage (WP-05); Prototyp: Angebot, Zeiterfassung | Lastenheft: Phase 2, im Pilot nicht simulieren → ⊘ **ENT-039** |
| Datenschutzassessment des Produkts | Kap. 8.1, 12, A-16 | ⊘ | bleibt Folgestufe; Betriebsdatenschutz des Agenten ist Teil von P-F |

## 3. Pakete und Reihenfolge

Die Reihenfolge folgt Anhang C des Lastenhefts: zuerst Methodik, dann das Sicherheits- und Datenschutz-Gate, dann die durchgehende Strecke, danach UX-Tests und Abnahme. Jedes Paket endet mit grünen Tests, DB-Smoke-Tests und einem Commit.

### Etappe 0 – Entscheidungen und Freigaben (Paul, vor P-A)

| Nr. | Entscheidung | Benötigt für |
|---|---|---|
| ENT-038 | Umsetzungsgrundlage v0.4 / v0.4.1 | alle Pakete |
| ENT-039 | kaufmännische Module im Pilot ausblenden | P-B, P-G |
| ENT-040 | Bewertungsmatrix: §A8 um Prüfbezug, E0–E4 und Aussagekraft erweitern | P-A1 |
| ENT-041 | Risikoangabe im 3PA qualitativ | P-A1, P-E |
| ENT-042 | Vier-Augen-Prinzip bei einer Pilotperson | P-A2, P-E |
| ENT-043 | KI-Betriebsart (Modell, Datenübermittlung, Grenzen) | P-D |
| ENT-044 | Hosting, Anmeldung, Sicherung | P-F |
| ENT-045 | Pilotprofil aus 28 Prüfpunkten als Entwurf übernehmen | P-A3 |

Außerdem offen aus dem Lastenheft Kap. 13, nur durch Menschen zu besetzen: Pilot-Messplan, Berichtsvorlage, Dateiformate und OCR, Browserumfang sowie benannte Abnahmeverantwortliche.

### Etappe 1 – Fachmodell 3PA (P-A) – ✔ umgesetzt 2026-11-15

Stand: Migrationen 0017–0019, `src/bewertung/modell.ts`, Schnittstelle und Oberfläche; Tests `db/tests/0017–0019_smoke.sql`, `test/bewertung.test.ts`, `test/api/fachmodell.test.ts`, Klick-Durchlauf. Offen bleibt die fachliche Freigabe der 28 Kriterien des Pilotprofils durch den Lead Assessor (`bibliothek/methodik/pilotprofil-3pa-v1.json`, Import über `POST /profiles/import`).

| Paket | Inhalt | Migration / Code | Abnahme |
|---|---|---|---|
| P-A1 Bewertungsmatrix | Prüfbezug, Prüfstatus E0–E4, Aussagekraft, Wirksamkeit „nicht untersucht“; berechneter Status „nicht ausreichend beurteilbar“; E3/E4 nur über Prüfschritt; Ausnahmefreigabe ≠ „erfüllt“ | 0017; `src/bewertung/modell.ts`; §A8 | A-14, A-22, A-23, A-29, A-30 |
| P-A2 Parteien, Ebenen, Rollen | Partei mit Rolle je Fall; Produkt mit Version; Beziehung (bestätigt/offen); Ebene je Bewertung, Finding, Risiko und Maßnahme; Rolle `customer_risk_owner`; getrennte Scope-Bestätigung Kunde/Berater | 0018; `service.ts` | A-13, A-44, A-45, A-46 |
| P-A3 Quellen und Pilotprofil | Quelle, Quellelement, Referenzart, Verbindlichkeit je Fall, Mapping mit Freigabe; Pilotprofil versioniert; Import der 28 Prüfpunkte als **Entwurf** (Status `vorgeschlagen`, ohne Normtext, §A17.2); zweite Quelle als Test | 0019; `src/profil/` | A-04, A-15, F-026 |
| P-A4 Prüfschritt-Protokoll | Tabelle `assessment_step` (Methode Examine/Interview/Test, Person, Zeit, Objekt, Stichprobe, Fundstelle, Ergebnis, Grenzen); KI-Vorschlag nur als `ai_proposal` | 0020 | A-31 |

### Etappe 2 – Kundenaufgaben und robuste Bearbeitung (P-B)

- Aufgaben-Dienst (Rest von WP-07):
  - Statusfolge nach Lastenheft 4.4 mit serverseitigen Übergängen und Prüfspur;
  - Frist und Zuständigkeit (Kunde/Berater);
  - Nachforderung;
  - „Ich weiß es nicht / bitte klären“.
- Vor Veröffentlichung wird geprüft, ob die Frage schon beantwortet oder belegt ist:
  - zunächst über Kriterium und Sachverhalt;
  - semantisch über den KI-Adapter, sobald P-D läuft.
- Eine Wiederöffnung nennt Grund und Quelle. Die frühere Antwort bleibt historisiert.
- Revisionsfeld auf allen bearbeitbaren Objekten:
  - `If-Match` beziehungsweise `revision` im Body;
  - 409 mit verständlichem Konflikthinweis;
  - Autosave zeigt „gespeichert“ erst nach Serverbestätigung;
  - Idempotenzschlüssel für Wiederholungen.
- Pilotinformation vor der ersten Kundenaktion, Kenntnisnahme in der Prüfspur.
- Abnahme: A-20, A-21, A-24, A-33, A-34, A-39, A-40 (ohne Modellteil), A-11.

### Etappe 3 – Dokumente, Quellenregister, Änderungsfolgen (P-C)

- Quellenregister nach AE-03.01:
  - eine Fassungskette je Dokument;
  - eine Dublette verweist auf das Original;
  - eine geänderte Datei wird als neue Fassung angelegt.
- Extraktionsstatus je Seite oder Abschnitt. Ein Scan ohne Text gilt als „unlesbar“, nie als „leer“ oder „vollständig“.
- Jede Aussage trägt ihre Art: Norm, Fachkommentar, Methode, Kundenauskunft, Originaldokument, Paraphrase, KI-Schluss.
- Eine falsche oder fallfremde Fundstelle wird abgewiesen.
- `version_impact` wird ausgeweitet auf:
  - neue oder ersetzte Quelle;
  - geänderte Kundenaussage;
  - Scope- und Kriterienversion.

  Die betroffenen Bewertungen, Findings und Berichtsaussagen werden zur Nachprüfung markiert.
- Abnahme: A-05, A-06, A-32, A-35 – A-38.

### Etappe 4 – KI-Betrieb (P-D), nach ENT-043

- Modelladapter mit Konfiguration je Mandat:
  - Standard: keine Übermittlung;
  - Opt-in nach Freigabe;
  - Modell-ID, Promptversion und Methodenversion je Lauf.
- Vor jeder Übergabe ans Modell:
  - Erkennung von Geheimnissen und Zugangsdaten (sperren oder maskieren, protokolliert);
  - Trennung von Systeminstruktion und Dokumentdaten;
  - Prüfung der Ausgabe (Fundstelle existiert und gehört zum Fall).
- Fähigkeiten nach Kap. 6.1 als Vorschlagsarten:
  - Kontextaufnahme und Lücken;
  - Folgefragen;
  - Antwortentwurf;
  - Kriterien-Vorschlag mit Gegenargumenten;
  - Finding- und Maßnahmenentwurf.

  Jeder Vorschlag ist sichtbar gekennzeichnet als „Vorschlag – nicht geprüft“.
- Grenzen für Schritte, Laufzeit, Eingabemenge und Verbrauch; Abbruch durch Berechtigte. Bei einer Grenze bleibt der letzte gültige Stand, offene Arbeit wird sichtbar, es entsteht keine Bewertung.
- Testprotokoll mit drei Ausführungsarten. Referenzkorpus (positiv, negativ, unvollständig, widersprüchlich, manipulativ) mit je 3 echten Läufen. P0 = 0 als Go-live-Bedingung.
- Abnahme: A-09, A-12, A-18, A-40 (Modellteil), A-41 – A-43.

### Etappe 5 – Bericht, Varianten, Export (P-E)

- Berichtsgliederung nach Prototyp und F-053:
  - Prüfmetadaten;
  - Management Summary;
  - Liefer- und Prüfumfang;
  - Ergebnisse je Kriterium mit Ebene, Referenzart und Verbindlichkeit;
  - Maßnahmenplan;
  - offene und nicht untersuchte Punkte;
  - Methodische Grenzen;
  - Freigabe und Version.

  Formuliert wird nur mit den Satzbausteinen aus §A17.3.
- Management Summary, Detailbericht und Maßnahmenübersicht entstehen aus derselben gesperrten Berichtsversion. Ein Quervergleichstest prüft das.
- Qualitätsprüfung vor Freigabe (F-057): Widersprüche, Terminologie, Scope-fremde Aussagen, unzulässige Verallgemeinerung. Beispiel: Ein Produktteilbefund darf keine ISO/IEC-27001-Aussage tragen.
- Export (JSON plus PDF/HTML) mit Prüfsumme; Wiederherstellung in einer Testumgebung mit Vollständigkeitsprüfung.
- Abnahme: A-01, A-08, A-10, A-17.

### Etappe 6 – Browser-Pilot und Schutz-Gate (P-F), nach ENT-044

- Anmeldung:
  - Einladung per Link mit Ablauf;
  - Passwort mit zweitem Faktor oder SSO nach ENT-044;
  - Sitzungsablauf und Sperre.

  Die Test-Anmeldung bleibt nur in der Entwicklung (`ISMS_DEV_AUTH`).
- Hosting:
  - HTTPS-Pilot-URL;
  - verschlüsselter Dateispeicher;
  - nächtliche Sicherung;
  - Wiederherstellung eines Testfalls nachgewiesen;
  - Zeitgeber für `expire_offers()` entfällt, wenn ENT-039 Option 1 gilt.
- Pilot-Sicherheitscheckliste nach OWASP ASVS 5.0 (Auth, Autorisierung, Upload, Sitzungen, Protokolle), ohne Vollkonformität zu behaupten.
- Betriebs- und Datenschutzunterlagen: Rollen, Rechtsgrundlage, Auftragsverarbeitung, Region, Löschfristen, Incident-Kontakt.
- **Bis das Gate bestanden ist: nur Testdaten** (S-005, A-28).
- Abnahme: A-02, A-19, A-27, A-28.

### Etappe 7 – UX-Qualität und Abnahme (P-G, P-H)

- Startseiten:
  - Berater: Aktionszentrum mit offenen Entscheidungen, unbeantworteten Kundenfragen und nächsten Aktionen;
  - Kunde: „Was muss ich erledigen?“.
- Arbeitsfluss je Fall: Überblick → Scope → Fragen und Nachweise → Bewertungen → Findings → Bericht.
- KI-Panel im Prüfpunkt mit „Quellen ansehen · Begründung · Übernehmen · Zurückweisen · Prüfung offen“.
- Fehlermeldung je Oberfläche (F-070). Keine technischen Fehlertexte im Kundenportal.
- Automatische Barrierearmuts-Prüfung im Klick-Durchlauf (axe über Playwright), Tastatur- und Zoomtest, Kundenaufgabe in Smartphone-Breite.
- UX-Test mit 2 Beratern und 2 Personen in Kundenrolle, ein Verbesserungsdurchlauf. Ziele nach dem Messplan: ≥ 90 % Aufgabenerfolg, 0 kritische Fehlbedienungen, Median ≥ 4/5.
- Abnahmematrix A-01 – A-46 je Test mit Pilotfall, Erwartung, Testdatenversion, Prüfer, Ergebnis und Beleg. Datei: `docs/plattform/ABNAHME_3PA.md`.
- Abnahme: A-25, A-26 und Gesamtabnahme.

## 4. Abnahme A-01 – A-46 nach Etappe

| Etappe | Tests | heute schon abgedeckt |
|---|---|---|
| 1 (P-A) | A-04, A-13 – A-15, A-22, A-23, A-29 – A-31, A-44 – A-46 | Teile von A-22 (Freigabe nur Mensch), A-46 (Gewaltentrennung, 403) |
| 2 (P-B) | A-11, A-20, A-21, A-24, A-33, A-34, A-39, A-40 | – |
| 3 (P-C) | A-05, A-06, A-32, A-35 – A-38 | A-35 (Dubletten), A-38 teilweise (Normversion) |
| 4 (P-D) | A-09, A-12, A-18, A-41 – A-43 | A-09 (Injektionsprüfung, KI nur Vorschläge) als deterministischer Test |
| 5 (P-E) | A-01, A-03, A-07, A-08, A-10, A-17 | A-03, A-07, A-08 (Spurprotokoll, Berichtsfilter) |
| 6 (P-F) | A-02, A-19, A-27, A-28 | A-02, A-27 über API-Negativpfade N-01 – N-12, aber noch ohne echte Anmeldung |
| 7 (P-G/H) | A-16, A-25, A-26 | – |

## 5. Was bewusst nicht übernommen wird

- **Kaufmännische Funktionen** des Prototyps: Angebot, Beauftragung, Zeit- und Tätigkeitserfassung, Aufwandsindikator. Das Lastenheft ordnet sie Phase 2 zu (Kap. 12.2); entschieden wird über ENT-039.
- **Speicherung im Browser** als führender Stand.
- **Freigabe ohne Server** („HTML allein bietet keinen zuverlässigen Snapshot“, so der Prototyp selbst).
- **Prozentwerte zur Erfüllung.** Fortschritt wird nur als „x von y“ angezeigt (Lastenheft 4.4, ENT-037).
- **Normtext.** Das Normmodell des Prototyps erklärt „eigene Formulierungen, keine kopierten Normvolltexte“. Das wird beim Import je Eintrag geprüft (CLAUDE.md Regel 6).
- **Kunden- und Produktnamen aus dem Prototyp** gelangen nicht in Code, Tests oder Artefakt-Seiten (Regel 7). Testdaten bleiben fiktiv.

## 6. Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| v0.4.1 wird geändert oder nicht freigegeben | Nacharbeit an P-A1, P-B, P-C, P-D | ENT-038: AE-Pakete umsetzen, die ohnehin aus CLAUDE.md und §A8 folgen; Abnahmetexte erst nach Freigabe fixieren |
| Hosting/KI-Anbieter nicht entschieden | P-D und P-F blockiert; kein Kundeneinsatz | Etappen 1–3 und 5 laufen unabhängig; Entscheidung früh einholen |
| Einzelperson als Lead und QA | Freigaben ab Profil 3 gesperrt | ENT-042 |
| KI-Qualität nicht messbar ohne Referenzkorpus | A-42 nicht abnehmbar | Korpus parallel zu Etappe 1 durch Lead Assessor freigeben lassen |
| UX-Tests ohne Testpersonen | A-25 offen | Testpersonen in Etappe 0 benennen |
