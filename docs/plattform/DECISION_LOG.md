# Decision Log – Plattform

Index nach `05_CLAUDE_HANDOFF.md` §8 Nr. 4. **Maßgeblich ist die Entscheidungsseite [`entscheidungen.md`](../../entscheidungen.md)** – dort Optionen, Begründung und Freigabe; hier nur die Übersicht für die Plattform.

| ID | Frage | Status | Empfehlung | Konsequenz |
|---|---|---|---|---|
| ADR-001 | Variante C (Direktzugang / geführte Ermittlung) | vereinbart (README) | – | Intake mit `entryRoute` |
| ADR-002 – ADR-010 | siehe README des Plans | empfohlen (README) – **noch nicht freigegeben** | übernehmen; Konflikte unten | – |
| ENT-021 | Scopes Organisation/Produkt | offen – neuer Plan liegt vor | Assessment-Objekt als eigene Entität (`07`: `assessmentObject`) | löst Pilotfall ADR-009 |
| ENT-026 | Normbezüge, Lizenz, Formulierungen | vorgeschlagen | Vorlage `docs/vorschlaege/2026-11-12-ENT-026-029-…` | Gate für ISO-Inhalte |
| ENT-029 | „verifiziert“ und „freigegeben“ | vorgeschlagen | zwei Stufen – passt zu ADR-006/008 und BPMN | zusätzliche Stufe in Status und Schema |
| ENT-030 | Begriffskonflikt „Assurance Profile“ | offen | Proportionalitätsprofil 1–4 = „Prüftiefenprofil“; `assuranceProfile` aus `07` = „Aussagequalität“ (Review, Unabhängigkeit) | Umbenennung in einem der beiden Modelle |
| ENT-031 | Statusvokabular der Beispiel-Cases | offen | Abbildung auf Achsenmodell und Freigabestufen | Schema/Mapping |
| ENT-032 | Technologie, BPMN-Engine, DMN vs. Regelcode | offen (README: nicht entschieden) | Regeln vorerst als versionierter Code; Engine erst nach L1 | keine voreilige Migration |
| ENT-033 | Vollständiger Fragebogen vs. progressive Fragen | offen | Einstufung mit Teilfakten, ungeklärte materielle Fakten als Unsicherheit | Änderung Einstufungswerkzeug |
| ENT-034 | Rechtsgrundlage für Kontaktaufnahme (DiscoveryRun) | offen | erst Wissen erfassen; Outreach im MVP aus | Gate für G-03/G-04 |
| – | Dateien 01, 02, 04, 06, 08 | **fehlen** | nachreichen | blockiert Blueprint, MVP-Plan, DMN, P0-Tests |
