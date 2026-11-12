# Vorschriften – was die ISMS-Parameter festlegt

| | |
|---|---|
| Stand | 2026-11-12 · Entwurf |
| Rechtsstand | BSIG i. d. F. vom 22.10.2026; NIS-2-Richtlinie; DSGVO; BDSG |
| Verbindlich | je Zeile erst, wenn der Bibliothekseintrag `verifiziert` ist |

Dieses Dokument verbindet Vorschriften mit ISMS-Parametern: **Wann gilt eine Vorschrift (Prüffragen im Fragebogen) und was legt sie fest (Untergrenze, Pflichtmodul, Frist, Rolle, Nachweis)?** Jede Aussage verweist auf einen Bibliothekseintrag mit wörtlich belegten Zitaten. Status der Einträge: [bibliothek/index.md](bibliothek/index.md).

---

## 1. Übersicht

| Vorschrift | Gilt, wenn | Fragebogen | Wirkung auf das ISMS | Bibliothek |
|---|---|---|---|---|
| BSIG § 28 – Betroffenheit | Einrichtungsart Anlage 1/2 + Größe, oder KRITIS, oder Sonderfall | `STA-04`–`STA-08`, `ORG-01`, `REG-03` | bestimmt `REG-02`; Untergrenze Profil 3/4 | [BIB-BSIG-28], [BIB-BSIG-ANL], [BIB-KMU] |
| BSIG § 30 – Risikomanagement | besonders wichtig / wichtig | `REG-02` | 10 Pflicht-Prüfbereiche, Dokumentationspflicht | [BIB-BSIG-30] |
| BSIG § 32 – Meldepflichten | besonders wichtig / wichtig | `REG-02` | Melde-Workflow 24 h / 72 h / 1 Monat | [BIB-BSIG-32] |
| BSIG § 33 – Registrierung | besonders wichtig / wichtig | `REG-02` | Registrierung ≤ 3 Monate, Änderungen ≤ 2 Wochen | [BIB-BSIG-33] |
| BSIG § 38 – Geschäftsleitung | besonders wichtig / wichtig | `REG-02` | Umsetzung, Überwachung, Schulung der Geschäftsleitung | [BIB-BSIG-38] |
| BSIG § 39 – KRITIS-Nachweise | Betreiber kritischer Anlagen | `REG-03` | Nachweis alle 3 Jahre, Mängelbeseitigung | [BIB-BSIG-39] |
| DSGVO Art. 32/33 | personenbezogene Daten | `INF-02` | risikoangemessene TOM, Wirksamkeitsprüfung, Meldung 72 h | [BIB-DSGVO-32] |
| DSGVO Art. 9/35 | besondere Kategorien, hohes Risiko | `INF-03`, `KI-04` | Informationsdimension, Untergrenze F6, DSFA | [BIB-DSGVO-09] |
| DSGVO Art. 37 / BDSG § 38 | ≥ 20 Personen in automatisierter Verarbeitung oder DSFA-Pflicht | `REG-04` | Rolle DSB, Schnittstelle zum ISMS | [BIB-DSB] |
| ISO/IEC 27001:2022 | Zertifizierung angestrebt/vorhanden | `REG-01` | Untergrenze F7, Pflichtartefakte | [BIB-ISO27001] (Entwurf) |

## 2. NIS2 / BSIG

### 2.1 Betroffenheit

Prüfreihenfolge nach § 28 BSIG – umgesetzt in `npm run isms -- einstufung` ([BIB-BSIG-28]):

