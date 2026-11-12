/**
 * Fehler der Anwendungsschicht. Regelverstöße der Datenbank werden in verständliche Antworten
 * übersetzt; die Meldung der Regel (deutsch) geht unverändert an den Aufrufer.
 */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

interface PgLike { code?: string; message?: string; constraint?: string; detail?: string }

export function mapDbError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  const pg = e as PgLike;
  const msg = pg.message ?? String(e);
  switch (pg.code) {
    case '23514': // check_violation (Constraint oder Regel-Trigger)
    case 'P0001': // raise exception ohne eigenen Code
      return new ApiError(422, 'regelverstoss', pg.constraint ? `${msg} [${pg.constraint}]` : msg);
    case '42501': // insufficient_privilege / RLS
      return new ApiError(403, 'keine_berechtigung', msg.includes('row-level security') ? 'Keine Berechtigung für diesen Datensatz' : msg);
    case '23505':
      return new ApiError(409, 'doppelt', pg.constraint ? `Bereits vorhanden [${pg.constraint}]` : msg);
    case '23502':
      return new ApiError(422, 'pflichtfeld', msg);
    case '23503':
      return new ApiError(422, 'bezug_fehlt', 'Bezug auf einen nicht vorhandenen oder nicht sichtbaren Datensatz');
    case '22P02':
      return new ApiError(400, 'ungueltig', msg);
    default:
      // Ursache nur in das Serverprotokoll, nie an den Aufrufer
      console.error('[isms-api] unerwarteter Fehler:', pg.code ?? '', msg);
      return new ApiError(500, 'interner_fehler', 'Interner Fehler');
  }
}
