# Plan – Einstufung und ISMS-Prüfung (iterativ)

| | |
|---|---|
| Stand | 2026-11-12 · Entwurf |
| Gilt für | alle Mandate von DT Agency |
| Verbindlich | Abschnitte mit offenen Entscheidungen erst nach deren Verifikation |

Dieser Plan beschreibt, **wie wir Unternehmen einstufen und wie wir daraus eine belastbare ISMS-Prüfung machen** – mit Agents, die Dateien iterativ bearbeiten, und Menschen, die jede verbindliche Aussage verifizieren.

---

## 1. Prinzipien

1. **Nur verifiziertes Wissen.** Eine ISMS-Aussage stützt sich auf einen verifizierten Bibliothekseintrag, eine verifizierte Entscheidung oder eine belegte Fragebogen-Antwort. Nichts aus dem Gedächtnis, nichts geraten.
2. **Was fehlt, wird entschieden – nicht überbrückt.** Jede Lücke wird als Entscheidung auf der Entscheidungsseite sichtbar: offen → vorgeschlagen → verifiziert → abgelegt.
3. **Agents bereiten vor, Menschen entscheiden.** Agents erheben, recherchieren, schlagen vor und legen ab. Den Status `verifiziert` setzt nur ein Mensch.
4. **Proportional, nicht nach Größe.** Gleiche Anforderungen für alle, Tiefe nach Risiko. Gesetzliche Grundlage: § 30 Abs. 1 Satz 2 BSIG und Art. 21 Abs. 1 NIS2 nennen Risikoexposition, Größe, Kosten, Eintrittswahrscheinlichkeit, Schwere und Auswirkungen ([BIB-BSIG-30]).
5. **Alles nachvollziehbar.** Jede Änderung ist ein Git-Commit; jede Iteration steht in `verlauf.md`; jede Einstufung trägt ihre Policy-Version.

## 2. Artefakte

| Artefakt | Zweck | Wer bearbeitet |
|---|---|---|
| `plan.md` | dieser Plan: Methode, Ablauf, Rollen | Mensch; Agents nur nach verifizierter Entscheidung |
| `vorschriften.md` | Teil A: Projektvorschriften (Arbeitsweise, Status-, Evidenz- und Rollenmodell); Teil B: welche Regelwerke welche ISMS-Parameter festlegen | Änderungen nur über Entscheidungen; Agent `vorschriften` schlägt vor, Mensch verifiziert |
| `bibliothek/` | verifiziertes Wissen mit Quellen-Snapshots | Agent `bibliothek` erfasst, Mensch verifiziert |
| `entscheidungen.md` | Entscheidungsseite für Methodik und Bibliothek (`ENT-…`) | alle; verifizieren nur Menschen |
| `mandanten/<kürzel>/fragebogen.md` | Fakten zum Unternehmen, ankreuzbar, je Antwort eine Quelle | Agent `erhebung` |
| `mandanten/<kürzel>/entscheidungen.md` | Entscheidungsseite des Mandats (`E-…`) | alle; verifizieren nur Menschen |
| `mandanten/<kürzel>/isms.md` | **das ISMS-Artefakt** des Unternehmens – nur Verifiziertes | Agent `isms-pruefung` legt ab |
| `mandanten/<kürzel>/verlauf.md` | Protokoll jeder Iteration | jeder Agent, jeder Mensch |
| `mandanten/<kürzel>/notizen/` | Rohmaterial: Interviewprotokolle, Dokumente | Berater |
| `docs/vorgaben/` | Eingangsdokumente (unverändert) und Prüfberichte | Mensch liefert, Agent prüft |
| `src/`, `npm run isms` | Werkzeuge: Einstufung, NIS2-Vorprüfung, Status, Prüfung | Entwicklung |

## 3. Der Iterationszyklus

```
            ┌──────────────────────────────────────────────────────────────┐
            ▼                                                              │
  1 Status lesen ──▶ 2 Lücke wählen ──▶ 3 Agent arbeitet ──▶ 4 Entscheidung vorgeschlagen
  npm run isms --     (Priorität        (erhebt, rechnet,       auf der Entscheidungsseite
  status <kürzel>      siehe unten)       recherchiert)                    │
                                                                           ▼
  7 nächste Iteration ◀── 6 Ablage im Zielartefakt ◀── 5 Mensch verifiziert
                          (fragebogen / isms / bibliothek)   (Name, Datum)
```

