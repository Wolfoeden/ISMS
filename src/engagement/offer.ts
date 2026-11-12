/**
 * Angebot, Mandatsanlage und Storno (MVP WP-05; Fachkonzept 02 §4.2, §8; Backlog 04 TC-07, TC-08,
 * TC-19, TC-20, TC-22; DEC-10, DEC-14; ENT-036).
 *
 *  - Ein Angebot bezieht sich auf eine freigegebene Scope-Version und ist nach dem Versand unveränderlich.
 *  - Frist: Standard P21D (DEC-10, Platzhalter, konfigurierbar). Abgelaufen → kein Mandat (TC-07).
 *  - Änderungswunsch → neue Scope- und Angebotsversion; das alte Angebot wird ersetzt, nie still
 *    in ein Mandat verwandelt (TC-08, DEC-14).
 *  - Unterschrift → genau ein Mandat je Angebot, auch bei mehrfach zugestellter Nachricht (TC-20).
 *  - Leistungsabgrenzung: jedes Angebot enthält den Pflichtbaustein „keine Zertifizierung“ (TC-22,
 *    vorschriften.md §A17.3); Zertifikatswunsch des Kunden wird ausdrücklich beantwortet.
 *  - Storno eines aktiven Mandats nur mit dokumentierter Daten- und Vertragsentscheidung (TC-19).
 */

export const DEFAULT_OFFER_VALIDITY_DAYS = 21;

/** Pflichtbaustein Leistungsabgrenzung (vorschriften.md §A17.3) */
export const LEISTUNGSABGRENZUNG =
  'Dieses Angebot umfasst eine beratende Bewertung der Informationssicherheit im vereinbarten Umfang nach der beschriebenen Methodik. Es ist keine Zertifizierung und kein Audit einer akkreditierten Stelle; ein Zertifikat wird nicht ausgestellt.';

/** Zusatzbaustein, wenn der Kunde ein Zertifikat wünscht */
export const ZERTIFIKATSWUNSCH =
  'Ein Zertifikat, etwa nach ISO/IEC 27001, kann nur eine dafür akkreditierte Zertifizierungsstelle in einem eigenen Verfahren erteilen. Unser Ergebnis kann der Vorbereitung darauf dienen, ersetzt es aber nicht.';

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'superseded';

export interface Offer {
  id: string;
  caseId: string;
  version: number;
  scopeVersionId: string;
  scopeApproved: boolean;
  status: OfferStatus;
  serviceDescription: string;
  customerWantsCertificate: boolean;
  sentAt?: string;
  validUntil?: string;
}

const addDays = (iso: string, d: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);

export function checkOfferText(o: Pick<Offer, 'serviceDescription' | 'customerWantsCertificate'>): string[] {
  const e: string[] = [];
  if (!o.serviceDescription.includes(LEISTUNGSABGRENZUNG)) e.push('Pflichtbaustein Leistungsabgrenzung fehlt (keine Zertifizierung)');
  if (o.customerWantsCertificate && !o.serviceDescription.includes(ZERTIFIKATSWUNSCH)) {
    e.push('Zertifikatswunsch des Kunden nicht beantwortet (Beratungs-Assessment ≠ akkreditierte Zertifizierung)');
  }
  return e;
}

export function sendOffer(o: Offer, today: string, validityDays = DEFAULT_OFFER_VALIDITY_DAYS): { ok: true; offer: Offer } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (o.status !== 'draft') errors.push('Nur Entwürfe können versandt werden');
  if (!o.scopeApproved) errors.push('Angebot nur auf Grundlage einer freigegebenen Scope-Version');
  errors.push(...checkOfferText(o));
  if (errors.length) return { ok: false, errors };
  return { ok: true, offer: { ...o, status: 'sent', sentAt: today, validUntil: addDays(today, validityDays) } };
}

/** TC-07: Frist abgelaufen → expired, kein Mandat */
export function expireOffer(o: Offer, today: string): Offer {
  return o.status === 'sent' && o.validUntil !== undefined && today > o.validUntil ? { ...o, status: 'expired' } : o;
}

/** TC-08: Änderungswunsch → altes Angebot ersetzt, neuer Entwurf auf neuer (noch nicht freigegebener) Scope-Version */
export function requestChange(o: Offer, newScopeVersionId: string, newOfferId: string): { old: Offer; draft: Offer } {
  if (o.status !== 'sent' && o.status !== 'draft') throw new Error(`Änderung bei Angebotsstatus ${o.status} nicht möglich`);
  return {
    old: { ...o, status: 'superseded' },
    draft: {
      id: newOfferId, caseId: o.caseId, version: o.version + 1, scopeVersionId: newScopeVersionId, scopeApproved: false,
      status: 'draft', serviceDescription: o.serviceDescription, customerWantsCertificate: o.customerWantsCertificate,
    },
  };
}

// ---------------------------------------------------------------------------
// Mandatsanlage aus der Unterschrift – idempotent (TC-20)
// ---------------------------------------------------------------------------

export interface MandateRecord {
  id: string;
  offerId: string;
  status: 'signed';
}

export interface SigningLedger {
  processedEvents: Map<string, string>; // eventId → mandateId
  mandatesByOffer: Map<string, MandateRecord>;
}

export const emptyLedger = (): SigningLedger => ({ processedEvents: new Map(), mandatesByOffer: new Map() });

export function handleSignedMandate(
  ledger: SigningLedger,
  event: { eventId: string; offerId: string },
  offer: Offer,
  today: string,
  newId: () => string,
): { ok: true; mandate: MandateRecord; offer: Offer; duplicate: boolean } | { ok: false; error: string } {
  const bekannt = ledger.processedEvents.get(event.eventId) ?? ledger.mandatesByOffer.get(event.offerId)?.id;
  if (bekannt) {
    const m = [...ledger.mandatesByOffer.values()].find((x) => x.id === bekannt)!;
    ledger.processedEvents.set(event.eventId, m.id);
    return { ok: true, mandate: m, offer, duplicate: true };
  }
  const aktuell = expireOffer(offer, today);
  if (aktuell.status !== 'sent') return { ok: false, error: `Angebot ist ${aktuell.status} – kein Mandat` };
  const mandate: MandateRecord = { id: newId(), offerId: offer.id, status: 'signed' };
  ledger.mandatesByOffer.set(offer.id, mandate);
  ledger.processedEvents.set(event.eventId, mandate.id);
  return { ok: true, mandate, offer: { ...aktuell, status: 'accepted' }, duplicate: false };
}

// ---------------------------------------------------------------------------
// Storno (TC-19)
// ---------------------------------------------------------------------------

export interface TerminationDecision {
  reason: string;
  dataDecision: 'delete' | 'retain';
  /** Pflicht bei retain: bis wann und warum (Aufbewahrungspflicht) */
  retainUntil?: string;
  retentionBasis?: string;
  contractDecision: string;
  decidedBy: { party: 'agency' | 'customer'; personId: string };
}

export function checkTermination(d: TerminationDecision): string[] {
  const e: string[] = [];
  if (!d.reason.trim()) e.push('Storno ohne Grund');
  if (!d.contractDecision.trim()) e.push('Vertragsentscheidung fehlt (Abrechnung erbrachter Leistungen, Fristen)');
  if (d.dataDecision === 'retain' && (!d.retainUntil || !d.retentionBasis?.trim())) e.push('Aufbewahrung ohne Frist und Grundlage');
  if (d.decidedBy.party !== 'agency') e.push('Storno-Entscheidung dokumentiert DT Agency (Engagement Lead)');
  return e;
}
