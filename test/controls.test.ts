import { describe, expect, it } from 'vitest';
import { ACCESS_REVIEW, OT_SEGMENTATION, SECURE_DEVELOPMENT } from '../src/proportionality/catalog.example.js';
import { applyTailoring, resolveControl, type ControlContext } from '../src/proportionality/controls.js';
import { rateAll } from '../src/proportionality/dimensions.js';
import type { DepthProfile } from '../src/proportionality/profile.js';
import { MANUFACTURER, SOLO_DEV_A, SOLO_DEV_B } from './fixtures.js';

const ctx = (facts: ControlContext['facts'], profile: DepthProfile): ControlContext => ({
  facts, profile, ratings: rateAll(facts),
});

describe('Dynamic Control Applicability – Access Review (§9)', () => {
  it('Profil 1: Owner überprüft halbjährlich und dokumentiert', () => {
    const r = resolveControl(ACCESS_REVIEW, ctx(SOLO_DEV_A, 1));
    expect(r.applicable && r.requiredDepth).toBe(1);
    expect(r.applicable && r.spec.frequency).toBe('halbjährlich');
    expect(r.applicable && r.spec.fourEyes).toBe(false);
  });

  it('Profil 4: formalisierter Review mit Vier-Augen-Prüfung und IAM-Export', () => {
    const r = resolveControl(ACCESS_REVIEW, ctx(MANUFACTURER, 4));
    expect(r.applicable && r.requiredDepth).toBe(4);
    expect(r.applicable && r.spec.fourEyes).toBe(true);
    expect(r.applicable && r.spec.evidence.join()).toMatch(/IAM-Export/);
  });

  it('Control bleibt dasselbe – Tiefe wird durch Risiko über das Profil angehoben', () => {
    const r = resolveControl(ACCESS_REVIEW, ctx(SOLO_DEV_B, 2));
    expect(r.applicable).toBe(true);
    if (!r.applicable) return;
    expect(r.baseDepth).toBe(2);
    expect(r.requiredDepth).toBe(3);
    expect(r.raisedBy).toEqual(['privilegierter Zugriff auf Kundensysteme']);
  });
});

describe('Anwendbarkeit folgt dem Scope, nicht der Größe', () => {
  it('Secure Development nicht anwendbar ohne eigene Entwicklung – mit Begründung', () => {
    const r = resolveControl(SECURE_DEVELOPMENT, ctx(MANUFACTURER, 4));
    expect(r).toEqual({ controlId: 'SDLC', applicable: false, justification: 'Keine eigene Softwareentwicklung im Scope.' });
  });

  it('Secure Development für Einzelentwickler B anwendbar und angehoben', () => {
    const r = resolveControl(SECURE_DEVELOPMENT, ctx(SOLO_DEV_B, 2));
    expect(r.applicable && r.requiredDepth).toBe(3);
  });

  it('OT-Segmentierung nur mit OT im Scope', () => {
    expect(resolveControl(OT_SEGMENTATION, ctx(SOLO_DEV_A, 1)).applicable).toBe(false);
    expect(resolveControl(OT_SEGMENTATION, ctx(MANUFACTURER, 4)).applicable).toBe(true);
  });
});

describe('Tailoring', () => {
  const resolved = resolveControl(ACCESS_REVIEW, ctx(SOLO_DEV_B, 2));
  if (!resolved.applicable) throw new Error('expected applicable');

  it('Unterschreiten der erforderlichen Tiefe braucht Begründung und Risikoakzeptanz', () => {
    expect(applyTailoring(resolved, { depth: 2, justification: '', riskAcceptanceId: '' }).ok).toBe(false);
    expect(applyTailoring(resolved, {
      depth: 2,
      justification: 'Kundenzugriffe ausschließlich über PAM des Kunden mit Session Recording.',
      riskAcceptanceId: 'RA-12',
    })).toEqual({ ok: true, effectiveDepth: 2 });
  });
});