Eine Iteration ist klein: ein Agent, eine Lücke, ein Commit, ein Eintrag in `verlauf.md`. `npm run isms -- status <kürzel>` schlägt die nächsten Schritte in dieser **Priorität** vor:

1. Formfehler beheben (`pruefen`)
2. verifizierte Entscheidungen ablegen
3. offene Fragebogen-Fragen aus `notizen/` beantworten
4. für `unbekannt` beantwortete Fragen Klärungs-Entscheidungen anlegen
5. NIS2-Vorprüfung in die Betroffenheits-Entscheidung übernehmen
6. Assurance Profile vorschlagen, sobald der Fragebogen vollständig ist
7. anwendbare Vorschriften vorschlagen, sobald das Profil abgelegt ist
8. fehlendes Wissen recherchieren (Entscheidungen vom Typ `wissen`)
9. Controls bewerten, Findings und Maßnahmen vorschlagen
10. Menschen um Verifikation bitten (alle `vorgeschlagen`)

**Definition of Done einer ISMS-Prüfung:** `pruefen` fehlerfrei · keine Entscheidung `offen` oder `vorgeschlagen` außer bewusst vertagten (in `isms.md` §11 aufgeführt) · `isms.md` §1–§10 vollständig · Prüfergebnis vom Engagement Lead verifiziert.

## 4. Phasen eines Mandats

| Phase | Eingang | Agent | Ergebnis | Menschliche Freigabe |
|---|---|---|---|---|
| 0 Anlage | Auftrag | – | `npm run isms -- neu <kürzel> "<Name>"` | Engagement Lead benannt |
| 1 Erhebung | Interviews, Dokumente in `notizen/` | `erhebung` | Fragebogen mit Quellen; Klärungsfragen | Kunde bestätigt Klärungen |
| 2 Einstufung | vollständiger Fragebogen | `einstufung` | Vorschläge E-002 NIS2-Betroffenheit, E-003 Assurance Profile | Engagement Lead (Herabstufung zusätzlich QA) |
| 3 Vorschriften | Profil abgelegt | `vorschriften` | Anwendbarkeits-Entscheidungen, Pflichtmodule | Engagement Lead |
| 4 Prüfung | Profil + Vorschriften | `isms-pruefung` | Controls mit Tiefe, Evidenz, Findings, Risiken als Vorschläge | Senior/Reviewer gemäß Quality Gate |
| 5 Ergebnis | verifizierte Findings | `isms-pruefung` | Maßnahmen, Prüfergebnis in `isms.md` §10 | Engagement Lead, Kunde (Risikoakzeptanz) |
| 6 Betrieb | Anlass oder Turnus | alle | Neubewertung ([ENT-010]) | wie oben |

Querschnittlich: Agent `bibliothek` bei Wissenslücken, Agent `qualitaet` vor jedem Commit.

## 5. Wie wir Unternehmen einstufen

Detailspezifikation: `docs/01-engagement-proportionality-model.md` · Methodik-Eintrag: [BIB-MET-PROFIL] · Policy-Freigabe: [ENT-001].

**Schritt 1 – NIS2/BSIG-Vorprüfung** nach § 28 BSIG ([BIB-BSIG-28]): Einrichtungsart nach Anlage 1/2 (`STA-04`), entgeltliches Angebot (`STA-05`), Größe (`ORG-01`, `STA-06`, `STA-07`), KRITIS (`REG-03`). Das Werkzeug liefert *besonders wichtig*, *wichtig*, *nicht betroffen* oder *prüfen* – als Vorschlag für Entscheidung E-002.

**Schritt 2 – Assurance Profile** aus zehn Dimensionen (Stufen 0–4):

| Rolle in der Ableitung | Dimensionen |
|---|---|
| Kern-Exposure | Information, Business Criticality, Threat Exposure, Regulation |
| Verstärker | Third Parties, AI, Cryptography |
| Komplexität (max. +1, nie über Profil 3) | Organization, Technology, Third Parties |
| nicht im Profil (Aufwand, Roadmap) | Existing Maturity |

Exposure-Score = 0,5 × Spitzenwert + 0,5 × Mittel der Top 3 → Band 1–4. Untergrenzen:

