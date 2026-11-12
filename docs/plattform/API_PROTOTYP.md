# Lokaler Prototyp – Anwendungsschicht (MVP Etappe 1)

| | |
|---|---|
| Stand | 2026-11-12 |
| Code | `src/api/` (Server, Sitzung, Fehler, Fachfunktionen) |
| Tests | `npm run test:api` – startet eine temporäre Datenbank, wendet Migrationen 0001–0014 und fiktive Startdaten an, spielt den Pilotfall über die Schnittstelle durch |
| Grenzen | nur lokal, Test-Anmeldung, lokale Dateiablage, kein KI-Dienst – Betrieb nach ENT-032 (zurückgestellt bis das MVP läuft) |

## Prinzip

Jede Anfrage läuft in einer eigenen Transaktion unter der Rolle `isms_app` mit gesetzter Person. Damit greifen alle Regeln der Datenbank: Zugriffsschutz (0008), KI-Grenzen (0010), Status- und Freigaberegeln. Der Kern (`src/`) prüft vorab und rechnet (Intake, Fristen, Pflichtbausteine, Hash, Rework-Ziel); die Datenbank erzwingt dieselben Regeln noch einmal.

Antworten: `{ "data": … }` oder `{ "error": { "code", "message" } }`.

| Code | Bedeutung |
|---|---|
| 401 `nicht_angemeldet` | keine Person bzw. kein gültiges System-Token |
| 403 `keine_berechtigung` | Zugriffsschutz hat die Änderung verhindert (auch: KI-Sitzung schreibt) |
| 404 `nicht_gefunden` | nicht vorhanden **oder** nicht sichtbar – bewusst nicht unterschieden |
| 409 `doppelt` | bereits vorhanden |
| 422 `regelverstoss` | eine Fachregel lehnt ab; die Meldung nennt die Regel |

## Starten

```bash
bash scripts/with-db.sh env ISMS_DEV_AUTH=1 ISMS_SYSTEM_TOKEN=lokal npm run api
```

- Test-Anmeldung: Kopfzeile `x-person-id` (fiktive Personen aus `db/seed/pilot.sql`). Nur aktiv mit `ISMS_DEV_AUTH=1`; der Server lauscht nur auf 127.0.0.1.
- KI-Sitzung: zusätzlich `x-actor: ai` und `x-ai-mandate: <Mandat>`.
- Systemnachrichten (Unterschrift): `x-system-token` = `ISMS_SYSTEM_TOKEN`.

## Aufrufe (Pilotfall)

| Schritt | Aufruf |
|---|---|
| Stammdaten | `POST /organizations` · `POST /persons` · `POST /profile-decisions` |
| Intake | `POST /intakes` · `POST /intakes/:id/facts` · `POST /intakes/:id/route` · `GET /intakes/:id/orientation` |
| Prüfvorgang, Scope | `POST /cases` · `GET /cases/:id` · `POST /cases/:id/status` · `POST /objects` · `POST /cases/:id/scope-versions` · `POST /scope-versions/:id/approve` |
| Angebot, Mandat | `POST /cases/:id/offers` · `POST /offers/:id/send` · `POST /offers/:id/signed` (System) · `POST /mandates/:id/team` · `POST /mandates/:id/activate` |
| Nachweise, Bewertung | `POST /mandates/:id/evidence` · `POST /evidence/:id/review` · `POST /mandates/:id/control-assessments` · `PATCH /control-assessments/:id` · `POST /evidence-links` · `POST /evidence-links/confirm` |
| KI-Vorschläge | `POST /mandates/:id/proposals` · `POST /proposals/:id/review` |
| Normversion | `POST /version-impacts/:id/decide` |
| Bericht | `POST /cases/:id/reports` · `POST /reports/:id/submit` · `POST /reports/:id/qa` · `POST /reports/:id/publish` |

## Durch die Tests belegt (`test/api/pilot.test.ts`)

Anmeldung und System-Token; Intake mit Hinweisbestätigung, Ask once, Orientierung; Modus/Assurance-Regel; Scope-Freigabe nur durch DT Agency; Angebot ohne Pflichtbaustein abgelehnt; dreifache Unterschrift → ein Mandat; Upload vor aktivem Mandat abgelehnt; Dedup und Sicherheitsereignis bei versteckter Anweisung; Kunde kann Nachweise nicht prüfen; R1 ohne bestätigte Verknüpfung; KI-Sitzung legt Vorschläge an, kann aber weder prüfen noch Bewertungen ändern; QA durch Autor abgelehnt, Rückgabe mit berechneter Zielphase, keine Veröffentlichung danach; Freigabe nur mit benannten Grenzen; gesperrter Bericht; Abschluss nur „mit Einschränkungen“; Kunde sieht nur die veröffentlichte Version.

## Offen (Etappe 2/3)

Ende-zu-Ende-Negativpfade vollständig; Kundenportal und Berater-Arbeitsplatz; Dashboard je Mandat über die Schnittstelle; Aufgaben (WP-07).
