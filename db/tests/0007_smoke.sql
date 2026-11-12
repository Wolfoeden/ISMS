-- 0007 · Bewertungsobjekte, gesperrte Scope-Versionen, Bewertung je Objekt, Audit-Protokoll
\set ON_ERROR_STOP on
begin;
set search_path = isms, public;

create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ERWARTETER FEHLER BLIEB AUS: %', label;
exception when check_violation or unique_violation or insufficient_privilege then
  raise notice 'ok – abgelehnt: % (%)', label, sqlerrm;
end $$;

-- fiktive Testdaten: Einzelunternehmer mit Softwareprodukt (Pilotfall)
insert into organization (id, name) values
  ('00000000-0000-0000-0000-0000000007c1', 'Solo Dev (fiktiv)'),
  ('00000000-0000-0000-0000-0000000007c2', 'Andere GmbH (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-0000000007a1', 'agency', null, 'Lead (fiktiv)'),
  ('00000000-0000-0000-0000-0000000007c9', 'customer', '00000000-0000-0000-0000-0000000007c1', 'Inhaber (fiktiv)');
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-0000000007a5', '00000000-0000-0000-0000-0000000007c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-0000000007a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-0000000007d1', '00000000-0000-0000-0000-0000000007a5', 2, 'none', '00000000-0000-0000-0000-0000000007a1');
insert into mandate (id, customer_id, scope, engagement_type, depth_profile, start_date)
values ('00000000-0000-0000-0000-0000000007e1', '00000000-0000-0000-0000-0000000007c1', 'Pilot', 'third_party_assessment', 2, '2026-11-12');
insert into mandate_participant values
  ('00000000-0000-0000-0000-0000000007e1', '00000000-0000-0000-0000-0000000007a1'),
  ('00000000-0000-0000-0000-0000000007e1', '00000000-0000-0000-0000-0000000007c9');
insert into mandate_role values
  ('00000000-0000-0000-0000-0000000007e1', '00000000-0000-0000-0000-0000000007a1', 'engagement_lead'),
  ('00000000-0000-0000-0000-0000000007e1', '00000000-0000-0000-0000-0000000007c9', 'executive_sponsor');

insert into assessment_object (id, organization_id, object_type, name, boundaries) values
  ('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007c1', 'organization', 'Solo Dev', 'Inhaber, Arbeitsplatz, Konten'),
  ('00000000-0000-0000-0000-0000000007b2', '00000000-0000-0000-0000-0000000007c1', 'product', 'App 2.3', 'Backend, App, Build-Pipeline'),
  ('00000000-0000-0000-0000-0000000007b9', '00000000-0000-0000-0000-0000000007c2', 'product', 'Fremdprodukt', 'nicht im Mandat');
insert into assessment_case (id, mandate_id, entry_route, status)
values ('00000000-0000-0000-0000-0000000007f1', '00000000-0000-0000-0000-0000000007e1', 'known_need', 'scope_draft');

-- Modus und Assurance-Aussage (02 §5.2)
select pg_temp.expect_fail($$
  insert into scope_version (case_id, version, goal, criteria, handling_mode, assurance_statement)
  values ('00000000-0000-0000-0000-0000000007f1', 9, 'x', 'x', 'digital', 'professionally_reviewed') $$,
  'Digital mit fachlich reviewter Aussage');
select pg_temp.expect_fail($$
  insert into scope_version (case_id, version, goal, criteria, handling_mode, assurance_statement)
  values ('00000000-0000-0000-0000-0000000007f1', 9, 'x', 'x', 'assisted', 'independently_assessed') $$,
  '„unabhängig geprüft“ ohne Managed');

insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement, depth_profile)
values ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-0000000007f1', 1,
        'Third-Party Security Assessment für Kunden', 'vereinbarte Kriterien (Anlage A)', 'assisted', 'professionally_reviewed', 2);
select pg_temp.expect_fail($$
  update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000007a1', approved_at = now()
   where id = '00000000-0000-0000-0000-000000000701' $$, 'Freigabe ohne Bewertungsobjekt');
