# Entscheidungsvorlage – Status- und Freigabemodell, Größenklassen

| | |
|---|---|
| Für | Paul |
| Entscheidungen | [ENT-018] Bewertungsmodell · [ENT-027] Freigabebegriff und Finding-Ablauf · [ENT-028] fehlende Lebenszyklen · [ENT-019] Größenklassen |
| Stand | 2026-11-12, Vorschlag des Agents – nichts davon ist umgesetzt, bis du entschieden hast |
| Antwortform | am Ende: Entscheidungsbogen, z. B. „ENT-018: C, ENT-027: A, …“ |

## 1. Ausgangslage: 13 Statusbegriffe, die nicht zusammenpassen

| # | Objekt | Status heute | Definiert in | Problem |
|---|---|---|---|---|
| 1 | Bibliothekseintrag | `entwurf` · `quellengeprueft` · `verifiziert` · `veraltet` | Werkzeug, Bibliothek | – |
| 2 | Entscheidung | `offen` · `vorgeschlagen` · `verifiziert` · `abgelegt` · `verworfen` | Werkzeug, Entscheidungsseiten | – |
| 3 | Fragebogen-Antwort | `offen` · `unbekannt` · `beantwortet` | Werkzeug | ist immer nur Aussage (`claim`), nicht gekennzeichnet |
| 4 | Notiz | `claim` · `evidence` | Notiz-Kopf (neu) | keine Prüfung, ob ein Nachweis geeignet ist |
| 5 | NIS2-Vorprüfung | `besonders_wichtig` · `wichtig` · `nicht_betroffen` · `pruefen` | Werkzeug | – |
| 6 | Profilentscheidung | Abweichung `none` · `borderline` · `upgrade` · `downgrade` | Code, Schema | – |
| 7 | Anforderung | 8 Werte (`not_assessed` … `needs_review`) | vorschriften.md §A8 (vorläufig) | **mischt vier Fragen in einer Liste** (Abschnitt 2) |
| 8 | Control | Anwendbarkeit / Umsetzung / Wirksamkeit | vorschriften.md §A8, isms.md | Schema kennt nur `applicable` ja/nein |
| 9 | Control-Tiefe | erforderlich 1–4, Tailoring | Code, Schema | nicht mit dem Bewertungsergebnis verknüpft |
| 10 | Finding (Datei-Ablauf) | Entscheidung vom Typ `finding` | Agents | **zweiter Ablauf parallel zu Nr. 11** |
| 11 | Finding (Plattform) | `draft` → `in_review` → `confirmed` → `customer_discussion` → `accepted` / `disputed` / `withdrawn` | Code, Schema | Kundenreaktion fehlt im Datei-Ablauf |
| 12 | Mandat | `planned` · `active` · `closed` · `cancelled` | Schema | „abgeschlossen“ nicht an die Definition of Done gebunden |
| 13 | `isms.md` | `entwurf` · `in_pruefung` · `freigegeben` | Vorlage | nicht geprüft |
| – | Nachweis, Risiko, Maßnahme | **kein Status** | – | von den Vorschriften verlangt (§A6, §A8) |

Zusätzlich bedeutet **„verifiziert“** dreierlei: Wissen geprüft (Bibliothek), Entscheidung getroffen (Entscheidungsseite), Nachweis geprüft (§A8). Der Plattform-Code sagt für Findings „confirmed“.

## 2. Das Kernproblem der 8-Werte-Liste

Die Liste aus den Eingangsdokumenten beantwortet vier verschiedene Fragen mit einem einzigen Wert:

| Frage | Werte in der Liste |
|---|---|
| Gilt die Anforderung überhaupt? | `not_applicable` |
| Wie weit ist die Bearbeitung? | `not_assessed`, `needs_review` |
| Wie gut ist die Beweislage? | `evidence_missing`, `insufficient_evidence` |
| Was ist das Ergebnis? | `met`, `partially_met`, `not_met` |

Folgen in der Praxis:
- Ein Control ist „teilweise umgesetzt“ **und** wartet auf Review – die Liste kann nur eines davon ausdrücken.
- Die Kundin sagt im Interview „MFA haben wir nicht“. Ist das `evidence_missing` oder `not_met`? Die Liste lässt beides zu.
- Das Assurance Profile spielt keine Rolle: Bei Profil 4 muss ein Control nachweislich *wirken*, bei Profil 1 genügt die nachgewiesene Umsetzung. Die Liste kennt diesen Unterschied nicht.

---

## 3. ENT-018 – Bewertungsmodell

### Optionen