| ID | Bedingung | min. Profil | Grundlage | Status |
|---|---|---|---|---|
| F1 | Betreiber kritischer Anlagen | 4 | [BIB-BSIG-28] | Methodik offen [ENT-001] |
| F2 | besonders wichtige Einrichtung | 4 | [BIB-BSIG-28] | offen [ENT-002] |
| F3 | wichtige Einrichtung | 3 | [BIB-BSIG-28] | offen [ENT-002] |
| F4 | NIS2-relevant und OT oder sehr hohe Kritikalität | 4 | [BIB-BSIG-28] | offen [ENT-002] |
| F5 | OT bei hoher Kritikalität | 3 | Methodik | offen [ENT-001] |
| F6 | besondere Kategorien personenbezogener Daten in großem Umfang | 3 | [BIB-DSGVO-09] | offen [ENT-001] |
| F7 | ISO-27001-Zertifizierung angestrebt | 2 | [BIB-ISO27001] | offen [ENT-003] |
| F8 | privilegierter Zugriff auf Kundensysteme | 2 | Methodik | offen [ENT-001] |

**Schritt 3 – Entscheidung** durch den Engagement Lead: Empfehlung übernehmen oder mit Begründung abweichen; Herabstufung nur mit QA-Review; Untergrenzen sind nicht unterschreitbar.

**Schritt 4 – Parameter** folgen aus dem Profil (Interviewtiefe, Evidenz, Vier-Augen, Zyklen, Reporting) und aus den Pflichtmodulen der anwendbaren Vorschriften ([ENT-009], `vorschriften.md`).

## 6. Wer darf was

| Handlung | Agent | Mensch |
|---|---|---|
| Fragebogen ausfüllen (mit Quelle) | ✔ | ✔ |
| Entscheidung anlegen / vorschlagen | ✔ | ✔ |
| Bibliothekseintrag `entwurf` / `quellengeprueft` | ✔ (nur mit fehlerfreiem `pruefen`) | ✔ |
| Status `verifiziert` setzen | ✘ – nur auf ausdrückliche Anweisung eines Menschen im Chat, mit dessen Name | ✔ |
| Ergebnis ablegen (`abgelegt`) | ✔ nach Verifikation | ✔ |
| `isms.md` schreiben | ✔ nur Verifiziertes | ✔ |
| Profil herabstufen, Untergrenze ändern, Risiko akzeptieren | ✘ | ✔ |

Wer konkret verifizieren darf, ist in [ENT-013] offen.

## 7. Werkzeuge

| Befehl | Zweck |
|---|---|
| `npm run isms -- neu <kürzel> "<Name>"` | Mandat aus `mandanten/_vorlage/` anlegen |
| `npm run isms -- status <kürzel>` | Fortschritt und nächste Schritte |
| `npm run isms -- einstufung <kürzel>` | NIS2-Vorprüfung und Profilvorschlag als Text für die Entscheidung |
| `npm run isms -- pruefen [kürzel]` | Konsistenz: Zitate wörtlich, Verifikation durch Menschen, nur Verifiziertes in `isms.md` |
| `npm run isms -- index` | `bibliothek/index.md` neu erzeugen |
| `/iteration <kürzel>` | eine Iteration in Claude Code ausführen (`.claude/commands/`) |

## 8. Ausbau der Methodik (nächste Iterationen)

1. Startkalibrierung an 5 bekannten Kunden ([ENT-001])
2. Wissenslücken schließen: KRITIS ([ENT-015]), KMU Art. 3–5 ([ENT-016]), weitere Regelwerke nach Bedarf ([ENT-017])
3. Vertiefte Assessment-Kataloge je Pflicht-Prüfbereich (§ 30 Abs. 2 Nr. 1–10), Tiefe je Profil
4. ISO-Kataloge verifizieren ([ENT-014]) und Prüfimpulse je Control ausarbeiten ([ENT-024]); SoA nach [ENT-023]
5. Pilotfall Einzelunternehmer mit Softwareprodukt: getrennte Scopes ([ENT-021]), Product Security Assessment ([ENT-020]), Evidenzregister, Risikomethode ([ENT-022]), Berichtsvorlage
6. Third-Party Pre-Assessment ([ENT-008])
7. Aufwandsschätzung aus Ist-Aufwänden

## 9. Vertraulichkeit

Mandatsordner enthalten vertrauliche Kundendaten. Das Repository ist privat; wo Mandatsdaten dauerhaft liegen, ist in [ENT-012] offen. Bis dahin: keine Zugangsdaten, keine Originaldokumente mit besonders schützenswerten Inhalten in `notizen/` – stattdessen Zusammenfassungen mit Fundstelle beim Kunden.
