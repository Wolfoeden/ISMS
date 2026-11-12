import { describe, expect, it } from 'vitest';
import {
  checkTermination, emptyLedger, expireOffer, handleSignedMandate, LEISTUNGSABGRENZUNG, requestChange, sendOffer, ZERTIFIKATSWUNSCH, type Offer,
} from '../src/engagement/offer.js';
import { pruefeFormulierungen } from '../src/werkzeuge/ergebnis.js';

const entwurf = (o: Partial<Offer> = {}): Offer => ({
  id: 'OF-1', caseId: 'C-1', version: 1, scopeVersionId: 'SV-1', scopeApproved: true, status: 'draft',
  serviceDescription: `Sicherheitsbewertung Produkt X (Version 2.3), Modus Assisted. ${LEISTUNGSABGRENZUNG}`,
  customerWantsCertificate: false, ...o,
});
const versandt = () => {
  const r = sendOffer(entwurf(), '2026-11-12');
  if (!r.ok) throw new Error(r.errors.join());
  return r.offer;
};

describe('Angebot und Mandatsanlage (WP-05)', () => {
  it('Versand nur mit freigegebenem Scope und Leistungsabgrenzung; Frist 21 Tage (DEC-10)', () => {
    expect(sendOffer(entwurf({ scopeApproved: false }), '2026-11-12')).toMatchObject({ ok: false });
    expect(sendOffer(entwurf({ serviceDescription: 'Sicherheitsbewertung' }), '2026-11-12')).toMatchObject({ ok: false, errors: [expect.stringMatching(/Leistungsabgrenzung/)] });
    expect(versandt()).toMatchObject({ status: 'sent', validUntil: '2026-12-03' });
  });

  it('TC-22 · Zertifikatswunsch: Angebot grenzt Beratungs-Assessment von akkreditierter Zertifizierung ab', () => {
    const o = entwurf({ customerWantsCertificate: true });
    expect(sendOffer(o, '2026-11-12')).toMatchObject({ ok: false, errors: [expect.stringMatching(/Zertifikatswunsch/)] });
    const mit = entwurf({ customerWantsCertificate: true, serviceDescription: `${o.serviceDescription} ${ZERTIFIKATSWUNSCH}` });
    expect(sendOffer(mit, '2026-11-12').ok).toBe(true);
    expect(pruefeFormulierungen(mit.serviceDescription, 'angebot', false).filter((b) => b.schwere === 'fehler')).toEqual([]);
  });

  it('TC-07 · Frist abgelaufen: Angebot expired, kein Mandat', () => {
    const o = versandt();
    expect(expireOffer(o, '2026-12-03').status).toBe('sent');
    expect(expireOffer(o, '2026-12-04').status).toBe('expired');
    const r = handleSignedMandate(emptyLedger(), { eventId: 'EV-1', offerId: o.id }, o, '2026-12-10', () => 'M-1');
    expect(r).toMatchObject({ ok: false, error: expect.stringMatching(/expired/) });
  });

  it('TC-08 · Änderungswunsch: neue Scope- und Angebotsversion, kein Mandat', () => {
    const { old, draft } = requestChange(versandt(), 'SV-2', 'OF-2');
    expect(old.status).toBe('superseded');
    expect(draft).toMatchObject({ version: 2, scopeVersionId: 'SV-2', scopeApproved: false, status: 'draft' });
    expect(sendOffer(draft, '2026-11-20').ok).toBe(false);
    expect(handleSignedMandate(emptyLedger(), { eventId: 'EV-9', offerId: old.id }, old, '2026-11-20', () => 'M-9').ok).toBe(false);
  });

  it('TC-20 · doppelt zugestellte Unterschrift: genau ein Mandat', () => {
    const ledger = emptyLedger();
    const o = versandt();
    let n = 0;
    const id = () => `M-${++n}`;
    const a = handleSignedMandate(ledger, { eventId: 'EV-1', offerId: o.id }, o, '2026-11-20', id);
    const b = handleSignedMandate(ledger, { eventId: 'EV-1', offerId: o.id }, o, '2026-11-20', id);
    const c = handleSignedMandate(ledger, { eventId: 'EV-2', offerId: o.id }, o, '2026-11-21', id);
    expect(a).toMatchObject({ ok: true, duplicate: false, mandate: { id: 'M-1' }, offer: { status: 'accepted' } });
    expect(b).toMatchObject({ ok: true, duplicate: true, mandate: { id: 'M-1' } });
    expect(c).toMatchObject({ ok: true, duplicate: true, mandate: { id: 'M-1' } });
    expect(ledger.mandatesByOffer.size).toBe(1);
  });

  it('TC-19 · Storno nur mit Daten- und Vertragsentscheidung', () => {
    const basis = { reason: 'Kunde widerruft Auftrag', contractDecision: 'erbrachte Leistungen bis 20.11. abrechnen', decidedBy: { party: 'agency' as const, personId: 'P-LEAD' } };
    expect(checkTermination({ ...basis, dataDecision: 'delete' })).toEqual([]);
    expect(checkTermination({ ...basis, dataDecision: 'retain' })).toEqual([expect.stringMatching(/Aufbewahrung/)]);
    expect(checkTermination({ ...basis, dataDecision: 'delete', contractDecision: '' })).toEqual([expect.stringMatching(/Vertrag/)]);
  });
});
