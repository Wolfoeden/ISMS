# Service Blueprint – Umsetzung

| | |
|---|---|
| Stand | 2026-11-12 · nach `05_CLAUDE_HANDOFF.md` §8 Nr. 2 |
| Grundlage | 01 Journey, 02 Fachkonzept, 04 Backlog, 08 Traceability (`docs/vorgaben/eingang-2026-11-12-plan/`) |
| Status | Spezifikation, **kein UI umgesetzt**. Regeln mit ✔ existieren bereits getestet im Domänenkern bzw. Schema |

## 1. Rollen und Sichten

| Kürzel | Rolle | Sicht | Darf nie |
|---|---|---|---|
| C | Kunde (Kontakt, Fachverantwortliche, Risk Owner) | Client Portal: Übersicht · Meine Aufgaben · Unterlagen · Ergebnisse | Severity, QA-Freigabe, Findings löschen |
| P | Plattform/Agent | – | `verified`/`persisted_locked` ändern, extern senden, publizieren |
| J | Junior/Analyst | Workspace: Queue | verbindlich einstufen oder freigeben |
| L | Engagement Lead | Workspace: Entscheidungen | eigene Berichte QA-freigeben (wo SoD verlangt) |
| Q | Reviewer/QA | QA-Konsole | als Autor/Verifizierer desselben Objekts freigeben |
| M | Methodikverantwortlicher | Admin | laufende verifizierte Bewertungen still ändern |

Gemeinsame Regeln aller Screens: Mandantenprüfung serverseitig (RLS ✔ Muster), jede Statusänderung erzeugt ein `AuditEvent` (append-only ✔ Muster `finding_transition`), Uploads und Webtexte sind untrusted input, kein Prozent-Score ohne kalibrierte Methode, Fortschritt getrennt nach Erhebung · Bewertung · Review · Freigabe.

## 2. Client Portal

| Screen | Use Case | Aktionen | Minimale Felder | Serverseitige Regeln | Fehlerzustände | Status | Audit Event | Berechtigung |
|---|---|---|---|---|---|---|---|---|
| **S01 Start / Variante C** | Einstieg wählen (US-A1, TC-01/02) | „Ich weiß, was ich brauche“ · „Helfen Sie mir“ · „Anfrage meines Kunden“ · „fortsetzen“ | `entryRoute` (KNOWN_NEED/GUIDED_DISCOVERY), Datenschutz-/Nutzungshinweis bestätigt | Wechsel A↔B erhält bestätigte Felder; keine Pflichtbehauptung („Sie sind NIS2-pflichtig“) | Hinweis nicht bestätigt → kein Speichern; Duplikat → bestehender Case angeboten | `IntakeCase.phase=intake` | `intake.created`, `intake.route_changed` | öffentlich + Consent; danach Case-Token |
| **S02 Adaptive Discovery** | 3–7 Kernfragen, dann objektspezifisch (US-A3, ADR-005) | beantworten, „weiß ich nicht“, Link/Dokument (nur minimiert, DEC-08) | Objektart, Ziel, Länder, Rechtseinheit; Branche/Größe nur falls relevant | Ask once: belegte Fakten nicht erneut fragen; Antwort `Ja/Nein/Teilweise/Unbekannt/Nicht anwendbar`, N/A nur mit Begründung; jede Antwort = `ContextFact` mit Quelle `CUSTOMER_INPUT`, Status `UNVERIFIED` | vertrauliche Evidenz vor Mandat → abgewiesen mit Hinweis | `OpenQuestion.resolution_state` | `fact.recorded`, `question.unknown_marked` | Case-Token |
| **S03 Erste Orientierung** | Fakten · Hypothesen · Unsicherheit · nächste Fragen (US-A2) | Rückfragen beantworten, S04 anfordern | – (Anzeige) | D-01, D-04: Kandidaten mit Status `preliminary`, Gründe, fehlende Fakten; max. 3 Rückfragen; NIS2-Vorprüfung § 28 BSIG ✔ als Kandidat, nie als Feststellung; Formulierungsregeln §A17 ✔ | Regel-/AI-Ausfall → deterministische Anzeige ohne AI-Text (TC-21) | `preliminary` | `orientation.shown` (Regelversion) | Case-Token |
| **S04 Scope / Angebot / Beauftragung** | Vorläufigen Scope abstimmen, Angebot, Auftrag (TC-07/08/22) | Scope bestätigen, Änderung anfragen, ablehnen, beauftragen | Ziel, Objekt(e), Ein-/Ausschlüsse, Modus, Assurance-Aussage, Leistungsabgrenzung | Angebot versioniert; Änderung → neue Scope-/Angebotsversion; Mandat nur nach Signatur, **idempotent** (TC-20); Text unterscheidet Beratungs-Assessment und Zertifizierung (TC-22) | Frist abgelaufen → `offer_expired`, keine Evidenzerhebung | Mandate `draft→offered→signed` | `offer.sent`, `offer.changed`, `mandate.signed` | Kundenvertreter mit Vollmacht |
| **S05 Dashboard** | „Das brauchen wir jetzt von Ihnen“ | Aufgabe öffnen | – | nur eigene, relevante Tasks (WP-07); Status in Kundensprache (Dual View) | – | Case-Status | – | Mandatsrolle Kunde |
| **S06 Evidence Upload + Rückfragen** | Nachweise liefern, sichere Rückfragen | hochladen, verlinken, „nicht verfügbar“ dokumentieren | Datei/Link, betroffene Aufgabe | erst nach `mandate.active`; Hash, Quelle, Zeit, Version, Klassifikation (✔ Tabelle `evidence`); Verschlüsselung; Dokument ≠ wirksame Kontrolle | Datei mit eingebetteten Anweisungen → als Inhalt behandeln, Sicherheitsereignis (TC-11) | `evidence.review_state=received` | `evidence.uploaded` | Evidence Contributor |
| **S07 Ergebnis** | Bericht mit Grenzen (US-D1, TC-16) | lesen, Faktenkorrektur anfragen | – | nur `ReportVersion` gesperrt + publiziert; Faktenkorrektur → `Dispute/Clarification`, nie Löschen (TC-14) ✔ Kundenreaktion `bestritten` | – | `published` / `closed_with_limitations` | `report.viewed`, `dispute.opened` | Mandatsrolle Kunde |

