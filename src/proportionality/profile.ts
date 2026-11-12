/**
 * Assurance Profile – Ableitung (Fachkonzept §1, §3–§7).
 *
 *   Risk + Complexity + Regulation + Criticality → Required Assurance Level
 *
 * Verfahren (Policy-versioniert, deterministisch, erklärbar):
 *  1. Exposure: Spitzenwert der Kern-Risikodimensionen, geglättet mit dem
 *     Mittel der drei höchsten Risikodimensionen → Exposure-Band 1–4.
 *  2. Komplexität: kann das Band um höchstens eine Stufe anheben, aber nie
 *     über Profil 3 hinaus. Größe allein erzeugt nie Profil 4.
 *  3. Harte Untergrenzen (Floors) aus Regulierung und Kritikalität.
 *  4. Grenzfälle werden markiert – die Entscheidung trifft der Engagement Lead.
 *
 * Der Reifegrad (existingMaturity) fließt bewusst nicht ein: Er verändert
 * nicht, wie viel Assurance nötig ist, sondern wie weit der Weg dorthin ist.
 */
import { rateAll, type ComplexityFacts, type Dimension, type DimensionRating, type Level } from './dimensions.js';

export type AssuranceProfile = 1 | 2 | 3 | 4;

export const PROFILE_NAMES: Record<AssuranceProfile, string> = {
  1: 'Lean',
  2: 'Standard',
  3: 'Enhanced',
  4: 'Critical / Regulated',
};

export const DERIVATION_POLICY = {
  version: '2026-11.1',
  coreExposureDimensions: ['information', 'businessCriticality', 'threatExposure', 'regulation'] as const,
  amplifierDimensions: ['thirdParties', 'ai', 'cryptography'] as const,
  complexityDimensions: ['organization', 'technology', 'thirdParties'] as const,
  /** Gewicht des Spitzenwerts gegenüber dem Mittel der Top-3 */
  peakWeight: 0.5,
  /** Untere Schwellen der Exposure-Bänder 2, 3, 4 */
  bandThresholds: { 2: 1.75, 3: 2.5, 4: 3.25 } as const,
  /** Abstand zur Bandgrenze, ab dem ein Grenzfall gemeldet wird */
  borderlineMargin: 0.35,
  /** Komplexitäts-Score, ab dem um eine Stufe angehoben wird */
  complexityLiftThreshold: 3,
  /** Höchstes Profil, das durch Komplexität erreicht werden kann */
  complexityLiftCap: 3 as AssuranceProfile,
} as const;

export interface ProfileFloor {
  id: string;
  profile: AssuranceProfile;
  reason: string;
}

