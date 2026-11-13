/**
 * Lokaler Prototyp-Server (MVP Etappe 1). Kein Framework, nur node:http.
 *
 * Anmeldung im Prototyp: Kopfzeile `x-person-id` (Test-Anmeldung). Sie ist nur aktiv, wenn
 * ISMS_DEV_AUTH=1 gesetzt ist; der Server lauscht nur auf 127.0.0.1. Die echte Anmeldung folgt
 * mit der Hosting-Entscheidung (ENT-032). KI-Sitzung: zusätzlich `x-actor: ai` und `x-ai-mandate`.
 * Systemnachrichten (z. B. Unterschrift): Kopfzeile `x-system-token` = ISMS_SYSTEM_TOKEN.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ApiError } from './errors.js';
import { SYSTEM, withSession, type Identity } from './db.js';
import * as s from './service.js';

type Body = Record<string, unknown>;
type Handler = (p: string[], body: Body, id: Identity & { personId: string }) => Promise<unknown>;
interface Route { method: string; path: RegExp; handler: Handler; system?: boolean }

const ID = '([0-9a-f-]{36})';
/** fiktive Agenturperson aus db/seed/pilot.sql – nur für die Rollenauswahl im Prototyp */
const DEV_LEAD = '00000000-0000-4000-8000-000000000a01';
const r = (method: string, path: string, handler: Handler, system = false): Route =>
  ({ method, path: new RegExp(`^${path.replaceAll(':id', ID)}$`), handler, system });

