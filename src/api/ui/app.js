// ISMS-Prototyp – Oberfläche (Etappe 3). Nutzt ausschließlich die Schnittstelle des Servers.
// Sicherheit: Alle Inhalte werden als Text eingesetzt (textContent), nie als HTML.
'use strict';

// ---------------------------------------------------------------------------
// Grundlagen
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}
const state = { person: null, persons: [], tab: null, view: null };

function toast(text, err) {
  const t = $('toast');
  t.textContent = text;
  t.className = 'toast' + (err ? ' err' : '');
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, err ? 9000 : 3500);
}

async function api(method, path, body, extraHeaders) {
  const headers = { 'content-type': 'application/json', ...(extraHeaders || {}) };
  if (state.person) headers['x-person-id'] = state.person.id;
  const r = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j.error && j.error.message) || `Fehler ${r.status}`;
    toast(`Abgelehnt: ${msg}`, true);
    throw new Error(msg);
  }
  return j.data;
}
const get = (p) => api('GET', p);
const post = (p, b) => api('POST', p, b || {});
const patch = (p, b) => api('PATCH', p, b);

// Aktion mit Rückmeldung und Neuaufbau der Ansicht
async function act(fn, ok) {
  try {
    await fn();
    if (ok) toast(ok);
    await render();
  } catch { /* Meldung bereits angezeigt */ }
}

function field(label, input) { return h('label', { class: 'f' }, label, input); }
function sel(id, options, value) {
  return h('select', { id }, options.map(([v, t]) => h('option', { value: v, selected: v === value }, t)));
}
const val = (id) => { const el = $(id); return el ? el.value : ''; };
const checked = (id) => { const el = $(id); return !!(el && el.checked); };
const pill = (text, kind) => h('span', { class: 'pill ' + (kind || '') }, text);

const DE = {
  scope_draft: 'Scope-Entwurf', scope_approved: 'Scope freigegeben', collecting_evidence: 'Nachweise sammeln', ready_for_assessment: 'bereit zur Bewertung',
  assessing: 'Bewertung', internal_review: 'internes Review', qa: 'Qualitätssicherung', approved: 'QA-freigegeben', published: 'veröffentlicht',
  closed: 'abgeschlossen', closed_with_limitations: 'abgeschlossen mit Einschränkungen', rework: 'Nacharbeit', cancelled: 'gestoppt',
  on_hold: 'pausiert', waiting_customer: 'wartet auf Kunde', blocked_material_unknown: 'blockiert (Unbekannte)',
  draft: 'Entwurf', sent: 'versandt', accepted: 'angenommen', superseded: 'ersetzt', expired: 'abgelaufen', declined: 'abgelehnt',
  signed: 'unterschrieben', active: 'aktiv', terminated: 'storniert', in_qa: 'in QA', returned: 'zurückgegeben', stopped: 'gestoppt',
  received: 'eingegangen', suitable: 'geeignet', unsuitable: 'ungeeignet',
  ai_proposed: 'KI-Vorschlag', in_review: 'in Prüfung', verified: 'verifiziert', persisted_locked: 'gesperrt', rejected_with_reason: 'abgelehnt',
  deferred_with_owner_impact_trigger: 'vertagt', pending_review: 'zu prüfen', confirmed: 'bestätigt',
  met: 'erfüllt', partially_met: 'teilweise erfüllt', not_met: 'nicht erfüllt', evidence_missing: 'Nachweis fehlt',
  insufficient_evidence: 'Nachweis unzureichend', not_assessed: 'nicht bewertet', not_applicable: 'nicht anwendbar', needs_review: 'in Klärung',
};
const de = (code) => DE[code] || code || '–';
const kindOf = (code) => (['met', 'suitable', 'confirmed', 'active', 'published', 'persisted_locked', 'verified', 'approved', 'scope_approved', 'erledigt', 'accepted', 'closed'].includes(code) ? 'p-ok'
  : ['not_met', 'unsuitable', 'expired', 'cancelled', 'terminated', 'stopped', 'rejected_with_reason', 'returned'].includes(code) ? 'p-err'
  : ['ai_proposed'].includes(code) ? 'p-ai' : 'p-warn');

// ---------------------------------------------------------------------------
// Start und Navigation
// ---------------------------------------------------------------------------
async function start() {
  state.persons = await (await fetch('/dev/persons')).json().then((j) => j.data || []);
  const s = $('person');
  s.replaceChildren(...state.persons.map((p) => h('option', { value: p.id }, `${p.display_name} – ${p.party === 'agency' ? 'DT Agency' : 'Kunde' + (p.organization ? ', ' + p.organization : '')}`)));
  s.addEventListener('change', () => { setPerson(s.value); });
  setPerson(state.persons[0] && state.persons[0].id);
}
function setPerson(id) {
  $('toast').hidden = true; // Meldungen gehören zur vorherigen Person
  state.person = state.persons.find((p) => p.id === id) || null;
  $('person').value = id;
  state.tab = state.person && state.person.party === 'agency' ? 'vorgaenge' : 'anfrage';
  state.view = null;
  render();
}
const TABS = { customer: [['anfrage', 'Neue Anfrage'], ['meine', 'Meine Vorgänge']], agency: [['vorgaenge', 'Vorgänge'], ['stammdaten', 'Kunden anlegen']] };
function renderTabs() {
  const tabs = TABS[state.person && state.person.party === 'agency' ? 'agency' : 'customer'];
  $('tabs').replaceChildren(...tabs.map(([k, t]) => h('button', { 'aria-selected': state.tab === k && !state.view ? 'true' : 'false', onclick: () => { state.tab = k; state.view = null; render(); } }, t)));
}
async function render() {
  renderTabs();
  const main = $('main');
  if (!state.person) { main.replaceChildren(h('section', {}, h('p', {}, 'Keine Person vorhanden.'))); return; }
  let content;
  try {
    if (state.view) content = await state.view();
    else if (state.tab === 'anfrage') content = viewNeueAnfrage();
    else if (state.tab === 'meine') content = await viewMeineVorgaenge();
    else if (state.tab === 'stammdaten') content = viewStammdaten();
    else content = await viewVorgaenge();
  } catch (e) {
    content = h('section', {}, h('p', {}, 'Ansicht konnte nicht geladen werden: ' + e.message));
  }
  main.replaceChildren(...[content].flat());
}
const open = (fn) => { state.view = fn; render(); };