export interface ProfileDerivation {
  policyVersion: string;
  ratings: Record<Dimension, DimensionRating>;
  exposureScore: number;
  exposureBand: AssuranceProfile;
  complexityScore: number;
  complexityLift: 0 | 1;
  floors: ProfileFloor[];
  recommended: AssuranceProfile;
  /** Gesetzt, wenn das Ergebnis nahe einer Bandgrenze liegt und nicht durch einen Floor fixiert ist. */
  borderline?: { alternative: AssuranceProfile; distance: number };
  /** Hinweise, die vor einer Entscheidung geklärt werden müssen. */
  openQuestions: string[];
  rationale: string[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const maxProfile = (a: AssuranceProfile, b: AssuranceProfile): AssuranceProfile => (a > b ? a : b);

function band(score: number): AssuranceProfile {
  const t = DERIVATION_POLICY.bandThresholds;
  if (score >= t[4]) return 4;
  if (score >= t[3]) return 3;
  if (score >= t[2]) return 2;
  return 1;
}

export function evaluateFloors(facts: ComplexityFacts, ratings: Record<Dimension, DimensionRating>): ProfileFloor[] {
  const { regulation: reg, technology: tech, information: info, threatExposure: threat } = facts;
  const nis2Relevant = reg.nis2 === 'important_entity' || reg.nis2 === 'essential_entity';
  const crit = ratings.businessCriticality.level;
  const candidates: Array<ProfileFloor | false> = [
    reg.kritis && { id: 'F1', profile: 4, reason: 'Betreiber kritischer Anlagen (KRITIS)' },
    reg.nis2 === 'essential_entity' && { id: 'F2', profile: 4, reason: 'NIS2: besonders wichtige Einrichtung' },
    reg.nis2 === 'important_entity' && { id: 'F3', profile: 3, reason: 'NIS2: wichtige Einrichtung' },
    nis2Relevant && (tech.ot || crit === 4) && {
      id: 'F4', profile: 4, reason: 'NIS2-relevant mit OT bzw. sehr hoher Geschäftskritikalität',
    },
    tech.ot && crit >= 3 && { id: 'F5', profile: 3, reason: 'OT im Scope bei hoher Geschäftskritikalität' },
    info.specialCategoryData === 'large_scale' && {
      id: 'F6', profile: 3, reason: 'besondere Kategorien personenbezogener Daten in großem Umfang',
    },
    (reg.iso27001 === 'certification_target' || reg.iso27001 === 'certified') && {
      id: 'F7', profile: 2, reason: 'ISO 27001 Zertifizierung erfordert formales Risk Register, SoA, internes Audit und Management Review',
    },
    threat.privilegedAccess === 'customer_systems' && {
      id: 'F8', profile: 2, reason: 'privilegierter Zugriff auf Kundensysteme (Lieferkettenrisiko für Kunden)',
    },
  ];
  return candidates.filter((f): f is ProfileFloor => f !== false);
}

export function deriveAssuranceProfile(facts: ComplexityFacts): ProfileDerivation {
  const p = DERIVATION_POLICY;
  const ratings = rateAll(facts);
  const levelOf = (d: Dimension): Level => ratings[d].level;

  const coreLevels = p.coreExposureDimensions.map(levelOf);
  const riskLevels = [...p.coreExposureDimensions, ...p.amplifierDimensions].map(levelOf).sort((a, b) => b - a);
  const peak = Math.max(...coreLevels);
  const top3Mean = (riskLevels[0]! + riskLevels[1]! + riskLevels[2]!) / 3;
  const exposureScore = round2(p.peakWeight * peak + (1 - p.peakWeight) * top3Mean);
  const exposureBand = band(exposureScore);

  const complexityScore = round2(
    p.complexityDimensions.map(levelOf).reduce<number>((s, l) => s + l, 0) / p.complexityDimensions.length,
  );
  const liftFor = (b: AssuranceProfile): 0 | 1 =>
    complexityScore >= p.complexityLiftThreshold && b < p.complexityLiftCap ? 1 : 0;
  const complexityLift = liftFor(exposureBand);
  const lifted = (exposureBand + complexityLift) as AssuranceProfile;

  const floors = evaluateFloors(facts, ratings);
  const floorProfile = floors.reduce<AssuranceProfile>((m, f) => maxProfile(m, f.profile), 1);
  const finalFor = (b: AssuranceProfile): AssuranceProfile => maxProfile((b + liftFor(b)) as AssuranceProfile, floorProfile);
  const recommended = finalFor(exposureBand);

  const rationale: string[] = [
    `Exposure-Score ${exposureScore} (Spitze ${peak}, Top-3-Mittel ${round2(top3Mean)}) → Band ${exposureBand}`,
  ];
  for (const d of [...p.coreExposureDimensions, ...p.amplifierDimensions]) {
    const r = ratings[d];
    if (r.level >= 3) rationale.push(`${d} = ${r.level}: ${r.drivers.join('; ')}`);
  }
  if (complexityLift) {
    rationale.push(`Komplexität ${complexityScore} ≥ ${p.complexityLiftThreshold} → Anhebung auf ${lifted}`);
  }
  for (const f of floors) {
    if (f.profile > lifted) rationale.push(`Untergrenze ${f.id}: ${f.reason} → mindestens Profil ${f.profile}`);
  }

  // Grenzfall: Liegt der Score nahe einer Bandgrenze, wird das Ergebnis mit dem
  // Nachbarband neu berechnet. Ein Nachbarband nach oben ist nur erreichbar, wenn
  // der Spitzenwert es zulässt (Score ≤ Spitze) – Profil 4 aus Exposure setzt
  // also mindestens eine kritische Dimension voraus.
  let borderline: ProfileDerivation['borderline'];
  {
    const t = p.bandThresholds;
    const candidates: Array<{ band: AssuranceProfile; distance: number }> = [];
    if (exposureBand > 1) {
      candidates.push({ band: (exposureBand - 1) as AssuranceProfile, distance: exposureScore - t[exposureBand as 2 | 3 | 4] });
    }
    if (exposureBand < 4) {
      const upper = t[(exposureBand + 1) as 2 | 3 | 4];
      if (peak >= upper) candidates.push({ band: (exposureBand + 1) as AssuranceProfile, distance: upper - exposureScore });
    }
    const nearest = candidates
      .filter((c) => c.distance < p.borderlineMargin && finalFor(c.band) !== recommended)
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearest) borderline = { alternative: finalFor(nearest.band), distance: round2(nearest.distance) };
  }
  if (borderline) {
    rationale.push(`Grenzfall: Profil ${borderline.alternative} vertretbar (Abstand ${borderline.distance}) – Entscheidung durch Engagement Lead`);
  }

  const openQuestions: string[] = [];
  if (facts.regulation.nis2 === 'unclear') {
    openQuestions.push('NIS2-Betroffenheit klären – kann Untergrenze Profil 3 oder 4 auslösen');
  }

  return {
    policyVersion: p.version,
    ratings,
    exposureScore,
    exposureBand,
    complexityScore,
    complexityLift,
    floors,
    recommended,
    ...(borderline ? { borderline } : {}),
    openQuestions,
    rationale,
  };
}

// ---------------------------------------------------------------------------
// Profilentscheidung (Recommendation → Decision)
// ---------------------------------------------------------------------------

export interface DecisionActor {
  personId: string;
  role: 'engagement_lead' | 'independent_reviewer' | string;
}

export interface ProfileDecisionInput {
  profile: AssuranceProfile;
  justification?: string;
  decidedBy: DecisionActor;
  /** Pflicht bei Herabstufung unter die Empfehlung (außerhalb eines Grenzfalls). */
  reviewedBy?: DecisionActor;
}

export interface ProfileDecision {
  profile: AssuranceProfile;
  recommended: AssuranceProfile;
  policyVersion: string;
  deviation: 'none' | 'borderline' | 'upgrade' | 'downgrade';
  justification?: string;
  decidedBy: DecisionActor;
  reviewedBy?: DecisionActor;
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const MIN_JUSTIFICATION_LENGTH = 30;

export function decideProfile(derivation: ProfileDerivation, input: ProfileDecisionInput): Result<ProfileDecision> {
  const errors: string[] = [];
  const { profile, justification, decidedBy, reviewedBy } = input;
  const recommended = derivation.recommended;

  if (decidedBy.role !== 'engagement_lead') {
    errors.push('Das Assurance Profile wird durch den Engagement Lead festgelegt.');
  }
  const violatedFloors = derivation.floors.filter((f) => profile < f.profile);
  for (const f of violatedFloors) {
    errors.push(`Profil ${profile} unterschreitet Untergrenze ${f.id} (${f.reason}, mind. Profil ${f.profile}).`);
  }

  const deviation: ProfileDecision['deviation'] =
    profile === recommended ? 'none'
      : derivation.borderline?.alternative === profile ? 'borderline'
      : profile > recommended ? 'upgrade'
      : 'downgrade';

  if (deviation !== 'none' && (justification ?? '').trim().length < MIN_JUSTIFICATION_LENGTH) {
    errors.push(`Abweichung von der Empfehlung (Profil ${recommended}) erfordert eine Begründung.`);
  }
  if (deviation === 'downgrade') {
    if (!reviewedBy || reviewedBy.role !== 'independent_reviewer') {
      errors.push('Herabstufung unter die Empfehlung erfordert Review durch Independent Reviewer / QA.');
    } else if (reviewedBy.personId === decidedBy.personId) {
      errors.push('Entscheidung und Review der Herabstufung müssen durch verschiedene Personen erfolgen.');
    }
  }
  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      profile,
      recommended,
      policyVersion: derivation.policyVersion,
      deviation,
      ...(justification ? { justification } : {}),
      decidedBy,
      ...(reviewedBy ? { reviewedBy } : {}),
    },
  };
}