## 3. Consultant Workspace

| Screen | Use Case | Aktionen | Minimale Felder | Serverseitige Regeln | Fehlerzustände | Status | Audit Event | Berechtigung |
|---|---|---|---|---|---|---|---|---|
| **S08 Triage / Mandatierung / Scope** | Opportunity qualifizieren, Scope finalisieren | qualifizieren, Angebot freigeben, Scope finalisieren | Opportunity-Stage, Gründe, ScopeVersion | Outreach im MVP gesperrt (DEC-09, TC-06); Scope-Freigabe nur L; Mandatsteam-Validierung ✔ (T1–T8) | Scope ohne Mandat → abgewiesen | Opportunity `new…won`; Case `scope_draft→scope_approved` | `scope.approved` | L (J bereitet vor) |
| **S09 Plan & Regulatory/Assurance Decisions** | Regulatorik, Profil, Kriterien verifizieren (US-B1/B2/B3) | Vorschlag annehmen/korrigieren/ablehnen/vertagen | je Entscheidung: Regel-/Policy-Version, Eingaben, Begründung | D-05/D-07/D-08: Vorschlag → menschliche Verifikation → gesperrt; Profilableitung + Untergrenzen ✔, Herabstufung nur mit Begründung + QA ✔ (US-B3); `unknown_material` blockiert positive Aussage | Untergrenze unterschritten → abgewiesen ✔ | Artefakt `ai_proposed→in_review→verified→persisted_locked` | `determination.verified` | L, ggf. Fachexperte |
| **S10 Evidence Explorer / AI Proposals / Verified Objects** | Evidenz zuordnen, AI-Vorschläge prüfen (US-C1/C2, TC-10/12) | zuordnen, Vorschlag annehmen/korrigieren/ablehnen/vertagen | EvidenceLink mit **Bewertungsumfang**, Fundstelle | Reuse nur mit Scope-/Stand-Prüfung; AI überschreibt nie `verified` (neuer Vorschlag) ✔ Regel; R1/R2 „ausreichend“ nur mit geeignetem Nachweis ✔ Schema | fremde Tenant-Evidenz unsichtbar (TC-18) ✔ RLS-Muster | Evidence `received→suitable/unsuitable/expired` | `proposal.accepted/rejected/deferred` | J (vorbereiten), L (verifizieren) |
| **S11 Interview-/Question Queue** | fehlende Fakten gezielt erheben | Frage stellen, Erinnerung, Interview protokollieren | OpenQuestion: Materialität, Owner, Frist | D-06 Entscheidungsfähigkeit (Tabelle 02 §5.1); Fristen konfigurierbar (DEC-10) | Frist → Erinnerung/Eskalation; material unbekannt → `blocked_material_unknown` | `waiting_customer` | `question.sent`, `question.resolved` | J, L |
| **S12 Findings / Risks / Actions / Report Draft** | getrennte Register, Berichtsentwurf (WP-09) | Finding/Risiko/Empfehlung anlegen, verifizieren, Entwurf erzeugen | Finding: Kriterium, Aussage, Evidenzlinks, Schwere; Risk: Szenario, Kriterienversion, Risk Owner; Action: Empfehlung, Priorität | Finding ≠ Risiko ≠ Empfehlung ✔ Tabellen; berechneter Berichtsstatus ✔; Quality Gate (Schwere hoch/kritisch nur L/Reviewer/SME) ✔; Satzbausteine/Sperrliste ✔ | unbelegte Feststellung → abgewiesen | `assessing→internal_review` | `finding.verified`, `report.draft_created` | J Entwurf, L verifiziert |

## 4. QA-Konsole

| Screen | Use Case | Aktionen | Minimale Felder | Serverseitige Regeln | Fehlerzustände | Status | Audit Event | Berechtigung |
|---|---|---|---|---|---|---|---|---|
| **S13 Revision, Traceability, SoD, Freigabe** | unabhängige Prüfung (US-C3, TC-13/15/16) | `approve` · `approve_with_explicit_limitations` · `return_for_rework` · `reject/stop` | Review: Scope-Version, Methode, Ergebnis, Stichproben bis Originalevidenz | D-11 Review-Level, D-12 Rework-Ziel, D-13 Abschluss; SoD: Reviewer ≠ Autor ✔ (G6, T5); Freigabe-DoD ✔ (Gesamturteil, Umfang, Einschränkungen); Publikation erzeugt gesperrte `ReportVersion`, Änderung = neue Version (US-D2) | Reviewer = Autor → blockiert (TC-13); QA-Reject → Rework in richtige Phase, kein Versand (TC-15) | `qa→approved→published` / `rework` / `closed_with_limitations` | `review.decided`, `report.published` | Q |

## 5. Abbildung BPMN → Screens

Wie in 08 §2; ergänzend: `T_EvidenceIntake`/`T_Readiness` → S06/S10/S11, `Call_Configure` → S09, `Call_Assess` → S10–S12, `T_QA` → S13, `T_Publish` → S07. User Tasks für Verifikation und Freigabe bleiben menschliche Aufgaben (Handoff §5).
