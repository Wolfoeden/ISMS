# Engagement & Proportionality Model

| | |
|---|---|
| Status | Entwurf v0.1 – fachliche Abnahme ausstehend |
| Policy-Version | `2026-11.1` |
| Umsetzung | `src/proportionality/`, `src/engagement/`, `db/migrations/0001_engagement_proportionality.sql` |

Dieses Dokument präzisiert das Fachkonzept „Engagement & Proportionality Model“ so weit, dass es implementierbar und prüfbar ist. Wo das Ausgangskonzept offen war, sind Entscheidungen getroffen und in [Abschnitt 10](#10-designentscheidungen) begründet. Was fachlich noch zu bestätigen ist, steht auf der Entscheidungsseite [`entscheidungen.md`](../entscheidungen.md). Der Arbeitsablauf steht in [`plan.md`](../plan.md).

---

## 1. Grundprinzip

Die fachlichen Anforderungen sind für alle Organisationen gleich. Proportional skaliert werden Umsetzungstiefe, Prozesskomplexität, Evidenz, Rollenverteilung, Reviewintensität und Frequenz.

```
Risk + Complexity + Regulation + Criticality  →  Required Assurance Level
```

Nicht: *kleines Unternehmen = kleines ISMS*. Die Mitarbeiterzahl beeinflusst das Profil, bestimmt es aber nicht.

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Organization Complexity Profile** | Strukturierte Fakten zu 10 Dimensionen (§3.2), je Organisation versioniert gespeichert, optional je Mandat/Scope. |
| **Prüftiefenprofil** | 1 Lean · 2 Standard · 3 Enhanced · 4 Critical / Regulated. Steuert den Prozessumfang (§4). |
| **Implementation Depth** | 1 Basic · 2 Defined · 3 Managed · 4 Assured. Tiefe, mit der ein einzelnes Control umgesetzt und nachgewiesen wird (§5). |
| **Floor (Untergrenze)** | Regulatorische oder kritikalitätsbedingte Mindeststufe, die nicht unterschritten werden kann. |
| **Engagement / Mandate** | Zentrale Einheit der Beratungsleistung: Kunde, Scope, Typ, Profil, Laufzeit, Team, Verantwortlichkeiten, Deliverables. |

## 3. Ableitung des Prüftiefenprofils

### 3.1 Ablauf

```
Pre-Assessment (Triage, fester Kurzfragebogen)
  → Empfehlung (deterministisch, Policy-versioniert)
  → Entscheidung durch Engagement Lead (ggf. mit QA-Review)
  → Mandatsdurchführung mit Profilparametern
  → Rekalibrierung, falls das vertiefte Assessment andere Fakten ergibt
```

Das löst das Henne-Ei-Problem „Profil bestimmt Assessmenttiefe, Assessment bestimmt Profil“: Die Triage ist für alle gleich kurz; das vertiefte Assessment kann das Profil korrigieren.

### 3.2 Dimensionen und Stufen

Jede Dimension wird aus Fakten (Auswahlwerte, Zahlen, Ja/Nein) auf eine Stufe **0–4** abgebildet: 0 nicht relevant · 1 gering · 2 moderat · 3 hoch · 4 sehr hoch / kritisch. Die Stufe einer Dimension ist das Maximum ihrer Einzelfaktoren; die auslösenden Faktoren werden als *Treiber* mitgeführt.

| Dimension | Rolle in der Ableitung | Beispiele für Stufe 4 |
|---|---|---|
| Information | Kern-Exposure | besondere Kategorien personenbezogener Daten in großem Umfang |
| Business Criticality | Kern-Exposure | Ausfallzeit Minuten, existenzbedrohend, regionale/nationale Auswirkungen |
| Threat Exposure | Kern-Exposure | bekannte Zielgruppe für Angreifer |
| Regulation | Kern-Exposure | KRITIS, NIS2 besonders wichtige Einrichtung |
| Third Parties | Verstärker + Komplexität | ≥ 10 kritische Lieferanten |
| AI | Verstärker | kritische KI-Use-Cases |
| Cryptography | Verstärker | eigene Kryptographie-Implementierung |
| Organization | Komplexität | ≥ 1000 Beschäftigte, ≥ 10 Gesellschaften/Standorte |
| Technology | Komplexität | OT / Produktionsanlagen, ≥ 20 kritische Systeme |
| Existing Maturity | **nicht im Profil** – Aufwand & Roadmap | zertifiziertes ISMS |

Die vollständigen Abbildungsregeln stehen in `src/proportionality/dimensions.ts`.

### 3.3 Verfahren

1. **Exposure-Score**
   `0,5 × max(Kern-Exposure) + 0,5 × Mittel der drei höchsten Werte aus Kern-Exposure + Verstärkern`
   Der Spitzenwert sorgt dafür, dass ein einzelnes kritisches Risiko nicht weggemittelt wird; das Top-3-Mittel unterscheidet ein isoliertes Risiko von breiter Exposition.
2. **Exposure-Band**: `< 1,75` → 1 · `< 2,5` → 2 · `< 3,25` → 3 · sonst 4.
   Da der Score nie über dem Spitzenwert liegt, ist Band 4 nur mit mindestens einer kritischen Dimension (Stufe 4) erreichbar.
3. **Komplexitätsanhebung**: Mittel aus Organization, Technology, Third Parties ≥ 3 → +1 Stufe, **höchstens bis Profil 3**.
4. **Untergrenzen** (§3.4): Ergebnis = max(Band nach Anhebung, höchster Floor).
5. **Grenzfall**: Liegt der Score weniger als 0,35 von einer Bandgrenze entfernt und würde das Nachbarband das Ergebnis ändern, wird die Alternative ausgewiesen. Die Entscheidung trifft der Engagement Lead.

### 3.4 Untergrenzen

| ID | Bedingung | Mindestprofil |
|---|---|---|
| F1 | Betreiber kritischer Anlagen (KRITIS) | 4 |
| F2 | NIS2: besonders wichtige Einrichtung | 4 |
| F3 | NIS2: wichtige Einrichtung | 3 |
| F4 | NIS2-relevant **und** (OT im Scope **oder** Business Criticality = 4) | 4 |
| F5 | OT im Scope bei Business Criticality ≥ 3 | 3 |
| F6 | besondere Kategorien personenbezogener Daten in großem Umfang | 3 |
| F7 | ISO 27001 Zertifizierung angestrebt oder vorhanden | 2 |
| F8 | privilegierter Zugriff auf Kundensysteme | 2 |

Ungeklärte NIS2-Betroffenheit erzeugt eine offene Frage, die vor der Profilentscheidung zu klären ist.

### 3.5 Die Beispiele aus dem Konzept, durchgerechnet

Die Beispiele sind als automatisierte Tests hinterlegt (`test/profile.test.ts`).

| Fall | Exposure | Komplexität | Floors | Ergebnis |
|---|---|---|---|---|
| Einzelentwickler A – Webseiten, keine sensiblen Daten | 1,00 → Band 1 | 1,33 | – | **Profil 1** |
| Einzelentwickler B – Admin-Zugriff auf Kundensysteme, sensible Daten, Security-SaaS | 2,83 → Band 3 | 1,67 | F8 (2) | **Profil 3, Grenzfall 2** |
| Einzelentwickler B mit hoher Kundenabhängigkeit und erhöhter Angriffsattraktivität | 3,00 → Band 3 | 1,67 | F8 (2) | **Profil 3** |
| Produktionsunternehmen – 250 MA, ERP, OT, kritische Lieferanten, NIS2 | 3,00 → Band 3 | 3,33 | F3, F4, F5 | **Profil 4** (durch F4) |
| Großunternehmen ohne sensible Daten – 3000 MA, 40 Standorte | 1,33 → Band 1 | 3,00 | – | **Profil 2** (Anhebung) |

Damit gilt „2 oder 3“ für Einzelentwickler B nicht als Unschärfe, sondern als faktenabhängiges Ergebnis mit ausgewiesenem Grenzfall.

### 3.6 Profilentscheidung

| Situation | Anforderungen |
|---|---|
| Empfehlung übernommen | Entscheidung durch Engagement Lead |
| Grenzfall-Alternative gewählt | + Begründung |
| Höherstufung | + Begründung |
| Herabstufung | + Begründung + Review durch Independent Reviewer / QA (andere Person) |
| Unterschreitung eines Floors | **nicht zulässig** |

Jede Entscheidung speichert Fakten, Policy-Version, Ableitung und Begründung. Änderungen an Schwellwerten wirken nicht rückwirkend.

### 3.7 Organisations- vs. Mandatsprofil

Das Organisationsprofil ist der Standard. Ein Mandat kann ein scope-spezifisches Profil erhalten, indem die Ableitung auf die Fakten des Scopes angewendet wird (z. B. nur das SaaS-Produkt statt des gesamten Unternehmens). Beides wird als eigenes `complexity_assessment` versioniert.

## 4. Profilparameter (Prozessumfang)

Richtwerte; Kalibrierung mit Ist-Daten aus Mandaten (§9). Vollständig in `src/proportionality/parameters.ts`.

| Parameter | 1 Lean | 2 Standard | 3 Enhanced | 4 Critical |
|---|---|---|---|---|
| Fragenkatalog | core | standard | extended | full |
| Interviews | ein kombiniertes Interview mit dem Inhaber | Schlüsselfunktionen | alle Control Owner | alle Control Owner + Betrieb |
| Evidenz | gezielt | Schlüssel-Controls | alle anwendbaren Controls | alle Controls mit Stichproben |
| Dokumentation | kompaktes Handbuch | Policy-Struktur | vollständige Hierarchie | gelenkte Dokumente mit Freigabe |
| Risk Assessment | vereinfachtes Register | formales Register | + Szenarien | + Quantifizierung |
| Rollenkombination | erlaubt | erlaubt, dokumentiert | eingeschränkt (Warnung) | nur mit SoD-Ausnahme |
| Freigabe | Einzelfreigabe | Owner + Lead | Vier-Augen | Vier-Augen + unabhängig |
| Vier-Augen für | kritische Findings | + Risikoakzeptanz | alle Findings, Policies, Abschlussbericht | + Evidence Reviews |
| Independent Review | – | – | ja | ja |
| Review-Zyklus | 12 Mon. | 12 Mon. | 12 Mon. | 6 Mon. |
| Internes Audit | 24 Mon. | 12 Mon. | 12 Mon. | 12 Mon. |
| Management Review | 12 Mon. | 12 Mon. | 12 Mon. | 6 Mon. |
| Reporting | Summary | Management Report | + KPIs | Board + regulatorisch |
| Experten | – | bei Bedarf | empfohlen je hoher Dimension | verpflichtend je hoher Dimension |

Erforderliche SMEs werden aus Dimensionen ≥ 3 abgeleitet (Kryptographie, KI, OT, Datenschutz, NIS2, BCM, Cloud).

## 5. Dynamic Control Applicability

```
Requirement → Control → Applicability Evaluation → Risk / Scope / Complexity → Required Implementation Depth
```

1. **Anwendbarkeit** folgt ausschließlich dem Scope: Gibt es den Gegenstand des Controls? (keine OT → OT-Segmentierung nicht anwendbar). Größe ist nie ein Grund für Nichtanwendbarkeit. Nicht anwendbar heißt immer: mit Begründung (Statement of Applicability).
2. **Basistiefe** = Prüftiefenprofil.
3. **Tiefentreiber** je Control heben die Tiefe über das Profil hinaus an. Beispiel: Einzelentwickler B mit Profil 2 → Access Review auf Tiefe 3 wegen privilegierten Zugriffs auf Kundensysteme. So wird nicht die ganze Organisation hochgestuft, sondern gezielt das betroffene Control.
4. **Tailoring** unter die erforderliche Tiefe ist möglich, erfordert aber Begründung und dokumentierte Risikoakzeptanz.

Access Review (aus dem Konzept) als Referenz:

| Tiefe | Umsetzung | Vier-Augen |
|---|---|---|
| 1 | Owner überprüft Zugriffe halbjährlich und dokumentiert das Ergebnis | nein |
| 2 | strukturierter Review je kritischem System, Abweichungen als Aufgabe | nein |
| 3 | System Owner auf Basis IAM-Export, Bestätigung durch zweite Person | ja |
| 4 | formalisiert: System Owner, IAM-Export, Reviewer, Vier-Augen, Finding Workflow, Evidence | ja |

Beispielkatalog: `src/proportionality/catalog.example.ts` (Access Review, Secure Development, OT-Segmentierung, Schlüsselmanagement).

## 6. Engagement-Modell

### 6.1 Mandat

Kunde · Scope · Engagement Type · Prüftiefenprofil (mit Verweis auf die Profilentscheidung) · Start/Ende · Team · Verantwortlichkeiten · Deliverables · Workflows · Reviews. Ein Mandat wird erst **aktiv**, wenn die Profilentscheidung vorliegt.

### 6.2 Rollen

| DT Agency | Kunde |
|---|---|
| Engagement Lead / Senior Consultant (genau einer je Mandat) | Executive Sponsor |
| Consultant | Primary Customer Contact |
| Junior Consultant | ISMS Manager / CISO (fachlich) |
| Subject Matter Expert (mit Domänen) | ISMS Coordinator (operativ) |
| Independent Reviewer / QA | Risk Owner |
| Engagement Coordinator | Control Owner |
| | Evidence Contributor |
| | Approver |

Eine Person kann mehrere Rollen halten (Multi-Role Support). Ansprechpartner und Verantwortlicher sind getrennte Rollen, die zusammenfallen können.

### 6.3 Responsibility Model

Jedes Arbeitsobjekt (Assessment, Assessment Section, Finding, Risk, Measure, Evidence Review, Report, Deliverable) trägt Zuordnungen vom Typ **Owner · Assignee · Reviewer · Approver · Contributor**.

| Regel | Inhalt |
|---|---|
| G1 | genau ein Owner je Objekt (auch in der DB erzwungen) |
| G2 | nur Mitglieder des Mandatsteams (DB: Fremdschlüssel) |
| G3 | Vier-Augen gemäß Profil: Reviewer/Approver ≠ Bearbeiter – sonst SoD-Ausnahme |
| G4 | kritische Bewertungen eines Junior Consultants: Review durch Engagement Lead, Independent Reviewer oder SME der Domäne |
| G5 | finale Deliverables: Freigabe durch Engagement Lead; ab Profil 3 zusätzlich Independent Review |
| G6 | Independent Reviewer arbeitet nicht am geprüften Objekt mit |

### 6.4 Segregation not feasible

```
Rollentrennung fachlich erforderlich, organisatorisch nicht möglich
  → Grund dokumentiert
  → kompensierende Maßnahme
  → Senior Review (Engagement Lead oder Independent Reviewer, nicht die betroffene Person)
```

Eine Ausnahme ohne kompensierende Maßnahme oder ohne Senior Review ist unwirksam. Mit wirksamer Ausnahme wird aus dem Fehler eine Warnung – der Sachverhalt bleibt sichtbar.

### 6.5 Teamvalidierung

| Regel | Inhalt |
|---|---|
| T1 | Profil muss zum Template passen |
| T2 | genau ein Engagement Lead |
| T3 | Pflichtrollen des Templates besetzt |
| T4 | Independent Reviewer, wenn das Profil es verlangt |
| T5 | Independent Reviewer hält keine Durchführungsrolle im selben Mandat |
| T6 | Pflicht-Kundenrollen des Profils besetzt (Warnung) |
| T7 | Control Owner + Approver in einer Person: Profil 3 Warnung, Profil 4 Fehler ohne SoD-Ausnahme |
| T8 | erforderliche/empfohlene SMEs aus dem Complexity Profile |

### 6.6 Auditunabhängigkeit

Wer beim selben Kunden in den letzten **24 Monaten** beraten oder umgesetzt hat (Readiness, Implementation, NIS2 Readiness, Continuous Operation), darf dort kein internes Audit durchführen (Regel I1).

## 7. Quality Gate für Findings

```
draft ──submit──▶ in_review ──confirm──▶ confirmed ──present──▶ customer_discussion ──▶ accepted
  ▲                  │                                                   │
  └────return────────┘                       in_review ◀──rereview── disputed
```

- KI-Assistenz erzeugt Entwürfe (`ai_assisted`), löst aber **keinen** Statuswechsel aus.
- Junior Consultants reichen ein, bestätigen aber nicht.
- Kritische Findings (Schwere high/critical) bestätigen nur Engagement Lead, Independent Reviewer oder der SME der Domäne.
- Vier-Augen gemäß Profil: Der Autor bestätigt sein eigenes Finding nicht.
- Kunden sehen Findings erst ab `customer_discussion` (in der DB per Row Level Security erzwungen).
- Statusverlauf ist append-only.

## 8. Engagement Templates

| Template | Profile | Team (Pflicht / optional) |
|---|---|---|
| Solo Developer Security Assessment | 1 | Engagement Lead / Junior |
| SME ISO 27001 Readiness | 2 | Engagement Lead, Junior / SME |
| ISO 27001 Implementation | 2–3 | Engagement Lead, Consultant, Independent Reviewer / SME |
| NIS2 Readiness | 3–4 | Engagement Lead, Consultant, SME |
| Third-Party Assessment | 1–4 (aus Third-Party Pre-Assessment) | Engagement Lead / Consultant |

Profilabhängige Anforderungen (Independent Reviewer, SMEs, Kundenrollen) kommen zu den Template-Anforderungen hinzu.

## 9. Effort Scaling

Ziel (später): `Scope + Prüftiefenprofil + Standorte + Systeme + Interviews + Third Parties + Regulierung (+ Reifegrad) → geschätzter Beratungsaufwand`.

Voraussetzung ist eine Datenbasis. Deshalb werden **ab dem ersten Mandat** Ist-Aufwände je Tätigkeitsart erfasst (`effort_entry`: Planung, Interview, Dokumenten-/Evidence-Review, Assessment, Finding-Entwurf, Review/QA, Reporting, Kundentermin, Koordination). Nach etwa 10–20 abgeschlossenen Mandaten je Template lässt sich ein parametrisches Modell kalibrieren, das Paketpreise, Kapazitäts- und Deckungsbeitragsplanung trägt. Der Reifegrad ist hier – anders als beim Profil – ein zentraler Faktor.

## 10. Designentscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| E1 | Regelbasierte, erklärbare Ableitung statt gewichteter Gesamtsumme | Summenmodelle mitteln kritische Einzelrisiken weg und lassen Größe dominieren. Jede Stufe muss gegenüber Kunde und Auditor begründbar sein. |
| E2 | Reifegrad fließt nicht ins Profil | Das Profil beschreibt, wie viel Assurance nötig ist – nicht, wie weit der Weg ist. Ein unreifes Unternehmen mit hohem Risiko braucht nicht weniger Assurance. Der Reifegrad steuert Aufwand und Roadmap. |
| E3 | Komplexität hebt höchstens um eine Stufe und nie über Profil 3 | Setzt „Profile sind keine Größenklassen“ technisch durch. Profil 4 entsteht nur aus Kritikalität oder Regulierung. |
| E4 | Regulierung als harte Untergrenzen | Gesetzliche Pflichten sind nicht verhandelbar. NIS2 „wichtig“ allein → 3, in Kombination mit OT bzw. sehr hoher Kritikalität → 4 (entspricht dem Produktionsbeispiel). |
| E5 | Control-Tiefe kann über das Profil hinaus steigen | Vermeidet, eine ganze Organisation wegen eines Einzelrisikos hochzustufen. |
| E6 | Grenzfälle ausweisen, Mensch entscheidet; Herabstufung nur mit QA | Die Methode empfiehlt, die fachliche Verantwortung bleibt beim Engagement Lead. |
| E7 | Policy-Versionierung | Reproduzierbarkeit: Warum hatte Kunde X im März Profil 3? |
| E8 | KI nur für Entwürfe | Fachliche Verantwortung wird nicht delegiert (Konzept §22). |
| E9 | Kritische Findings immer mit zweiter Person, auch im Lean-Profil | Qualitätsversprechen und Haftung; der Mehraufwand betrifft nur wenige Findings. |
| E10 | Kundensicht auf Findings erst nach Quality Gate, in der DB erzwungen | Ungeprüfte Entwürfe dürfen den Kunden nicht erreichen – auch nicht über eine fehlerhafte UI. |
| E11 | Karenzzeit 24 Monate für Audits nach Beratung | Angelehnt an die Zweijahresregel der ISO/IEC 17021-1 für Zertifizierungsstellen; für interne Audits fordert ISO 27001 (9.2) Objektivität und Unparteilichkeit. Konfigurierbar. |
| E12 | Ist-Aufwände ab Tag 1 erfassen | Ohne Daten keine belastbare Aufwandsschätzung. |

## 11. Offene Punkte

Die offenen Punkte werden auf der Entscheidungsseite geführt: [`entscheidungen.md`](../entscheidungen.md).

| Bisher | Jetzt |
|---|---|
| O1 Kalibrierung | ENT-001 (freigegeben 2026-11-12) |
| O2 NIS2-Untergrenze | ENT-002 (freigegeben 2026-11-12) |
| O3 ISO-Zertifizierungsziel | ENT-003 (freigegeben 2026-11-12) |
| O4 ISMS Manager vs. Coordinator | ENT-004 (freigegeben 2026-11-12) |
| O5 Bestätigung kritischer Findings | ENT-005 (freigegeben 2026-11-12) |
| O6 Zweitprüfung in Lean-Mandaten | ENT-006 (freigegeben 2026-11-12) |
| O7 Sichtbarkeit von Findings | ENT-007 (freigegeben 2026-11-12) |
| O8 Third-Party Pre-Assessment | ENT-008 (freigegeben 2026-11-12) |
| O9 Regulatorische Module | ENT-009 (freigegeben 2026-11-12) |
| O10 Neubewertung | ENT-010 (freigegeben 2026-11-12) |
| O11 Mehrmandantenfähigkeit | ENT-011 (freigegeben 2026-11-12) |
| O12 Technologie-Stack | entschieden: TypeScript-Domänenkern, PostgreSQL-Schema; Engine/DMN nach stabilem MVP (ENT-032) |

## 12. Umsetzung im Repository

| Konzept | Code | Tests |
|---|---|---|
| §2 Complexity Profile | `src/proportionality/dimensions.ts` | `test/profile.test.ts` |
| §3–§7 Prüftiefenprofil, Floors, Entscheidung | `src/proportionality/profile.ts` | `test/profile.test.ts` |
| §8 Profilparameter, SMEs | `src/proportionality/parameters.ts` | `test/engagement.test.ts` |
| §9 Control Applicability | `src/proportionality/controls.ts`, `catalog.example.ts` | `test/controls.test.ts` |
| §10–§21 Mandat, Rollen, Responsibility Model | `src/engagement/model.ts`, `governance.ts` | `test/engagement.test.ts` |
| §22 Quality Gate | `src/engagement/findings.ts` | `test/engagement.test.ts` |
| §23 Templates | `src/engagement/templates.ts` | `test/engagement.test.ts` |
| Persistenz, Invarianten, RLS | `db/migrations/0001_engagement_proportionality.sql` | `db/tests/0001_smoke.sql` |
