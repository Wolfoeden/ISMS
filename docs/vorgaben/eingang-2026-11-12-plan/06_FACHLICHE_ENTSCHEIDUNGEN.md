# 06 – Entscheidungskatalog fuer Produkt und Implementierung

**Stand: 12.11.2026 | Zweck:** Echte Unklarheiten offenhalten, nicht von Claude implizit entscheiden lassen.

| ID | Offene Frage | Empfehlung (bis finaler Beschluss) | Bedeutung / Owner |
|---|---|---|---|
| DEC-01 | Produktbezeichnung: ISMS-Plattform oder Assessment & Assurance Platform? | **Assessment & Assurance Platform** als Produktkern, „ISMS“ als Modul/Anwendungsbereich | Produkt / DT Agency |
| DEC-02 | Ist Variante C Beschluss? | **Ja**, zwei Einstiege, gemeinsame Case-Daten | bereits vereinbart |
| DEC-03 | Zuerst welche Art von 3PA? | Beauftragte Security-Bewertung von Einzelunternehmer & Softwareprodukt, **keine Zertifizierung** | Methodik / Lead |
| DEC-04 | Was ist das Mindest-Assurance-Niveau fuer einen verkaufbaren Bericht? | definierte Kriterien, verifizierte Findings, Traceability, QA entsprechend Profil | Methodik + QA |
| DEC-05 | Wann ist 4-Augen-Prinzip zwingend? | bei formellen/extern verwendeten Berichten oder erweitertem Assurance-Profil; im MVP QA fuer jeden finalen Report | QA / Governance |
| DEC-06 | Was darf im kostenfreien Screening erscheinen? | Produkt-/Objekt-Hypothese, Rahmenkandidaten, offene Fragen, kein Security-Rating | Vertrieb / Legal |
| DEC-07 | Welche Framework-Bibliothek verwenden wir? | Selbst verwaltete *Referenzmetadaten* + lizenzierte bzw. frei nutzbare Quellen, keine unlizenzierte ISO-Volltext-Basis | Legal / Content Owner |
| DEC-08 | Welche Daten duerfen vor Mandatierung hochgeladen werden? | Nur bewusst minimierte, fuer Screening notwendige und rechtlich abgesicherte Angaben; vertrauliche Evidence nach Mandat/Terms | Legal / Privacy |
| DEC-09 | Wird proaktive Discovery im MVP automatisiert? | **Nein**; erste Produktversion Inbound/Einladung, P1 Discovery spaeter | Produkt / Risiko |
| DEC-10 | Wie lange ist die Standardantwortfrist? | P14D fuer Kontakt/Klaerung, P21D fuer Angebot **nur Platzhalter**, konfigurierbar | Vertrieb / Operations |
| DEC-11 | Welche Assessment-Tiefe wird angeboten? | zunächst Basis / Standard / Enhanced als interne Methodik, kein automatischer Anspruch aus Tarif | Methodik / QA |
| DEC-12 | Welche Status darf Kunde korrigieren? | Faktendarstellung und eigene Antworten; nicht selbststaendig Severity/QA-Approval | Governance |
| DEC-13 | Wann ist ein Assessment „nicht beurteilbar“? | Materiale Luecken verhindern uneingeschraenkte Aussage; QA genehmigt Limitation oder Stopp | Methodik / QA |
| DEC-14 | Wie wird Scope-Drift monetarisiert? | Change Request + neue ScopeVersion + ggf. Nachtragsangebot | Product/Commercial |
| DEC-15 | Welche Technologie/Workflow Engine? | Erst bestehendes Repo untersuchen; kein Tech-Stack im Fachkonzept unterstellen | Solution Architect |
| DEC-16 | Wie umgehen mit Kunden-Evidenz bei AI-Drittdiensten? | Opt-in/AVV/Providerpruefung, mandatsbezogene Datenfreigabe, keine Training-Nutzung standardmaessig erlauben | Security/Legal |
| DEC-17 | Welche Reportformate und Signaturen? | PDF/HTML als Version, Signatur/Reviewer-Metadaten; konkrete digitale Signatur spaeter | Product/QA |
| DEC-18 | Welche Marktsegmente zuerst? | KMU/Einzelunternehmer mit Softwareprodukt und hohem externen Nachweisbedarf | Commercial |

## Arbeitsprinzip

Fuer jeden Entscheidungsfall: `decision_id`, `version`, `owner`, `status`, `rationale`, `effective_date`, `affected_cases`, `migration_impact` speichern. Bei Aenderungen an Regeln vor bestehender Assessment-Publikation eine Impact-Pruefung vorsehen.

### Abgrenzung: Fachliches Produktkonzept vs. Rechtsberatung

Die Plattform darf einschlaegige Rechtsrahmen identifizieren und strukturiert zur Pruefung vorlegen. Eine rechtlich bindende Einstufung setzt sorgfaeltige, jurisdiktionsbezogene Pruefung und angemessene Expertise voraus. Produktmarketing darf nicht suggerieren, ein automatisches Screening ersetze diese Pruefung.
