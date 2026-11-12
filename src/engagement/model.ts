/**
 * Engagement / Mandate – Kernmodell (Fachkonzept §10–§21).
 */
import type { CustomerRole, SmeDomain } from '../proportionality/parameters.js';
import type { DepthProfile } from '../proportionality/profile.js';

export type { CustomerRole, SmeDomain };

export type Party = 'agency' | 'customer';

export type AgencyRole =
  | 'engagement_lead'
  | 'consultant'
  | 'junior_consultant'
  | 'subject_matter_expert'
  | 'independent_reviewer'
  | 'engagement_coordinator';

export type EngagementRole = AgencyRole | CustomerRole;

/** Rollen, die Leistungen im Mandat erbringen (und daher nicht unabhängig prüfen). */
export const AGENCY_DELIVERY_ROLES: readonly AgencyRole[] = [
  'engagement_lead',
  'consultant',
  'junior_consultant',
  'engagement_coordinator',
];

export type EngagementType =
  | 'security_assessment'
  | 'iso27001_readiness'
  | 'iso27001_implementation'
  | 'nis2_readiness'
  | 'third_party_assessment'
  | 'internal_audit'
  | 'continuous_operation';

/** Mandatstypen mit Beratungs-/Umsetzungsanteil – relevant für Auditunabhängigkeit. */
export const CONSULTING_ENGAGEMENT_TYPES: readonly EngagementType[] = [
  'iso27001_readiness',
  'iso27001_implementation',
  'nis2_readiness',
  'continuous_operation',
];

export interface TeamMember {
  personId: string;
  party: Party;
  /** Eine Person kann mehrere Rollen halten (Multi-Role Support, §18). */
  roles: EngagementRole[];
  smeDomains?: SmeDomain[];
}

export interface Mandate {
  id: string;
  customerId: string;
  scope: string;
  engagementType: EngagementType;
  depthProfile: DepthProfile;
  /** ISO-Datum YYYY-MM-DD */
  startDate: string;
  endDate?: string;
  team: TeamMember[];
  templateId?: string;
}

export type ResponsibilityType = 'owner' | 'assignee' | 'reviewer' | 'approver' | 'contributor';

export type WorkObjectType =
  | 'assessment'
  | 'assessment_section'
  | 'finding'
  | 'risk'
  | 'measure'
  | 'evidence_review'
  | 'report'
  | 'deliverable';

export interface WorkObjectRef {
  type: WorkObjectType;
  id: string;
  /** Kritische Bewertung (z. B. Finding mit Schwere high/critical, Risk Conclusion). */
  critical?: boolean;
  smeDomain?: SmeDomain;
}

export interface Assignment {
  personId: string;
  responsibility: ResponsibilityType;
}

/**
 * Segregation not feasible → Reason documented → Compensating Control → Senior Review (§18).
 */
export interface SegregationException {
  id: string;
  mandateId: string;
  personId: string;
  /** Leer = gilt mandatsweit für diese Person und diesen Konflikt. */
  objectId?: string;
  conflict: string;
  reason: string;
  compensatingControl: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface Violation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  personId?: string;
}

export const memberOf = (m: Mandate, personId: string): TeamMember | undefined =>
  m.team.find((t) => t.personId === personId);

export const hasRole = (m: Mandate, personId: string, role: EngagementRole): boolean =>
  memberOf(m, personId)?.roles.includes(role) ?? false;

export const holdersOf = (m: Mandate, role: EngagementRole): TeamMember[] =>
  m.team.filter((t) => t.roles.includes(role));
