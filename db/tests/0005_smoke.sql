-- 0005 · Mandats- und Prüfvorgangsstatus (ENT-036), Beratungshaus (ENT-011)
\set ON_ERROR_STOP on
begin;
set search_path = isms, public;

create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ERWARTETER FEHLER BLIEB AUS: %', label;
exception when check_violation then
  raise notice 'ok – abgelehnt: % (%)', label, sqlerrm;
end $$;

insert into organization (id, name) values ('00000000-0000-0000-0000-0000000005c1', 'Fünf GmbH (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-0000000005a1', 'agency', null, 'Lead (fiktiv)');
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-0000000005a5', '00000000-0000-0000-0000-0000000005c1', '{}', '2026-11.1', '{}', 2, 1,
        '00000000-0000-0000-0000-0000000005a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-0000000005d1', '00000000-0000-0000-0000-0000000005a5', 2, 'none', '00000000-0000-0000-0000-0000000005a1');

insert into mandate (id, customer_id, scope, engagement_type, depth_profile, start_date)
values ('00000000-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-0000000005c1', 'Produkt X', 'third_party_assessment', 2, '2026-11-12');
insert into mandate_participant values ('00000000-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-0000000005a1');

do $$ begin
  if (select status || '/' || tenant_id from isms.mandate where id = '00000000-0000-0000-0000-0000000005e1') <> 'draft/dt-agency' then
    raise exception 'Standard draft/dt-agency erwartet';
  end if;
  raise notice 'ok – neues Mandat: draft, Beratungshaus dt-agency';
end $$;

select pg_temp.expect_fail($$ update mandate set status = 'active' where id = '00000000-0000-0000-0000-0000000005e1' $$,
  'draft → active übersprungen');
select pg_temp.expect_fail($$
  insert into evidence (mandate_id, kind, source, captured_at, captured_by)
  values ('00000000-0000-0000-0000-0000000005e1', 'evidence', 'Export', '2026-11-12', '00000000-0000-0000-0000-0000000005a1') $$,
  'Nachweis vor aktivem Mandat');
select pg_temp.expect_fail($$
  insert into assessment_case (mandate_id, entry_route, status)
  values ('00000000-0000-0000-0000-0000000005e1', 'known_need', 'collecting_evidence') $$,
  'Evidenzerhebung ohne aktives Mandat');

update mandate set status = 'offered' where id = '00000000-0000-0000-0000-0000000005e1';
update mandate set status = 'signed' where id = '00000000-0000-0000-0000-0000000005e1';
select pg_temp.expect_fail($$ update mandate set status = 'active' where id = '00000000-0000-0000-0000-0000000005e1' $$,
  'aktiv ohne Profilentscheidung');
update mandate set status = 'active', profile_decision_id = '00000000-0000-0000-0000-0000000005d1'
  where id = '00000000-0000-0000-0000-0000000005e1';

insert into evidence (mandate_id, kind, source, captured_at, captured_by)
values ('00000000-0000-0000-0000-0000000005e1', 'evidence', 'Export', '2026-11-12', '00000000-0000-0000-0000-0000000005a1');
insert into assessment_case (id, mandate_id, entry_route, status)
values ('00000000-0000-0000-0000-0000000005f1', '00000000-0000-0000-0000-0000000005e1', 'guided_discovery', 'collecting_evidence');

select pg_temp.expect_fail($$
  update assessment_case set status = 'closed_with_limitations' where id = '00000000-0000-0000-0000-0000000005f1' $$,
  'Abschluss mit Einschränkungen ohne benannte Grenzen');
update assessment_case set status = 'closed_with_limitations', limitations = 'Produktmodul B nicht geprüft (kein Zugang)'
  where id = '00000000-0000-0000-0000-0000000005f1';
select pg_temp.expect_fail($$ update mandate set status = 'draft' where id = '00000000-0000-0000-0000-0000000005e1' $$,
  'aktiv → draft');

rollback;
