/**
 * Dynamic Control Applicability (Fachkonzept §9).
 *
 *   Requirement → Control → Applicability Evaluation
 *     → Risk / Scope / Complexity → Required Implementation Depth
 *
 * Grundregeln:
 *  - Anwendbarkeit wird ausschließlich über den Scope bestimmt
 *    (gibt es den Gegenstand des Controls?), nie über die Unternehmensgröße.
 *  - Das Assurance Profile setzt die Basistiefe.
 *  - Control-spezifische Risikotreiber können die Tiefe über das Profil
 *    hinaus anheben (z. B. Profil 2, aber Access Review auf Tiefe 3).
 *  - Unterschreiten der erforderlichen Tiefe ist Tailoring und benötigt
 *    Begründung plus Risikoakzeptanz.
 */
import type { ComplexityFacts, Dimension, DimensionRating } from './dimensions.js';
import type { AssuranceProfile } from './profile.js';

/** 1 Basic · 2 Defined · 3 Managed · 4 Assured */
export type ImplementationDepth = 1 | 2 | 3 | 4;

export const DEPTH_NAMES: Record<ImplementationDepth, string> = {
  1: 'Basic',
  2: 'Defined',
  3: 'Managed',
  4: 'Assured',
};

export interface DepthSpec {
  practice: string;
  frequency: string;
  evidence: string[];
  roles: string[];
  fourEyes: boolean;
}

export interface ControlContext {
  profile: AssuranceProfile;
  facts: ComplexityFacts;
  ratings: Record<Dimension, DimensionRating>;
}

export interface ControlDefinition {
  id: string;
  title: string;
  /** z. B. "ISO 27001:2022 A.5.18", "NIS2 Art. 21(2)(i)" */
  requirementRefs: string[];
  /** Scope-basierte Anwendbarkeit. Fehlt sie, ist das Control immer anwendbar. */
  applicability?: {
    when: (ctx: ControlContext) => boolean;
    notApplicableReason: string;
  };
  depthDrivers?: Array<{
    when: (ctx: ControlContext) => boolean;
    minDepth: ImplementationDepth;
    reason: string;
  }>;
  depths: Record<ImplementationDepth, DepthSpec>;
}

export type ControlApplicability =
  | { controlId: string; applicable: false; justification: string }
  | {
      controlId: string;
      applicable: true;
      baseDepth: ImplementationDepth;
      requiredDepth: ImplementationDepth;
      raisedBy: string[];
      spec: DepthSpec;
    };

export function resolveControl(control: ControlDefinition, ctx: ControlContext): ControlApplicability {
  if (control.applicability && !control.applicability.when(ctx)) {
    return { controlId: control.id, applicable: false, justification: control.applicability.notApplicableReason };
  }
  const baseDepth = ctx.profile as ImplementationDepth;
  let requiredDepth: ImplementationDepth = baseDepth;
  const raisedBy: string[] = [];
  for (const driver of control.depthDrivers ?? []) {
    if (driver.minDepth > baseDepth && driver.when(ctx)) {
      raisedBy.push(driver.reason);
      if (driver.minDepth > requiredDepth) requiredDepth = driver.minDepth;
    }
  }
  return {
    controlId: control.id,
    applicable: true,
    baseDepth,
    requiredDepth,
    raisedBy,
    spec: control.depths[requiredDepth],
  };
}

export interface TailoringRequest {
  depth: ImplementationDepth;
  justification: string;
  /** Referenz auf die Risikoakzeptanz des zuständigen Risk Owners */
  riskAcceptanceId: string;
}

export function applyTailoring(
  resolved: Extract<ControlApplicability, { applicable: true }>,
  request: TailoringRequest,
): { ok: true; effectiveDepth: ImplementationDepth } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (request.depth >= resolved.requiredDepth) {
    return { ok: true, effectiveDepth: request.depth };
  }
  if (request.justification.trim().length < 30) errors.push('Tailoring erfordert eine Begründung.');
  if (!request.riskAcceptanceId) errors.push('Tailoring erfordert eine dokumentierte Risikoakzeptanz.');
  return errors.length ? { ok: false, errors } : { ok: true, effectiveDepth: request.depth };
}
