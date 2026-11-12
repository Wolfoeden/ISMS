---
id: BIB-MET-PROFIL
titel: Methodik – Ableitung des Prüftiefenprofils (Policy 2026-11.1)
art: methodik
verbindlichkeit: interner_standard
rechtsraum: intern
status: entwurf
quellen:
  - docs/01-engagement-proportionality-model.md
  - src/proportionality/profile.ts
  - quellen/de-bsig-p30.txt
stand_der_quelle: 2026-11-12
erfasst_von: Agent bibliothek, 2026-11-12
freigegeben_von:
freigegeben_am:
naechste_pruefung: 2027-05-12
---
# Methodik – Ableitung des Prüftiefenprofils

Eigene Methodik von DT Agency. Verbindlich, sobald [ENT-001] freigegeben ist. Details: `docs/01-engagement-proportionality-model.md`, Umsetzung: `src/proportionality/`.

## Kernaussagen

1. **Gesetzliche Grundlage der Proportionalität:** Risikoexposition, Größe, Umsetzungskosten, Eintrittswahrscheinlichkeit und Schwere sowie gesellschaftliche und wirtschaftliche Auswirkungen ([BIB-BSIG-30]).
   > [de-bsig-p30.txt · Abs. 1 Satz 2] das Ausmaß der Risikoexposition, die Größe der Einrichtung, die Umsetzungskosten und die Eintrittswahrscheinlichkeit und Schwere von Sicherheitsvorfällen sowie ihre gesellschaftlichen und wirtschaftlichen Auswirkungen zu berücksichtigen.
2. **Vier Profile:** 1 Lean · 2 Standard · 3 Enhanced · 4 Critical / Regulated. Profile sind keine Größenklassen.
3. **Ableitung:** zehn Dimensionen aus dem Fragebogen (Stufen 0–4) → Exposure-Score (Spitze + Top-3-Mittel) → Band; Komplexität hebt um höchstens eine Stufe und nie über Profil 3; Untergrenzen F1–F8; Grenzfälle werden markiert. Der Reifegrad fließt nicht ein.
4. **Entscheidung:** Empfehlung des Werkzeugs → Entscheidung durch den Engagement Lead; Abweichungen mit Begründung, Herabstufung nur mit QA-Review, Untergrenzen nie unterschreitbar.
5. **Umsetzungstiefe je Control** (1 Basic … 4 Assured) folgt dem Profil und kann durch Risikotreiber angehoben werden.

## Bedeutung für die ISMS-Parameter

Profil → Prozessparameter (Interviewtiefe, Evidenz, Vier-Augen, Review- und Auditzyklen, Reporting) gemäß `src/proportionality/parameters.ts` und docs/01 §4.

## Grenzen und offene Punkte

- Schwellwerte und Gewichte sind Erstkalibrierung ([ENT-001]); Untergrenzen NIS2 ([ENT-002]) und ISO ([ENT-003]) offen.
