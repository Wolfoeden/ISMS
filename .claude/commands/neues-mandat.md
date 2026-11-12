---
description: Legt ein neues Mandat aus der Vorlage an
argument-hint: <kürzel> "<Name der Organisation>"
---
Lege das Mandat `$ARGUMENTS` an.

0. Ablageort (ENT-012): Echte Kundenmandate liegen in einem **eigenen privaten Repository je Kunde**. Frage den Menschen nach dem lokalen Pfad des Kundenrepositorys und setze `ISMS_MANDANTEN=<pfad>` für alle folgenden Befehle. Ohne Angabe nur fiktive Testmandate (`test-…`) in diesem Repository anlegen.
1. `npm run isms -- neu $ARGUMENTS` ausführen (Kürzel: Kleinbuchstaben, Ziffern, Bindestrich). Für ein Third-Party oder Product Security Assessment `--drittpartei` anhängen: Kurzfragebogen (ENT-008); wesentliche Nachfragen nennt danach `npm run isms -- einstufung <kürzel>`.
2. `npm run isms -- pruefen <kürzel>` muss fehlerfrei sein.
3. Frage den Menschen nach dem Engagement Lead und trage ihn in `isms.md` §5 erst ein, wenn E-004 freigegeben ist – bis dahin nur in `verlauf.md` vermerken.
4. Commit **im Kundenrepository**: `Mandat <kürzel> angelegt`.
5. Erkläre kurz, was als Nächstes gebraucht wird: Interviewnotizen und Dokumente in `mandanten/<kürzel>/notizen/`, danach `/iteration <kürzel>`.

Hinweis an den Menschen: Mandatsdaten sind vertraulich und gehören nie in dieses Methodik-Repository (`.gitignore` schließt `mandanten/*` außer Vorlage und `test-*` aus).
