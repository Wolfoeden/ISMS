---
description: Hält die Entscheidung eines Menschen fest (Status freigegeben) und legt sie danach ab
argument-hint: <ID> [<kürzel>] – z. B. E-003 mueller-gmbh oder ENT-002
---
Ein Mensch möchte eine Entscheidung freigeben: `$ARGUMENTS`.

1. Entscheidung finden (`E-…` in `mandanten/<kürzel>/entscheidungen.md`, `ENT-…` in `entscheidungen.md`) und dem Menschen zeigen: Titel, Optionen, Vorschlag, Grundlagen. Für jede Grundlage den Status des Bibliothekseintrags nennen; nicht freigegebene Grundlagen ausdrücklich hervorheben.
2. Den Menschen fragen und **auf seine Antwort warten**:
   - Welche Entscheidung (Vorschlag übernehmen, andere Option, eigene Formulierung)?
   - Name und Rolle der freigebenden Person?
   - Wurden die Grundlagen geprüft?
3. Nur mit ausdrücklicher Antwort eintragen: `Entscheidung:`, `Freigegeben von: <Name, Rolle>`, `Freigegeben am: <heutiges Datum>`, `Status: freigegeben`. Name nie erfinden, nie „Agent“ oder „Claude“.
4. Danach ablegen wie in `plan.md` §3 beschrieben (Agent `isms-pruefung` bzw. `erhebung` für Klärungen, bei `ENT-…` Übernahme in Bibliothek, `plan.md`, `vorschriften.md` oder Code), `Status: abgelegt`, `Abgelegt in:` setzen.
5. `npm run isms -- pruefen`, Zeile in `verlauf.md` (bei Mandaten), Commit: `Freigegeben <ID>: <Kurzfassung>`.

Für Bibliothekseinträge gilt dasselbe: `status: freigegeben`, `freigegeben_von`, `freigegeben_am` nur auf ausdrückliche Anweisung.
