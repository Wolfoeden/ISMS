import { describe, expect, it } from 'vitest';
import {
  CORE_QUESTIONS, createIntake, frameworkCandidates, nextQuestions, orientation, orientationText, recordFact, switchRoute,
} from '../src/intake/intake.js';
import { readiness, type OpenQuestion } from '../src/intake/readiness.js';
import { pruefeFormulierungen } from '../src/werkzeuge/ergebnis.js';

const kunde = (key: string, value: unknown) => ({ key, value, source: 'customer_input' as const, sourceRef: 'Intake-Formular' });
const fehlerIn = (text: string) => pruefeFormulierungen(text, 'orientierung', false).filter((b) => b.schwere === 'fehler');

describe('Variante-C-Intake (WP-02/03)', () => {
  it('ohne Datenschutzhinweis kein Speichern (S01)', () => {
    expect(() => createIntake('I-0', 'known_need', { consentGiven: false })).toThrow(/hinweis/i);
  });

  it('TC-01 · Einstieg A „Sicherheitsbewertung Softwareprodukt“: Objekt Produkt, Ziel, keine NIS2-Pflichtbehauptung', () => {
    let i = createIntake('INT-DEMO-0001', 'known_need', { consentGiven: true, goalCode: 'software_product_security' });
    expect(i.facts.find((f) => f.key === 'object_type')?.value).toBe('product');
    i = recordFact(i, kunde('purpose', 'customer_evidence'));
    i = recordFact(i, kunde('markets', ['DE', 'EU']));
    const plan = nextQuestions(i);
    // Gegenstand ist durch die Auswahl belegt und wird nicht erneut gefragt
    expect(plan.ask.map((a) => a.question.key)).toEqual(['audience', 'product_delivery']);
    expect(plan.skipped.map((s) => s.question.key)).toContain('object_type');
    const kandidaten = frameworkCandidates(i);
    expect(kandidaten.find((k) => k.framework === 'NIS2_DE_BSIG')).toBeUndefined();
    expect(kandidaten.every((k) => k.bindingDetermination === false)).toBe(true);
    const text = orientationText(orientation(i));
    expect(text).not.toMatch(/pflichtig|verpflichtet|unterliegen|konform|zertifiziert/i);
    expect(fehlerIn(text)).toEqual([]);
  });

  it('TC-02 · Einstieg B mit Freitext: Fragen kontextsensitiv, keine Rechtsauskunft', () => {
    let i = createIntake('INT-DEMO-0002', 'guided_discovery', { consentGiven: true, concern: 'Wir müssen wohl irgendwas mit NIS2 machen, ein Kunde fragt.' });
    expect(nextQuestions(i).ask.map((a) => a.question.key)).toEqual(['purpose', 'object_type', 'markets']);
    i = recordFact(i, kunde('purpose', 'regulatory_clarification'));
    i = recordFact(i, kunde('object_type', 'organization'));
    expect(nextQuestions(i).ask.map((a) => a.question.key)).toEqual(['markets', 'organization_size', 'sector']);
    // ohne Größe und Sektor: NIS2 nur „fachliche Prüfung erforderlich“
    expect(frameworkCandidates(i)).toEqual([expect.objectContaining({ framework: 'NIS2_DE_BSIG', status: 'requires_expert_review', basis: 'BIB-BSIG-28' })]);
    i = recordFact(i, kunde('sector', ['a2-5.4']));
    i = recordFact(i, kunde('organization_size', { employees: 120, turnoverMio: 30, balanceMio: 20 }));
    // die quellengeprüfte Vorprüfung ordnet ohne KRITIS- und Entgelt-Angabe nicht ein
    expect(frameworkCandidates(i).find((k) => k.framework === 'NIS2_DE_BSIG')).toMatchObject({ status: 'requires_expert_review', missingFacts: ['REG-03', 'STA-05'] });
    i = recordFact(i, kunde('kritis', false));
    i = recordFact(i, kunde('paid_service', true));
    const nis2 = frameworkCandidates(i).find((k) => k.framework === 'NIS2_DE_BSIG')!;
    expect(nis2.status).toBe('possibly_applicable');
    expect(nis2.bindingDetermination).toBe(false);
    const o = orientation(i);
    expect(o.status).toBe('preliminary');
    expect(o.notice).toMatch(/keine rechtliche Bewertung/);
    expect(fehlerIn(orientationText(o))).toEqual([]);
  });

  it('Regelwerke ohne Bibliothekseintrag: nur „fachliche Prüfung erforderlich“, nie eine Hypothese', () => {
    const i = createIntake('INT-DEMO-0003', 'known_need', { consentGiven: true, goalCode: 'ai_assessment' });
    expect(frameworkCandidates(i)).toEqual([expect.objectContaining({ framework: 'EU_AI_ACT', status: 'requires_expert_review' })]);
    expect(frameworkCandidates(i)[0]!.basis).toMatch(/ENT-017/);
  });

  it('US-A1 · Wechsel A ↔ B erhält erfasste Fakten', () => {
    let i = createIntake('I-1', 'guided_discovery', { consentGiven: true });
    i = recordFact(i, kunde('purpose', 'self_assessment'));
    i = recordFact(i, kunde('markets', ['DE']));
    const a = switchRoute(i, 'known_need', 'iso27001_readiness');
    expect(a.route).toBe('known_need');
    expect(a.routeHistory).toEqual(['guided_discovery', 'known_need']);
    expect(a.facts.map((f) => f.key).sort()).toEqual(['markets', 'object_type', 'purpose']);
    const b = switchRoute(a, 'guided_discovery');
    expect(b.facts.map((f) => f.key).sort()).toEqual(['markets', 'object_type', 'purpose']);
  });

  it('US-A3 · Ask once: belegte Fakten werden nur bei veraltetem oder bestrittenem Stand erneut gefragt – mit Grund', () => {
    let i = createIntake('I-2', 'guided_discovery', { consentGiven: true });
    i = recordFact(i, kunde('purpose', 'self_assessment'));
    expect(nextQuestions(i).ask.map((a) => a.question.key)).not.toContain('purpose');
    i = recordFact(i, { ...kunde('purpose', 'self_assessment'), state: 'stale' });
    expect(nextQuestions(i).ask.find((a) => a.question.key === 'purpose')?.reason).toMatch(/veraltet/);
    i = recordFact(i, kunde('purpose', 'unknown'));
    expect(nextQuestions(i).ask.find((a) => a.question.key === 'purpose')?.reason).toMatch(/unbekannt/);
  });

  it('höchstens 7 Kernfragen, Orientierung mit höchstens 3 Rückfragen', () => {
    expect(CORE_QUESTIONS.length).toBeLessThanOrEqual(7);
    const i = recordFact(recordFact(createIntake('I-3', 'guided_discovery', { consentGiven: true }), kunde('purpose', 'customer_evidence')), kunde('object_type', 'product'));
    expect(nextQuestions(i).ask.length).toBeLessThanOrEqual(7);
    expect(orientation(i).followUp.length).toBeLessThanOrEqual(3);
  });
});

