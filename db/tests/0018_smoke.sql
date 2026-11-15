-- 0018 · Beteiligte, Ebenen, Freigaberecht nach Rolle, Scope-Bestätigung – Lastenheft A-13, A-44, A-45, A-46, F-012
\set ON_ERROR_STOP on
begin;
set search_path = isms, public;

create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ERWARTETER FEHLER BLIEB AUS: %', label;
exception
  when check_violation or unique_violation or foreign_key_violation or insufficient_privilege then
    raise notice 'ok – abgelehnt: % (%)', label, sqlerrm;
end $$;
create function pg_temp.expect_eq(ist text, soll text, label text) returns void language plpgsql as $$
begin
  if ist is distinct from soll then raise exception 'FALSCH: % – ist %, soll %', label, ist, soll; end if;
  raise notice 'ok – %: %', label, ist;
end $$;

insert into organization (id, name) values
  ('00000000-0000-0000-0000-0000000018c1', 'Auftraggeber 18 (fiktiv)'),
  ('00000000-0000-0000-0000-0000000018c2', 'Lieferant 18 (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-0000000018a1', 'agency', null, 'Lead 18 (fiktiv)'),
  ('00000000-0000-0000-0000-0000000018a2', 'agency', null, 'Consultant 18 (fiktiv)'),
  ('00000000-0000-0000-0000-0000000018a3', 'agency', null, 'Admin ohne Mandatsrolle (fiktiv)'),
  ('00000000-0000-0000-0000-0000000018d1', 'customer', '00000000-0000-0000-0000-0000000018c1', 'Zahler 18 (fiktiv)'),
  ('00000000-0000-0000-0000-0000000018d2', 'customer', '00000000-0000-0000-0000-0000000018c1', 'Risikoverantwortung 18 (fiktiv)');
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-0000000018f1', '00000000-0000-0000-0000-0000000018c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-0000000018a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-0000000018b1', '00000000-0000-0000-0000-0000000018f1', 2, 'none', '00000000-0000-0000-0000-0000000018a1');
insert into mandate (id, customer_id, scope, engagement_type, profile_decision_id, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-0000000018e1', '00000000-0000-0000-0000-0000000018c1', '3PA', 'third_party_assessment',
        '00000000-0000-0000-0000-0000000018b1', 2, 'active', '2026-11-15');
insert into mandate_participant select '00000000-0000-0000-0000-0000000018e1', id from person where id::text like '%18%';
insert into mandate_role values
  ('00000000-0000-0000-0000-0000000018e1', '00000000-0000-0000-0000-0000000018a1', 'engagement_lead'),
  ('00000000-0000-0000-0000-0000000018e1', '00000000-0000-0000-0000-0000000018a2', 'consultant'),
  ('00000000-0000-0000-0000-0000000018e1', '00000000-0000-0000-0000-0000000018d1', 'executive_sponsor'),
  ('00000000-0000-0000-0000-0000000018e1', '00000000-0000-0000-0000-0000000018d2', 'risk_owner');
-- 18a3 nimmt teil, hat aber keine Mandatsrolle (Administrationszugang)
insert into assessment_case (id, mandate_id, entry_route, status)
values ('00000000-0000-0000-0000-0000000018f9', '00000000-0000-0000-0000-0000000018e1', 'known_need', 'scope_draft');
insert into assessment_object (id, organization_id, object_type, name, version, boundaries)
values ('00000000-0000-0000-0000-0000000018b9', '00000000-0000-0000-0000-0000000018c2', 'product', 'Produkt X (fiktiv)', '4.2', 'Anwendung und Schnittstellen');

-- A-44: Beteiligte getrennt; unbekannter Betreiber bleibt offen, keine Gleichsetzung
insert into case_party (id, case_id, role, name, organization_id, status, basis, confirmed_by, confirmed_at) values
  ('00000000-0000-0000-0000-00000000181a', '00000000-0000-0000-0000-0000000018f9', 'client', 'Auftraggeber 18 (fiktiv)', '00000000-0000-0000-0000-0000000018c1',
   'confirmed', 'Beauftragung vom 2026-11-15', '00000000-0000-0000-0000-0000000018a1', now()),
  ('00000000-0000-0000-0000-00000000181b', '00000000-0000-0000-0000-0000000018f9', 'assessee', 'Lieferant 18 (fiktiv)', '00000000-0000-0000-0000-0000000018c2',
   'open', 'Angabe Auftraggeber', null, null),
  ('00000000-0000-0000-0000-00000000181c', '00000000-0000-0000-0000-0000000018f9', 'product_developer', 'Entwicklungspartner (fiktiv)', null,
   'open', 'Produktblatt', null, null),
  ('00000000-0000-0000-0000-00000000181d', '00000000-0000-0000-0000-0000000018f9', 'operator', null, null, 'open', null, null, null);