export const ROUTES: Route[] = [
  r('POST', '/organizations', (_p, b, i) => withSession(i, (db) => s.createOrganization(db, b))),
  r('POST', '/persons', (_p, b, i) => withSession(i, (db) => s.createPerson(db, b))),
  r('POST', '/profile-decisions', (_p, b, i) => withSession(i, (db) => s.createProfileDecision(db, b, i.personId))),

  r('POST', '/intakes', (_p, b, i) => withSession(i, (db) => s.createIntake(db, b, i.personId))),
  r('POST', '/intakes/:id/facts', ([id], b, i) => withSession(i, (db) => s.recordFact(db, id!, b))),
  r('POST', '/intakes/:id/route', ([id], b, i) => withSession(i, (db) => s.switchRoute(db, id!, b))),
  r('GET', '/intakes/:id/orientation', ([id], _b, i) => withSession(i, (db) => s.intakeOrientation(db, id!))),

  r('POST', '/cases', (_p, b, i) => withSession(i, (db) => s.createCase(db, b))),
  r('GET', '/cases/:id', ([id], _b, i) => withSession(i, (db) => s.caseOverview(db, id!))),
  r('POST', '/cases/:id/status', ([id], b, i) => withSession(i, (db) => s.setCaseStatus(db, id!, b))),
  r('POST', '/objects', (_p, b, i) => withSession(i, (db) => s.createObject(db, b))),
  r('POST', '/cases/:id/scope-versions', ([id], b, i) => withSession(i, (db) => s.createScopeVersion(db, id!, b))),
  r('POST', '/scope-versions/:id/approve', ([id], _b, i) => withSession(i, (db) => s.approveScope(db, id!, i.personId))),

  r('POST', '/cases/:id/offers', ([id], b, i) => withSession(i, (db) => s.createOffer(db, id!, b, i.personId))),
  r('POST', '/offers/:id/send', ([id], b, i) => withSession(i, (db) => s.sendOffer(db, id!, b))),
  // Unterschrift kommt als Nachricht (Systemprozess) – idempotent
  r('POST', '/offers/:id/signed', ([id], b) => withSession(SYSTEM, (db) => s.signOffer(db, id!, b)), true),
  r('POST', '/mandates/:id/team', ([id], b, i) => withSession(i, (db) => s.addTeamMember(db, id!, b))),
  r('POST', '/mandates/:id/activate', ([id], b, i) => withSession(i, (db) => s.activateMandate(db, id!, b))),

  r('POST', '/mandates/:id/evidence', ([id], b, i) => withSession(i, (db) => s.uploadEvidence(db, id!, b, i.personId))),
  r('POST', '/evidence/:id/review', ([id], b, i) => withSession(i, (db) => s.reviewEvidence(db, id!, b, i.personId))),
  r('POST', '/mandates/:id/control-assessments', ([id], b, i) => withSession(i, (db) => s.createControlAssessment(db, id!, b))),
  r('PATCH', '/control-assessments/:id', ([id], b, i) => withSession(i, (db) => s.updateControlAssessment(db, id!, b))),
  r('POST', '/evidence-links', (_p, b, i) => withSession(i, (db) => s.linkEvidence(db, b))),
  r('POST', '/evidence-links/confirm', (_p, b, i) => withSession(i, (db) => s.confirmEvidenceLink(db, b, i.personId))),

  r('POST', '/mandates/:id/proposals', ([id], b, i) => withSession(i, (db) => s.createProposal(db, id!, b))),
  r('POST', '/proposals/:id/review', ([id], b, i) => withSession(i, (db) => s.reviewProposal(db, id!, b, i.personId))),

  r('POST', '/version-impacts/:id/decide', ([id], b, i) => withSession(i, (db) => s.decideVersionImpact(db, id!, b, i.personId))),

  r('POST', '/mandates/:id/terminate', ([id], b, i) => withSession(i, (db) => s.terminateMandate(db, id!, b, i.personId))),
  r('POST', '/cases/:id/questions', ([id], b, i) => withSession(i, (db) => s.createQuestion(db, id!, b))),
  r('PATCH', '/questions/:id', ([id], b, i) => withSession(i, (db) => s.updateQuestion(db, id!, b))),
  r('POST', '/framework-versions', (_p, b, i) => withSession(i, (db) => s.createFrameworkVersion(db, b))),
  r('POST', '/system/expire-offers', (_p, b) => withSession(SYSTEM, (db) => s.expireOffers(db, b)), true),
  r('GET', '/reports/:id/trace', ([id], _b, i) => withSession(i, (db) => s.traceReport(db, id!))),
  r('GET', '/intakes', (_p, _b, i) => withSession(i, (db) => s.listIntakes(db))),
  r('GET', '/cases', (_p, _b, i) => withSession(i, (db) => s.listCases(db))),
  r('GET', '/cases/:id/workspace', ([id], _b, i) => withSession(i, (db) => s.caseWorkspace(db, id!))),
  r('GET', '/cases/:id/dashboard', ([id], _b, i) => withSession(i, (db) => s.caseDashboard(db, id!))),
  r('GET', '/reports/:id', ([id], _b, i) => withSession(i, (db) => s.readReport(db, id!))),
  // ---- nur Prototyp (ISMS_DEV_AUTH=1): Rollenauswahl, Unterschrift und KI-Vorschlag simulieren ----
  r('GET', '/dev/persons', () => withSession({ personId: DEV_LEAD }, (db) => s.devPersons(db)), true),
  r('POST', '/dev/offers/:id/sign', ([id]) => withSession(SYSTEM, (db) => s.signOffer(db, id!, { eventId: `DEV-${id}` })), true),
  r('POST', '/dev/mandates/:id/simulate-proposal', ([id], b, i) => withSession({ personId: i.personId, ai: { mandateId: id! } }, (db) => s.devSimulateProposal(db, id!, b))),
  r('POST', '/cases/:id/reports', ([id], b, i) => withSession(i, (db) => s.createReport(db, id!, b, i.personId))),
  r('POST', '/reports/:id/submit', ([id], _b, i) => withSession(i, (db) => s.submitReport(db, id!))),
  r('POST', '/reports/:id/qa', ([id], b, i) => withSession(i, (db) => s.qaDecision(db, id!, b, i.personId))),
  r('POST', '/reports/:id/publish', ([id], _b, i) => withSession(i, (db) => s.publishReport(db, id!, i.personId))),
];

