import { describe, expect, it } from 'vitest';
import { canReceiveEvidence, checkCase, mandateTransition } from '../src/engagement/lifecycle.js';

describe('Mandat und Prüfvorgang (ENT-036)', () => {
  it('Mandat folgt draft → offered → signed → active → closed', () => {
    expect(mandateTransition('draft', 'offered', { profileDecided: false }).ok).toBe(true);
    expect(mandateTransition('offered', 'signed', { profileDecided: false }).ok).toBe(true);
    expect(mandateTransition('draft', 'active', { profileDecided: true }).ok).toBe(false);
    expect(mandateTransition('signed', 'active', { profileDecided: false }).ok).toBe(false);
    expect(mandateTransition('signed', 'active', { profileDecided: true }).ok).toBe(true);
    expect(mandateTransition('active', 'draft', { profileDecided: true }).ok).toBe(false);
  });

  it('Nachweise und Evidenzerhebung erst bei aktivem Mandat', () => {
    expect(canReceiveEvidence('signed')).toBe(false);
    expect(canReceiveEvidence('active')).toBe(true);
    expect(checkCase({ status: 'collecting_evidence', mandateStatus: 'signed' })).toHaveLength(1);
    expect(checkCase({ status: 'scope_draft' })).toEqual([]);
  });

  it('Abschluss mit Einschränkungen nur mit benannten Grenzen', () => {
    expect(checkCase({ status: 'closed_with_limitations', mandateStatus: 'active' })).toHaveLength(1);
    expect(checkCase({ status: 'closed_with_limitations', mandateStatus: 'active', limitations: 'Modul B nicht geprüft' })).toEqual([]);
  });
});
