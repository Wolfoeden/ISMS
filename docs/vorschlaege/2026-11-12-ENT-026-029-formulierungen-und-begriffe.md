# Entscheidungsvorlage – ENT-026 Normbezüge und Formulierungen · ENT-029 Freigabebegriff

| | |
|---|---|
| Für | Paul, zertifizierter CISO |
| Stand | 2026-11-12 – Vorschlag, nichts davon ist freigegeben |
| Antwortform | Entscheidungsbogen am Ende, z. B. „026-A: 2, 026-B: 1 …, 029: 3“ |
| Hinweis | keine Rechtsberatung; Punkte mit rechtlicher Tragweite sind als solche gekennzeichnet |

---

## Teil 1 – ENT-026: Was steht heute im Repository?

### 1.1 Bestand an Norminhalten

| Ort | Inhalt | Herkunft | Einschätzung ([BIB-URHG]) |
|---|---|---|---|
| `bibliothek/normen/iso-iec-27001-2022.md` | 30 Abschnittsnummern 4.1–10.2 mit **eigenen** Themenbezeichnungen, Datenobjekt, Nachweisbeispielen | eigene Formulierung | gering – Nummern sind Fakten, Texte eigenständig |
| `bibliothek/normen/iso-iec-27002-2022-controls.md` | 93 Kennungen 5.1–8.34 mit **eigenen** Themenbezeichnungen und Nachweiskategorie | eigene Formulierung | gering |
| `bibliothek/normen/iso-iec-27000-2018.md` | 7 Kernaussagen, eigene Zusammenfassung | Projektaufbereitung | gering |
| `docs/vorgaben/eingang-2026-11-12/ISO-27002-Controls.md` und `ISO-27001-Anforderungen.md` | **amtliche DIN-Kurztitel** aller 93 Controls und 30 Abschnitte, **PDF-Seitenzahlen** des E-Books (130 Stellen) | deine Aufbereitung aus dem E-Book | gering bis mittel; hängt zusätzlich von der **Lizenz** ab |
| Kundenausgaben (`isms.md`) | nur Kennungen und eigene Texte; das Werkzeug lehnt unzulässige Formulierungen ab | – | gering |

Beispiel zur eigenen Bezeichnung (Kennung bleibt der Bezug):

| Kennung | DIN-Kurztitel (nur im Eingangsdokument) | heutige Bibliothek |
|---|---|---|
| 5.18 | Zugangsrechte | Vergabe, Überprüfung und Entzug von Berechtigungen |
| 8.8 | Handhabung von technischen Schwachstellen | Schwachstellenmanagement |
| 7.14 | Sichere Entsorgung oder Wiederverwendung von Geräten und Betriebsmitteln | Daten vor Entsorgung oder Wiederverwendung von Geräten entfernen |
| 10.2 (27001) | Nichtkonformität und Korrekturmaßnahmen | Nichtkonformitäten beheben, Ursachen abstellen |

### 1.2 Die Satzbausteine für Endergebnisse (vollständig)

Vom Werkzeug geprüft: Keiner verstößt gegen die Formulierungsregeln; nur Baustein 9 löst die vorgesehene Warnung „zertifiziert“ aus.

