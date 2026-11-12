/**
 * Responsibility Model, Vier-Augen-Prinzip, Rollentrennung und
 * Unabhängigkeit (Fachkonzept §14, §18, §20–§22).
 */
import { PROFILE_PARAMETERS } from '../proportionality/parameters.js';
import type { AssuranceProfile } from '../proportionality/profile.js';
import {
  CONSULTING_ENGAGEMENT_TYPES,
  AGENCY_DELIVERY_ROLES,
  hasRole,
  memberOf,
  type Assignment,
  type Mandate,
  type SegregationException,
  type Violation,
  type WorkObjectRef,
} from './model.js';

export function fourEyesRequired(profile: AssuranceProfile, object: WorkObjectRef): boolean {
  const scopes = PROFILE_PARAMETERS[profile].fourEyesRequiredFor;
  switch (object.type) {
    case 'finding':
      return scopes.includes('findings') || (!!object.critical && scopes.includes('critical_findings'));
    case 'risk':
      return scopes.includes('risk_acceptance') || !!object.critical;
    case 'evidence_review':
      return scopes.includes('evidence_reviews');
    case 'report':
    case 'deliverable':
      return scopes.includes('final_report');
    default:
      return !!object.critical;
  }
}

/** Darf diese Person eine kritische Bewertung bestätigen? (§12: "durch Senior / Reviewer bestätigt") */
export function canConfirmCritical(mandate: Mandate, personId: string, object: WorkObjectRef): boolean {
  if (hasRole(mandate, personId, 'engagement_lead') || hasRole(mandate, personId, 'independent_reviewer')) return true;
  const m = memberOf(mandate, personId);
  return !!object.smeDomain && !!m?.roles.includes('subject_matter_expert') && !!m.smeDomains?.includes(object.smeDomain);
}

/** Gültig nur mit Begründung, kompensierender Maßnahme und Review durch Senior (≠ betroffene Person). */
export function isValidSegregationException(mandate: Mandate, e: SegregationException): boolean {
  return (
    e.mandateId === mandate.id &&
    e.reason.trim().length > 0 &&
    e.compensatingControl.trim().length > 0 &&
    e.reviewedBy !== e.personId &&
    (hasRole(mandate, e.reviewedBy, 'engagement_lead') || hasRole(mandate, e.reviewedBy, 'independent_reviewer'))
  );
}

function hasException(exceptions: SegregationException[], mandate: Mandate, personId: string, objectId: string): boolean {
  return exceptions.some(
    (e) =>
      e.personId === personId &&
      (e.objectId === undefined || e.objectId === objectId) &&
      isValidSegregationException(mandate, e),
  );
}

