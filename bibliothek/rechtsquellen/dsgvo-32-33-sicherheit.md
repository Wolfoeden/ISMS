---
id: BIB-DSGVO-32
titel: DSGVO – Sicherheit der Verarbeitung und Meldung von Datenschutzverletzungen
art: rechtsquelle
verbindlichkeit: anforderung
rechtsraum: EU
status: quellengeprueft
quellen:
  - quellen/eu-dsgvo-art32.txt
  - quellen/eu-dsgvo-art33.txt
  - https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32016R0679
stand_der_quelle: 2016-05-04
erfasst_von: Agent bibliothek, 2026-11-12
freigegeben_von:
freigegeben_am:
naechste_pruefung: 2027-11-12
---
# DSGVO – Sicherheit der Verarbeitung (Art. 32) und Meldung (Art. 33)

## Kernaussagen

1. **Risikoangemessene technische und organisatorische Maßnahmen** unter Berücksichtigung von Stand der Technik und Kosten.
   > [eu-dsgvo-art32.txt · Art. 32 Abs. 1] treffen der Verantwortliche und der Auftragsverarbeiter geeignete technische und organisatorische Maßnahmen, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten;

2. **Regelmäßige Überprüfung der Wirksamkeit** ist ausdrücklich Teil der Maßnahmen.
   > [eu-dsgvo-art32.txt · Art. 32 Abs. 1 Buchst. d] ein Verfahren zur regelmäßigen Überprüfung, Bewertung und Evaluierung der Wirksamkeit der technischen und organisatorischen Maßnahmen zur Gewährleistung der Sicherheit der Verarbeitung.

3. **Meldung an die Aufsichtsbehörde möglichst binnen 72 Stunden.**
   > [eu-dsgvo-art33.txt · Art. 33 Abs. 1] meldet der Verantwortliche unverzüglich und möglichst binnen 72 Stunden, nachdem ihm die Verletzung bekannt wurde, diese der gemäß Artikel 51 zuständigen Aufsichtsbehörde,

4. **Auftragsverarbeiter melden dem Verantwortlichen unverzüglich.**
   > [eu-dsgvo-art33.txt · Art. 33 Abs. 2] Wenn dem Auftragsverarbeiter eine Verletzung des Schutzes personenbezogener Daten bekannt wird, meldet er diese dem Verantwortlichen unverzüglich.

## Bedeutung für die ISMS-Parameter

*Auslegung – verbindlich erst nach Freigabe.*

- Gilt für jede Organisation, die personenbezogene Daten verarbeitet (`INF-02` ≠ `none`) – unabhängig von NIS2 und Profil.
- Incident-Prozess muss Datenschutz-Meldung (72 h) und ggf. NIS2-Meldung (24 h / 72 h, [BIB-BSIG-32]) parallel abdecken.
- Auftragsverarbeiter (z. B. Einzelentwickler mit Kundendaten, `INF-06`) brauchen einen Meldeweg zum Kunden.

## Grenzen und offene Punkte

- Art. 33 Abs. 1 Ausnahme (kein Risiko für Betroffene) und Art. 34 (Benachrichtigung Betroffener) sind noch nicht erfasst.
