/**
 * Quality Gate Model für Findings (Fachkonzept §22).
 *
 *   Junior Consultant (Interview / Initial Assessment)
 *     → AI Assistance → Draft Finding → Senior Review
 *     → Confirmed Finding → Customer Discussion
 *
 * KI darf Entwürfe erzeugen, aber keinen Statuswechsel auslösen:
 * fachliche Verantwortung wird nicht an KI delegiert.
 */
import { canConfirmCritical, fourEyesRequired } from './governance.js';
import { hasRole, memberOf, type Mandate, type SmeDomain, type WorkObjectRef } from './model.js';

export type FindingStatus =
  | 'draft'
  | 'in_review'
  | 'confirmed'
  | 'customer_discussion'
  | 'accepted'
  | 'disputed'
  | 'withdrawn';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Finding {
  id: string;
  mandateId: string;
  status: FindingStatus;
  severity: Severity;
  authorId: string;
  aiAssisted: boolean;
  smeDomain?: SmeDomain;
}

export type Actor = { kind: 'human'; personId: string } | { kind: 'ai'; system: string };

export type FindingAction = 'submit' | 'return' | 'confirm' | 'present' | 'accept' | 'dispute' | 'rereview' | 'withdraw';

const TRANSITIONS: Record<FindingAction, { from: FindingStatus[]; to: FindingStatus }> = {
  submit: { from: ['draft'], to: 'in_review' },
  return: { from: ['in_review'], to: 'draft' },
  confirm: { from: ['in_review'], to: 'confirmed' },
  present: { from: ['confirmed'], to: 'customer_discussion' },
  accept: { from: ['customer_discussion'], to: 'accepted' },
  dispute: { from: ['customer_discussion'], to: 'disputed' },
  rereview: { from: ['disputed'], to: 'in_review' },
  withdraw: { from: ['draft', 'in_review', 'confirmed', 'disputed'], to: 'withdrawn' },
};

export const isCritical = (f: Finding): boolean => f.severity === 'high' || f.severity === 'critical';

/** Kunden sehen Findings erst nach bestandenem Quality Gate und Vorstellung. */
export const visibleToCustomer = (status: FindingStatus): boolean =>
  status === 'customer_discussion' || status === 'accepted' || status === 'disputed';

export function transitionFinding(
  mandate: Mandate,
  finding: Finding,
  action: FindingAction,
  actor: Actor,
): { ok: true; status: FindingStatus } | { ok: false; error: string } {
  const t = TRANSITIONS[action];
  if (!t.from.includes(finding.status)) {
    return { ok: false, error: `Aktion '${action}' ist im Status '${finding.status}' nicht zulässig.` };
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
      if (member.party !== 'agency') return { ok: false, error: 'Nur das Beratungsteam reicht Findings zur Prüfung ein.' };
      break;
    case 'return':
    case 'confirm': {
      if (is('junior_consultant') && !is('engagement_lead', 'independent_reviewer')) {
        return { ok: false, error: 'Junior Consultants bereiten Bewertungen vor, bestätigen sie aber nicht.' };
      }
      if (action === 'confirm') {
        if (fourEyesRequired(mandate.assuranceProfile, ref) && p === finding.authorId) {
          return { ok: false, error: 'Vier-Augen-Prinzip: Autor darf das eigene Finding nicht bestätigen.' };
        }
        if (ref.critical && !canConfirmCritical(mandate, p, ref)) {
          return { ok: false, error: 'Kritische Findings werden durch Engagement Lead, Independent Reviewer oder zuständigen SME bestätigt.' };
        }
        if (!ref.critical && !is('engagement_lead', 'independent_reviewer', 'consultant', 'subject_matter_expert')) {
          return { ok: false, error: 'Bestätigung erfordert eine Beraterrolle.' };
        }
      }
      break;
    }
    case 'present':
      if (!is('engagement_lead', 'consultant')) return { ok: false, error: 'Vorstellung beim Kunden durch Engagement Lead oder Consultant.' };
      break;
    case 'accept':
    case 'dispute':
      if (!is('engagement_lead', 'consultant', 'executive_sponsor', 'isms_manager', 'primary_contact')) {
        return { ok: false, error: 'Kundenentscheidung wird durch Kundenverantwortliche oder das Beratungsteam erfasst.' };
      }
      break;
    case 'rereview':
    case 'withdraw':
      if (!is('engagement_lead')) return { ok: false, error: `'${action}' ist dem Engagement Lead vorbehalten.` };
      break;
  }
  return { ok: true, status: t.to };
}
