/**
 * Mandats- und Prüfvorgangsstatus – ENT-036 (Option 1, freigegeben 2026-11-12),
 * Fachkonzept 02 §4.2/§4.3. Gleiche Regeln wie db/migrations/0005.
 */

export const MANDATE_STATUS = ['draft', 'offered', 'signed', 'active', 'closed', 'rejected', 'expired', 'terminated'] as const;
export type MandateStatus = (typeof MANDATE_STATUS)[number];

export const MANDATE_STATUS_DE: Record<MandateStatus, string> = {
  draft: 'Entwurf (kein Mandat)',
  offered: 'angeboten',
  signed: 'unterschrieben',
  active: 'aktiv',
  closed: 'abgeschlossen',
  rejected: 'abgelehnt',
  expired: 'Angebot abgelaufen',
  terminated: 'beendet',
};

const MANDATE_TRANSITIONS: Record<MandateStatus, readonly MandateStatus[]> = {
  draft: ['offered'],
  offered: ['draft', 'signed', 'rejected', 'expired'],
  signed: ['active', 'terminated'],
  active: ['closed', 'terminated'],
  closed: [],
  rejected: [],
  expired: [],
  terminated: [],
};

export function mandateTransition(
  from: MandateStatus,
  to: MandateStatus,
  ctx: { profileDecided: boolean },
): { ok: true } | { ok: false; error: string } {
  if (!MANDATE_TRANSITIONS[from].includes(to)) {
    return { ok: false, error: `Mandatsstatus ${MANDATE_STATUS_DE[from]} → ${MANDATE_STATUS_DE[to]} nicht zulässig.` };
  }
  if ((to === 'active' || to === 'closed') && !ctx.profileDecided) {
    return { ok: false, error: 'Ein Mandat wird erst aktiv, wenn das Prüftiefenprofil entschieden ist.' };
  }
  return { ok: true };
}

/** Vertrauliche Nachweise erst bei aktivem Mandat (02 §4.2, DEC-08). */
export const canReceiveEvidence = (status: MandateStatus): boolean => status === 'active';

export const CASE_STATUS = [
  'intake', 'scope_draft', 'scope_approved', 'collecting_evidence', 'ready_for_assessment', 'assessing',
  'internal_review', 'qa', 'approved', 'published', 'closed',
  'on_hold', 'waiting_customer', 'blocked_material_unknown', 'rework', 'cancelled', 'closed_with_limitations',
] as const;
export type CaseStatus = (typeof CASE_STATUS)[number];

const BRAUCHT_AKTIVES_MANDAT: readonly CaseStatus[] = [
  'collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review', 'qa', 'approved', 'published',
];

export function checkCase(c: { status: CaseStatus; mandateStatus?: MandateStatus; limitations?: string }): string[] {
  const e: string[] = [];
  if (BRAUCHT_AKTIVES_MANDAT.includes(c.status) && c.mandateStatus !== 'active') {
    e.push(`Prüfvorgang im Status ${c.status} braucht ein aktives Mandat.`);
  }
  if (c.status === 'closed_with_limitations' && !c.limitations?.trim()) {
    e.push('„Abgeschlossen mit Einschränkungen“ ist kein positives Urteil – die Grenzen müssen benannt sein.');
  }
  return e;
}
