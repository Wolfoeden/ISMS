---
description: Führt eine Iteration für ein Mandat aus – Status lesen, nächste Lücke wählen, passenden Agent einsetzen, prüfen, protokollieren
argument-hint: <kürzel>
---
Führe genau **eine** Iteration für das Mandat `$ARGUMENTS` aus. Regeln: `CLAUDE.md`, Ablauf: `plan.md` §3.

1. `npm run isms -- status $ARGUMENTS` ausführen und die Ausgabe lesen.
2. Den **ersten** Punkt unter „Nächste Schritte“ wählen, der nicht `[mensch]` ist. Gibt es nur noch `[mensch]`-Punkte: direkt zu Schritt 5.
3. Den genannten Agent (`.claude/agents/<name>.md`) mit dem Mandatskürzel und dem gewählten Schritt beauftragen. Nur diesen einen Schritt bearbeiten.
4. Danach `npm run isms -- pruefen $ARGUMENTS` – bei Fehlern den Agent `qualitaet` einsetzen, bis die Prüfung fehlerfrei ist.
5. Prüfen, dass `mandanten/$ARGUMENTS/verlauf.md` eine Zeile für diese Iteration hat.
6. Änderungen committen: `Iteration <kürzel>: <Schritt>`.
7. Abschlussbericht an den Menschen, kurz:
   - was erledigt wurde,
   - **was der Mensch jetzt verifizieren muss** – je Entscheidung ID, Titel, Vorschlag in einem Satz und die Grundlagen,
   - welche Fragen an den Kunden gehen (Klärungen),
   - der nächste Schritt laut `status`.

Setze niemals selbst `verifiziert`. Wenn der Mensch im Chat eine Entscheidung trifft, verwende `/verifizieren`.