describe('D-06 Entscheidungsfähigkeit (02 §5.1)', () => {
  const q = (o: Partial<OpenQuestion>): OpenQuestion => ({ id: 'Q-1', text: 'Updateprozess des Produkts', materiality: 'material', state: 'answered', ...o });

  it('TC-09 · materielle Unbekannte: blockiert oder ausdrückliche Einschränkung, nie positiv', () => {
    const blockiert = readiness({ questions: [q({ state: 'unknown' })], evidenceSufficient: true, mandatoryDecisionsVerified: true });
    expect(blockiert).toMatchObject({ result: 'blocked', positiveStatementAllowed: false });
    const begrenzt = readiness({ questions: [q({ state: 'unknown', limitationRef: 'E-012' })], evidenceSufficient: true, mandatoryDecisionsVerified: true });
    expect(begrenzt).toMatchObject({ result: 'limitation', positiveStatementAllowed: false });
  });

  it('„nicht anwendbar“ ersetzt keine Unbekannte: ohne Begründung bleibt es eine Lücke', () => {
    expect(readiness({ questions: [q({ state: 'not_applicable' })], evidenceSufficient: true, mandatoryDecisionsVerified: true }).result).toBe('blocked');
    expect(readiness({ questions: [q({ state: 'not_applicable', naJustification: 'kein Update-Kanal: Produkt wird nur als SaaS betrieben, Updates serverseitig' })], evidenceSufficient: true, mandatoryDecisionsVerified: true }).result).toBe('ready');
  });

  it('Tabelle 02 §5.1: clarify, human_review, ready', () => {
    expect(readiness({ questions: [q({})], evidenceSufficient: false, mandatoryDecisionsVerified: true }).result).toBe('clarify');
    expect(readiness({ questions: [q({})], evidenceSufficient: true, mandatoryDecisionsVerified: false }).result).toBe('human_review');
    expect(readiness({ questions: [q({}), q({ id: 'Q-2', materiality: 'nonmaterial', state: 'unknown' })], evidenceSufficient: true, mandatoryDecisionsVerified: true }))
      .toMatchObject({ result: 'ready', positiveStatementAllowed: true, decisionId: 'D-06' });
  });
});
