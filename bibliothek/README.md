# Bibliothek – verifiziertes Wissen

Die Bibliothek enthält das Wissen, auf das sich Einstufungen und ISMS-Prüfungen stützen dürfen: Rechtsquellen, Normen, Leitfäden und unsere eigene Methodik. **Nur was hier mit Status `verifiziert` steht, darf in einer `isms.md` verwendet werden.**

Übersicht aller Einträge: [index.md](index.md) (erzeugt mit `npm run isms -- index`).

## Aufbau

```
bibliothek/
  quellen/        Wortlaut-Snapshots amtlicher Texte (Gesetze, EU-Rechtsakte) mit URL und Abrufdatum
  rechtsquellen/  ein Eintrag je Regelungskomplex (z. B. BSIG § 28 Betroffenheit)
  normen/         Normen (ISO/IEC …) – nur Fundstellen und eigene Zusammenfassungen, kein Normtext
  methodik/       eigene Methodik (z. B. Ableitung des Assurance Profile)
  _vorlage.md     Vorlage für neue Einträge
```

## Statusmodell

| Status | Bedeutung | Wer setzt ihn |
|---|---|---|
| `entwurf` | Inhalt erfasst, nicht belegt | Agent oder Mensch |
| `quellengeprueft` | Jede Kernaussage hat ein Zitat, das `npm run isms -- pruefen` wörtlich im Quellen-Snapshot gefunden hat | Agent oder Mensch, nur wenn die Prüfung fehlerfrei ist |
| `verifiziert` | Ein Mensch hat Zitate, Auslegung und Aktualität geprüft; `verifiziert_von` (Name, Rolle) und `verifiziert_am` sind gesetzt | **nur ein Mensch** |
| `veraltet` | Quelle hat sich geändert oder Eintrag ist ersetzt | Agent oder Mensch, mit Verweis auf den Nachfolger |

Ein Agent setzt **niemals** `verifiziert`. Das Prüfwerkzeug lehnt `verifiziert_von`-Werte ab, die nach einer Maschine aussehen.

## Regeln für Einträge

1. **Belegen statt erinnern.** Jede Kernaussage zu einer Rechtsquelle wird mit einem Zitat belegt:
   ```
   > [de-bsig-p28.txt · Abs. 1 Nr. 1] Als besonders wichtige Einrichtung gelten 1. Betreiber kritischer Anlagen,
   ```
   Format: `> [<snapshot-datei> · <Fundstelle>] <Wortlaut>`. Auslassungen mit `…`. Das Werkzeug prüft, dass der Wortlaut im Snapshot steht.
2. **Snapshots** in `quellen/` nur aus amtlichen Quellen (gesetze-im-internet.de, EUR-Lex, Amtsblätter). Kopfzeilen mit Quelle, Teil, URL, Fassung und Abrufdatum. Snapshots werden nicht von Hand verändert.
3. **Normen sind urheberrechtlich geschützt.** Kein Normtext in der Bibliothek – nur Abschnittsnummern, Titel in eigener Kurzform und eigene Zusammenfassungen. Verifikation nur gegen ein lizenziertes Normexemplar.
4. **Auslegung kennzeichnen.** Unter „Bedeutung für die ISMS-Parameter“ steht unsere Auslegung – sie ist erst mit dem Status `verifiziert` verbindlich.
5. **Grenzen benennen.** Was der Eintrag nicht abdeckt, steht unter „Grenzen und offene Punkte“. Fehlt Wissen, wird auf der Entscheidungsseite eine Entscheidung vom Typ `wissen` angelegt.
6. **Aktualität.** `naechste_pruefung` setzen (Standard: 6 Monate für Gesetze im Umbruch, 12 Monate sonst). Bei Gesetzesänderungen neuen Snapshot ziehen, Zitate prüfen, Status ggf. zurücksetzen.
7. **IDs** sind stabil: `BIB-<KÜRZEL>`; ein Eintrag wird nie umbenannt, sondern bei Bedarf `veraltet` gesetzt und ersetzt.
