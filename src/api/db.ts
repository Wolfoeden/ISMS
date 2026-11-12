/**
 * Datenbankanbindung: jede Anfrage in einer eigenen Transaktion unter der Rolle isms_app,
 * mit gesetzter Person (app.person_id) und – für KI-Sitzungen – app.actor_kind / app.ai_mandate.
 * Damit greifen Zugriffsschutz (0008), KI-Grenzen (0010) und alle Regel-Trigger.
 */
import pg from 'pg';
import { ApiError, mapDbError } from './errors.js';

export interface Identity {
  personId?: string;
  /** KI-Sitzung im Auftrag einer Person, begrenzt auf ein Mandat */
  ai?: { mandateId: string };
}

export type Db = pg.PoolClient;

let pool: pg.Pool | undefined;
export function getPool(): pg.Pool {
  pool ??= new pg.Pool(process.env['DATABASE_URL'] ? { connectionString: process.env['DATABASE_URL'] } : {});
  return pool;
}
export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

export async function withSession<T>(id: Identity, fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query('set local role isms_app');
    await client.query("select set_config('app.person_id', $1, true)", [id.personId ?? '']);
    await client.query("select set_config('app.actor_kind', $1, true)", [id.ai ? 'ai' : '']);
    await client.query("select set_config('app.ai_mandate', $1, true)", [id.ai?.mandateId ?? '']);
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (e) {
    await client.query('rollback').catch(() => undefined);
    throw mapDbError(e);
  } finally {
    client.release();
  }
}

/** Für den Systemprozess (z. B. Nachrichtenverarbeitung) – ohne Person, aber mit Anwendungsrolle */
export const SYSTEM: Identity = {};

export async function one<T = Record<string, unknown>>(db: Db, sql: string, params: unknown[] = []): Promise<T> {
  const r = await db.query(sql, params);
  // nicht vorhanden oder durch den Zugriffsschutz verborgen – die Antwort unterscheidet das bewusst nicht
  if (!r.rows[0]) throw new ApiError(404, 'nicht_gefunden', 'Datensatz nicht vorhanden oder nicht sichtbar');
  return r.rows[0] as T;
}
