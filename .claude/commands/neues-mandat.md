---
description: Legt ein neues Mandat aus der Vorlage an
argument-hint: <kürzel> "<Name der Organisation>"
---
Lege das Mandat `$ARGUMENTS` an.

1. `npm run isms -- neu $ARGUMENTS` ausführen (Kürzel: Kleinbuchstaben, Ziffern, Bindestrich).
2. `npm run isms -- pruefen <kürzel>` muss fehlerfrei sein.
3. Frage den Menschen nach dem Engagement Lead und trage ihn in `isms.md` §5 erst ein, wenn E-004 freigegeben ist – bis dahin nur in `verlauf.md` vermerken.
4. Commit: `Mandat <kürzel> angelegt`.
5. Erkläre kurz, was als Nächstes gebraucht wird: Interviewnotizen und Dokumente in `mandanten/<kürzel>/notizen/`, danach `/iteration <kürzel>`.

Hinweis an den Menschen: Mandatsdaten sind vertraulich; der Ablageort ist in ENT-012 noch offen.