| # | Zweck | Wortlaut |
|---|---|---|
| 1 | Ergebnis je Anforderung/Control | [Kennung] – [Thema]: Berichtsstatus „[Bezeichnung]“. Grundlage: [Nachweise mit Datum]. Stand: [Datum]. |
| 2 | Gesamturteil | Im vereinbarten Prüfumfang ([Scope], Stand [Datum]) lagen für [n] von [m] bewerteten Anforderungen ausreichende Nachweise für eine Erfüllung vor; [k] Anforderungen sind teilweise oder nicht erfüllt, [j] befinden sich in Klärung. Einzelheiten stehen in den Abschnitten 6 bis 9. |
| 3 | Prüfumfang | Bewertet wurden [Prüfbereiche/Anforderungen] für [Organisationseinheit/System/Standort] auf Grundlage von [Interviews, Dokumenten, Stichproben] im Zeitraum [von–bis]. Nicht bewertet wurden: [Bereiche]. |
| 4 | Einschränkungen (Pflicht) | Die Bewertung beruht auf den bis zum [Datum] vorgelegten Nachweisen und auf Angaben der befragten Personen. Stichproben erlauben keinen Schluss auf eine vollständige Fehlerfreiheit. Die Aussagen gelten nur für den genannten Prüfumfang und Zeitpunkt. Dieses Ergebnis ist keine Zertifizierung und kein Audit einer akkreditierten Stelle. |
| 5 | Anwendbarkeit eines Gesetzes | Fachliche Einschätzung im Rahmen der Informationssicherheitsberatung: Nach den vorliegenden Angaben ([Fragebogen-IDs], Stand [Datum]) spricht die Prüfung nach [Fundstelle] für eine Einordnung als [Ergebnis]. Getroffene Annahmen: [Annahmen]. Die verbindliche rechtliche Bewertung obliegt dem Unternehmen bzw. seiner Rechtsberatung. |
| 6 | Feststellung | Feststellung [ID] ([Schwere]): Für [Kennung] wurde am [Datum] anhand von [Nachweis] festgestellt, dass [beobachteter Sachverhalt]. Mögliche Auswirkung: [Auswirkung]. |
| 7 | Empfehlung | Empfehlung [ID]: [Maßnahme], um [Ziel] zu erreichen. Priorität: [Priorität]. Über Umsetzung und verbleibendes Risiko entscheidet [Rolle beim Kunden]. |
| 8 | nur Aussage | Für [Kennung] liegt bislang nur eine Aussage vor ([Quelle, Datum]); ein Nachweis steht aus. |
| 9 | Zertifikat des Kunden | Laut vorgelegtem Zertifikat [Nummer] der Stelle [Name] vom [Datum], gültig bis [Datum], ist der Geltungsbereich [Geltungsbereich] nach ISO/IEC 27001 zertifiziert. |

### 1.3 Gesperrte Formulierungen (Werkzeug lehnt ab)

„ist/wird … konform“, „rechtskonform“, „rechtssicher“, „zertifizierungsreif“ · „NIS2-/ISO-27001-/DSGVO-konform“ · „garantiert“, „gewährleistet“ · „vollständig/100 % sicher“, „lückenlos geschützt“ · „erfüllt alle …“ · „rechtsverbindlich“, „Rechtsgutachten“, „rechtlich geprüft“ · „Nichtkonformität“, „Auditfeststellung“, „auditiert“ außerhalb eines Audit-Mandats. Warnung bei „es bestehen keine Risiken/Schwachstellen“ und „zertifiziert“.

### 1.4 Was DT Agency nicht selbst lösen kann

| Punkt | Warum offen | Rechtliche Tragweite |
|---|---|---|
| **Lizenz der E-Books** (TÜV Süd Akademie, DIN EN ISO/IEC 27001/27002:2024-01) | Lizenzbedingungen liegen nicht vor. Typische Einschränkungen: nur eine benannte Person, keine Weitergabe, kein Einspeisen in Datenbanken oder KI | **ja** – Vertragsrecht, unabhängig vom Urheberrecht |
| **Entstehung der Eingangsdokumente per KI aus dem PDF** | zulässig nur, wenn der Rechteinhaber Text und Data Mining nicht vorbehalten hat (§ 44b UrhG) bzw. die Lizenz es erlaubt | **ja** |
| **Gesetzeseinschätzungen für Kunden** (z. B. NIS2-Betroffenheit) | erlaubt als Nebenleistung zur Beratung (§ 5 RDG), wenn Inhalt und Umfang dazu passen | **ja** – Abgrenzung im Einzelfall |

---