// ---------------------------------------------------------------------------
// Kunde: Einstieg nach Variante C
// ---------------------------------------------------------------------------
const GOALS = [
  ['software_product_security', 'Sicherheitsbewertung Softwareprodukt'], ['iso27001_readiness', 'ISO-27001-Readiness'],
  ['nis2_orientation', 'NIS2-Orientierung'], ['supplier_assessment', 'Lieferanten- / Third-Party-Assessment'],
  ['ai_assessment', 'KI-/AI-Act-Assessment'], ['part_is', 'EASA Part-IS'], ['other', 'Sonstiges'],
];
function viewNeueAnfrage() {
  let route = 'known_need';
  const a = h('button', { class: 'card choice', 'aria-pressed': 'true', onclick: () => pick('known_need') },
    h('h3', {}, 'Ich weiß, was ich brauche'), h('p', { class: 'muted' }, 'Ziel auswählen – der Gegenstand ergibt sich daraus.'));
  const b = h('button', { class: 'card choice', 'aria-pressed': 'false', onclick: () => pick('guided_discovery') },
    h('h3', {}, 'Helfen Sie mir'), h('p', { class: 'muted' }, 'Anliegen in eigenen Worten schildern – wir fragen gezielt nach.'));
  const goal = field('Ziel', sel('goal', GOALS));
  const concern = field('Ihr Anliegen', h('textarea', { id: 'concern', placeholder: 'z. B. Ein Kunde verlangt einen Sicherheitsnachweis für unsere App.' }));
  concern.hidden = true;
  function pick(r) {
    route = r;
    a.setAttribute('aria-pressed', String(r === 'known_need'));
    b.setAttribute('aria-pressed', String(r === 'guided_discovery'));
    goal.hidden = r !== 'known_need';
    concern.hidden = r !== 'guided_discovery';
  }
  return h('section', {},
    h('h2', {}, 'Wie möchten Sie beginnen?'),
    h('p', { class: 'muted' }, 'Sie können den Weg später wechseln, ohne Angaben zu verlieren. Die Auswahl ist keine rechtliche Einordnung.'),
    h('div', { class: 'grid2' }, a, b), goal, concern,
    h('label', { class: 'row' }, h('input', { type: 'checkbox', id: 'consent' }),
      'Ich habe den Datenschutz- und Nutzungshinweis gelesen. Bitte vor dem Auftrag keine vertraulichen Unterlagen hochladen.'),
    h('div', { class: 'row' }, h('button', { class: 'b', onclick: () => act(async () => {
      const i = await post('/intakes', { route, consentGiven: checked('consent'), ...(route === 'known_need' ? { goalCode: val('goal') } : { concern: val('concern') }) });
      open(() => viewKernfragen(i.id));
    }, 'Anfrage angelegt') }, 'Weiter')));
}

const PURPOSE = [['customer_evidence', 'Nachweis für einen Kunden'], ['self_assessment', 'eigene Standortbestimmung'], ['certification_preparation', 'Zertifizierung vorbereiten'], ['regulatory_clarification', 'Pflichten klären']];
const OBJECT = [['product', 'Softwareprodukt'], ['organization', 'Organisation'], ['service', 'Dienstleistung'], ['site', 'Standort'], ['supplier', 'Lieferant'], ['ai_system', 'KI-System']];
function eingabe(q) {
  const id = 'q-' + q.key;
  if (q.key === 'purpose') return sel(id, PURPOSE);
  if (q.key === 'object_type') return sel(id, OBJECT);
  if (q.key === 'organization_size') return h('div', { class: 'row' },
    h('input', { id: id + '-e', type: 'number', min: '0', placeholder: 'Beschäftigte' }),
    h('input', { id: id + '-u', type: 'number', min: '0', step: '0.1', placeholder: 'Umsatz Mio. €' }),
    h('input', { id: id + '-b', type: 'number', min: '0', step: '0.1', placeholder: 'Bilanz Mio. €' }));
  return h('input', { id, type: 'text', placeholder: q.key === 'markets' ? 'z. B. DE, EU' : q.key === 'sector' ? 'z. B. a2-5.4 oder keine' : '' });
}
function wert(q) {
  const id = 'q-' + q.key;
  if (checked(id + '-unk')) return 'unknown';
  if (q.key === 'organization_size') {
    const n = (s) => (val(id + s) === '' ? undefined : Number(val(id + s)));
    const v = { employees: n('-e'), turnoverMio: n('-u'), balanceMio: n('-b') };
    return Object.values(v).some((x) => x !== undefined) ? v : undefined;
  }
  const v = val(id).trim();
  if (!v) return undefined;
  if (q.key === 'markets' || q.key === 'sector') return v.split(',').map((x) => x.trim()).filter(Boolean);
  return v;
}
async function viewKernfragen(intakeId) {
  const d = await get(`/intakes/${intakeId}/orientation`);
  const o = d.orientation;
  const fragen = h('section', {}, h('h2', {}, 'Kurze Fragen'),
    d.questions.length ? h('p', { class: 'muted' }, 'Nur was für die Einordnung nötig ist. Was Sie nicht wissen, markieren Sie bitte als „weiß ich nicht“ – wir raten nie.') : h('p', {}, 'Alle Kernfragen sind beantwortet.'),
    ...d.questions.map((q) => h('div', { class: 'card' },
      h('div', { class: 'row' }, h('b', {}, q.text), q.materiality === 'material' ? pill('entscheidungsrelevant', 'p-warn') : null),
      h('span', { class: 'muted' }, q.reason), eingabe(q),
      h('label', { class: 'row muted' }, h('input', { type: 'checkbox', id: `q-${q.key}-unk` }), 'weiß ich nicht'))),
    d.questions.length ? h('div', { class: 'row' }, h('button', { class: 'b', onclick: () => act(async () => {
      for (const q of d.questions) { const v = wert(q); if (v !== undefined) await post(`/intakes/${intakeId}/facts`, { key: q.key, value: v }); }
    }, 'Angaben gespeichert') }, 'Angaben speichern')) : null);
  const kat = { customer_named: 'vom Kunden genannt', possibly_applicable: 'möglicherweise anwendbar – fachlich zu prüfen', possibly_not_applicable: 'eher nicht betroffen – fachlich zu prüfen', requires_expert_review: 'fachliche Prüfung erforderlich', optional_criterion: 'freiwilliges Bewertungskriterium' };
  const orient = h('section', {}, h('h2', {}, 'Erste Orientierung ', pill('vorläufig')),
    h('div', { class: 'grid2' },
      h('div', { class: 'card' }, h('h3', {}, 'Das wissen wir'), h('ul', {}, o.known.map((k) => h('li', {}, `${k.key}: ${typeof k.value === 'object' ? JSON.stringify(k.value) : k.value}`, h('span', { class: 'muted' }, ` (${k.source})`))))),
      h('div', { class: 'card' }, h('h3', {}, 'Das vermuten wir'), o.hypotheses.length ? h('ul', {}, o.hypotheses.map((x) => h('li', {}, `${x.framework}: ${kat[x.status] || x.status}. `, h('span', { class: 'muted' }, x.reason)))) : h('p', { class: 'muted' }, 'noch keine Einordnung möglich')),
      h('div', { class: 'card' }, h('h3', {}, 'Das fehlt noch'), o.missing.length ? h('ul', {}, o.missing.map((m) => h('li', {}, m.text))) : h('p', { class: 'muted' }, 'nichts für die erste Orientierung'))),
    h('p', { class: 'notice' }, o.notice));
  return [fragen, orient];
}

