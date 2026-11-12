-- Smoke-Test der Invarianten aus 0001. Läuft in einer Transaktion und rollt zurück.
\set ON_ERROR_STOP on
begin;
set search_path = isms, public;

-- Hilfsfunktion: erwartet, dass ein Statement mit check_violation/unique_violation scheitert
create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ERWARTETER FEHLER BLIEB AUS: %', label;
exception
  when check_violation or unique_violation or foreign_key_violation or insufficient_privilege then
    raise notice 'ok – abgelehnt: % (%)', label, sqlerrm;
end $$;

insert into organization (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Produktion GmbH');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-00000000a001', 'agency',   null, 'Paul (Engagement Lead)'),
  ('00000000-0000-0000-0000-00000000a002', 'agency',   null, 'Anna (Junior)'),
  ('00000000-0000-0000-0000-00000000a003', 'agency',   null, 'Thomas (QA)'),
  ('00000000-0000-0000-0000-00000000c001', 'customer', '00000000-0000-0000-0000-0000000000c1', 'Geschäftsführung'),
  ('00000000-0000-0000-0000-00000000c002', 'customer', '00000000-0000-0000-0000-0000000000c1', 'IT-Leitung');

insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000c1', '{}', '2026-11.1', '{}', 4, 4,
        '00000000-0000-0000-0000-00000000a001');

select pg_temp.expect_fail($$
  insert into profile_decision (complexity_assessment_id, profile, deviation, justification, decided_by, reviewed_by)
  values ('00000000-0000-0000-0000-0000000000a5', 3, 'downgrade', repeat('x', 40),
          '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a003') $$,
  'Profilentscheidung unter Untergrenze');

select pg_temp.expect_fail($$
  insert into profile_decision (complexity_assessment_id, profile, deviation, decided_by)
  values ('00000000-0000-0000-0000-0000000000a5', 4, 'upgrade', '00000000-0000-0000-0000-00000000a001') $$,
  'Abweichung ohne Begründung');

insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a5', 4, 'none',
        '00000000-0000-0000-0000-00000000a001');

insert into engagement_template (id, name, engagement_type, allowed_profiles, profile_source, team, deliverables)
values ('nis2-readiness', 'NIS2 Readiness', 'nis2_readiness', '{3,4}', 'pre_assessment', '[]', '[]'),
       ('sme-iso27001-readiness', 'SME ISO 27001 Readiness', 'iso27001_readiness', '{2}', 'pre_assessment', '[]', '[]');

select pg_temp.expect_fail($$
  insert into mandate (customer_id, scope, engagement_type, template_id, profile_decision_id, depth_profile, status, start_date)
  values ('00000000-0000-0000-0000-0000000000c1', 'ISMS', 'iso27001_readiness', 'sme-iso27001-readiness',
          '00000000-0000-0000-0000-0000000000d1', 4, 'active', '2026-11-01') $$,
  'Template passt nicht zum Profil');

select pg_temp.expect_fail($$
  insert into mandate (customer_id, scope, engagement_type, depth_profile, status, start_date)
  values ('00000000-0000-0000-0000-0000000000c1', 'ISMS', 'nis2_readiness', 4, 'active', '2026-11-01') $$,
  'aktives Mandat ohne Profilentscheidung');

insert into mandate (id, customer_id, scope, engagement_type, template_id, profile_decision_id, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', 'ISMS Produktion',
        'nis2_readiness', 'nis2-readiness', '00000000-0000-0000-0000-0000000000d1', 4, 'active', '2026-11-01');

insert into mandate_participant (mandate_id, person_id) select '00000000-0000-0000-0000-0000000000e1', id from person;
insert into mandate_role (mandate_id, person_id, role) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000a001', 'engagement_lead'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000a002', 'junior_consultant'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000a003', 'independent_reviewer'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000c001', 'executive_sponsor'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000c002', 'primary_contact'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000c002', 'isms_coordinator');

select pg_temp.expect_fail($$
  insert into mandate_role values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000a003', 'engagement_lead') $$,
  'zweiter Engagement Lead');
select pg_temp.expect_fail($$
  insert into mandate_role values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000c002', 'consultant') $$,
  'Agenturrolle für Kundenperson');

insert into work_assignment (mandate_id, object_type, object_id, person_id, responsibility)
values ('00000000-0000-0000-0000-0000000000e1', 'finding', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000a001', 'owner');
select pg_temp.expect_fail($$
  insert into work_assignment (mandate_id, object_type, object_id, person_id, responsibility)
  values ('00000000-0000-0000-0000-0000000000e1', 'finding', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000a002', 'owner') $$,
  'zweiter Owner');

insert into control (id, title) values ('ACC-REV', 'Access Review');
select pg_temp.expect_fail($$
  insert into control_assessment (mandate_id, control_id, applicability) values ('00000000-0000-0000-0000-0000000000e1', 'ACC-REV', 'not_applicable') $$,
  'nicht anwendbar ohne Begründung');
select pg_temp.expect_fail($$
  insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, tailored_depth)
  values ('00000000-0000-0000-0000-0000000000e1', 'ACC-REV', 'applicable', 4, 4, 2) $$,
  'Tailoring ohne Risikoakzeptanz');

insert into finding (id, mandate_id, title, severity, status, customer_response, author_id, ai_assisted) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Entwurf: Fernwartung ohne MFA', 'high', 'open', 'pending',
   '00000000-0000-0000-0000-00000000a002', true),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', 'Abgelegt und besprochen: Kein OT-Asset-Inventar', 'high', 'filed', 'discussed',
   '00000000-0000-0000-0000-00000000a002', false);

insert into finding_transition (finding_id, action, from_status, to_status, actor_id)
values ('00000000-0000-0000-0000-0000000000f2', 'approve', 'proposed', 'approved', '00000000-0000-0000-0000-00000000a001');
select pg_temp.expect_fail($$ delete from finding_transition $$, 'Verlauf löschen');

-- RLS: Sicht als nicht-privilegierte Rolle
create role isms_app_test nologin;
grant usage on schema isms to isms_app_test;
grant select on all tables in schema isms to isms_app_test;
set local role isms_app_test;

set local app.person_id = '00000000-0000-0000-0000-00000000c002';
do $$ begin
  if (select count(*) from isms.finding) <> 1 then raise exception 'Kunde sieht Entwurfs-Findings'; end if;
  raise notice 'ok – Kunde sieht nur abgelegte und besprochene Feststellungen';
end $$;

set local app.person_id = '00000000-0000-0000-0000-00000000a002';
do $$ begin
  if (select count(*) from isms.finding) <> 2 then raise exception 'Agentur sieht nicht alle Findings'; end if;
  raise notice 'ok – Agentur-Team sieht alle Findings des Mandats';
end $$;

set local app.person_id = '00000000-0000-0000-0000-000000000999';
do $$ begin
  if (select count(*) from isms.mandate) <> 0 then raise exception 'Fremde Person sieht Mandat'; end if;
  raise notice 'ok – Nicht-Teilnehmer sieht kein Mandat';
end $$;

reset role;
rollback;
