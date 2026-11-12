# Decision Log – Plattform

Index nach `05_CLAUDE_HANDOFF.md` §8 Nr. 4. **Maßgeblich ist die Entscheidungsseite [`entscheidungen.md`](../../entscheidungen.md)** – dort Optionen, Begründung und Freigabe; hier nur die Übersicht für die Plattform.

| ID | Frage | Status | Empfehlung | Konsequenz |
|---|---|---|---|---|
| ADR-001 | Variante C (Direktzugang / geführte Ermittlung) | vereinbart (README) | – | Intake mit `entryRoute` |
| ADR-002 – ADR-010 | siehe README des Plans | empfohlen (README) – **noch nicht freigegeben** | übernehmen; Konflikte unten | – |
| ENT-021 | Scopes Organisation/Produkt | vorgeschlagen | Option 3: ein Mandat, mehrere `AssessmentObject`s (02 §3) | löst Pilotfall ADR-009 |
| ENT-026 | Normbezüge, Lizenz, Formulierungen | vorgeschlagen | Vorlage `docs/vorschlaege/2026-11-12-ENT-026-029-…` | Gate für ISO-Inhalte |
| ENT-029 | „verifiziert“ und „freigegeben“ | **freigegeben** (Paul, 2026-11-12) – Ablage offen | zwei Stufen – bestätigt durch 02 §7.1 (Spalten V und F) und §4.4 | zusätzliche Stufe in Status und Schema |
| ENT-030 | Begriffskonflikt „Assurance Profile“ | **abgelegt** (freigegeben Paul, 2026-11-12) | Proportionalitätsprofil 1–4 = „Prüftiefenprofil“; `assuranceProfile` aus `07` = „Aussagequalität“ (Review, Unabhängigkeit) | Umbenennung in einem der beiden Modelle |
| ENT-031 | Statusvokabular der Beispiel-Cases und 02 | vorgeschlagen | Abbildungstabelle im Eintrag | Schema/Mapping |
| ENT-032 | Technologie, BPMN-Engine, DMN vs. Regelcode | offen (README: nicht entschieden) | Regeln vorerst als versionierter Code; Engine erst nach L1 | keine voreilige Migration |
| ENT-033 | Vollständiger Fragebogen vs. progressive Fragen | offen | Einstufung mit Teilfakten, ungeklärte materielle Fakten als Unsicherheit | Änderung Einstufungswerkzeug |
| ENT-034 | Rechtsgrundlage für Kontaktaufnahme (DiscoveryRun) | vorgeschlagen | erst Wissen erfassen; Outreach im MVP aus | Gate für G-03/G-04 |
| ENT-035 | Prüftiefe 3 Stufen (DEC-11) vs. Profil 1–4 | **abgelegt** (freigegeben Paul, 2026-11-12) | intern 4 Profile, nach außen Basis/Standard/Enhanced | Angebotssprache, D-07 |
| ENT-036 | Mandats-/Case-Status nach 02 §4 | vorgeschlagen | übernehmen, Migration 0003 | Schema, Upload erst ab `active` |

**Gate 0 (04 §5) vor dem ersten Plattform-Code:** ENT-029 ✔ (Ablage offen), ENT-030 ✔, ENT-035 ✔ (abgelegt); offen: ENT-032, ENT-036; für Berichtstexte zusätzlich ENT-026.

## Fachliche Entscheidungen des Plans (06) → Repository

Status in 06: „Empfehlung bis finaler Beschluss“ – keine davon ist freigegeben.

| DEC | Thema | Empfehlung 06 | Stand im Repository | Bezug |
|---|---|---|---|---|
| DEC-01 | Produktbezeichnung | Assessment & Assurance Platform, ISMS als Modul | Arbeitssystem heißt „ISMS“ | Benennung offen |
| DEC-02 | Variante C | Beschluss | Intake fehlt | ADR-001, G-01 |
| DEC-03 | erste 3PA-Art | Einzelunternehmer + Softwareprodukt, keine Zertifizierung | Sperrliste „zertifiziert“ ✔ | ENT-021, TC-22 |
| DEC-04 | Mindest-Assurance für verkaufbaren Bericht | Kriterien, verifizierte Findings, Traceability, QA | Freigabe-DoD ✔ | ENT-029, D-13 |
| DEC-05 | Vier-Augen-Pflicht | im MVP QA für jeden finalen Bericht | SoD-Regeln ✔ | D-11 |
| DEC-06 | Inhalt kostenfreies Screening | Hypothesen, Kandidaten, Fragen, kein Rating | Formulierungsregeln §A17 ✔ | S03 |
| DEC-07 | Framework-Bibliothek | Referenzmetadaten, keine ISO-Volltexte | Regel 6 CLAUDE.md ✔ | ENT-026 |
| DEC-08 | Daten vor Mandat | nur minimiert | – | S02, ENT-036 |
| DEC-09 | proaktive Discovery im MVP | nein | – | ENT-034 |
| DEC-10 | Antwortfristen | P14D/P21D Platzhalter, konfigurierbar | – | S11 |
| DEC-11 | Assessment-Tiefe | Basis/Standard/Enhanced | Profil 1–4 | **ENT-035** |
| DEC-12 | Kundenkorrektur | Fakten und eigene Antworten, nicht Severity/QA | Kundenreaktion ✔ (findings.ts) | S07 |
| DEC-13 | „nicht beurteilbar“ | materielle Lücken → Limitation oder Stopp durch QA | Berichtsstatus `not_assessed` ✔ | D-13, ENT-033 |
| DEC-14 | Scope-Drift | Change Request + neue ScopeVersion | – | WP-04 |
| DEC-15 | Technologie | erst Repo untersuchen | Gap-Analyse ✔ | **ENT-032** |
| DEC-16 | Kundenevidenz und AI-Dienste | Opt-in, AVV, kein Training | Regel 7 CLAUDE.md ✔ | ENT-032 |
| DEC-17 | Reportformate | PDF/HTML versioniert, Reviewer-Metadaten | – | WP-10 |
| DEC-18 | Marktsegment | KMU/Einzelunternehmer mit Softwareprodukt | Größenklasse ✔ | – |
