---
mandant: {{kuerzel}}
dokument: isms
status: entwurf
leistungsart: offen
stand: {{datum}}
---
# ISMS – {{name}}

> Eigenständiges Artefakt des Mandats. **Hier steht nur Freigegebenes.** Jede Ergebniszeile nennt ihre Grundlage: abgelegte Entscheidung (`[E-003]`, `[ENT-002]`), freigegebener Bibliothekseintrag (`[BIB-BSIG-30]`) oder beantwortete Frage (`[ORG-01]`).
> Bewertungen in Codes nach `vorschriften.md` §A8; der **Berichtsstatus wird berechnet** und vom Werkzeug nachgerechnet. Formulierungen nach §A17.
> `status`: `entwurf` → `in_pruefung` → `freigegeben` (nur bei erfüllter Definition of Done). `leistungsart` aus E-004; Auditbegriffe nur bei `internal_audit`.
> `npm run isms -- pruefen {{kuerzel}}` muss fehlerfrei sein.

## 1. Organisation und Scope

| Punkt | Inhalt | Grundlage |
|---|---|---|
| Organisation | | |
| Geschäftstätigkeit | | |
| Scope | | |
| Ausschlüsse mit Begründung | | |

Bewertungsobjekte ([ENT-021]): ein Mandat, ein oder mehrere Objekte mit eigenen Grenzen und eigener Bewertung; gemeinsame Fakten werden nur einmal erhoben. Art: `organisation` · `produkt` · `standort` · `dienst` · `lieferant` · `ki_system`. Bei mehr als einem Objekt tragen die Bewertungstabellen eine Spalte `Objekt`, und §10 nennt je Objekt ein eigenes „Gesamturteil O-n“.

| Objekt | Art | Bezeichnung / Version | Grenzen | Grundlage |
|---|---|---|---|---|
| O-1 | organisation | | | |

## 2. Einstufung

| Punkt | Ergebnis | Grundlage |
|---|---|---|
| NIS2 / BSIG | | |
| Prüftiefenprofil | | |
| Untergrenzen, Grenzfall, Abweichung | | |
| Größenklasse und Organisationsform | | |
| Policy-Version | | |

## 3. Anwendbare Vorschriften und Pflichten

| Vorschrift | Anwendbar | Pflichten und Fristen | Grundlage |
|---|---|---|---|

## 4. ISMS-Parameter

| Parameter | Festlegung | Grundlage |
|---|---|---|
| Interviewtiefe | | |
| Evidenz | | |
| Vier-Augen-Prinzip | | |
| Review-Zyklus | | |
| Internes Audit | | |
| Managementbewertung | | |
| Reporting | | |

## 5. Rollen und Verantwortlichkeiten

| Rolle | Person | Grundlage |
|---|---|---|
| Engagement Lead (DT Agency) | | |
| Executive Sponsor | | |
| ISMS Manager / CISO | | |
| ISMS Coordinator | | |

## 6. Prüfbereiche und Controls

Gliederung nach § 30 Abs. 2 BSIG (`vorschriften.md` §B2.3). Tiefe 1–4 aus Prüftiefenprofil und Risikotreibern. Codes: Anwendbarkeit `applicable` · `not_applicable` · `undecided` · Umsetzung `unknown` · `absent` · `partial` · `present` · Wirksamkeit `not_verified` · `effective` · `ineffective` · Evidenzlage `none` · `claim_only` · `insufficient` · `sufficient` · `conflicting`. Nachweise als `notizen/<datei>.md`; „ausreichend“ verlangt einen Nachweis mit `art: evidence` und `pruefung: geeignet`.