| | A – eine Liste | B – Achsenmodell | C – Achsenmodell + abgeleiteter Berichtsstatus |
|---|---|---|---|
| Kurz | 8 Werte wie heute in §A8 | Anwendbarkeit, Ergebnis, Evidenzlage, Freigabe getrennt speichern | wie B; der 8-Werte-Status wird daraus **berechnet** und nur im Bericht gezeigt |
| Aussagekraft | gering – Mischzustände nicht darstellbar | hoch | hoch |
| Aussage vs. Nachweis trennbar | nein | ja | ja |
| Assurance Profile wirkt | nein | ja | ja |
| Kunde versteht den Bericht | gut | schwerer (vier Spalten) | gut – eine Spalte, Details auf Wunsch |
| Passt zu den Eingangsdokumenten | ja | nein | ja, deren Begriffe bleiben als Berichtsstatus |
| Werkzeug kann Regeln prüfen | kaum | ja | ja |
| Aufwand je Bewertung | gering | mittel | mittel (Berichtsstatus kostet nichts) |

**Empfehlung: C.**

### So sähe C aus

**Gespeichert (je Anforderung, Control oder Prüfbereich):**

| Achse | Werte | gilt für |
|---|---|---|
| Anwendbarkeit | `undecided` · `applicable` · `not_applicable` | alle |
| Erfüllung | `open` · `met` · `partially_met` · `not_met` | Anforderungen (ISO 4–10, Gesetzespflichten) |
| Umsetzung | `unknown` · `absent` · `partial` · `present` | Controls, Prüfbereiche |
| Wirksamkeit | `not_verified` · `effective` · `ineffective` | Controls, Prüfbereiche |
| Evidenzlage | `none` · `claim_only` · `insufficient` · `sufficient` · `conflicting` | alle |
| Freigabe | `offen` · `vorgeschlagen` · `verifiziert` · `abgelegt` | alle – identisch mit der Entscheidungsseite |

**Regeln, die das Werkzeug prüfen würde:**

| # | Regel |
|---|---|
| R1 | Gespeichert wird, was erhoben wurde – auch eine bloße Aussage. **Berichtet** wird eine Erfüllung (`met`) aber nur mit Evidenzlage `sufficient`; eine **Lücke** (`not_met`, `absent`) wird schon auf eine Aussage hin als Lücke berichtet. Die Berechnung des Berichtsstatus setzt das durch (Zeilen 4–8). |
| R2 | `effective`/`ineffective` nur, wenn Umsetzung `partial` oder `present` ist und ein Nachweis der Art `evidence` vorliegt (kein `claim`). |
| R3 | Ab erforderlicher Tiefe 3 (Profil 3/4 oder angehoben) gilt ein Control erst mit `effective` als erfüllt; darunter genügt `present` + `sufficient`. **So greift das Assurance Profile in die Bewertung.** |
| R4 | `not_applicable` nur mit Begründung und Freigabe `verifiziert`; unzulässig für ISO/IEC 27001 Abschnitte 4–10 und für Pflichten eines als anwendbar entschiedenen Gesetzes. |
| R5 | `conflicting` erzwingt Freigabe `vorgeschlagen` → ein Mensch entscheidet. |
| R6 | In `isms.md` (außer §11) nur Bewertungen mit Freigabe `abgelegt` – gilt heute schon. |

**Berechneter Berichtsstatus** (erste zutreffende Zeile gewinnt):

| # | Bedingung | Berichtsstatus |
|---|---|---|
| 1 | Anwendbarkeit `not_applicable` | `not_applicable` |
| 2 | Evidenzlage `conflicting` oder Freigabe `vorgeschlagen` | `needs_review` |
| 3 | Erfüllung `open` bzw. Umsetzung `unknown` | `not_assessed` |
| 4 | Erfüllung `not_met` bzw. Umsetzung `absent` oder Wirksamkeit `ineffective` | `not_met` |
| 5 | Evidenzlage `none` | `evidence_missing` |
| 6 | Evidenzlage `claim_only`/`insufficient`, oder Umsetzung `present` bei Tiefe ≥ 3 ohne `effective` | `insufficient_evidence` |
| 7 | Erfüllung `partially_met` bzw. Umsetzung `partial` | `partially_met` |
| 8 | sonst | `met` |

**Vier Beispiele:**

