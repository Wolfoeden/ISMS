# ISMS-Plattform – DT Agency

Arbeitssystem für ISMS-Einstufungen und -Prüfungen: Agents bearbeiten Dateien iterativ, Menschen geben jede verbindliche Aussage frei, und nur freigegebenes Wissen gelangt in das ISMS eines Unternehmens.

**Einstieg:** [`plan.md`](plan.md) → [`vorschriften.md`](vorschriften.md) → [`entscheidungen.md`](entscheidungen.md) → [`bibliothek/`](bibliothek/README.md)

## Aufbau

```
plan.md                  Methode und Ablauf: wie wir einstufen, wie eine Iteration läuft, wer was darf
vorschriften.md          welche Vorschriften welche ISMS-Parameter festlegen
entscheidungen.md        Entscheidungsseite für Methodik und Bibliothek (ENT-…)
bibliothek/              freigegebenes Wissen mit wörtlich belegten Zitaten
  quellen/               Wortlaut-Snapshots amtlicher Texte (BSIG, NIS2, DSGVO, BDSG, KMU)
mandanten/
  _vorlage/              Vorlage je Unternehmen:
    fragebogen.md          Fakten zum Unternehmen, ankreuzbar, mit Quelle
    entscheidungen.md      Entscheidungsseite des Mandats (E-…)
    isms.md                das ISMS-Artefakt – nur Freigegebenes
    verlauf.md             Protokoll der Iterationen
    notizen/               Rohmaterial (Interviews, Dokumente)
.claude/agents/          Agents: erhebung, einstufung, vorschriften, bibliothek, isms-pruefung, qualitaet
.claude/commands/        /iteration, /neues-mandat, /freigeben
CLAUDE.md                Regeln für alle Agents
docs/                    Fachkonzept Engagement & Proportionality Model
src/                     Domänenkern (Profil, Controls, Mandat, Bewertungsmodell, Größenklasse) und Werkzeuge (Fragebogen, NIS2-Vorprüfung, Prüfung der Endergebnisse)
db/                      PostgreSQL-Schema der späteren Plattform (0001 Mandatsmodell, 0002 Bewertung, Freigabe, Lebenszyklen)
```

## Arbeiten

```bash
npm install
```

```bash
npm run isms -- neu mueller-gmbh "Müller GmbH"
```

```bash
npm run isms -- status mueller-gmbh
```

In Claude Code: `/iteration mueller-gmbh` führt eine Iteration aus und endet mit der Liste dessen, was ein Mensch freigeben muss. `/freigeben E-003 mueller-gmbh` hält eine menschliche Entscheidung fest.

Weitere Befehle: `npm run isms -- einstufung <kürzel>`, `npm run isms -- pruefen [kürzel]`, `npm run isms -- index`.

## Entwicklung

```bash
npm run check
```

Typprüfung und Tests, darunter ein vollständiger Iterationszyklus an einem fiktiven Mandat und der Abgleich aller Bibliothekszitate mit den Quellen-Snapshots.

Datenbank-Tests (lokale PostgreSQL-Binaries, nicht als root):

```bash
db/test.sh
```
