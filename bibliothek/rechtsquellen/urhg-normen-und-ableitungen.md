---
id: BIB-URHG
titel: Urheberrecht – Schutz von Normen, Bearbeitungen, Text und Data Mining, Zitate
art: rechtsquelle
verbindlichkeit: anforderung
rechtsraum: DE
status: quellengeprueft
quellen:
  - quellen/de-urhg-p5.txt
  - quellen/de-urhg-p23.txt
  - quellen/de-urhg-p44b.txt
  - quellen/de-urhg-p51.txt
  - https://www.gesetze-im-internet.de/urhg/
stand_der_quelle: 2026-05-26
erfasst_von: Agent bibliothek, 2026-11-12
verifiziert_von:
verifiziert_am:
naechste_pruefung: 2027-05-12
---
# Urheberrecht – Normen und daraus abgeleitete Unterlagen

Anlass: Frage, ob überarbeitete Fassungen von ISO-Normen im Repository und in der Plattform rechtlich zulässig sind ([ENT-026]). **Keine Rechtsberatung** – die Auslegung unten ist eine fachliche Einordnung und für die kommerzielle Plattform anwaltlich bzw. mit dem Rechteinhaber zu bestätigen.

## Kernaussagen

1. **Gesetze und amtliche Werke sind frei.** Deshalb dürfen BSIG, NIS-2-Richtlinie, DSGVO und BDSG wörtlich in der Bibliothek stehen.
   > [de-urhg-p5.txt · Abs. 1] Gesetze, Verordnungen, amtliche Erlasse und Bekanntmachungen sowie Entscheidungen und amtlich verfaßte Leitsätze zu Entscheidungen genießen keinen urheberrechtlichen Schutz.

2. **Private Normwerke bleiben geschützt** – auch wenn Gesetze auf sie verweisen.
   > [de-urhg-p5.txt · Abs. 3 Satz 1] Das Urheberrecht an privaten Normwerken wird durch die Absätze 1 und 2 nicht berührt, wenn Gesetze, Verordnungen, Erlasse oder amtliche Bekanntmachungen auf sie verweisen, ohne ihren Wortlaut wiederzugeben.

3. **Bearbeitungen dürfen nur mit Zustimmung veröffentlicht oder verwertet werden – außer das neue Werk hält hinreichenden Abstand.** Das Herstellen einer Bearbeitung eines Sprachwerks ist zustimmungsfrei (Ausnahmen in Abs. 2 betreffen u. a. Datenbankwerke).
   > [de-urhg-p23.txt · Abs. 1] Bearbeitungen oder andere Umgestaltungen eines Werkes, insbesondere auch einer Melodie, dürfen nur mit Zustimmung des Urhebers veröffentlicht oder verwertet werden. Wahrt das neu geschaffene Werk einen hinreichenden Abstand zum benutzten Werk, so liegt keine Bearbeitung oder Umgestaltung im Sinne des Satzes 1 vor.
   > [de-urhg-p23.txt · Abs. 2 Nr. 4] die Bearbeitung oder Umgestaltung eines Datenbankwerkes,

4. **Automatisierte Analyse (Text und Data Mining) rechtmäßig zugänglicher Werke ist erlaubt, wenn der Rechtsinhaber sie nicht vorbehalten hat.**
   > [de-urhg-p44b.txt · Abs. 2 Satz 1] Zulässig sind Vervielfältigungen von rechtmäßig zugänglichen Werken für das Text und Data Mining.
   > [de-urhg-p44b.txt · Abs. 3 Satz 1] Nutzungen nach Absatz 2 Satz 1 sind nur zulässig, wenn der Rechtsinhaber sich diese nicht vorbehalten hat.

5. **Zitate sind erlaubt, soweit der Zweck den Umfang rechtfertigt** – das trägt einzelne belegende Stellen in einem eigenen Werk, keinen systematischen Katalog.
   > [de-urhg-p51.txt · Satz 1] Zulässig ist die Vervielfältigung, Verbreitung und öffentliche Wiedergabe eines veröffentlichten Werkes zum Zweck des Zitats, sofern die Nutzung in ihrem Umfang durch den besonderen Zweck gerechtfertigt ist.

## Bedeutung für die ISMS-Parameter

*Auslegung – keine Rechtsberatung; verbindlich erst nach Verifikation.*

| Inhalt | Einschätzung |
|---|---|
| Gesetzestexte als Snapshots | zulässig (Kernaussage 1) |
| Abschnitts- und Control-Nummern, Gliederung, eigene Zusammenfassungen, eigene Prüfregeln und Datenmodelle | geringes Risiko, wenn eigenständig formuliert (hinreichender Abstand, Kernaussage 3) |
| Amtliche deutsche Kurztitel der 93 Controls und PDF-Seitenzahlen | geringes bis mittleres Risiko: einzelne Kurztitel sind kaum schutzfähig, die vollständige Liste gibt aber einen Teil der DIN-Fassung wieder |
| Eng am Normtext entlang paraphrasierte Passagen | Bearbeitung – Verwertung (z. B. Weitergabe an Kunden, Bestandteil eines Produkts) nur mit Zustimmung |
| Erstellung der Aufbereitungen mit KI aus dem E-Book | hängt vom Vorbehalt des Rechtsinhabers bzw. von den Lizenzbedingungen ab (Kernaussage 4) – **ungeklärt** |
| Lizenzbedingungen des E-Books | Vertragsrecht, unabhängig vom Urheberrecht; können strenger sein (z. B. Nutzung nur durch eine Person, keine Datenbanken) – **ungeklärt** |

## Grenzen und offene Punkte

- Lizenzbedingungen der TÜV-Süd-Akademie-E-Books und Rechtevorbehalte von DIN Media / ISO sind nicht erfasst.
- Datenbankherstellerrecht (§§ 87a ff. UrhG) ist nicht erfasst.
- Rechtsprechung zum „hinreichenden Abstand“ bei technischen Normen ist nicht erfasst.
