---
id: BIB-BSIG-28
titel: NIS2 / BSIG – Betroffenheit (besonders wichtige und wichtige Einrichtungen)
art: rechtsquelle
rechtsraum: DE
status: quellengeprueft
quellen:
  - quellen/de-bsig-p28.txt
  - quellen/eu-nis2-art02.txt
  - quellen/eu-nis2-art03.txt
  - https://www.gesetze-im-internet.de/bsig_2025/__28.html
stand_der_quelle: 2026-10-22
erfasst_von: Agent bibliothek, 2026-11-12
verifiziert_von:
verifiziert_am:
naechste_pruefung: 2027-05-12
---
# NIS2 / BSIG – Betroffenheit

Deutsche Umsetzung der NIS-2-Richtlinie im BSI-Gesetz vom 2.12.2025 (BGBl. 2025 I Nr. 301), in Kraft seit 6.12.2025, Fassung vom 22.10.2026. Die Richtlinie spricht von „wesentlichen“ und „wichtigen“ Einrichtungen, das BSIG von „besonders wichtigen“ und „wichtigen“ Einrichtungen.

## Kernaussagen

1. **Betreiber kritischer Anlagen sind immer besonders wichtige Einrichtungen.**
   > [de-bsig-p28.txt · Abs. 1 Nr. 1] Als besonders wichtige Einrichtung gelten 1. Betreiber kritischer Anlagen,

2. **Qualifizierte Vertrauensdiensteanbieter, TLD-Registries und DNS-Diensteanbieter sind unabhängig von der Größe besonders wichtig.**
   > [de-bsig-p28.txt · Abs. 1 Nr. 2] qualifizierte Vertrauensdiensteanbieter, Top Level Domain Name Registries oder DNS-Diensteanbieter,

3. **Telekommunikation: besonders wichtig ab 50 Mitarbeitern oder bei Umsatz und Bilanz über je 10 Mio. EUR, sonst wichtig.**
   > [de-bsig-p28.txt · Abs. 1 Nr. 3] Anbieter öffentlich zugänglicher Telekommunikationsdienste oder Betreiber öffentlicher Telekommunikationsnetze, die a) mindestens 50 Mitarbeiter beschäftigen oder b) einen Jahresumsatz und eine Jahresbilanzsumme von jeweils über 10 Millionen Euro aufweisen,

4. **Anlage 1 und große Einrichtung (ab 250 Mitarbeitern oder Umsatz > 50 Mio. EUR und Bilanz > 43 Mio. EUR) → besonders wichtig.** Voraussetzung ist ein entgeltliches Angebot von Waren oder Dienstleistungen.
   > [de-bsig-p28.txt · Abs. 1 Nr. 4] sonstige natürliche oder juristische Personen … die anderen natürlichen oder juristischen Personen entgeltlich Waren oder Dienstleistungen anbieten und die einer der in Anlage 1 bestimmten Einrichtungsarten zuzuordnen sind, und a) mindestens 250 Mitarbeiter beschäftigen oder b) einen Jahresumsatz von über 50 Millionen Euro und zudem eine Jahresbilanzsumme von über 43 Millionen Euro aufweisen.

5. **Anlage 1 oder 2 und mittlere Größe (ab 50 Mitarbeitern oder Umsatz und Bilanz über je 10 Mio. EUR) → wichtig.**
   > [de-bsig-p28.txt · Abs. 2 Nr. 3] … die einer der in den Anlagen 1 und 2 bestimmten Einrichtungsarten zuzuordnen sind und a) mindestens 50 Mitarbeiter beschäftigen oder b) einen Jahresumsatz und eine Jahresbilanzsumme von jeweils über 10 Millionen Euro aufweisen.

6. **Vertrauensdiensteanbieter (nicht qualifiziert) sind mindestens wichtig.**
   > [de-bsig-p28.txt · Abs. 2 Nr. 1] Als wichtige Einrichtungen gelten 1. Vertrauensdiensteanbieter,