| Fall | Gespeichert | Berichtsstatus |
|---|---|---|
| Einzelentwickler, Profil 2, A.8.5 MFA. Interview: „MFA überall aktiv“ | Umsetzung `present`, Evidenz `claim_only` | `insufficient_evidence` → nach Export der MFA-Registrierungen: Evidenz `sufficient` → `met` |
| Produktion, Profil 4, Prüfbereich 3 Backup. Konzept und Job-Logs da, kein Wiederherstellungstest | `present`, `sufficient`, Wirksamkeit `not_verified`, Tiefe 4 | `insufficient_evidence` (R3) → Maßnahme: Wiederherstellungstest |
| ISO 6.1.2 Risikobeurteilung. Kunde: „machen wir im Kopf“ | Erfüllung `not_met`, Evidenz `claim_only` | `not_met` (R1: Lücke darf auf Aussage beruhen) → Finding |
| Access Review laut Richtlinie quartalsweise, Export zeigt letzte Prüfung vor 14 Monaten | Evidenz `conflicting` | `needs_review` → Mensch entscheidet |

### Teilfragen zu ENT-018

| # | Frage | Empfehlung |
|---|---|---|
| 018.1 | Werte englisch (wie Schema und Eingangsdokumente) oder deutsch? | englische Codes, deutsche Bezeichnungen im Bericht |
| 018.2 | Wird eine Lücke schon auf eine Aussage hin berichtet (R1)? | ja – eine eingestandene Lücke ist belastbar, eine behauptete Erfüllung nicht |
| 018.3 | Wirksamkeitspflicht ab Tiefe 3 (R3)? | ja – sonst bleibt das Profil für die Bewertung folgenlos |

---

## 4. ENT-027 – Ein Freigabebegriff, ein Finding-Ablauf

| | A – ein Begriff, Datei-Ablauf führt | B – Begriffe je Objekt | C – nur dokumentieren |
|---|---|---|---|
| Kurz | „verifiziert“ heißt überall: ein benannter, berechtigter Mensch hat geprüft bzw. entschieden. Findings laufen über die Entscheidungsseite; der Plattform-Code übernimmt dieselben Stufen. | „verifiziert“ (Wissen), „freigegeben“ (Entscheidungen), „bestätigt“ (Findings) | Zuordnungstabelle, keine Änderung |
| Lernaufwand | gering | höher | gering |
| Werkzeugprüfung | bereits vorhanden | dreifach | – |
| Doppelter Ablauf beseitigt | ja | ja | nein |

**Empfehlung: A.** Zuordnung des Plattform-Ablaufs:

| Plattform-Code | Entscheidungsseite | neu: Feld „Kundenreaktion“ |
|---|---|---|
| `draft` | `offen` | – |
| `in_review` | `vorgeschlagen` | – |
| `confirmed` | `verifiziert` (Quality Gate: bei Schwere high/critical nur Engagement Lead, Independent Reviewer oder SME) | – |
| – | `abgelegt` (in `isms.md` §8) | `offen` |
| `customer_discussion` | `abgelegt` | `besprochen` |
| `accepted` / `disputed` | `abgelegt` | `akzeptiert` / `bestritten` (bestritten → neue Entscheidung) |
| `withdrawn` | `verworfen` | – |

---

## 5. ENT-028 – Fehlende Lebenszyklen

| Objekt | Vorgeschlagene Stufen | Wer wechselt | Wo |
|---|---|---|---|
| **Nachweis** | `eingegangen` → `geeignet` · `ungeeignet` · `abgelaufen` (mit `gueltig_bis`) | Consultant; bei kritischen Bewertungen Senior | Notiz-Kopf |
| **Risiko** | `identifiziert` → `bewertet` → `behandlung_entschieden` (vermeiden · reduzieren · teilen · tragen) → `restrisiko_akzeptiert` → `in_ueberwachung` → `geschlossen` | Akzeptanz nur Risk Owner (Kunde) | Entscheidung Typ `risiko`, Feld „Phase“; Skala nach [ENT-022] |
| **Maßnahme** | `vorgeschlagen` → `beschlossen` → `in_umsetzung` → `umgesetzt` → `wirksam_bestaetigt` · `verworfen` | beschlossen: Kunde; wirksam: nur mit Nachweis | Entscheidung Typ `massnahme`, Feld „Phase“, Frist, Verantwortlich |
| **Mandat** | `planned` → `active` → `closed` nur bei erfüllter Definition of Done | Engagement Lead | Schema, `verlauf.md` |
| **`isms.md`** | `entwurf` → `in_pruefung` → `freigegeben` nur ohne offene Pflichtpunkte | Engagement Lead | Frontmatter, vom Werkzeug geprüft |

| | A – alle jetzt in Vorlagen und Werkzeug | B – Nachweis + Maßnahme jetzt, Risiko nach ENT-022 | C – später |
|---|---|---|---|
| Pilot (3PA Einzelunternehmer) braucht | alles | reicht für den Start | blockiert den Pilot |