## Teil 2 – ENT-026: Lösungsvorschläge

### 026-A Norminhalte in Bibliothek und Plattform

| Option | Inhalt | Vorteil | Nachteil |
|---|---|---|---|
| 1 | eigene Themenbezeichnungen + Kennung (heutiger Stand) | verständlich für Kunden, geringes Risiko | eigene Bezeichnungen müssen fachlich gepflegt werden |
| 2 | nur Kennungen, keine Bezeichnungen | minimales Risiko | für Kunden kaum lesbar; widerspricht deiner Wording-Auflage |
| 3 | amtliche DIN-Kurztitel verwenden | normnah | nur mit nachgewiesener Lizenz zulässig |

**Empfehlung: 1.**

### 026-B Eingangsdokumente mit DIN-Kurztiteln und PDF-Seiten

| Option | Inhalt | Vorteil | Nachteil |
|---|---|---|---|
| 1 | bleiben im privaten Repository, als „intern – nicht für Kunden oder Agents“ gekennzeichnet | Nachvollziehbarkeit des Prüfberichts | Zugriff für alle mit Repo-Zugang; bei personengebundener Lizenz problematisch |
| 2 | aus dem Repository entfernen, nur Prüfsummen und Prüfbericht behalten; Original liegt bei dir | sicher bei jeder Lizenzlage; Prüfsumme belegt, was geprüft wurde | Inhalt nicht mehr im Repo einsehbar |
| 3 | bis zur Lizenzklärung Option 2, danach ggf. zurück | vorsichtig, umkehrbar | ein zusätzlicher Arbeitsschritt |

**Empfehlung: 3** – Git bewahrt die Historie; für eine echte Entfernung müsste auch die Historie bereinigt werden (gesonderte Entscheidung, weil das Rewriting der Historie bedeutet).

### 026-C Lizenzklärung (Checkliste für dich)

1. Ist die Lizenz personen-, arbeitsplatz- oder unternehmensbezogen?
2. Sind Auszüge, Zusammenfassungen oder abgeleitete Arbeiten erlaubt – intern, gegenüber Kunden?
3. Ist die Verarbeitung durch KI-Werkzeuge (Hochladen, Auswerten, Einbetten) erlaubt oder ausgeschlossen?
4. Dürfen Inhalte in eine Software/Plattform für Dritte einfließen?
5. Falls nein bei 2–4: Lizenzanfrage beim Rechteinhaber der DIN-Ausgaben vor P1 (ISO-Katalog in der Plattform).

### 026-D Gesetzeseinschätzungen (RDG)

| Option | Inhalt |
|---|---|
| 1 | Baustein 5 verwenden, Grenzfälle an den Kunden zur rechtlichen Klärung (heutiger Stand) |
| 2 | wie 1, zusätzlich Klausel in Leistungsbeschreibung/Angebot (Entwurf unten) und **einmalige anwaltliche Prüfung** von Baustein 5 und Klausel |
| 3 | keine Gesetzeseinschätzungen; nur Hinweis „Betroffenheit durch Rechtsberatung klären“ |

Entwurf Klausel (anwaltlich zu prüfen):
> Einschätzungen von DT Agency zur Anwendbarkeit gesetzlicher Vorgaben sind fachliche Einschätzungen im Rahmen der Informationssicherheitsberatung auf Grundlage der vom Auftraggeber bereitgestellten Angaben. Sie ersetzen keine Rechtsberatung; die verbindliche rechtliche Bewertung obliegt dem Auftraggeber.

**Empfehlung: 2** – 3 würde die NIS2-Vorprüfung entwerten, die ein Kern des Angebots ist.

### 026-E Sprachregeln (Satzbausteine, gesperrte Formulierungen)

| Option | Inhalt |
|---|---|
| 1 | wie in 1.2 und 1.3 freigeben |
| 2 | mit deinen Änderungen freigeben (Baustein-Nummer + neuer Wortlaut) |

---