7. **Vernachlässigbare Nebentätigkeiten zählen nicht.**
   > [de-bsig-p28.txt · Abs. 3] Bei der Zuordnung zu einer der Einrichtungsarten nach den Anlagen 1 und 2 können solche Geschäftstätigkeiten unberücksichtigt bleiben, die im Hinblick auf die gesamte Geschäftstätigkeit der Einrichtung vernachlässigbar sind.

8. **Größe nach KMU-Empfehlung; Partner-/verbundene Unternehmen zählen nicht mit, wenn die IT unabhängig ist.**
   > [de-bsig-p28.txt · Abs. 4] Die Daten von Partner- oder verbundenen Unternehmen im Sinne der Empfehlung der Kommission (2003/361/EG) sind nicht hinzuzurechnen, wenn das Unternehmen unter Berücksichtigung der rechtlichen, wirtschaftlichen und tatsächlichen Umstände mit Blick auf die Beschaffenheit und den Betrieb der informationstechnischen Systeme, Komponenten und Prozesse unabhängig von seinen Partner- oder verbundenen Unternehmen ist.

9. **Für DORA-Finanzunternehmen gelten Risikomanagement-, Melde- und Geschäftsleitungspflichten des BSIG nicht** (Vorrang des Sektorrechts).
   > [de-bsig-p28.txt · Abs. 6 Nr. 1] Die §§ 30, 31, 32, 35, 36, 38 und 39 gelten nicht für 1. Finanzunternehmen nach Artikel 2 Absatz 2 der Verordnung (EU) 2022/2554

10. **Richtlinie zum Vergleich:** wesentliche Einrichtungen sind u. a. Anhang-I-Einrichtungen oberhalb der Schwellen für mittlere Unternehmen.
    > [eu-nis2-art03.txt · Art. 3 Abs. 1 Buchst. a] Einrichtungen der in Anhang I aufgeführten Art, die die in Artikel 2 Absatz 1 des Anhangs der Empfehlung 2003/361/EG genannten Schwellenwerte für mittlere Unternehmen überschreiten;

## Bedeutung für die ISMS-Parameter

*Auslegung – verbindlich erst nach Verifikation.*

- Fragebogen: `STA-04` (Einrichtungsart), `STA-05` (entgeltlich), `ORG-01`, `STA-06`, `STA-07` (Größe), `STA-08` (verbundene Unternehmen), `REG-03` (KRITIS) → Ergebnis in `REG-02`.
- Werkzeug: `npm run isms -- einstufung <kürzel>` führt die Vorprüfung nach Abs. 1 und 2 durch (`src/regelwerk/nis2.ts`). Das Ergebnis ist ein Vorschlag für die Betroffenheits-Entscheidung.
- Untergrenzen des Assurance Profile: besonders wichtig → Profil 4 (F1/F2), wichtig → Profil 3 (F3), siehe [ENT-002].
- Betroffenheit löst profilunabhängige Pflichten aus: Registrierung [BIB-BSIG-33], Meldewege [BIB-BSIG-32], Geschäftsleitungspflichten [BIB-BSIG-38], Risikomanagement [BIB-BSIG-30].

## Grenzen und offene Punkte

- Begriff „kritische Anlage“ (§ 2 Nr. 22 BSIG, KRITIS-Dachgesetz, Schwellenwerte per Rechtsverordnung) ist noch nicht erfasst.
- Ausnahmen für Telekommunikation und Energie nach EnWG (Abs. 5), Telematikinfrastruktur (Abs. 6 Nr. 2) und Einrichtungen der Bundesverwaltung sind nur genannt, nicht ausgewertet.
- Zählweise der Mitarbeiter (Jahresarbeitseinheiten) und Zurechnung von Partner-/verbundenen Unternehmen: siehe [BIB-KMU], dort offen.