**Empfehlung: A** – die Stufen kosten in den Vorlagen wenig; die Werkzeugprüfung kann schrittweise folgen.

---

## 6. ENT-019 – Größenklassen

Das Eingangsdokument will mit `micro` / `sme` / `enterprise` Interviewtiefe, Beteiligte und Prozesskomplexität steuern. Zwei Dinge sprechen dagegen, diese Klassen so zu übernehmen:

1. **Sie verwischen die Schwelle, an der NIS2 beginnt.** `sme` fasst kleine (< 50) und mittlere (50–249) Unternehmen zusammen – genau zwischen beiden liegt die Grenze aus § 28 Abs. 2 Nr. 3 BSIG ([BIB-BSIG-28], [BIB-KMU]).
2. **Größe und nötige Absicherung sind verschiedene Dinge.** Ein DNS-Diensteanbieter mit 6 Beschäftigten ist größenunabhängig *besonders wichtig* (Profil 4), kann aber organisatorisch nur wie ein Kleinstunternehmen arbeiten.

Die Absicht dahinter ist trotzdem berechtigt: Wer interviewt wird, wie viele Rollen eine Person hält und wie Freigaben organisiert werden, hängt wirklich von der Größe ab.

| | A – streichen | B – Größenklasse als reine Eingangsgröße | C – B + Größe steuert die Organisationsform |
|---|---|---|---|
| Kurz | nur Assurance Profile | `kleinst` · `klein` · `mittel` · `gross` nach KMU-Empfehlung, berechnet aus `ORG-01`, `STA-06`, `STA-07` (Vorbehalt `STA-08`) | wie B; zusätzlich steuert die Größenklasse **wie** geprüft wird (Gesprächspartner, Rollenbündelung, Freigabewege) – **nie was** und **wie tief** |
| Nutzt | – | NIS2-Vorprüfung, Dimension Organization, Aufwandsschätzung | dazu: Interviewplanung, vorbereitete SoD-Ausnahmen, Format der Freigaben |
| Risiko | Kleinstunternehmen bekommen unpassende Rollenanforderungen | wie A | gering, solange die Regel „nie was, nie wie tief“ eingehalten wird |

**Empfehlung: C.** Beispiel DNS-Anbieter mit 6 Personen: Profil 4 legt Prüfumfang und Evidenztiefe fest (Wirksamkeitsnachweise, Vier-Augen). Die Größenklasse `kleinst` legt fest: ein bis zwei Gesprächspartner, Rollenbündelung erwartet, SoD-Ausnahmen mit kompensierenden Maßnahmen vorbereitet, Vier-Augen über DT Agency statt intern.

---

## 7. Was sich bei Annahme der Empfehlungen ändert

| Bereich | Änderung |
|---|---|
| `vorschriften.md` | §A8 neu (Achsen, Regeln R1–R6, Berichtsstatus), §A13 Größenklassen, §A9 Freigabebegriff |
| Vorlagen | `isms.md` §6/§6a/§6b mit Spalten Evidenzlage und Berichtsstatus; Entscheidungen `finding` mit „Kundenreaktion“, `risiko`/`massnahme` mit „Phase“; Notiz-Kopf mit Prüfstufe |
| Werkzeug | Berechnung des Berichtsstatus; Prüfung von R1–R6; Größenklasse in `status` und `einstufung` |
| Code und Schema | `control_applicability` → `control_assessment` mit Achsen; neue Tabelle `requirement_assessment`; Finding-Stufen angleichen; Tabellen für Nachweis, Risiko, Maßnahme |
| Agents | `isms-pruefung` und `erhebung` auf Achsen und Nachweis-Prüfstufen |

Geschätzt: Vorlagen, Vorschriften und Werkzeug ein Arbeitsgang; Schema und Plattform-Code ein zweiter.

## 8. Entscheidungsbogen

| Entscheidung | Optionen | Empfehlung | Deine Wahl |
|---|---|---|---|
| ENT-018 Bewertungsmodell | A Liste · B Achsen · C Achsen + Berichtsstatus | C | |
| 018.1 Sprache der Werte | englisch · deutsch | englisch, deutsche Bezeichnungen | |
| 018.2 Lücke auf Aussage | ja · nein | ja | |
| 018.3 Wirksamkeit ab Tiefe 3 | ja · nein | ja | |
| ENT-027 Freigabebegriff | A ein Begriff · B je Objekt · C nur dokumentieren | A | |
| ENT-028 Lebenszyklen | A alle jetzt · B teilweise · C später | A | |
| ENT-019 Größenklassen | A streichen · B Eingangsgröße · C B + Organisationsform | C | |