select pg_temp.expect_fail($$
  update case_party set status = 'confirmed', confirmed_by = '00000000-0000-0000-0000-0000000018a1', confirmed_at = now()
   where id = '00000000-0000-0000-0000-00000000181d' $$, 'A-44 unbekannten Betreiber bestätigen');
insert into object_relation (case_id, party_id, object_id, relation) values
  ('00000000-0000-0000-0000-0000000018f9', '00000000-0000-0000-0000-00000000181c', '00000000-0000-0000-0000-0000000018b9', 'develops'),
  ('00000000-0000-0000-0000-0000000018f9', '00000000-0000-0000-0000-00000000181d', '00000000-0000-0000-0000-0000000018b9', 'operates');
select pg_temp.expect_eq((select count(*)::text from case_party where case_id = '00000000-0000-0000-0000-0000000018f9'), '4', 'A-44 vier getrennte Beteiligte');
select pg_temp.expect_eq((select status from object_relation where relation = 'operates'), 'open', 'A-44 Betreiberbeziehung offen');

-- Kunde bestätigt nur, ändert nicht
select set_config('app.person_id', '00000000-0000-0000-0000-0000000018d1', true);
select pg_temp.expect_fail($$ update case_party set name = 'anderer Name' where id = '00000000-0000-0000-0000-00000000181b' $$, 'Kunde ändert Angabe');
update case_party set status = 'confirmed', basis = 'Kunde bestätigt im Portal', confirmed_by = '00000000-0000-0000-0000-0000000018d1', confirmed_at = now()
 where id = '00000000-0000-0000-0000-00000000181b';
select set_config('app.person_id', '', true);

-- A-13/A-45: Ebene je Ergebnis; Pflicht vor der fachlichen Prüfung im 3PA
insert into control (id, title) values ('T18.1', 'Rollenprüfung (fiktiv)'), ('T18.2', 'Lieferantensteuerung (fiktiv)');
insert into control_assessment (id, mandate_id, control_id, applicability, base_depth, required_depth, implementation) values
  ('00000000-0000-0000-0000-00000000182a', '00000000-0000-0000-0000-0000000018e1', 'T18.1', 'applicable', 1, 1, 'partial'),
  ('00000000-0000-0000-0000-00000000182b', '00000000-0000-0000-0000-0000000018e1', 'T18.2', 'applicable', 1, 1, 'absent');
select pg_temp.expect_fail($$ update control_assessment set approval = 'verified' where id = '00000000-0000-0000-0000-00000000182a' $$,
  'A-45 Prüfung ohne Ebene');
select pg_temp.expect_fail($$ update control_assessment set level = 'cross_cutting' where id = '00000000-0000-0000-0000-00000000182a' $$,
  'übergreifend ohne Begründung');
update control_assessment set level = 'product' where id = '00000000-0000-0000-0000-00000000182a';
update control_assessment set level = 'supplier' where id = '00000000-0000-0000-0000-00000000182b';

-- A-46: Freigabe nach Mandatsrolle, nicht nach Agenturzugehörigkeit
select set_config('app.person_id', '00000000-0000-0000-0000-0000000018a3', true);
select pg_temp.expect_fail($$ update control_assessment set approval = 'verified' where id = '00000000-0000-0000-0000-00000000182a' $$,
  'A-46 Admin ohne Mandatsrolle prüft fachlich');
select set_config('app.person_id', '00000000-0000-0000-0000-0000000018a2', true);
update control_assessment set approval = 'verified' where id = '00000000-0000-0000-0000-00000000182a';
select pg_temp.expect_fail($$ update control_assessment set approval = 'approved' where id = '00000000-0000-0000-0000-00000000182a' $$,
  'A-46 Consultant gibt frei');
select set_config('app.person_id', '00000000-0000-0000-0000-0000000018a1', true);
update control_assessment set approval = 'approved' where id = '00000000-0000-0000-0000-00000000182a';
select pg_temp.expect_eq((select approval from control_assessment where id = '00000000-0000-0000-0000-00000000182a'), 'approved', 'A-46 Lead gibt frei');