| Prüfbereich / Control | Anwendbarkeit | Tiefe | Umsetzung | Wirksamkeit | Evidenzlage | Berichtsstatus | Nachweise | Grundlage |
|---|---|---|---|---|---|---|---|---|
| 1 Risikoanalyse und Sicherheitskonzepte | | | | | | | | |
| 2 Bewältigung von Sicherheitsvorfällen | | | | | | | | |
| 3 Betriebskontinuität, Backup, Krisenmanagement | | | | | | | | |
| 4 Sicherheit der Lieferkette | | | | | | | | |
| 5 Erwerb, Entwicklung, Wartung, Schwachstellen | | | | | | | | |
| 6 Bewertung der Wirksamkeit | | | | | | | | |
| 7 Schulung und Sensibilisierung | | | | | | | | |
| 8 Kryptographie | | | | | | | | |
| 9 Personal, Zugriffskontrolle, IKT-Verwaltung | | | | | | | | |
| 10 MFA, gesicherte Kommunikation | | | | | | | | |

### 6a. ISO/IEC 27001 Abschnitte 4–10 (nur bei ISO-Mandaten)

Pflichtanforderungen: Anwendbarkeit immer `applicable`. Erfüllung `open` · `met` · `partially_met` · `not_met`. Gliederung: 30 Unterabschnitte laut BIB-ISO27001.

| Abschnitt | Erfüllung | Evidenzlage | Berichtsstatus | Nachweise | Grundlage |
|---|---|---|---|---|---|

### 6b. Erklärung zur Anwendbarkeit – SoA (nur bei ISO-Mandaten)

Referenz: ISO/IEC 27001 Anhang A (`A.5.1` … `A.8.34`). Nichtanwendbarkeit nur mit begründeter, freigegebener Entscheidung.

| Control | Anwendbarkeit | Begründung | Tiefe | Umsetzung | Wirksamkeit | Evidenzlage | Berichtsstatus | Risiken | Nachweise | Grundlage |
|---|---|---|---|---|---|---|---|---|---|---|

## 7. Risiken

Phasen: `identifiziert` · `bewertet` · `behandlung_entschieden` · `restrisiko_akzeptiert` · `in_ueberwachung` · `geschlossen`. Restrisiken akzeptiert nur der Risk Owner.

Methode ([ENT-022]): Methode des Kunden, falls vorhanden (Kriterien, Skalen, Schwellen hier dokumentieren); sonst DT-Standard `RM-2026-11.1` – Bewertung als `W3×A4=12 (kritisch)`, wird vom Werkzeug nachgerechnet.

| Methode | Akzeptanzschwelle (Kunde) | Grundlage |
|---|---|---|
| | | |

| ID | Risiko | Bewertung | Behandlung | Phase | Risk Owner | Grundlage |
|---|---|---|---|---|---|---|

## 8. Feststellungen

Schwere: `gering` · `mittel` · `hoch` · `kritisch`. Kundenreaktion: `offen` · `besprochen` · `akzeptiert` · `bestritten`.

| ID | Feststellung | Schwere | Prüfbereich | Kundenreaktion | Grundlage |
|---|---|---|---|---|---|

## 9. Empfehlungen und Korrekturmaßnahmen

Phasen: `offen` (Empfehlung) · `beschlossen` · `in_umsetzung` · `umgesetzt` · `wirksam_bestaetigt` · `verworfen`.

| ID | Maßnahme | Phase | Verantwortlich | Frist | Bezug | Grundlage |
|---|---|---|---|---|---|---|

## 10. Prüfergebnis

Formulierungen nach `vorschriften.md` §A17.3 – keine Aussage über den geprüften Umfang hinaus.

| Punkt | Ergebnis | Grundlage |
|---|---|---|
| Gesamturteil | | |
| Prüfumfang | | |
| Prüfzeitraum und Methode | | |
| Einschränkungen | | |
| Verifizierung DT Agency | | |
| Freigabe DT Agency | | |
| Kenntnisnahme Kunde | | |

## 11. Offene Punkte

Verweise auf noch offene Entscheidungen (hier dürfen nicht freigegebene Punkte stehen):

- [E-001] Scope der Prüfung
- [E-002] NIS2-/BSIG-Betroffenheit
- [E-003] Prüftiefenprofil
- [E-004] Mandatstemplate und Team
