/**
 * Testhelfer für die Anwendungsschicht: Server starten, Aufrufe, Fall bis zu einer Stufe aufbauen.
 * Nur fiktive Daten.
 */
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { closePool } from '../../src/api/db.js';
import { startServer } from '../../src/api/server.js';

export const LEAD = '00000000-0000-4000-8000-000000000a01';
export const QA = '00000000-0000-4000-8000-000000000a02';
export const CONSULTANT = '00000000-0000-4000-8000-000000000a03';
export const TOKEN = 'test-system-token';
export const PFLICHT_ANGEBOT = 'Dieses Angebot umfasst eine beratende Bewertung der Informationssicherheit im vereinbarten Umfang nach der beschriebenen Methodik. Es ist keine Zertifizierung und kein Audit einer akkreditierten Stelle; ein Zertifikat wird nicht ausgestellt.';
export const PFLICHT_BERICHT = 'Die Aussagen gelten nur für den genannten Prüfumfang und Zeitpunkt. Dieses Ergebnis ist keine Zertifizierung und kein Audit einer akkreditierten Stelle.';

export interface Antwort { status: number; data: any; error?: { code: string; message: string } }

export class Api {
  private server!: Server;
  base = '';
  async start() {
    process.env['ISMS_DEV_AUTH'] = '1';
    process.env['ISMS_SYSTEM_TOKEN'] = TOKEN;
    this.server = startServer(0);
    await new Promise((r) => this.server.once('listening', r));
    this.base = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }
  async stop() {
    this.server.close();
    await closePool();
  }
  async call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Antwort> {
    const r = await fetch(this.base + path, { method, headers: { 'content-type': 'application/json', ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const json = (await r.json()) as { data?: unknown; error?: { code: string; message: string } };
    if (process.env['DEBUG_API'] && json.error) console.log(method, path, r.status, json.error.message);
    return { status: r.status, data: json.data, ...(json.error ? { error: json.error } : {}) };
  }
  als(person: string, ai?: string) {
    const h: Record<string, string> = { 'x-person-id': person, ...(ai ? { 'x-actor': 'ai', 'x-ai-mandate': ai } : {}) };
    return {
      post: (p: string, b: unknown = {}) => this.call('POST', p, b, h),
      patch: (p: string, b: unknown) => this.call('PATCH', p, b, h),
      get: (p: string) => this.call('GET', p, undefined, h),
    };
  }
  system(p: string, b: unknown) {
    return this.call('POST', p, b, { 'x-system-token': TOKEN });
  }
  /** Wirft mit Meldung, wenn ein Aufbauschritt scheitert – damit Negativtests nur am geprüften Schritt scheitern */
  async ok(r: Promise<Antwort>): Promise<any> {
    const a = await r;
    if (a.status !== 200) throw new Error(`Aufbau gescheitert (${a.status}): ${a.error?.message}`);
    return a.data;
  }
}

export type Stufe = 'intake' | 'scope' | 'angebot' | 'mandat' | 'aktiv' | 'qa';
const REIHE: Stufe[] = ['intake', 'scope', 'angebot', 'mandat', 'aktiv', 'qa'];

export interface Fall {
  org: string; kunde: string; intake: string; fall: string; o1: string; o2: string;
  scope?: string; angebot?: string; mandat?: string; nachweis?: string; bewertung?: string;
}

/** Baut einen frischen, fiktiven Pilotfall bis zur angegebenen Stufe auf. */
export async function aufbauen(api: Api, bis: Stufe, name = 'Fall'): Promise<Fall> {
  const n = REIHE.indexOf(bis);
  const lead = api.als(LEAD);
  const org = (await api.ok(lead.post('/organizations', { name: `${name} (fiktiv)` }))).id;
  const kunde = (await api.ok(lead.post('/persons', { party: 'customer', organizationId: org, displayName: `Kontakt ${name} (fiktiv)` }))).id;
  const k = api.als(kunde);
  const intake = (await api.ok(k.post('/intakes', { route: 'known_need', goalCode: 'software_product_security', consentGiven: true }))).id;
  await api.ok(k.post(`/intakes/${intake}/facts`, { key: 'purpose', value: 'customer_evidence' }));
  const fall = (await api.ok(lead.post('/cases', { intakeId: intake }))).id;
  const o1 = (await api.ok(lead.post('/objects', { organizationId: org, type: 'organization', name, boundaries: 'Sitz, Konten' }))).id;
  const o2 = (await api.ok(lead.post('/objects', { organizationId: org, type: 'product', name: `App ${name}`, version: '1.0', boundaries: 'Backend, App' }))).id;
  const f: Fall = { org, kunde, intake, fall, o1, o2 };
  if (n < 1) return f;
  f.scope = (await api.ok(lead.post(`/cases/${fall}/scope-versions`, {
    goal: 'Sicherheitsbewertung als Kundennachweis', criteria: 'ISO/IEC 27001 Anhang A (Auswahl)', handlingMode: 'assisted',
    assuranceStatement: 'professionally_reviewed', depthProfile: 2, criteriaVersions: { 'ISO/IEC 27001': '2022' }, objectIds: [o1, o2],
  }))).id;
  await api.ok(lead.post(`/scope-versions/${f.scope}/approve`));
  if (n < 2) return f;
  f.angebot = (await api.ok(lead.post(`/cases/${fall}/offers`, { scopeVersionId: f.scope, customerId: org, engagementType: 'product_security_assessment', depthProfile: 2, plannedStart: '2026-12-01', serviceDescription: `Sicherheitsbewertung. ${PFLICHT_ANGEBOT}` }))).id;
  await api.ok(lead.post(`/offers/${f.angebot}/send`));
  if (n < 3) return f;
  f.mandat = (await api.ok(api.system(`/offers/${f.angebot}/signed`, { eventId: `EV-${fall}` }))).mandateId;
  await api.ok(lead.post(`/mandates/${f.mandat}/team`, { personId: LEAD, roles: ['engagement_lead'] }));
  await api.ok(lead.post(`/mandates/${f.mandat}/team`, { personId: QA, roles: ['independent_reviewer'] }));
  await api.ok(lead.post(`/mandates/${f.mandat}/team`, { personId: CONSULTANT, roles: ['consultant'] }));
  await api.ok(lead.post(`/mandates/${f.mandat}/team`, { personId: kunde, roles: ['executive_sponsor'] }));
  if (n < 4) return f;
  const pd = (await api.ok(lead.post('/profile-decisions', { organizationId: org, recommendedProfile: 2, minProfile: 1, profile: 2 }))).id;
  await api.ok(lead.post(`/mandates/${f.mandat}/activate`, { profileDecisionId: pd }));
  f.nachweis = (await api.ok(k.post(`/mandates/${f.mandat}/evidence`, { source: 'IdP-Export', capturedAt: '2026-11-20', contentBase64: Buffer.from(`Export ${name}: MFA bei 3 von 5 Admin-Konten`).toString('base64') }))).id;
  await api.ok(lead.post(`/evidence/${f.nachweis}/review`, { state: 'suitable' }));
  f.bewertung = (await api.ok(lead.post(`/mandates/${f.mandat}/control-assessments`, { controlId: 'A.8.5', objectId: o2, baseDepth: 2, requiredDepth: 2, implementation: 'partial' }))).id;
  await api.ok(lead.post('/evidence-links', { evidenceId: f.nachweis, controlAssessmentId: f.bewertung, scopeVersionId: f.scope }));
  await api.ok(lead.patch(`/control-assessments/${f.bewertung}`, { evidenceState: 'sufficient', approval: 'approved' }));
  if (n < 5) return f;
  for (const st of ['collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review', 'qa']) await api.ok(lead.post(`/cases/${fall}/status`, { status: st }));
  return f;
}
