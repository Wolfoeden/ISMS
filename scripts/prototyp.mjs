/**
 * Startet den lokalen Prototyp ohne bash – läuft unter Windows (PowerShell), macOS und Linux.
 * Temporäre PostgreSQL-Datenbank (eigene Binaries: initdb, pg_ctl), alle Migrationen, fiktive
 * Startdaten, dann der Server auf http://localhost:8787. Strg+C beendet und löscht alle Daten.
 * Nur Prototyp mit Test-Anmeldung und fiktiven Daten.
 */
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIN = process.platform === 'win32';
const EXE = WIN ? '.exe' : '';
const PORT = Number(process.env.PGPORT_PROTOTYP ?? 54332);

function pgBin() {
  if (process.env.PGBIN) return process.env.PGBIN;
  const kandidaten = [];
  if (WIN) {
    for (const basis of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean)) {
      const d = join(basis, 'PostgreSQL');
      if (existsSync(d)) for (const v of readdirSync(d).sort((a, b) => Number(b) - Number(a))) kandidaten.push(join(d, v, 'bin'));
    }
  } else {
    for (const d of ['/usr/lib/postgresql']) if (existsSync(d)) for (const v of readdirSync(d).sort((a, b) => Number(b) - Number(a))) kandidaten.push(join(d, v, 'bin'));
    kandidaten.push('/opt/homebrew/opt/postgresql@16/bin', '/usr/local/opt/postgresql@16/bin');
  }
  const gefunden = kandidaten.find((d) => existsSync(join(d, 'initdb' + EXE)));
  if (gefunden) return gefunden;
  const wo = spawnSync(WIN ? 'where' : 'which', ['initdb'], { encoding: 'utf-8' });
  if (wo.status === 0) return dirname(wo.stdout.split(/\r?\n/)[0].trim());
  console.error('PostgreSQL nicht gefunden. Windows: winget install PostgreSQL.PostgreSQL.16 – danach PowerShell neu öffnen.');
  process.exit(1);
}

const BIN = pgBin();
const TMP = mkdtempSync(join(tmpdir(), 'isms-prototyp-'));
const DATA = join(TMP, 'data');
const run = (cmd, args) => {
  const r = spawnSync(join(BIN, cmd + EXE), args, { encoding: 'utf-8' });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); throw new Error(`${cmd} fehlgeschlagen`); }
};

let server;
let beendet = false;
function aufraeumen() {
  if (beendet) return;
  beendet = true;
  try { server?.kill(); } catch {}
  try { spawnSync(join(BIN, 'pg_ctl' + EXE), ['-D', DATA, '-m', 'immediate', 'stop'], { stdio: 'ignore' }); } catch {}
  try { rmSync(TMP, { recursive: true, force: true }); } catch {}
}
process.on('SIGINT', () => { aufraeumen(); process.exit(0); });
process.on('SIGTERM', () => { aufraeumen(); process.exit(0); });
process.on('exit', aufraeumen);

console.log('Datenbank wird vorbereitet …');
run('initdb', ['-D', DATA, '-A', 'trust', '-U', 'postgres', '-E', 'UTF8', '--no-locale']);
run('pg_ctl', ['-D', DATA, '-o', `-p ${PORT} -c listen_addresses=localhost`, '-l', join(TMP, 'pg.log'), '-w', 'start']);

const url = `postgresql://postgres@localhost:${PORT}/postgres`;
// je Datei eine eigene Sitzung (wie psql -f)
async function sqlDatei(datei) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try { await c.query(readFileSync(datei, 'utf-8')); } finally { await c.end(); }
}
const migrationen = readdirSync(join(ROOT, 'db', 'migrations')).filter((f) => f.endsWith('.sql')).sort();
for (const f of migrationen) await sqlDatei(join(ROOT, 'db', 'migrations', f));
await sqlDatei(join(ROOT, 'db', 'seed', 'pilot.sql'));
console.log(`${migrationen.length} Migrationen und fiktive Startdaten geladen.`);

server = spawn(process.execPath, ['--import', 'tsx', join(ROOT, 'src', 'api', 'server.ts')], {
  cwd: ROOT,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: url,
    ISMS_EVIDENCE_DIR: join(TMP, 'evidence'),
    ISMS_DEV_AUTH: '1',
    ISMS_SYSTEM_TOKEN: process.env.ISMS_SYSTEM_TOKEN ?? randomBytes(16).toString('hex'),
  },
});
console.log('Im Browser öffnen: http://localhost:8787/   (Beenden: Strg+C)');
server.on('exit', (code) => { aufraeumen(); process.exit(code ?? 0); });