// ---------------------------------------------------------------------------
// Kunde: Meine Vorgänge, Dashboard (ENT-037), Upload, Bericht
// ---------------------------------------------------------------------------
async function viewMeineVorgaenge() {
  const [intakes, cases] = await Promise.all([get('/intakes'), get('/cases')]);
  return h('section', {}, h('h2', {}, 'Meine Vorgänge'),
    !intakes.length && !cases.length ? h('p', { class: 'muted' }, 'Noch keine Anfrage. Über „Neue Anfrage“ beginnen.') : null,
    h('div', { class: 'tw' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Anfrage'), h('th', {}, 'Stand'), h('th', {}, ''))),
      h('tbody', {}, intakes.map((i) => {
        const c = cases.find((x) => x.intake_id === i.id);
        return h('tr', {}, h('td', {}, GOALS.find((g) => g[0] === i.goal_code)?.[1] || 'eigenes Anliegen', h('div', { class: 'muted' }, new Date(i.created_at).toLocaleDateString('de-DE'))),
          h('td', {}, c ? pill(de(c.status), kindOf(c.status)) : pill('Anfrage in Bearbeitung')),
          h('td', {}, h('div', { class: 'row' },
            h('button', { class: 's', onclick: () => open(() => viewKernfragen(i.id)) }, 'Orientierung'),
            c ? h('button', { class: 'b', onclick: () => open(() => viewKundenFall(c.id)) }, 'Fortschritt') : null)));
      })))));
}

function dashboard(d) {
  return h('section', {}, h('h2', {}, 'Fortschritt'), h('p', { class: 'muted' }, d.hinweis),
    h('div', { class: 'phases' }, d.phasen.map((p) => h('div', { class: 'phase' }, h('b', {}, p.name), pill(p.stand === 'erledigt' ? 'erledigt' : p.stand === 'in_arbeit' ? 'in Arbeit' : 'offen', p.stand === 'erledigt' ? 'p-ok' : p.stand === 'in_arbeit' ? 'p-warn' : ''), h('span', { class: 'muted' }, p.detail)))),
    h('h3', {}, 'Als Nächstes'),
    d.aufgaben.length ? h('ul', {}, d.aufgaben.map((a) => h('li', {}, h('b', {}, a.wer + ': '), a.text))) : h('p', { class: 'muted' }, 'Keine offenen Aufgaben.'),
    d.einschraenkungen ? h('p', { class: 'notice' }, 'Einschränkungen: ' + d.einschraenkungen) : null);
}

async function viewKundenFall(caseId) {
  const d = await get(`/cases/${caseId}/dashboard`);
  const ov = await get(`/cases/${caseId}`);
  const teile = [h('div', { class: 'row' }, h('button', { class: 's', onclick: () => { state.view = null; render(); } }, '← Meine Vorgänge')), dashboard(d)];
  if (ov.case.mandate_id && ['collecting_evidence', 'ready_for_assessment', 'assessing'].includes(ov.case.status)) {
    teile.push(h('section', {}, h('h2', {}, 'Nachweis hochladen'),
      h('p', { class: 'muted' }, 'Die Datei wird mit Fingerabdruck, Quelle und Datum gespeichert. Inhalte von Dateien werden nie als Anweisung behandelt.'),
      h('div', { class: 'grid2' }, field('Datei', h('input', { type: 'file', id: 'file' })), field('Was ist das? (Quelle)', h('input', { id: 'src', placeholder: 'z. B. Export Benutzerverwaltung' })),
        field('Stand vom', h('input', { id: 'date', type: 'date', value: new Date().toISOString().slice(0, 10) }))),
      h('div', { class: 'row' }, h('button', { class: 'b', onclick: () => act(async () => {
        const f = $('file').files[0];
        if (!f) throw (toast('Bitte eine Datei wählen', true), new Error('keine Datei'));
        const b64 = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(f); });
        const e = await post(`/mandates/${ov.case.mandate_id}/evidence`, { source: val('src') || f.name, capturedAt: val('date'), contentBase64: b64 });
        if (e.duplicate) toast('Diese Datei liegt bereits vor – nicht doppelt gespeichert.');
      }, 'Nachweis hochgeladen') }, 'Hochladen'))));
  }
  if (d.berichtId) {
    const r = await get(`/reports/${d.berichtId}`);
    teile.push(h('section', {}, h('h2', {}, `Bericht – Version ${r.version}`),
      r.limitations ? h('p', { class: 'notice' }, 'Grenzen der Aussage: ' + r.limitations) : null,
      h('p', { class: 'pre' }, r.report_text),
      h('p', { class: 'muted mono' }, `Fingerabdruck ${r.content_sha256} · veröffentlicht ${new Date(r.published_at).toLocaleString('de-DE')}`)));
  }
  return teile;
}

