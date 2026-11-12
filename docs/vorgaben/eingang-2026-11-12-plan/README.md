# DT Agency | Intelligent Assessment & Assurance Platform

**Fachliches Zielbild und Claude-Handover | Version 1.0 | 2026-11-12**  
**Status:** Arbeitsbasis fuer Diskussion und Implementierungsplanung, keine freigegebene Rechts- oder Pruefmethodik.

## 1. Ziel

Eine KI-unterstuetzte, mandantenfaehige Plattform, die aus einem konkreten Kundenanliegen einen nachvollziehbaren Assessment-Auftrag erzeugt, Informationen gezielt erhebt, regulatorische und normative Anforderungen anwendbarkeitsbezogen ableitet, Nachweise bewertet und einen fachlich verifizierten Bericht erstellt.

**Produktprinzip:** Der Kunde kauft ein nachvollziehbares Assessment-Ergebnis, nicht zunaechst ein komplexes GRC-System.

## 2. Beschlossene Produktentscheidungen

| ID | Entscheidung | Status |
|---|---|---|
| ADR-001 | Hybrider Einstieg: „Ich weiss, was ich brauche“ / „Hilf mir bei der Einordnung“ | vereinbart |
| ADR-002 | Auswahl von ISO 27001, NIS2, Part-IS, KI, CRA, 3PA ist **kein** exklusiver regulatorischer Zweig | empfohlen |
| ADR-003 | Opportunity/Assessment werden als getrennte Case-Instanzen gefuehrt; Discovery-Run kann 0..n Candidates erzeugen | empfohlen |
| ADR-004 | Kundenoberflaeche und Consultant Workspace teilen Daten und Regeln, nicht dieselbe Bedienoberflaeche | empfohlen |
| ADR-005 | Evidence-first und progressive Fragen statt starrer Frageboegen | empfohlen |
| ADR-006 | AI erzeugt Vorschlaege; DMN/Regeln berechnen reproduzierbare Entscheidungen; Berechtigte verifizieren | empfohlen |
| ADR-007 | Assessment-Typ, Objekt, Framework-Anwendbarkeit, Scope, Tiefe, Bearbeitungsmodus und Assurance getrennt modellieren | empfohlen |
| ADR-008 | Verifizierte Artefakte versioniert / unveraenderlich speichern; neue Vorschlaege erzeugen neue Version | empfohlen |
| ADR-009 | MVP: Beratungsorientiertes 3PA fuer Einzelunternehmer + Softwareprodukt; spaeter weitere Module | empfohlen |
| ADR-010 | BPMN steuert die dauerhaften Geschaeftsvorfaelle, ein Case-/Task-Service dynamische Erhebungsfragen | empfohlen |

Nicht als Entscheidung interpretieren: Technologie-Stack, Preisgestaltung, regulatorische Rechtsmeinungen, Zertifizierungsversprechen, Lizenzrechte an ISO-Volltexten. Diese Punkte bleiben offen.

## 3. Dateien und Verwendung

1. [`01_CUSTOMER_CONSULTANT_JOURNEY.md`](01_CUSTOMER_CONSULTANT_JOURNEY.md) – Service Blueprint, Customer und Consultant Journeys, UX-Muster, konkrete Beispiele.
2. [`02_FACHKONZEPT_UND_DATENMODELL.md`](02_FACHKONZEPT_UND_DATENMODELL.md) – fachliche Architektur, Datenobjekte, Rollen, DMN-Katalog, Governance, Ausnahme- und Freigaberegeln.
3. [`03_BPMN_L0_COLLABORATION.bpmn`](03_BPMN_L0_COLLABORATION.bpmn) – importierbare BPMN-2.0-XML mit BPMN-DI, separatem Discovery-Run, einer Opportunity-to-Assessment-Collaboration und wiederverwendbarem Assessment-Prozess.
4. [`04_MVP_BACKLOG_UND_TESTFAELLE.md`](04_MVP_BACKLOG_UND_TESTFAELLE.md) – MVP, priorisierte Stories, Akzeptanzkriterien, fachliche Testfaelle, Kennzahlen, Pilot.
5. [`05_CLAUDE_HANDOFF.md`](05_CLAUDE_HANDOFF.md) – Implementierungsanweisung an Claude/Claude Code mit Arbeitsreihenfolge und Qualitaetsgates.
6. [`06_FACHLICHE_ENTSCHEIDUNGEN.md`](06_FACHLICHE_ENTSCHEIDUNGEN.md) – explizite offene Entscheidungen und Vorschlaege.
7. [`07_BEISPIEL_CASES.json`](07_BEISPIEL_CASES.json) – fiktive Beispiel-Cases fuer Software/3PA, Aviation/Part-IS und KI-Systeme.
8. [`08_BPMN_TRACEABILITY.md`](08_BPMN_TRACEABILITY.md) – BPMN-IDs auf UX, Datenobjekte, Entscheidungsregeln abgebildet.
9. [`09_QA_REPORT.md`](09_QA_REPORT.md) – automatisiert gepruefte BPMN-Struktur und offen ausgewiesene Importgrenzen.
10. `build_bpmn.py` und `validate_bpmn.py` – reproduzierbarer Modell-Generator und statischer Modell-Check.

## 4. So beginnt Claude

`05_CLAUDE_HANDOFF.md` zuerst lesen, danach Dateien 01–04 sowie 06–09, dann den bestehenden Repository-Stand pruefen. **Keine unbekannten Produkt-, Rechts- oder Architekturentscheidungen erfinden.** Vor Code-Aenderungen eine Traceability-Matrix und einen Umsetzungsplan anfertigen.

## 5. Begriffsdisziplin

- **Screening / Pre-Assessment** = indikative Orientierung, keine Feststellung einer Regelkonformitaet.
- **Assessment** = systematische Bewertung gegen explizit festgelegte Kriterien und Grenzen.
- **Audit** = nur verwenden, wenn die jeweils geltenden Unabhaengigkeits- und Auditkriterien erfuellt werden.
- **3PA** = hier zunaechst *Third-Party Security Assessment*, nicht automatisch zertifizierende Drittparteipruefung oder akkreditierte Konformitaetsbewertung.
- **Assurance** = nachvollziehbar begrenzte Aussagequalitaet nach Methodik, Evidenz und Review, kein frei waehlbares Marketing-Label.
- **ISO-27001-Zertifizierung** = nur durch zustaendige Zertifizierungsstellen; DT Agency kann Readiness/Gaps bewerten, nicht ungeprueft zertifizieren.

## 6. Externe Quellen zur Modellierung (Pruefstand 2026-11-12)

- OMG BPMN 2.0.2: https://www.omg.org/spec/BPMN/2.0.2/
- EASA Information Security: https://www.easa.europa.eu/en/regulations/information-security
- Deutsches BSI NIS-2-Informationsportal: https://mip2.bsi.bund.de/de/info-nis2-registrierung/
- EU AI Act konsolidierter Text: https://eur-lex.europa.eu/eli/reg/2024/1689
- Cyber Resilience Act: https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act
- DSGVO: https://eur-lex.europa.eu/eli/reg/2016/679/oj

**Normenlizenzen:** Lizenzpflichtige Normtexte nicht ohne nachgewiesene KI-/Plattform-Nutzungsrechte als Volltext, Embeddings oder Prompt-Kontext integrieren. Eigene Struktur- und Verweis-Metadaten sowie freigegebene Inhaltszusammenfassungen separat behandeln.
