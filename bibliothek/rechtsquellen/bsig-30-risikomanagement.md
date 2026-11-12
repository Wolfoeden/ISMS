---
id: BIB-BSIG-30
titel: NIS2 / BSIG – Risikomanagementmaßnahmen und Verhältnismäßigkeit
art: rechtsquelle
verbindlichkeit: anforderung
rechtsraum: DE
status: quellengeprueft
quellen:
  - quellen/de-bsig-p30.txt
  - quellen/eu-nis2-art21.txt
  - https://www.gesetze-im-internet.de/bsig_2025/__30.html
stand_der_quelle: 2026-10-22
erfasst_von: Agent bibliothek, 2026-11-12
freigegeben_von:
freigegeben_am:
naechste_pruefung: 2027-05-12
---
# NIS2 / BSIG – Risikomanagementmaßnahmen

## Kernaussagen

1. **Pflicht zu geeigneten, verhältnismäßigen und wirksamen Maßnahmen.**
   > [de-bsig-p30.txt · Abs. 1 Satz 1] Besonders wichtige Einrichtungen und wichtige Einrichtungen sind verpflichtet, geeignete, verhältnismäßige und wirksame technische und organisatorische Maßnahmen, die in Absatz 2 konkretisiert werden, zu ergreifen,

2. **Verhältnismäßigkeit bemisst sich an Risikoexposition, Größe, Kosten, Eintrittswahrscheinlichkeit und Schwere sowie gesellschaftlichen und wirtschaftlichen Auswirkungen.** Das ist die gesetzliche Grundlage unseres Proportionalitätsmodells.
   > [de-bsig-p30.txt · Abs. 1 Satz 2] Bei der Bewertung der Verhältnismäßigkeit der Maßnahmen nach Satz 1 sind das Ausmaß der Risikoexposition, die Größe der Einrichtung, die Umsetzungskosten und die Eintrittswahrscheinlichkeit und Schwere von Sicherheitsvorfällen sowie ihre gesellschaftlichen und wirtschaftlichen Auswirkungen zu berücksichtigen.
   > [eu-nis2-art21.txt · Art. 21 Abs. 1 UAbs. 2] Bei der Bewertung der Verhältnismäßigkeit dieser Maßnahmen sind das Ausmaß der Risikoexposition der Einrichtung, die Größe der Einrichtung und die Wahrscheinlichkeit des Eintretens von Sicherheitsvorfällen und deren Schwere, einschließlich ihrer gesellschaftlichen und wirtschaftlichen Auswirkungen, gebührend zu berücksichtigen.

3. **Die Einhaltung ist zu dokumentieren.**
   > [de-bsig-p30.txt · Abs. 1 Satz 3] Die Einhaltung der Verpflichtung nach Satz 1 ist durch die Einrichtungen zu dokumentieren.

4. **Stand der Technik, Normen, gefahrenübergreifender Ansatz.**
   > [de-bsig-p30.txt · Abs. 2 Satz 1] Maßnahmen nach Absatz 1 sollen den Stand der Technik einhalten, die einschlägigen europäischen und internationalen Normen berücksichtigen und müssen auf einem gefahrenübergreifenden Ansatz beruhen.

5. **Zehn Mindestbereiche** (§ 30 Abs. 2 Satz 2 Nr. 1–10 BSIG entsprechen Art. 21 Abs. 2 Buchst. a–j NIS2):
   > [de-bsig-p30.txt · Abs. 2 Nr. 1] Konzepte in Bezug auf die Risikoanalyse und auf die Sicherheit in der Informationstechnik,
   > [de-bsig-p30.txt · Abs. 2 Nr. 2] Bewältigung von Sicherheitsvorfällen,
   > [de-bsig-p30.txt · Abs. 2 Nr. 3] Aufrechterhaltung des Betriebs, wie Backup-Management und Wiederherstellung nach einem Notfall, und Krisenmanagement,
   > [de-bsig-p30.txt · Abs. 2 Nr. 4] Sicherheit der Lieferkette einschließlich sicherheitsbezogener Aspekte der Beziehungen zu unmittelbaren Anbietern oder Diensteanbietern,
   > [de-bsig-p30.txt · Abs. 2 Nr. 5] Sicherheitsmaßnahmen bei Erwerb, Entwicklung und Wartung von informationstechnischen Systemen, Komponenten und Prozessen, einschließlich Management und Offenlegung von Schwachstellen,
   > [de-bsig-p30.txt · Abs. 2 Nr. 6] Konzepte und Verfahren zur Bewertung der Wirksamkeit von Risikomanagementmaßnahmen im Bereich der Sicherheit in der Informationstechnik,
   > [de-bsig-p30.txt · Abs. 2 Nr. 7] grundlegende Schulungen und Sensibilisierungsmaßnahmen im Bereich der Sicherheit in der Informationstechnik,
   > [de-bsig-p30.txt · Abs. 2 Nr. 8] Konzepte und Prozesse für den Einsatz von kryptographischen Verfahren,
   > [de-bsig-p30.txt · Abs. 2 Nr. 9] Erstellung von Konzepten für die Sicherheit des Personals, die Zugriffskontrolle und für die Verwaltung von IKT-Systemen, -Produkten und -Prozessen,
   > [de-bsig-p30.txt · Abs. 2 Nr. 10] Verwendung von Lösungen zur Multi-Faktor-Authentifizierung oder kontinuierlichen Authentifizierung, gesicherte Sprach-, Video- und Textkommunikation sowie gegebenenfalls gesicherte Notfallkommunikationssysteme innerhalb der Einrichtung.

6. **Für bestimmte digitale Einrichtungsarten hat der EU-Durchführungsrechtsakt Vorrang** (u. a. Cloud, Rechenzentren, MSP, MSSP).
   > [de-bsig-p30.txt · Abs. 3] … in Bezug auf DNS-Diensteanbieter, Top Level Domain Name Registries, Cloud-Computing-Dienstleister, Anbieter von Rechenzentrumsdiensten, Betreiber von Content Delivery Networks, Managed Service Provider, Managed Security Service Provider, … hat für die vorgenannten Einrichtungsarten Vorrang.

## Bedeutung für die ISMS-Parameter

*Auslegung – verbindlich erst nach Freigabe.*

- Die zehn Bereiche sind für betroffene Einrichtungen **Pflicht-Prüfbereiche** – unabhängig vom Prüftiefenprofil. Das Profil steuert nur die Umsetzungstiefe, nicht ob ein Bereich geprüft wird.
- Die Verhältnismäßigkeitskriterien begründen das Proportionalitätsmodell ([BIB-MET-PROFIL]): Risikoexposition → Exposure-Score, Größe → Komplexität, Schwere/Auswirkungen → Business Criticality.
- Dokumentationspflicht → `isms.md` muss je Bereich Umsetzung und Nachweis führen.

## Grenzen und offene Punkte

- Der Durchführungsrechtsakt nach Art. 21 Abs. 5 NIS2 (Vorrang für MSP, Cloud usw.) ist noch nicht erfasst – Entscheidung vom Typ `wissen` anlegen, sobald ein Kunde betroffen ist.
- Besondere Anforderungen an Betreiber kritischer Anlagen (§ 31 BSIG) sind noch nicht erfasst.
