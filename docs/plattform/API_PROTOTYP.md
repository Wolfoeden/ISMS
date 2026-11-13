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
| Normversion | `POST /framework-versions` · `POST /version-impacts/:id/decide` |
| Storno, offene Fragen | `POST /mandates/:id/terminate` · `POST /cases/:id/questions` · `PATCH /questions/:id` |
| System | `POST /offers/:id/signed` · `POST /system/expire-offers` (Fristen-Lauf) |
| Nachvollziehbarkeit | `GET /reports/:id/trace` – Kette Anfrage → Bericht mit Lückenliste (nur DT Agency) |
| Bericht | `POST /cases/:id/reports` · `POST /reports/:id/submit` · `POST /reports/:id/qa` · `POST /reports/:id/publish` |

## Durch die Tests belegt (`test/api/pilot.test.ts`)

Anmeldung und System-Token; Intake mit Hinweisbestätigung, Ask once, Orientierung; Modus/Assurance-Regel; Scope-Freigabe nur durch DT Agency; Angebot ohne Pflichtbaustein abgelehnt; dreifache Unterschrift → ein Mandat; Upload vor aktivem Mandat abgelehnt; Dedup und Sicherheitsereignis bei versteckter Anweisung; Kunde kann Nachweise nicht prüfen; R1 ohne bestätigte Verknüpfung; KI-Sitzung legt Vorschläge an, kann aber weder prüfen noch Bewertungen ändern; QA durch Autor abgelehnt, Rückgabe mit berechneter Zielphase, keine Veröffentlichung danach; Freigabe nur mit benannten Grenzen; gesperrter Bericht; Abschluss nur „mit Einschränkungen“; Kunde sieht nur die veröffentlichte Version.

## Etappe 2 – WP-11 (`test/api/negativpfade.test.ts`, `test/api/spur.test.ts`)

| Pfad | Prüft | Fachtest |
|---|---|---|
| N-01 | fremder Kunde sieht keinen fremden Fall, Intake oder Nachweis | TC-18 |
| N-02 | KI-Sitzung: kein fremdes Mandat, keine Änderung an Bewertung oder Nachweis, keine Prüfung eigener Vorschläge | TC-11, TC-12 |
| N-03 | kein Upload vor aktivem Mandat | DEC-08 |
| N-04 | abgelaufenes Angebot → kein Mandat | TC-07 |
| N-05 | Änderungswunsch → neue Version, keine Unterschrift auf dem alten Angebot | TC-08 |
| N-06 | mehrfache Unterschrift → ein Mandat; ohne Token kein Systemaufruf | TC-20 |
| N-07 | Storno nur mit Entscheidung, danach Prüfvorgang gestoppt, kein Upload | TC-19 |
| N-08 | Nachweis aus anderem Mandat zählt erst nach Bestätigung durch DT Agency | TC-10 |
| N-09 | QA nicht durch Autor, Consultant oder Kunde; keine Veröffentlichung ohne QA | TC-13, TC-15 |
| N-10 | wesentliche Unbekannte blockiert die Bewertung; N/A nur begründet | TC-09, US-B2 |
| N-11 | neue Normversion → keine QA ohne Entscheidung des Leads | TC-17 |
| N-12 | veröffentlichter Bericht gesperrt; neue Version nur mit Änderungsprotokoll | US-D2, TC-16 |

**Spurprotokoll:** Für einen veröffentlichten Bericht ist die Kette Intake (mit Angaben und Quellen) → Scope (Normversion, Objekte) → Angebot → Mandat → Bewertungen → Nachweise (Fingerabdruck) → KI-Vorschläge (Modell, Prompt, Fundstelle, Prüfer) → QA → Protokoll lückenlos; Lücken werden benannt statt verdeckt. Nur DT Agency mit Beteiligung am Mandat sieht es.

**Durch WP-11 gefundene und behobene Fehler (Migration 0015):** Der Fristen-Lauf sah als Systemprozess keine Angebote und ließ abgelaufene Angebote offen. Protokolleinträge zu Bericht, Angebot und Folgeprüfung hatten keinen Mandatsbezug – sie fehlten im Mandatsprotokoll und waren für alle Agenturpersonen sichtbar.

## Etappe 3 – Oberfläche

```bash
npm run prototyp          # Datenbank + Server, http://127.0.0.1:8787/
npm run ui:durchlauf      # Klick-Durchlauf des Pilotfalls, Screenshots in .data/ui
```

- Drei statische Dateien (`src/api/ui/`), ohne Bibliotheken; strenge Inhaltsrichtlinie (nur eigene Quellen, kein eingebettetes Skript); alle Inhalte als Text eingesetzt, nie als HTML.
- **Kunde:** Einstieg nach Variante C, Kernfragen mit „weiß ich nicht“, erste Orientierung, Meine Vorgänge, Fortschritt je Mandat (ENT-037), Upload, Bericht mit Grenzen.
- **DT Agency:** Kunden anlegen, Vorgänge, Fallansicht (Objekte und Scope, Angebot und Mandat, Rollen, Nachweise und Bewertung je Objekt, offene Fragen, KI-Vorschläge, Bericht/QA/Veröffentlichung), Spurprotokoll.
- **Nur Prototyp** (gestrichelt markiert, nur mit `ISMS_DEV_AUTH=1`): Rollenauswahl, „Unterschrift simulieren“, „KI-Vorschlag simulieren“ (läuft über die echte KI-Sitzung mit allen Grenzen, fester Platzhalterinhalt).
- Fortschritt zählt nur Freigegebenes – Kunde und Berater sehen dieselben Zahlen.

**Durch die Oberfläche gefundene und behobene Fehler (Migration 0016, Service):** Nach der Unterschrift sah der Engagement Lead seinen Fall nicht mehr (jetzt Startteam: Angebotsersteller = Engagement Lead, anfragender Kunde = Ansprechpartner); Engagement Lead und Independent Reviewer konnten dieselbe Person sein (jetzt gesperrt); Scope-Freigabe setzte den Prüfvorgang nicht weiter.

## Offen

Aufgaben-Dienst mit Fristen und Erinnerungen (WP-07); echte Anmeldung, Dateispeicher, KI-Dienst (ENT-032).