-- Zahler (Kunde, Executive Sponsor) kann über den Zugriffsschutz nichts freigeben
set local role isms_app;
select set_config('app.person_id', '00000000-0000-0000-0000-0000000018d1', true);
do $$
declare n int;
begin
  update isms.control_assessment set approval = 'approved' where id = '00000000-0000-0000-0000-00000000182b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Zahler konnte eine Bewertung freigeben'; end if;
  raise notice 'ok – A-46 Zahler ändert keine Bewertung (0 Zeilen)';
end $$;
reset role;

-- Restrisiko: nur die Risikoverantwortung des Kunden, nicht der Lead
insert into risk (id, mandate_id, title, phase, treatment, level) values
  ('00000000-0000-0000-0000-00000000183a', '00000000-0000-0000-0000-0000000018e1', 'Abhängigkeit von einem Entwickler (fiktiv)', 'treatment_decided', 'retain', 'supplier');
select pg_temp.expect_fail($$
  update risk set phase = 'residual_accepted', accepted_by = '00000000-0000-0000-0000-0000000018a1', accepted_at = now()
   where id = '00000000-0000-0000-0000-00000000183a' $$, 'A-46 Lead akzeptiert Restrisiko');
update risk set phase = 'residual_accepted', accepted_by = '00000000-0000-0000-0000-0000000018d2', accepted_at = now()
 where id = '00000000-0000-0000-0000-00000000183a';
select pg_temp.expect_eq((select phase from risk where id = '00000000-0000-0000-0000-00000000183a'), 'residual_accepted', 'A-46 Risikoakzeptanz durch Kundenrolle');

-- Feststellung ohne Ebene nicht prüfbar
select set_config('app.person_id', '', true);
select pg_temp.expect_fail($$
  insert into finding (mandate_id, title, severity, status, author_id)
  values ('00000000-0000-0000-0000-0000000018e1', 'Lieferantenbefund (fiktiv)', 'medium', 'verified', '00000000-0000-0000-0000-0000000018a2') $$,
  'Feststellung ohne Ebene');

-- F-012: Scope-Bestätigung getrennt
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement)
values ('00000000-0000-0000-0000-0000000018d9', '00000000-0000-0000-0000-0000000018f9', 1, 'Lieferantenbewertung Produkt X', 'Pilotprofil', 'managed', 'professionally_reviewed');
insert into scope_object values ('00000000-0000-0000-0000-0000000018d9', '00000000-0000-0000-0000-0000000018b9');
select pg_temp.expect_fail($$
  insert into scope_confirmation (scope_version_id, kind, person_id) values ('00000000-0000-0000-0000-0000000018d9', 'customer_facts', '00000000-0000-0000-0000-0000000018d1') $$,
  'Bestätigung eines Scope-Entwurfs');
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000018a1', approved_at = now() where id = '00000000-0000-0000-0000-0000000018d9';
select pg_temp.expect_eq((select string_agg(kind, ',') from scope_confirmation where scope_version_id = '00000000-0000-0000-0000-0000000018d9'),
  'assessor_scope', 'Berater bestätigt mit der Freigabe');
select pg_temp.expect_fail($$
  insert into scope_confirmation (scope_version_id, kind, person_id) values ('00000000-0000-0000-0000-0000000018d9', 'customer_facts', '00000000-0000-0000-0000-0000000018a2') $$,
  'Agentur bestätigt Kundentatsachen');
insert into scope_confirmation (scope_version_id, kind, person_id, note)
values ('00000000-0000-0000-0000-0000000018d9', 'customer_facts', '00000000-0000-0000-0000-0000000018d1', 'Systemgrenzen stimmen');
select pg_temp.expect_fail($$ delete from scope_confirmation where scope_version_id = '00000000-0000-0000-0000-0000000018d9' $$, 'Bestätigung löschen');
do $$ begin
  if (select count(*) from isms.audit_event where event_type like 'scope_confirmation.%' and mandate_id = '00000000-0000-0000-0000-0000000018e1') <> 2 then
    raise exception 'Scope-Bestätigungen nicht getrennt protokolliert';
  end if;
  raise notice 'ok – F-012 zwei getrennte Bestätigungen im Protokoll';
end $$;

rollback;