insert into scope_object values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-0000000007b1'),
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-0000000007b2');
select pg_temp.expect_fail($$
  update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000007c9', approved_at = now()
   where id = '00000000-0000-0000-0000-000000000701' $$, 'Kunde gibt Scope frei');
select pg_temp.expect_fail($$
  update assessment_case set status = 'scope_approved' where id = '00000000-0000-0000-0000-0000000007f1' $$,
  'Prüfvorgang ohne freigegebenen Scope');
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000007a1', approved_at = now()
 where id = '00000000-0000-0000-0000-000000000701';

select pg_temp.expect_fail($$ update scope_version set goal = 'anders' where id = '00000000-0000-0000-0000-000000000701' $$,
  'freigegebene Scope-Version ändern');
select pg_temp.expect_fail($$ delete from scope_version where id = '00000000-0000-0000-0000-000000000701' $$,
  'freigegebene Scope-Version löschen');
select pg_temp.expect_fail($$ delete from scope_object where scope_version_id = '00000000-0000-0000-0000-000000000701' $$,
  'Objekte aus freigegebenem Scope entfernen');

-- Änderung = neue Version
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement, depth_profile)
values ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-0000000007f1', 2,
        'Third-Party Security Assessment für Kunden, erweitert um Build-Pipeline', 'vereinbarte Kriterien (Anlage A, Rev. 2)', 'assisted', 'professionally_reviewed', 2);
insert into scope_object values ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-0000000007b2');
select pg_temp.expect_fail($$
  update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000007a1', approved_at = now()
   where id = '00000000-0000-0000-0000-000000000702' $$, 'zwei gleichzeitig freigegebene Versionen');
update scope_version set status = 'superseded' where id = '00000000-0000-0000-0000-000000000701';
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000007a1', approved_at = now()
 where id = '00000000-0000-0000-0000-000000000702';
update assessment_case set status = 'scope_approved' where id = '00000000-0000-0000-0000-0000000007f1';

-- Bewertung je Objekt (ENT-021)
insert into control (id, title) values ('A.8.28', 'Sichere Entwicklung') on conflict do nothing;
insert into control_assessment (mandate_id, control_id, object_id, applicability, base_depth, required_depth) values
  ('00000000-0000-0000-0000-0000000007e1', 'A.8.28', '00000000-0000-0000-0000-0000000007b1', 'applicable', 2, 2),
  ('00000000-0000-0000-0000-0000000007e1', 'A.8.28', '00000000-0000-0000-0000-0000000007b2', 'applicable', 2, 3);
select pg_temp.expect_fail($$
  insert into control_assessment (mandate_id, control_id, object_id, applicability, base_depth, required_depth)
  values ('00000000-0000-0000-0000-0000000007e1', 'A.8.28', '00000000-0000-0000-0000-0000000007b2', 'applicable', 2, 2) $$,
  'dasselbe Control zweimal für dasselbe Objekt');
select pg_temp.expect_fail($$
  insert into control_assessment (mandate_id, control_id, object_id, applicability, base_depth, required_depth)
  values ('00000000-0000-0000-0000-0000000007e1', 'A.8.28', '00000000-0000-0000-0000-0000000007b9', 'applicable', 2, 2) $$,
  'Objekt einer fremden Organisation');

-- Audit-Protokoll
update mandate set status = 'offered' where id = '00000000-0000-0000-0000-0000000007e1';
do $$ begin
  if not exists (select 1 from isms.audit_event where object_table = 'mandate' and details ->> 'to' = 'offered'
                  and mandate_id = '00000000-0000-0000-0000-0000000007e1') then
    raise exception 'Statuswechsel Mandat nicht protokolliert';
  end if;
  if (select count(*) from isms.audit_event where object_table = 'scope_version') < 4 then
    raise exception 'Scope-Freigaben nicht protokolliert';
  end if;
  raise notice 'ok – Statuswechsel von Mandat, Scope und Bewertungen protokolliert';
end $$;
select pg_temp.expect_fail($$ delete from audit_event $$, 'Protokoll löschen');
select pg_temp.expect_fail($$ update audit_event set event_type = 'x' $$, 'Protokoll ändern');

rollback;