// ---------------------------------------------------------------------------
// DT Agency: Stammdaten, Vorgänge, Fallansicht
// ---------------------------------------------------------------------------
function viewStammdaten() {
  return h('section', {}, h('h2', {}, 'Kunden anlegen (fiktiv)'),
    h('div', { class: 'grid2' }, field('Organisation', h('input', { id: 'orgname', placeholder: 'z. B. Solo Dev (fiktiv)' })), field('Kontaktperson', h('input', { id: 'pname', placeholder: 'z. B. Inhaber (fiktiv)' }))),
    h('div', { class: 'row' }, h('button', { class: 'b', onclick: () => act(async () => {
      const o = await post('/organizations', { name: val('orgname') });
      await post('/persons', { party: 'customer', organizationId: o.id, displayName: val('pname') });
      state.persons = await (await fetch('/dev/persons')).json().then((j) => j.data);
      const cur = state.person.id;
      $('person').replaceChildren(...state.persons.map((p) => h('option', { value: p.id }, `${p.display_name} – ${p.party === 'agency' ? 'DT Agency' : 'Kunde' + (p.organization ? ', ' + p.organization : '')}`)));
      $('person').value = cur;
    }, 'Kunde angelegt – oben unter „Angemeldet als“ auswählbar') }, 'Anlegen')));
}

async function viewVorgaenge() {
  const [intakes, cases] = await Promise.all([get('/intakes'), get('/cases')]);
  return h('section', {}, h('h2', {}, 'Vorgänge'),
    h('div', { class: 'tw' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Anfrage'), h('th', {}, 'von'), h('th', {}, 'Prüfvorgang'), h('th', {}, ''))),
      h('tbody', {}, intakes.map((i) => {
        const c = cases.find((x) => x.intake_id === i.id);
        return h('tr', {}, h('td', {}, GOALS.find((g) => g[0] === i.goal_code)?.[1] || 'eigenes Anliegen', h('div', { class: 'muted' }, i.entry_route === 'known_need' ? 'Einstieg A' : 'Einstieg B')),
          h('td', {}, i.created_by_name || '–'),
          h('td', {}, c ? pill(de(c.status), kindOf(c.status)) : h('span', { class: 'muted' }, 'noch keiner')),
          h('td', {}, h('div', { class: 'row' },
            h('button', { class: 's', onclick: () => open(() => viewKernfragen(i.id)) }, 'Orientierung'),
            c ? h('button', { class: 'b', onclick: () => open(() => viewFall(c.id)) }, 'Öffnen')
              : h('button', { class: 'b', onclick: () => act(async () => { const n = await post('/cases', { intakeId: i.id }); open(() => viewFall(n.id)); }, 'Prüfvorgang angelegt') }, 'Prüfvorgang anlegen'))));
      })))));
}

const PFLICHT_ANGEBOT = 'Dieses Angebot umfasst eine beratende Bewertung der Informationssicherheit im vereinbarten Umfang nach der beschriebenen Methodik. Es ist keine Zertifizierung und kein Audit einer akkreditierten Stelle; ein Zertifikat wird nicht ausgestellt.';
const ZERTIFIKATSWUNSCH = 'Ein Zertifikat, etwa nach ISO/IEC 27001, kann nur eine dafür akkreditierte Zertifizierungsstelle in einem eigenen Verfahren erteilen. Unser Ergebnis kann der Vorbereitung darauf dienen, ersetzt es aber nicht.';
const PFLICHT_BERICHT = 'Die Bewertung beruht auf den vorgelegten Nachweisen und auf Angaben der befragten Personen. Stichproben erlauben keinen Schluss auf eine vollständige Fehlerfreiheit. Die Aussagen gelten nur für den genannten Prüfumfang und Zeitpunkt. Dieses Ergebnis ist keine Zertifizierung und kein Audit einer akkreditierten Stelle.';
const NEXT = { scope_draft: 'scope_approved', scope_approved: 'collecting_evidence', collecting_evidence: 'ready_for_assessment', ready_for_assessment: 'assessing', assessing: 'internal_review', internal_review: 'qa', rework: 'qa', approved: 'published' };

