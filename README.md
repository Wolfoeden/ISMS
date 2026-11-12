# ISMS-Plattform

Plattform für Information Security Governance und gleichzeitig Delivery Operating System für DT Agency:

```
Customer → Mandate → Team → Scope → Assessment → Interviews → Evidence
  → Expert Review → Findings → Measures → Deliverables → Customer Decision → Continuous Operation
```

## Stand

Erster Baustein: **Engagement & Proportionality Model**. Er legt fest, wie viel Assurance eine Organisation braucht und wie ein Mandat organisiert wird.

- Fachkonzept mit Designentscheidungen und offenen Punkten: [`docs/01-engagement-proportionality-model.md`](docs/01-engagement-proportionality-model.md)
- Domänenkern (TypeScript, ohne Laufzeitabhängigkeiten): `src/`
  - `proportionality/` – Complexity Profile, Ableitung des Assurance Profile, Profilparameter, Control-Umsetzungstiefe
  - `engagement/` – Mandat, Rollen, Responsibility Model, Rollentrennung, Auditunabhängigkeit, Quality Gate, Templates
- Datenbankschema (PostgreSQL ≥ 15): `db/migrations/`

## Entwicklung

```bash
npm install
```

```bash
npm run check
```

`check` führt Typprüfung und Tests aus. Die Beispiele aus dem Fachkonzept (Einzelentwickler A/B, Produktionsunternehmen, Access Review) sind als Tests hinterlegt.

Datenbank-Tests (benötigt lokale PostgreSQL-Binaries, nicht als root):

```bash
db/test.sh
```
