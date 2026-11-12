---
id: BIB-BSIG-ANL
titel: BSIG Anlagen 1 und 2 – Sektoren und Einrichtungsarten
art: rechtsquelle
rechtsraum: DE
status: quellengeprueft
quellen:
  - quellen/de-bsig-anlage1.txt
  - quellen/de-bsig-anlage2.txt
  - https://www.gesetze-im-internet.de/bsig_2025/anlage_1.html
  - https://www.gesetze-im-internet.de/bsig_2025/anlage_2.html
stand_der_quelle: 2026-10-22
erfasst_von: Agent bibliothek, 2026-11-12
verifiziert_von:
verifiziert_am:
naechste_pruefung: 2027-05-12
---
# BSIG Anlagen 1 und 2 – Sektoren und Einrichtungsarten

## Kernaussagen

1. **Anlage 1** (besonders wichtige und wichtige Einrichtungen) umfasst die Sektoren Energie, Transport und Verkehr, Finanzwesen, Gesundheit, Wasser, Digitale Infrastruktur und Weltraum. Beispiele für Einrichtungsarten:
   > [de-bsig-anlage1.txt · Nr. 6.1.4] Anbieter von Cloud-Computing-Diensten
   > [de-bsig-anlage1.txt · Nr. 6.1.5] Anbieter von Rechenzentrumsdiensten

2. **Managed Services Provider und Managed Security Services Provider sind Einrichtungsarten der Anlage 1** (Sektor Digitale Infrastruktur) – relevant für IT-Dienstleister unter unseren Kunden.
   > [de-bsig-anlage1.txt · Nr. 6.1.10] Managed Services Provider
   > [de-bsig-anlage1.txt · Nr. 6.1.11] Managed Security Services Provider

3. **Anlage 2** (nur wichtige Einrichtungen) umfasst Post- und Kurierdienste, Abfallbewirtschaftung, Chemie, Lebensmittel, verarbeitendes Gewerbe (nach NACE-Abteilungen), Anbieter digitaler Dienste und Forschung. Beispiele:
   > [de-bsig-anlage2.txt · Nr. 1.1.1] Anbieter von Postdienstleistungen nach § 3 Nummer 15 PostG, einschließlich Anbieter von Kurierdiensten
   > [de-bsig-anlage2.txt · Nr. 7.1.1] Forschungseinrichtungen

4. **Verarbeitendes Gewerbe wird über NACE Rev. 2 abgegrenzt**, z. B. Maschinenbau:
   > [de-bsig-anlage2.txt · Nr. 5.4.1] Unternehmen, die eine der Wirtschaftstätigkeiten nach Abschnitt C Abteilung 28 der Statistischen Systematik der Wirtschaftszweige in der Europäischen Gemeinschaft (NACE Rev. 2) ausüben

## Bedeutung für die ISMS-Parameter

*Auslegung – verbindlich erst nach Verifikation.*

- Die Auswahloptionen von Fragebogen `STA-04` bilden die Gliederung der Anlagen ab (`src/fragebogen/katalog.ts`). Bei Zweifel an der Zuordnung: Klärungs-Entscheidung, nicht raten.
- Anlage 1 kann besonders wichtig oder wichtig ergeben, Anlage 2 nur wichtig (siehe [BIB-BSIG-28]).

## Grenzen und offene Punkte

- Die Einrichtungsarten verweisen auf Begriffsbestimmungen anderer Gesetze (z. B. PostG, KrWG, EnWG) und auf § 2 BSIG (z. B. Managed Services Provider). Diese Definitionen sind noch nicht erfasst – bei Grenzfällen Entscheidung vom Typ `wissen` anlegen.
- Die vollständige Liste steht im Snapshot; der Eintrag fasst nur die Struktur zusammen.