async function viewFall(caseId) {
  const w = await get(`/cases/${caseId}/workspace`);
  const m = w.mandate;
  const freigegeben = w.scopeDetails.find((s) => s.status === 'approved');
  const objName = (id) => (w.objects.find((o) => o.id === id) || {}).name || '–';
  const zurueck = h('div', { class: 'row' }, h('button', { class: 's', onclick: () => { state.view = null; render(); } }, '← Vorgänge'),
    pill(de(w.case.status), kindOf(w.case.status)),
    NEXT[w.case.status] && w.case.status !== 'approved' ? h('button', { class: 's', onclick: () => act(() => post(`/cases/${caseId}/status`, { status: NEXT[w.case.status] }), 'Status geändert') }, `weiter: ${de(NEXT[w.case.status])}`) : null,
    w.case.status === 'published' ? h('button', { class: 's', onclick: () => act(() => post(`/cases/${caseId}/status`, { status: 'closed_with_limitations', limitations: prompt('Einschränkungen') || '' }), 'abgeschlossen') }, 'abschließen mit Einschränkungen') : null,
    w.case.status === 'published' ? h('button', { class: 's', onclick: () => act(() => post(`/cases/${caseId}/status`, { status: 'closed' }), 'abgeschlossen') }, 'abschließen') : null);

  // 1 Objekte und Scope
  const s1 = h('section', {}, h('h2', {}, '1 · Objekte und Scope'),
    h('div', { class: 'tw' }, h('table', {}, h('tbody', {}, w.objects.map((o) => h('tr', {}, h('td', {}, o.name), h('td', {}, de(o.object_type) || o.object_type), h('td', { class: 'muted' }, o.boundaries)))))),
    w.organizationId ? h('div', { class: 'grid2' }, field('Art', sel('otype', OBJECT)), field('Bezeichnung', h('input', { id: 'oname' })), field('Version', h('input', { id: 'over' })), field('Grenzen (Pflicht)', h('input', { id: 'obound' }))) : h('p', { class: 'muted' }, 'Anfrage ohne Organisation – Objekte erst nach Zuordnung.'),
    w.organizationId ? h('div', { class: 'row' }, h('button', { class: 's', onclick: () => act(() => post('/objects', { organizationId: w.organizationId, type: val('otype'), name: val('oname'), version: val('over') || undefined, boundaries: val('obound') }), 'Objekt angelegt') }, 'Objekt anlegen')) : null,
    h('h3', {}, 'Scope-Versionen'),
    h('div', { class: 'tw' }, h('table', {}, h('tbody', {}, w.scopeDetails.map((s) => h('tr', {}, h('td', {}, `V${s.version}`), h('td', {}, pill(s.status === 'approved' ? 'freigegeben' : de(s.status), kindOf(s.status))),
      h('td', {}, s.goal, h('div', { class: 'muted' }, `${s.handling_mode} · ${s.assurance_statement} · Profil ${s.depth_profile || '–'} · ${Object.entries(s.criteria_versions || {}).map(([k, v]) => `${k}:${v}`).join(', ') || 'keine Normversion'} · Objekte: ${s.object_ids.map(objName).join(', ')}`)),
      h('td', {}, s.status === 'draft' ? h('button', { class: 'b', onclick: () => act(() => post(`/scope-versions/${s.id}/approve`), 'Scope freigegeben') }, 'freigeben') : null)))))),
    h('div', { class: 'grid2' }, field('Ziel', h('input', { id: 'sgoal', value: 'Sicherheitsbewertung als Nachweis für einen Geschäftskunden' })), field('Kriterien', h('input', { id: 'scrit', value: 'ISO/IEC 27001 Anhang A (Auswahl)' })),
      field('Modus', sel('smode', [['assisted', 'Assisted'], ['managed', 'Managed'], ['digital', 'Digital']])),
      field('Aussage', sel('sass', [['professionally_reviewed', 'fachlich reviewed'], ['indicative', 'indikativ'], ['independently_assessed', 'unabhängig geprüft']])),
      field('Prüftiefenprofil', sel('sdepth', [['2', '2 (Standard)'], ['1', '1 (Basis)'], ['3', '3 (Enhanced)'], ['4', '4 (Enhanced)']])),
      field('Normversion', sel('snorm', [['ISO/IEC 27001|2022', 'ISO/IEC 27001:2022'], ['', 'keine festlegen']]))),
    h('div', { class: 'row' }, w.objects.map((o) => h('label', { class: 'row' }, h('input', { type: 'checkbox', class: 'sobj', value: o.id, checked: true }), o.name))),
    h('div', { class: 'row' }, h('button', { class: 's', onclick: () => act(() => {
      const [k, v] = val('snorm').split('|');
      return post(`/cases/${caseId}/scope-versions`, { goal: val('sgoal'), criteria: val('scrit'), handlingMode: val('smode'), assuranceStatement: val('sass'), depthProfile: Number(val('sdepth')),
        criteriaVersions: k ? { [k]: v } : {}, objectIds: [...document.querySelectorAll('.sobj:checked')].map((x) => x.value) });
    }, 'Scope-Version angelegt') }, 'neue Scope-Version')));

  // 2 Angebot und Mandat
  const s2 = h('section', {}, h('h2', {}, '2 · Angebot und Mandat'),
    h('div', { class: 'tw' }, h('table', {}, h('tbody', {}, w.offers.map((o) => h('tr', {}, h('td', {}, `V${o.version}`), h('td', {}, pill(de(o.status), kindOf(o.status))), h('td', { class: 'muted' }, o.valid_until ? `Frist ${String(o.valid_until).slice(0, 10)}` : ''),
      h('td', {}, h('div', { class: 'row' },
        o.status === 'draft' ? h('button', { class: 'b', onclick: () => act(() => post(`/offers/${o.id}/send`), 'Angebot versandt') }, 'versenden') : null,
        o.status === 'sent' ? h('button', { class: 's dev', title: 'Nur Prototyp: simuliert die Unterschrift des Kunden', onclick: () => act(() => post(`/dev/offers/${o.id}/sign`), 'Unterschrift verarbeitet – Mandat angelegt') }, 'Unterschrift simulieren') : null))))))),
    freigegeben && !m ? h('div', { class: 'grid2' },
      field('Mandatstyp', sel('otypm', [['product_security_assessment', 'Product Security Assessment'], ['third_party_assessment', 'Third-Party Assessment'], ['gap_assessment', 'Gap Assessment'], ['initial_assessment', 'Initial Assessment']])),
      field('geplanter Start', h('input', { id: 'ostart', type: 'date', value: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10) })),
      field('Leistungsbeschreibung (Pflichtbaustein ist enthalten)', h('textarea', { id: 'odesc' }, `Sicherheitsbewertung im vereinbarten Scope (Version ${freigegeben.version}). ${PFLICHT_ANGEBOT}`)),
      h('label', { class: 'row' }, h('input', { type: 'checkbox', id: 'ocert' }), 'Kunde wünscht ein Zertifikat (Antwortbaustein wird ergänzt)')) : null,
    freigegeben && !m ? h('div', { class: 'row' }, h('button', { class: 's', onclick: () => act(() => post(`/cases/${caseId}/offers`, {
      scopeVersionId: freigegeben.id, customerId: w.organizationId, engagementType: val('otypm'), depthProfile: freigegeben.depth_profile || 2, plannedStart: val('ostart'),
      serviceDescription: val('odesc') + (checked('ocert') ? ' ' + ZERTIFIKATSWUNSCH : ''), customerWantsCertificate: checked('ocert') }), 'Angebotsentwurf angelegt') }, 'Angebotsentwurf anlegen')) : null,
    m ? h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', {}, 'Mandat'), pill(de(m.status), kindOf(m.status)), h('span', { class: 'muted' }, `${m.engagement_type} · Profil ${m.depth_profile} (${m.offered_depth})`)),
      h('div', { class: 'tw' }, h('table', {}, h('tbody', {}, w.team.map((t) => h('tr', {}, h('td', {}, t.display_name), h('td', { class: 'muted' }, t.party === 'agency' ? 'DT Agency' : 'Kunde'), h('td', {}, t.roles.join(', '))))))),
      h('div', { class: 'row' },
        sel('tperson', state.persons.map((p) => [p.id, `${p.display_name} (${p.party === 'agency' ? 'DT Agency' : 'Kunde'})`])),
        sel('trole', [['independent_reviewer', 'Independent Reviewer (QA)'], ['consultant', 'Consultant'], ['junior_consultant', 'Junior Consultant'], ['subject_matter_expert', 'Fachexperte'],
          ['executive_sponsor', 'Kunde: Executive Sponsor'], ['risk_owner', 'Kunde: Risk Owner'], ['evidence_contributor', 'Kunde: liefert Nachweise']]),
        h('button', { class: 's', onclick: () => act(() => post(`/mandates/${m.id}/team`, { personId: val('tperson'), roles: [val('trole')] }), 'Rolle zugeordnet') }, 'Rolle zuordnen'),
        m.status === 'signed' ? h('button', { class: 'b', onclick: () => act(async () => {
          const pd = await post('/profile-decisions', { organizationId: w.organizationId, recommendedProfile: m.depth_profile, minProfile: 1, profile: m.depth_profile });
          await post(`/mandates/${m.id}/activate`, { profileDecisionId: pd.id });
        }, 'Mandat aktiv') }, 'Profil entscheiden und aktivieren') : null)) : null);

  if (!m) return [zurueck, s1, s2];

  // 3 Nachweise und Bewertung
  const s3 = h('section', {}, h('h2', {}, '3 · Nachweise und Bewertung'),
    h('div', { class: 'tw' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Nachweis'), h('th', {}, 'Stand'), h('th', {}, 'Prüfung'), h('th', {}, ''))),
      h('tbody', {}, w.evidence.map((e) => h('tr', {}, h('td', {}, e.source, h('div', { class: 'mono muted' }, (e.sha256 || '').slice(0, 16) + '…')), h('td', {}, String(e.captured_at).slice(0, 10)), h('td', {}, pill(de(e.review_state), kindOf(e.review_state))),
        h('td', {}, e.review_state === 'received' ? h('div', { class: 'row' },
          h('button', { class: 's', onclick: () => act(() => post(`/evidence/${e.id}/review`, { state: 'suitable' }), 'geprüft: geeignet') }, 'geeignet'),
          h('button', { class: 's', onclick: () => act(() => post(`/evidence/${e.id}/review`, { state: 'unsuitable' }), 'geprüft: ungeeignet') }, 'ungeeignet')) : null)))))),
    h('h3', {}, 'Bewertungen je Objekt'),
    h('div', { class: 'tw' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Control'), h('th', {}, 'Objekt'), h('th', {}, 'Umsetzung / Nachweislage / Freigabe'), h('th', {}, 'Berichtsstatus (berechnet)'), h('th', {}, 'Nachweis verknüpfen'))),
      h('tbody', {}, w.assessments.map((a) => {
        const links = w.links.filter((l) => l.control_assessment_id === a.id);
        const idp = 'ca-' + a.id.slice(0, 8);
        return h('tr', {}, h('td', {}, a.control_id, h('div', { class: 'muted' }, a.title)), h('td', {}, objName(a.object_id)),
          h('td', {}, h('div', { class: 'row' },
            sel(idp + '-i', [['unknown', 'unbekannt'], ['absent', 'nicht umgesetzt'], ['partial', 'teilweise'], ['present', 'umgesetzt']], a.implementation),
            sel(idp + '-e', [['none', 'kein Nachweis'], ['claim_only', 'nur Aussage'], ['insufficient', 'unzureichend'], ['sufficient', 'ausreichend'], ['conflicting', 'widersprüchlich']], a.evidence_state),
            sel(idp + '-a', [['open', 'offen'], ['proposed', 'vorgeschlagen'], ['verified', 'verifiziert'], ['approved', 'freigegeben']], a.approval),
            h('button', { class: 's', onclick: () => act(() => patch(`/control-assessments/${a.id}`, { implementation: val(idp + '-i'), evidenceState: val(idp + '-e'), approval: val(idp + '-a') }), 'Bewertung gespeichert') }, 'speichern'))),
          h('td', {}, pill(de(a.report_status), kindOf(a.report_status))),
          h('td', {}, links.map((l) => h('div', {}, pill(de(l.link_state), kindOf(l.link_state)), l.link_state === 'pending_review' ? h('button', { class: 's', onclick: () => act(() => post('/evidence-links/confirm', { evidenceId: l.evidence_id, controlAssessmentId: a.id, note: 'Geltungsbereich, Stand, Zulassung, Aussagekraft geprüft' }), 'Wiederverwendung bestätigt') }, 'bestätigen') : null)),
            h('div', { class: 'row' }, sel(idp + '-l', w.evidence.map((e) => [e.id, e.source])), h('button', { class: 's', onclick: () => act(() => post('/evidence-links', { evidenceId: val(idp + '-l'), controlAssessmentId: a.id, scopeVersionId: freigegeben && freigegeben.id }), 'verknüpft') }, 'verknüpfen'))));
      })))),
    h('div', { class: 'row' }, sel('nctl', w.controls.map((c) => [c.id, `${c.id} – ${c.title}`])), sel('nobj', w.objects.map((o) => [o.id, o.name])),
      h('button', { class: 's', onclick: () => act(() => post(`/mandates/${m.id}/control-assessments`, { controlId: val('nctl'), objectId: val('nobj'), baseDepth: m.depth_profile, requiredDepth: m.depth_profile, implementation: 'unknown' }), 'Bewertung angelegt') }, 'Bewertung anlegen')));

  // 4 Fragen
  const s4 = h('section', {}, h('h2', {}, '4 · Offene Fragen'),
    w.questions.length ? h('ul', {}, w.questions.map((q) => h('li', {}, `${q.text} `, pill(q.materiality === 'material' ? 'entscheidungsrelevant' : 'nicht entscheidungsrelevant', q.materiality === 'material' ? 'p-warn' : ''), ' ', pill(q.state),
      q.limitation_ref ? h('span', { class: 'muted' }, ` · als Einschränkung: ${q.limitation_ref}`) : null,
      ['open', 'unknown'].includes(q.state) && !q.limitation_ref ? h('button', { class: 's', onclick: () => act(() => patch(`/questions/${q.id}`, { limitationRef: prompt('Als Einschränkung ausweisen (Text für den Bericht)') || '' }), 'als Einschränkung ausgewiesen') }, 'als Einschränkung ausweisen') : null,
      ['open', 'unknown'].includes(q.state) ? h('button', { class: 's', onclick: () => act(() => patch(`/questions/${q.id}`, { state: 'answered' }), 'beantwortet') }, 'beantwortet') : null))) : h('p', { class: 'muted' }, 'keine'),
    h('div', { class: 'row' }, h('input', { id: 'qtext', placeholder: 'z. B. Wie läuft der Updateprozess der App?' }), sel('qmat', [['material', 'entscheidungsrelevant'], ['nonmaterial', 'nicht entscheidungsrelevant']]), sel('qstate', [['open', 'offen'], ['unknown', 'unbekannt']]),
      h('button', { class: 's', onclick: () => act(() => post(`/cases/${caseId}/questions`, { code: 'Q', text: val('qtext'), materiality: val('qmat'), state: val('qstate') }), 'Frage angelegt') }, 'Frage anlegen')));

  // 5 KI-Vorschläge
  const s5 = h('section', {}, h('h2', {}, '5 · KI-Vorschläge'),
    h('p', { class: 'muted' }, 'Die KI schlägt nur vor – mit Fundstelle. Annehmen, korrigieren, ablehnen oder vertagen entscheidet ein Mensch. Gesperrte Stände ändert die KI nie.'),
    h('div', { class: 'tw' }, h('table', {}, h('tbody', {}, w.proposals.map((p) => h('tr', {}, h('td', {}, pill(de(p.status), kindOf(p.status))),
      h('td', {}, JSON.stringify(p.payload), h('div', { class: 'muted' }, `Fundstelle: ${(p.sources || []).map((s) => s.locator).join('; ')} · ${p.model} / ${p.prompt_version} · Unsicherheit: ${p.uncertainty}`), p.original_payload ? h('div', { class: 'muted' }, 'korrigiert; KI-Fassung: ' + JSON.stringify(p.original_payload)) : null),
      h('td', {}, h('div', { class: 'row' },
        ['ai_proposed', 'deferred_with_owner_impact_trigger'].includes(p.status) ? h('button', { class: 's', onclick: () => act(() => post(`/proposals/${p.id}/review`, { action: 'start_review' }), 'in Prüfung') }, 'prüfen') : null,
        p.status === 'in_review' ? h('button', { class: 'b', onclick: () => act(() => post(`/proposals/${p.id}/review`, { action: 'accept' }), 'verifiziert') }, 'annehmen') : null,
        p.status === 'in_review' ? h('button', { class: 's', onclick: () => act(() => post(`/proposals/${p.id}/review`, { action: 'reject', reason: prompt('Begründung der Ablehnung') || '' }), 'abgelehnt') }, 'ablehnen') : null,
        ['ai_proposed', 'in_review'].includes(p.status) ? h('button', { class: 's', onclick: () => act(() => post(`/proposals/${p.id}/review`, { action: 'defer', owner: state.person.display_name, impact: 'Bewertung bleibt offen', trigger: prompt('Wann wieder aufnehmen?') || '' }), 'vertagt') }, 'vertagen') : null,
        p.status === 'verified' ? h('button', { class: 's', onclick: () => act(() => post(`/proposals/${p.id}/review`, { action: 'lock' }), 'gesperrt') }, 'sperren') : null))))))),
    w.assessments.length && w.evidence.length ? h('div', { class: 'row' }, sel('pca', w.assessments.map((a) => [a.id, `${a.control_id} · ${objName(a.object_id)}`])), sel('pev', w.evidence.map((e) => [e.id, e.source])),
      h('button', { class: 's dev', title: 'Nur Prototyp: legt über die echte KI-Sitzung einen festen Platzhalter-Vorschlag an', onclick: () => act(() => post(`/dev/mandates/${m.id}/simulate-proposal`, { assessmentId: val('pca'), evidenceId: val('pev') }), 'KI-Vorschlag angelegt') }, 'KI-Vorschlag simulieren')) : null);

  // 6 Bericht und QA
  const s6 = h('section', {}, h('h2', {}, '6 · Bericht, QA und Veröffentlichung'),
    h('div', { class: 'tw' }, h('table', {}, h('tbody', {}, w.reports.map((r) => h('tr', {}, h('td', {}, `V${r.version}`), h('td', {}, pill(de(r.status), kindOf(r.status))), h('td', { class: 'muted' }, r.qa_decision || ''),
      h('td', {}, h('div', { class: 'row' },
        r.status === 'draft' ? h('button', { class: 's', onclick: () => act(() => post(`/reports/${r.id}/submit`), 'an QA übergeben') }, 'an QA übergeben') : null,
        r.status === 'in_qa' ? h('button', { class: 'b', onclick: () => act(() => post(`/reports/${r.id}/qa`, { decision: 'approve' }), 'QA: freigegeben') }, 'QA: freigeben') : null,
        r.status === 'in_qa' ? h('button', { class: 's', onclick: () => act(() => post(`/reports/${r.id}/qa`, { decision: 'approve_with_explicit_limitations', limitations: prompt('Einschränkungen (jede offene Unbekannte nennen)') || '' }), 'QA: mit Einschränkungen freigegeben') }, 'QA: mit Einschränkungen') : null,
        r.status === 'in_qa' ? h('button', { class: 's', onclick: () => act(() => post(`/reports/${r.id}/qa`, { decision: 'return_for_rework', reason: prompt('Was ist nachzuarbeiten?') || '', issues: [{ kind: prompt('Art: missing_evidence, scope, requirements, assessment oder report', 'missing_evidence') || 'report', ref: 'QA', text: 'QA' }] }), 'QA: zurückgegeben') }, 'QA: zurückgeben') : null,
        r.status === 'approved' ? h('button', { class: 'b', onclick: () => act(async () => { if (w.case.status !== 'approved') await post(`/cases/${caseId}/status`, { status: 'approved' }); await post(`/reports/${r.id}/publish`); }, 'veröffentlicht und gesperrt') }, 'veröffentlichen') : null,
        h('button', { class: 's', onclick: () => open(() => viewSpur(caseId, r.id)) }, 'Spurprotokoll')))))))),
    freigegeben ? h('div', { class: 'grid2' },
      field('Berichtstext (Pflichtsatz ist enthalten)', h('textarea', { id: 'rtext' }, `Gesamturteil und Feststellungen …\n\n${PFLICHT_BERICHT}`)),
      field('entscheidungsrelevante Unbekannte (kommagetrennt)', h('input', { id: 'runk' })),
      field('Änderungsprotokoll (ab Version 2 Pflicht)', h('input', { id: 'rlog' }))) : null,
    freigegeben ? h('div', { class: 'row' }, h('button', { class: 's', onclick: () => act(() => post(`/cases/${caseId}/reports`, { scopeVersionId: freigegeben.id, content: {}, reportText: val('rtext'),
      materialUnknowns: val('runk').split(',').map((x) => x.trim()).filter(Boolean), changeLog: val('rlog') || undefined }), 'Berichtsentwurf angelegt') }, 'Berichtsentwurf anlegen')) : null);

  return [zurueck, dashboard(await get(`/cases/${caseId}/dashboard`)), s1, s2, s3, s4, s5, s6];
}

