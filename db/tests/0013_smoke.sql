-- 0013 · Normversion festgelegt, Folgeprüfung bei neuer Version (TC-17); Anwendungsrolle
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

insert into organization (id, name) values ('00000000-0000-0000-0000-00000000d0c1', 'Version GmbH (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-00000000d0a1', 'agency', null, 'Lead (fiktiv)'),
  ('00000000-0000-0000-0000-00000000d0a2', 'agency', null, 'Consultant (fiktiv)');
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-00000000d0a5', '00000000-0000-0000-0000-00000000d0c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-00000000d0a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-00000000d0b5', '00000000-0000-0000-0000-00000000d0a5', 2, 'none', '00000000-0000-0000-0000-00000000d0a1');
insert into mandate (id, customer_id, scope, engagement_type, profile_decision_id, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-00000000d0e1', '00000000-0000-0000-0000-00000000d0c1', 'X', 'gap_assessment', '00000000-0000-0000-0000-00000000d0b5', 2, 'active', '2026-11-12');
insert into mandate_participant select '00000000-0000-0000-0000-00000000d0e1', id from person where id::text like '%d0a%';
insert into mandate_role values ('00000000-0000-0000-0000-00000000d0e1', '00000000-0000-0000-0000-00000000d0a1', 'engagement_lead'),
                                ('00000000-0000-0000-0000-00000000d0e1', '00000000-0000-0000-0000-00000000d0a2', 'consultant');
insert into assessment_case (id, mandate_id, entry_route, status) values ('00000000-0000-0000-0000-00000000d0f1', '00000000-0000-0000-0000-00000000d0e1', 'known_need', 'scope_draft');
insert into assessment_object (id, organization_id, object_type, name, boundaries) values ('00000000-0000-0000-0000-00000000d0b1', '00000000-0000-0000-0000-00000000d0c1', 'organization', 'X', 'Sitz');

select pg_temp.expect_fail($$
  insert into scope_version (case_id, version, goal, criteria, handling_mode, assurance_statement, criteria_versions)
  values ('00000000-0000-0000-0000-00000000d0f1', 1, 'Gap', 'ISO', 'assisted', 'professionally_reviewed', '{"ISO/IEC 27001":"2013"}') $$,
  'nicht hinterlegte Normversion');
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement, criteria_versions)
values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0f1', 1, 'Gap', 'ISO/IEC 27001', 'assisted', 'professionally_reviewed', '{"ISO/IEC 27001":"2022"}');
insert into scope_object values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d0b1');
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-00000000d0a1', approved_at = now() where id = '00000000-0000-0000-0000-00000000d001';
update assessment_case set status = 'collecting_evidence' where id = '00000000-0000-0000-0000-00000000d0f1';

-- neue Normversion während des Assessments (fiktiv)
insert into framework_version (framework, version, effective_from, supersedes, note)
values ('ISO/IEC 27001', '2022+Amd1', '2026-12-01', '2022', 'fiktive Folgeversion für den Test');
do $$ begin
  if (select count(*) from isms.version_impact where case_id = '00000000-0000-0000-0000-00000000d0f1' and decision is null) <> 1 then
    raise exception 'keine Folgeprüfung angelegt';
  end if;
  raise notice 'ok – neue Normversion erzeugt Folgeprüfung für den laufenden Prüfvorgang';
end $$;
update assessment_case set status = 'ready_for_assessment' where id = '00000000-0000-0000-0000-00000000d0f1';
update assessment_case set status = 'assessing' where id = '00000000-0000-0000-0000-00000000d0f1';
update assessment_case set status = 'internal_review' where id = '00000000-0000-0000-0000-00000000d0f1';
select pg_temp.expect_fail($$ update assessment_case set status = 'qa' where id = '00000000-0000-0000-0000-00000000d0f1' $$,
  'QA trotz offener Folgeprüfung');
select pg_temp.expect_fail($$
  update version_impact set decision = 'keep_pinned', rationale = 'Prüfung nach vereinbarter Fassung', decided_by = '00000000-0000-0000-0000-00000000d0a2', decided_at = now()
   where case_id = '00000000-0000-0000-0000-00000000d0f1' $$, 'Entscheidung durch Consultant');
update version_impact set decision = 'keep_pinned', rationale = 'Prüfung nach der vereinbarten Fassung 2022; Bericht nennt die Version',
       decided_by = '00000000-0000-0000-0000-00000000d0a1', decided_at = now() where case_id = '00000000-0000-0000-0000-00000000d0f1';
do $$ begin
  if not has_table_privilege('isms_app', 'isms.version_impact', 'select') then raise exception 'Anwendungsrolle ohne Rechte'; end if;
  raise notice 'ok – Engagement Lead entscheidet; Anwendungsrolle eingerichtet';
end $$;
update assessment_case set status = 'qa' where id = '00000000-0000-0000-0000-00000000d0f1';
rollback;
