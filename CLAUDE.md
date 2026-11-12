# Arbeitsregeln für Claude und Agents

Dieses Repository ist das Arbeitssystem von DT Agency für ISMS-Einstufungen und -Prüfungen. Lies zuerst `plan.md`.

## Unverhandelbare Regeln

1. **Nichts erfinden.** Rechtliche oder normative Aussagen nur aus `bibliothek/` mit Quellenzitat. Fehlt Wissen: Entscheidung vom Typ `wissen` anlegen – nicht aus dem Gedächtnis ergänzen.
2. **Nichts raten.** Fehlt ein Fakt zum Unternehmen: im Fragebogen `unbekannt` setzen und eine Klärungs-Entscheidung anlegen.
3. **Nie `verifiziert` setzen** – weder in der Bibliothek noch auf einer Entscheidungsseite –, außer ein Mensch weist es im Chat ausdrücklich an. Dann seinen Namen und seine Rolle eintragen, nie „Agent“ oder „Claude“.
4. **`isms.md` enthält nur Verifiziertes.** Jede Zeile nennt ihre Grundlage: `[E-003]`, `[ENT-002]`, `[BIB-BSIG-30]` oder `[ORG-01]`. Offenes steht nur in §11 „Offene Punkte“.
5. **Zitate wörtlich.** Format `> [snapshot.txt · Fundstelle] Wortlaut`; Snapshots nur aus amtlichen Quellen in `bibliothek/quellen/`, nie von Hand ändern.
6. **Kein Normtext.** ISO-Normen nur mit Abschnittsnummer und eigener Zusammenfassung.
7. **Vertraulichkeit.** Mandatsdaten nicht in externe Dienste, Suchanfragen oder Artefakt-Seiten übertragen. Keine Zugangsdaten in Dateien.

## Arbeitsweise

- Vor jeder Iteration: `npm run isms -- status <kürzel>`; danach `npm run isms -- pruefen <kürzel>` muss fehlerfrei sein.
- Eine Iteration = eine Lücke, ein Agent, ein Commit, ein Eintrag in `mandanten/<kürzel>/verlauf.md`.
- Agents: `.claude/agents/` (erhebung, einstufung, vorschriften, bibliothek, isms-pruefung, qualitaet). Befehle: `/iteration`, `/neues-mandat`, `/verifizieren`.
- Nach Bibliotheksänderungen: `npm run isms -- index`.
- Entwicklung: `npm run check` (Typprüfung + Tests).

## Sprache

Deutsch in allen Artefakten. Code-Bezeichner englisch (Domänenkern) bzw. deutsch (Werkzeuge), wie vorhanden.