const MAX_BODY = 10 * 1024 * 1024;

async function readBody(req: IncomingMessage): Promise<Body> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) throw new ApiError(413, 'zu_gross', 'Anfrage zu groß');
    chunks.push(c as Buffer);
  }
  if (!chunks.length) return {};
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error();
    return v as Body;
  } catch {
    throw new ApiError(400, 'ungueltig', 'Kein gültiges JSON-Objekt');
  }
}

function identity(req: IncomingMessage): Identity & { personId: string } {
  const personId = String(req.headers['x-person-id'] ?? '');
  if (!/^[0-9a-f-]{36}$/.test(personId)) throw new ApiError(401, 'nicht_angemeldet', 'Anmeldung fehlt (Prototyp: Kopfzeile x-person-id)');
  if (req.headers['x-actor'] === 'ai') {
    const mandateId = String(req.headers['x-ai-mandate'] ?? '');
    if (!/^[0-9a-f-]{36}$/.test(mandateId)) throw new ApiError(400, 'ungueltig', 'KI-Sitzung ohne Mandat (x-ai-mandate)');
    return { personId, ai: { mandateId } };
  }
  return { personId };
}

// Oberfläche (Etappe 3): drei statische Dateien, strenge Inhaltsrichtlinie – keine fremden Quellen,
// kein eingebettetes Skript. Nutzt ausschließlich die Schnittstelle oben.
const UI_DIR = join(dirname(fileURLToPath(import.meta.url)), 'ui');
const STATIC: Record<string, [string, string]> = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/app.css': ['app.css', 'text/css; charset=utf-8'],
};
function sendStatic(res: ServerResponse, path: string) {
  const [file, type] = STATIC[path]!;
  res.writeHead(200, {
    'content-type': type,
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });
  res.end(readFileSync(join(UI_DIR, file)));
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload));
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true });
    if (req.method === 'GET' && STATIC[url.pathname]) return sendStatic(res, url.pathname);
    const route = ROUTES.find((x) => x.method === req.method && x.path.test(url.pathname));
    if (!route) throw new ApiError(404, 'unbekannt', 'Unbekannter Pfad');
    const params = url.pathname.match(route.path)!.slice(1);
    const body = req.method === 'GET' ? {} : await readBody(req);
    const dev = url.pathname.startsWith('/dev/');
    if (dev && process.env['ISMS_DEV_AUTH'] !== '1') throw new ApiError(404, 'unbekannt', 'Unbekannter Pfad');
    if (route.system && !dev) {
      const token = process.env['ISMS_SYSTEM_TOKEN'];
      if (!token || req.headers['x-system-token'] !== token) throw new ApiError(401, 'nicht_angemeldet', 'Systemaufruf ohne gültiges Token');
    }
    const id = route.system ? { personId: '' } : identity(req);
    const data = await route.handler(params, body, id);
    send(res, 200, { data });
  } catch (e) {
    const err = e instanceof ApiError ? e : new ApiError(500, 'interner_fehler', 'Interner Fehler');
    if (err.status === 500) console.error(e);
    send(res, err.status, { error: { code: err.code, message: err.message } });
  }
}

export function startServer(port = Number(process.env['PORT'] ?? 8787)): Server {
  if (process.env['ISMS_DEV_AUTH'] !== '1') {
    throw new Error('Prototyp-Server startet nur mit ISMS_DEV_AUTH=1 (Test-Anmeldung, nur lokal).');
  }
  const server = createServer((req, res) => void handle(req, res));
  server.listen(port, '127.0.0.1');
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const srv = startServer();
  srv.on('listening', () => console.log(`ISMS-Prototyp auf http://127.0.0.1:${(srv.address() as { port: number }).port}`));
}