async function viewSpur(caseId, reportId) {
  const t = await get(`/reports/${reportId}/trace`);
  const zeile = (k, v) => h('tr', {}, h('th', {}, k), h('td', {}, v));
  return [h('div', { class: 'row' }, h('button', { class: 's', onclick: () => open(() => viewFall(caseId)) }, '← Fall')),
    h('section', {}, h('h2', {}, 'Spurprotokoll'),
      t.gaps.length ? h('div', { class: 'card' }, h('h3', { class: 'gap' }, 'Lücken'), h('ul', {}, t.gaps.map((g) => h('li', { class: 'gap' }, g)))) : h('p', {}, pill('lückenlos nachvollziehbar', 'p-ok')),
      h('div', { class: 'tw' }, h('table', {}, h('tbody', {},
        zeile('Anfrage', t.intake ? `${t.intake.entry_route} · ${t.intake.goal_code || 'eigenes Anliegen'} · ${t.intake.facts.length} Angaben mit Quelle` : '–'),
        zeile('Scope', `V${t.scope.version} · ${t.scope.handling_mode} · ${t.scope.assurance_statement} · ${JSON.stringify(t.scope.criteria_versions)} · ${t.scope.objects.length} Objekte`),
        zeile('Angebot', t.offer ? `V${t.offer.version} · ${de(t.offer.status)}` : '–'),
        zeile('Mandat', t.mandate ? de(t.mandate.status) : '–'),
        zeile('Bewertungen', t.assessments.map((a) => `${a.control_id}: ${de(a.report_status)}`).join(' · ') || '–'),
        zeile('Nachweise', t.evidence.map((e) => `${e.source} (${de(e.link_state)}, ${String(e.sha256).slice(0, 12)}…)`).join(' · ') || '–'),
        zeile('KI-Vorschläge', t.proposals.map((p) => `${de(p.status)} · ${p.model}/${p.prompt_version}`).join(' · ') || '–'),
        zeile('QA', `${t.report.qa_decision || 'offen'}`),
        zeile('Bericht', `V${t.report.version} · ${de(t.report.status)}${t.report.content_sha256 ? ' · ' + t.report.content_sha256.slice(0, 16) + '…' : ''}`),
        zeile('Protokoll', `${t.events.length} Einträge`)))),
      h('h3', {}, 'Protokoll'),
      h('div', { class: 'tw' }, h('table', {}, h('tbody', {}, t.events.map((e) => h('tr', {}, h('td', { class: 'muted' }, new Date(e.occurred_at).toLocaleString('de-DE')), h('td', {}, pill(e.actor_kind, e.actor_kind === 'ai' ? 'p-ai' : '')), h('td', {}, e.event_type), h('td', { class: 'muted' }, `${e.details.from ?? ''} → ${e.details.to ?? ''}`)))))))];
}

start();
