/**
 * Quality Gate für Feststellungen (Findings) – Fachkonzept §22, ENT-027 (Option A, freigegeben 2026-11-12).
 *
 * Dieselben Stufen wie die Entscheidungsseite:
 *   open (offen) → proposed (vorgeschlagen) → approved (freigegeben) → filed (abgelegt) | rejected (verworfen)
 * Getrennt davon die Kundenreaktion nach der Ablage:
 *   pending (offen) → discussed (besprochen) → accepted (akzeptiert) | disputed (bestritten)
 *
 * KI darf Entwürfe erzeugen, aber keinen Statuswechsel auslösen.
 */
import { canConfirmCritical, fourEyesRequired } from './governance.js';
import { hasRole, memberOf, type Mandate, type SmeDomain, type WorkObjectRef } from './model.js';

export type FindingStatus = 'open' | 'proposed' | 'approved' | 'filed' | 'rejected';
export type CustomerResponse = 'pending' | 'discussed' | 'accepted' | 'disputed';

/** Bezeichnungen wie auf der Entscheidungsseite (vorschriften.md §A17). */
export const FINDING_STATUS_DE: Record<FindingStatus, string> = {
  open: 'offen',
  proposed: 'vorgeschlagen',
  approved: 'freigegeben',
  filed: 'abgelegt',
  rejected: 'verworfen',
};
export const CUSTOMER_RESPONSE_DE: Record<CustomerResponse, string> = {
  pending: 'offen',
  discussed: 'besprochen',
  accepted: 'akzeptiert',
  disputed: 'bestritten',
};

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export const SEVERITY_DE: Record<Severity, string> = { low: 'gering', medium: 'mittel', high: 'hoch', critical: 'kritisch' };

export interface Finding {
  id: string;
  mandateId: string;
  status: FindingStatus;
  customerResponse: CustomerResponse;
  severity: Severity;
  authorId: string;
  aiAssisted: boolean;
  smeDomain?: SmeDomain;
}

export type Actor = { kind: 'human'; personId: string } | { kind: 'ai'; system: string };

export type FindingAction =
  | 'submit'
  | 'return'
  | 'approve'
  | 'file'
  | 'reject'
  | 'discuss'
  | 'accept'
  | 'dispute'
  | 'rereview';

type Zustand = Pick<Finding, 'status' | 'customerResponse'>;

const TRANSITIONS: Record<FindingAction, { from: (z: Zustand) => boolean; to: (z: Zustand) => Zustand }> = {
  submit: { from: (z) => z.status === 'open', to: (z) => ({ ...z, status: 'proposed' }) },
  return: { from: (z) => z.status === 'proposed', to: (z) => ({ ...z, status: 'open' }) },
  approve: { from: (z) => z.status === 'proposed', to: (z) => ({ ...z, status: 'approved' }) },
  file: { from: (z) => z.status === 'approved', to: (z) => ({ ...z, status: 'filed' }) },
  reject: { from: (z) => z.status === 'open' || z.status === 'proposed' || z.status === 'approved', to: (z) => ({ ...z, status: 'rejected' }) },
  discuss: { from: (z) => z.status === 'filed' && z.customerResponse === 'pending', to: (z) => ({ ...z, customerResponse: 'discussed' }) },
  accept: { from: (z) => z.status === 'filed' && z.customerResponse === 'discussed', to: (z) => ({ ...z, customerResponse: 'accepted' }) },
  dispute: { from: (z) => z.status === 'filed' && z.customerResponse === 'discussed', to: (z) => ({ ...z, customerResponse: 'disputed' }) },
  rereview: { from: (z) => z.status === 'filed' && z.customerResponse === 'disputed', to: () => ({ status: 'proposed', customerResponse: 'pending' }) },
};

export const isCritical = (f: Pick<Finding, 'severity'>): boolean => f.severity === 'high' || f.severity === 'critical';

/** Kunden sehen Feststellungen erst nach Freigabe, Ablage und Besprechung. */
export const visibleToCustomer = (f: Zustand): boolean => f.status === 'filed' && f.customerResponse !== 'pending';

export function transitionFinding(
  mandate: Mandate,
  finding: Finding,
  action: FindingAction,
  actor: Actor,
): { ok: true; state: Zustand } | { ok: false; error: string } {
  const t = TRANSITIONS[action];
  if (!t.from(finding)) {
    return { ok: false, error: `Aktion '${action}' ist bei ${FINDING_STATUS_DE[finding.status]} / Kundenreaktion ${CUSTOMER_RESPONSE_DE[finding.customerResponse]} nicht zulässig.` };
  }
  if (actor.kind === 'ai') {
    return { ok: false, error: 'KI-Assistenz darf Entwürfe erstellen, aber keinen Statuswechsel auslösen.' };
  }
  const p = actor.personId;
  const member = memberOf(mandate, p);
  if (!member) return { ok: false, error: `${p} ist nicht Teil des Mandatsteams.` };
  const is = (...roles: Parameters<typeof hasRole>[2][]) => roles.some((r) => hasRole(mandate, p, r));
  const ref: WorkObjectRef = {
    type: 'finding',
    id: finding.id,
    critical: isCritical(finding),
    ...(finding.smeDomain ? { smeDomain: finding.smeDomain } : {}),
  };

  switch (action) {
    case 'submit':
      if (member.party !== 'agency') return { ok: false, error: 'Nur das Beratungsteam schlägt Feststellungen vor.' };
      break;
    case 'return':
    case 'approve': {
      if (is('junior_consultant') && !is('engagement_lead', 'independent_reviewer')) {
        return { ok: false, error: 'Junior Consultants bereiten Bewertungen vor, geben sie aber nicht frei.' };
      }
      if (action === 'approve') {
        if (fourEyesRequired(mandate.depthProfile, ref) && p === finding.authorId) {
          return { ok: false, error: 'Vier-Augen-Prinzip: Wer die Feststellung verfasst hat, gibt sie nicht frei.' };
        }
        if (ref.critical && !canConfirmCritical(mandate, p, ref)) {
          return { ok: false, error: 'Kritische Feststellungen geben nur Engagement Lead, Independent Reviewer oder der SME der Domäne frei.' };
        }
        if (!ref.critical && !is('engagement_lead', 'independent_reviewer', 'consultant', 'subject_matter_expert')) {
          return { ok: false, error: 'Freigabe erfordert eine Beraterrolle.' };
        }
      }
      break;
    }
    case 'file':
    case 'discuss':
      if (!is('engagement_lead', 'consultant')) return { ok: false, error: `'${action}' durch Engagement Lead oder Consultant.` };
      break;
    case 'accept':
    case 'dispute':
      if (!is('engagement_lead', 'consultant', 'executive_sponsor', 'isms_manager', 'primary_contact')) {
        return { ok: false, error: 'Die Kundenreaktion erfassen Kundenverantwortliche oder das Beratungsteam.' };
      }
      break;
    case 'reject':
    case 'rereview':
      if (!is('engagement_lead')) return { ok: false, error: `'${action}' ist dem Engagement Lead vorbehalten.` };
      break;
  }
  return { ok: true, state: t.to({ status: finding.status, customerResponse: finding.customerResponse }) };
}