| # | Bedingung | Ergebnis | Fundstelle |
|---|---|---|---|
| 1 | Betreiber kritischer Anlagen | besonders wichtig | Abs. 1 Nr. 1 |
| 2 | qualifizierter Vertrauensdiensteanbieter, TLD-Registry, DNS-Diensteanbieter | besonders wichtig (größenunabhängig) | Abs. 1 Nr. 2 |
| 3 | TK-Netz/-Dienst mit ≥ 50 MA oder Umsatz und Bilanz > 10 Mio. EUR | besonders wichtig | Abs. 1 Nr. 3 |
| 4 | Anlage 1, entgeltlich, ≥ 250 MA oder Umsatz > 50 und Bilanz > 43 Mio. EUR | besonders wichtig | Abs. 1 Nr. 4 |
| 5 | Vertrauensdiensteanbieter (nicht qualifiziert) | wichtig | Abs. 2 Nr. 1 |
| 6 | TK-Netz/-Dienst unterhalb der Schwellen aus Nr. 3 | wichtig | Abs. 2 Nr. 2 |
| 7 | Anlage 1 oder 2, entgeltlich, ≥ 50 MA oder Umsatz und Bilanz > 10 Mio. EUR | wichtig | Abs. 2 Nr. 3 |
| 8 | sonst | nicht betroffen | – |

Immer zu prüfen: vernachlässigbare Nebentätigkeiten (Abs. 3), Partner-/verbundene Unternehmen und IT-Unabhängigkeit (Abs. 4), Ausnahmen für TK/Energie (Abs. 5) und DORA-Finanzunternehmen (Abs. 6). Ergebnis → Entscheidung E-002 im Mandat → `REG-02`.

### 2.2 Pflichtmodul NIS2 (profilunabhängig, Vorschlag [ENT-009])

| Pflicht | Parameter im ISMS | Fundstelle |
|---|---|---|
| Registrierung | erledigt? Prozess für Änderungsmeldung ≤ 2 Wochen (z. B. neue öffentliche IP-Bereiche) | § 33 Abs. 1, 5 BSIG [BIB-BSIG-33] |
| Meldewege | erhebliche Vorfälle erkennen; Erstmeldung ≤ 24 h, Meldung ≤ 72 h, Abschlussmeldung ≤ 1 Monat; Fortschrittsmeldung bei andauerndem Vorfall | § 32 BSIG [BIB-BSIG-32] |
| Geschäftsleitung | Umsetzung und Überwachung nachweisen; regelmäßige Schulung; Billigung dokumentieren (Richtlinie Art. 20) | § 38 BSIG [BIB-BSIG-38] |
| Risikomanagement | alle 10 Bereiche als Pflicht-Prüfbereiche; Einhaltung dokumentieren | § 30 BSIG [BIB-BSIG-30] |

### 2.3 Die zehn Pflicht-Prüfbereiche

Gliederung von `isms.md` §6 für betroffene Einrichtungen; für nicht betroffene als bewährte Struktur empfohlen. Tiefe je Bereich nach Assurance Profile.

| § 30 Abs. 2 BSIG | Art. 21 Abs. 2 NIS2 | Prüfbereich |
|---|---|---|
| Nr. 1 | a | Risikoanalyse und Sicherheitskonzepte |
| Nr. 2 | b | Bewältigung von Sicherheitsvorfällen |
| Nr. 3 | c | Betriebskontinuität: Backup, Wiederherstellung, Krisenmanagement |
| Nr. 4 | d | Sicherheit der Lieferkette |
| Nr. 5 | e | Erwerb, Entwicklung, Wartung; Schwachstellenmanagement und -offenlegung |
| Nr. 6 | f | Bewertung der Wirksamkeit |
| Nr. 7 | g | Schulung und Sensibilisierung |
| Nr. 8 | h | Kryptographie |
| Nr. 9 | i | Personal, Zugriffskontrolle, Verwaltung von IKT-Systemen |
| Nr. 10 | j | MFA, gesicherte Kommunikation, Notfallkommunikation |

### 2.4 Betreiber kritischer Anlagen

Zusätzlich: Nachweis alle drei Jahre durch Audits, Prüfungen oder Zertifizierungen inklusive Mängeln; Mängelbeseitigungsplan auf Verlangen ([BIB-BSIG-39]). Wissen zu „kritische Anlage“ fehlt noch ([ENT-015]).