## Teil 3 – ENT-029: Freigabebegriff

### 3.1 Wo der Begriff heute vorkommt und was er bedeuten muss

| Stelle | Was dort passiert | Bedeutung |
|---|---|---|
| Bibliothek | Inhalt gegen Quelle bzw. Normexemplar abgeglichen und für Mandate genehmigt | prüfen **und** genehmigen |
| Entscheidungsseiten | Mensch entscheidet zwischen Optionen | genehmigen |
| Feststellungen (Quality Gate) | Senior prüft Befund gegen Nachweise | prüfen |
| Bericht / `isms.md` | Engagement Lead bzw. QA gibt zur Weitergabe frei | genehmigen |
| Restrisiko | Risk Owner akzeptiert | genehmigen (Akzeptanz) |
| **dein neuer Plan** | ADR-006 „Berechtigte verifizieren“, ADR-008 „Verifizierte Artefakte“, BPMN „Findings … fachlich verifizieren“, „Profil verifizieren“, getrennt davon „Unabhängiges QA / Berichtsfreigabe“ | **prüfen** (verifizieren) und **genehmigen** (Freigabe) als zwei Schritte |

Der neue Plan trennt also bereits zwei Tätigkeiten, die das Repository heute in einem Wort „freigegeben“ zusammenfasst.

### 3.2 Optionen

| Option | Begriffe | passt zum neuen Plan | passt zur Normsprache | Aufwand |
|---|---|---|---|---|
| 1 | nur „freigegeben“ (heutiger Stand) | nein – BPMN-Labels müssten umbenannt werden | ja | gering |
| 2 | nur „verifiziert“ (ursprünglicher Vorschlag) | teilweise – „Berichtsfreigabe“ passt nicht | nein für Genehmigungen | gering |
| 3 | **zwei Stufen:** „verifiziert“ = von einer berechtigten Person fachlich gegen Quelle/Nachweise geprüft; „freigegeben“ = von der zuständigen Rolle zur Verwendung oder Weitergabe genehmigt | ja – entspricht ADR-006/008 und BPMN | ja | mittel: eine zusätzliche Stufe dort, wo zwei Schritte nötig sind |

Bei Option 3:

| Objekt | verifiziert durch | freigegeben durch |
|---|---|---|
| Bibliothekseintrag | Person mit Quelle bzw. Normexemplar | Methodik-Verantwortlicher (heute du) – darf dieselbe Person sein |
| Feststellung | Senior / SME (Quality Gate) | Engagement Lead zur Weitergabe an den Kunden |
| Bericht, `isms.md` | Engagement Lead (fachlich) | Independent Reviewer / QA (Berichtsfreigabe) – ab Profil 3 andere Person |
| Methodik-/Mandatsentscheidung | – | Entscheider (eine Stufe genügt) |
| Restrisiko | – | Risk Owner |

**Empfehlung: 3.** Sie macht die Sprache des Repositorys, deines neuen Plans und der Normen deckungsgleich. Technisch bedeutet das: Statusfolge `offen → vorgeschlagen → verifiziert → freigegeben → abgelegt`, wobei „verifiziert“ bei reinen Entscheidungen übersprungen werden darf; das Werkzeug prüft, dass Verifizierung und Freigabe bei Berichten ab Profil 3 durch verschiedene Personen erfolgen.

---

## Entscheidungsbogen

| Punkt | Optionen | Empfehlung | Deine Wahl |
|---|---|---|---|
| 026-A Norminhalte | 1 · 2 · 3 | 1 | |
| 026-B Eingangsdokumente | 1 · 2 · 3 | 3 | |
| 026-C Lizenz | Checkliste beantworten | – | |
| 026-D Gesetzeseinschätzungen | 1 · 2 · 3 | 2 | |
| 026-E Sprachregeln | 1 · 2 | 1 | |
| 029 Freigabebegriff | 1 · 2 · 3 | 3 | |