export function validateAssignments(
  mandate: Mandate,
  object: WorkObjectRef,
  assignments: Assignment[],
  exceptions: SegregationException[] = [],
): Violation[] {
  const v: Violation[] = [];
  const who = (r: Assignment['responsibility']) => assignments.filter((a) => a.responsibility === r).map((a) => a.personId);
  const owners = who('owner');
  const assignees = who('assignee');
  const reviewers = who('reviewer');
  const approvers = who('approver');
  const contributors = who('contributor');

  // G1 – genau ein Owner
  if (owners.length !== 1) {
    v.push({ rule: 'G1', severity: 'error', message: `${object.type} ${object.id} benötigt genau einen Owner (gefunden: ${owners.length}).` });
  }

  // G2 – nur Mitglieder des Mandatsteams
  for (const a of assignments) {
    if (!memberOf(mandate, a.personId)) {
      v.push({ rule: 'G2', severity: 'error', personId: a.personId, message: `${a.personId} ist nicht Teil des Mandatsteams.` });
    }
  }

  // G3 – Vier-Augen-Prinzip (mit SoD-Ausnahme nach §18)
  if (fourEyesRequired(mandate.assuranceProfile, object)) {
    const doers = new Set(assignees.length ? assignees : owners);
    const checkers = [...reviewers, ...approvers];
    const independentChecker = checkers.some((c) => !doers.has(c));
    if (!independentChecker) {
      const covered = checkers.length > 0 && [...doers].every((d) => hasException(exceptions, mandate, d, object.id));
      if (covered) {
        v.push({ rule: 'G3', severity: 'warning', message: `Vier-Augen-Prinzip für ${object.id} durch dokumentierte SoD-Ausnahme mit kompensierender Maßnahme ersetzt.` });
      } else {
        v.push({ rule: 'G3', severity: 'error', message: `${object.type} ${object.id} erfordert Prüfung durch eine zweite Person (Reviewer/Approver ≠ Bearbeiter).` });
      }
    }
  }

  // G4 – Kritische Bewertungen von Junior Consultants werden durch Senior/Reviewer bestätigt
  if (object.critical && assignees.some((a) => hasRole(mandate, a, 'junior_consultant'))) {
    if (!reviewers.concat(approvers).some((r) => canConfirmCritical(mandate, r, object))) {
      v.push({ rule: 'G4', severity: 'error', message: `Kritische Bewertung ${object.id} eines Junior Consultants benötigt Review durch Engagement Lead, Independent Reviewer oder zuständigen SME.` });
    }
  }

  // G5 – Finale Deliverables: Freigabe durch Engagement Lead, ggf. Independent Review
  if (object.type === 'report' || object.type === 'deliverable') {
    if (!approvers.some((a) => hasRole(mandate, a, 'engagement_lead'))) {
      v.push({ rule: 'G5', severity: 'error', message: `Finale Deliverables werden durch den Engagement Lead freigegeben.` });
    }
    if (PROFILE_PARAMETERS[mandate.assuranceProfile].independentReviewRequired &&
        !reviewers.some((r) => hasRole(mandate, r, 'independent_reviewer'))) {
      v.push({ rule: 'G5', severity: 'error', message: `Profil ${mandate.assuranceProfile} erfordert Review des Berichts durch Independent Reviewer / QA.` });
    }
  }

  // G6 – Independent Reviewer arbeitet nicht am geprüften Objekt mit
  for (const p of [...assignees, ...contributors]) {
    if (hasRole(mandate, p, 'independent_reviewer')) {
      v.push({ rule: 'G6', severity: 'error', personId: p, message: `Independent Reviewer ${p} darf nicht an ${object.id} mitarbeiten.` });
    }
  }

  return v;
}

// ---------------------------------------------------------------------------
// Unabhängigkeit bei Audits (§14: "Bei Audits ist die notwendige Unabhängigkeit ausdrücklich zu berücksichtigen")
// ---------------------------------------------------------------------------

const monthsBetween = (from: string, to: string): number => {
  const a = new Date(from);
  const b = new Date(to);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
};

export const AUDIT_COOLING_OFF_MONTHS = 24;

/**
 * Prüft, ob Personen eines Audit-Mandats in den letzten `coolingOffMonths`
 * beim selben Kunden beraten oder umgesetzt haben (keine Prüfung eigener Arbeit).
 */
export function checkAuditIndependence(
  audit: Mandate,
  history: Mandate[],
  coolingOffMonths: number = AUDIT_COOLING_OFF_MONTHS,
): Violation[] {
  if (audit.engagementType !== 'internal_audit') return [];
  const v: Violation[] = [];
  const auditors = audit.team.filter((t) => t.party === 'agency');
  for (const prior of history) {
    if (prior.id === audit.id || prior.customerId !== audit.customerId) continue;
    if (!CONSULTING_ENGAGEMENT_TYPES.includes(prior.engagementType)) continue;
    const priorEnd = prior.endDate ?? audit.startDate;
    if (monthsBetween(priorEnd, audit.startDate) >= coolingOffMonths) continue;
    for (const a of auditors) {
      const involvement = memberOf(prior, a.personId);
      if (involvement?.roles.some((r) => (AGENCY_DELIVERY_ROLES as readonly string[]).includes(r) || r === 'subject_matter_expert')) {
        v.push({
          rule: 'I1',
          severity: 'error',
          personId: a.personId,
          message: `${a.personId} war in Mandat ${prior.id} (${prior.engagementType}) beim selben Kunden beratend tätig – Abstand < ${coolingOffMonths} Monate.`,
        });
      }
    }
  }
  return v;
}