## 3. Datenschutz

| Pflicht | Parameter im ISMS | Grundlage |
|---|---|---|
| Sicherheit der Verarbeitung | TOM risikoangemessen; Verfahren zur regelmäßigen Wirksamkeitsprüfung | [BIB-DSGVO-32] |
| Meldung von Datenschutzverletzungen | Meldung an Aufsicht möglichst ≤ 72 h; Auftragsverarbeiter melden unverzüglich an Verantwortlichen | [BIB-DSGVO-32] |
| Besondere Kategorien / DSFA | `INF-03` → Dimension Information; DSFA-Prüfpunkt | [BIB-DSGVO-09] |
| Datenschutzbeauftragter | Benennungspflicht prüfen; Rolle im Mandat | [BIB-DSB] |

Zusammenspiel: Ein Vorfall kann gleichzeitig NIS2-meldepflichtig (24 h/72 h) und datenschutzmeldepflichtig (72 h) sein – der Incident-Prozess muss beide Wege abdecken.

## 4. Normen

| Norm | Wirkung | Status |
|---|---|---|
| ISO/IEC 27001:2022 | Zertifizierungsziel → Untergrenze F7; Pflichtartefakte (SoA, Risikobeurteilung, internes Audit, Managementbewertung) | Entwurf, Verifikation braucht Normexemplar ([ENT-014]) |

## 5. Parametermatrix

Was aus Vorschriften folgt – **zusätzlich** zu den Parametern des Assurance Profile:

| Parameter | Nicht betroffen | wichtige Einrichtung | besonders wichtige Einrichtung | Betreiber kritischer Anlagen |
|---|---|---|---|---|
| Untergrenze Profil | – | 3 (F3) | 4 (F2) | 4 (F1) |
| Pflicht-Prüfbereiche § 30 | empfohlen | Pflicht | Pflicht | Pflicht + § 31 (offen) |
| Melde-Workflow 24/72 h/1 M | – | Pflicht | Pflicht | Pflicht + Anlagenangaben |
| Registrierung | – | Pflicht | Pflicht | nach KRITIS-Dachgesetz |
| Geschäftsleitung (Umsetzung, Überwachung, Schulung) | empfohlen | Pflicht | Pflicht | Pflicht |
| Externer Nachweiszyklus | – | – | – | alle 3 Jahre |

Grundlagen: [BIB-BSIG-28], [BIB-BSIG-30], [BIB-BSIG-32], [BIB-BSIG-33], [BIB-BSIG-38], [BIB-BSIG-39]. Untergrenzen offen in [ENT-002].

## 6. Noch nicht erfasst

Diese Regelwerke dürfen **nicht** verwendet werden, bevor sie in der Bibliothek stehen ([ENT-017]). Taucht eines in einem Mandat auf (`REG-05`, `KI-01`–`KI-04`), legt der Agent eine Entscheidung vom Typ `wissen` an.

| Regelwerk | Relevant für |
|---|---|
| DORA – Verordnung (EU) 2022/2554 | Finanzunternehmen (für sie gelten §§ 30–32, 35, 36, 38, 39 BSIG nicht, § 28 Abs. 6) |
| KI-Verordnung – Verordnung (EU) 2024/1689 | KI-Use-Cases, Hochrisiko-Systeme |
| Cyber Resilience Act – Verordnung (EU) 2024/2847 | Hersteller von Produkten mit digitalen Elementen |
| KRITIS-Dachgesetz, § 2 Nr. 22 und § 31 BSIG | Betreiber kritischer Anlagen |
| Durchführungsrechtsakt nach Art. 21 Abs. 5 NIS2 | Cloud, Rechenzentren, MSP, MSSP u. a. (Vorrang nach § 30 Abs. 3 BSIG) |
| TISAX / VDA ISA | Automobilzulieferer (Kundenanforderung) |
| BSI IT-Grundschutz | öffentliche Auftraggeber, Methodikvergleich |
