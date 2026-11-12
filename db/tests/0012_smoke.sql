-- 0012 · Review, QA, gesperrte Berichtsversion (TC-13, TC-15, TC-16, US-D2)
\set ON_ERROR_STOP on
begin;
set search_path = isms, public;

create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ERWARTETER FEHLER BLIEB AUS: %', label;
exception when check_violation or insufficient_privilege then
  raise notice 'ok – abgelehnt: % (%)', label, sqlerrm;
end $$;

insert into organization (id, name) values ('00000000-0000-0000-0000-00000000c0c1', 'Bericht GmbH (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-00000000c0a1', 'agency', null, 'Lead (fiktiv)'),
  ('00000000-0000-0000-0000-00000000c0a2', 'agency', null, 'QA (fiktiv)'),
  ('00000000-0000-0000-0000-00000000c0a3', 'agency', null, 'Consultant (fiktiv)'),
  ('00000000-0000-0000-0000-00000000c0d1', 'customer', '00000000-0000-0000-0000-00000000c0c1', 'Kunde (fiktiv)');
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-00000000c0a5', '00000000-0000-0000-0000-00000000c0c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-00000000c0a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-00000000c0b5', '00000000-0000-0000-0000-00000000c0a5', 2, 'none', '00000000-0000-0000-0000-00000000c0a1');
insert into mandate (id, customer_id, scope, engagement_type, profile_decision_id, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-00000000c0e1', '00000000-0000-0000-0000-00000000c0c1', 'Produkt', 'product_security_assessment', '00000000-0000-0000-0000-00000000c0b5', 2, 'active', '2026-11-12');
insert into mandate_participant select '00000000-0000-0000-0000-00000000c0e1', id from person;
insert into mandate_role values
  ('00000000-0000-0000-0000-00000000c0e1', '00000000-0000-0000-0000-00000000c0a1', 'engagement_lead'),
  ('00000000-0000-0000-0000-00000000c0e1', '00000000-0000-0000-0000-00000000c0a2', 'independent_reviewer'),
  ('00000000-0000-0000-0000-00000000c0e1', '00000000-0000-0000-0000-00000000c0a3', 'consultant');
insert into assessment_case (id, mandate_id, entry_route, status) values ('00000000-0000-0000-0000-00000000c0f1', '00000000-0000-0000-0000-00000000c0e1', 'known_need', 'scope_draft');
insert into assessment_object (id, organization_id, object_type, name, boundaries) values ('00000000-0000-0000-0000-00000000c0b1', '00000000-0000-0000-0000-00000000c0c1', 'product', 'App (fiktiv)', 'Backend, App');
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement)
values ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c0f1', 1, 'Kundennachweis', 'ISO/IEC 27001:2022 Anhang A (Auswahl)', 'assisted', 'professionally_reviewed');
insert into scope_object values ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c0b1');
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-00000000c0a1', approved_at = now() where id = '00000000-0000-0000-0000-00000000c001';
update assessment_case set status = 'collecting_evidence' where id = '00000000-0000-0000-0000-00000000c0f1';
update assessment_case set status = 'ready_for_assessment' where id = '00000000-0000-0000-0000-00000000c0f1';
update assessment_case set status = 'assessing' where id = '00000000-0000-0000-0000-00000000c0f1';
update assessment_case set status = 'internal_review' where id = '00000000-0000-0000-0000-00000000c0f1';
update assessment_case set status = 'qa' where id = '00000000-0000-0000-0000-00000000c0f1';

\set pflicht '''Bericht … Die Aussagen gelten nur für den genannten Prüfumfang und Zeitpunkt. Dieses Ergebnis ist keine Zertifizierung und kein Audit einer akkreditierten Stelle.'''

insert into report_version (id, case_id, version, scope_version_id, content, report_text, author_id, material_unknowns)
values ('00000000-0000-0000-0000-00000000c0aa', '00000000-0000-0000-0000-00000000c0f1', 1, '00000000-0000-0000-0000-00000000c001',
        '{"findings":["F-1"]}', :pflicht, '00000000-0000-0000-0000-00000000c0a1', array['Updateprozess Mobil-App']);
update report_version set status = 'in_qa' where id = '00000000-0000-0000-0000-00000000c0aa';
select pg_temp.expect_fail($$ update assessment_case set status = 'approved' where id = '00000000-0000-0000-0000-00000000c0f1' $$,
  'Prüfvorgang „approved“ ohne QA-Freigabe');

-- TC-13: Autor gibt nicht frei
select pg_temp.expect_fail($$
  update report_version set status = 'approved', qa_decision = 'approve_with_explicit_limitations', limitations = 'Updateprozess Mobil-App nicht beurteilt',
         reviewer_id = '00000000-0000-0000-0000-00000000c0a1', qa_at = now() where id = '00000000-0000-0000-0000-00000000c0aa' $$,
  'Reviewer ist Autor (TC-13)');
select pg_temp.expect_fail($$
  update report_version set status = 'approved', qa_decision = 'approve_with_explicit_limitations', limitations = 'Updateprozess Mobil-App nicht beurteilt',
         reviewer_id = '00000000-0000-0000-0000-00000000c0a3', qa_at = now() where id = '00000000-0000-0000-0000-00000000c0aa' $$,
  'QA durch Consultant statt Independent Reviewer');
-- TC-16: materielle Unbekannte → keine uneingeschränkte Freigabe; Grenzen müssen sie nennen
select pg_temp.expect_fail($$
  update report_version set status = 'approved', qa_decision = 'approve', reviewer_id = '00000000-0000-0000-0000-00000000c0a2', qa_at = now()
   where id = '00000000-0000-0000-0000-00000000c0aa' $$, 'uneingeschränkte Freigabe trotz Unbekannter');
select pg_temp.expect_fail($$
  update report_version set status = 'approved', qa_decision = 'approve_with_explicit_limitations', limitations = 'Build-Pipeline nicht geprüft',
         reviewer_id = '00000000-0000-0000-0000-00000000c0a2', qa_at = now() where id = '00000000-0000-0000-0000-00000000c0aa' $$,
  'Einschränkungen nennen die Unbekannte nicht');

-- TC-15: QA weist zurück → Zielphase, keine Veröffentlichung
select pg_temp.expect_fail($$
  update report_version set status = 'returned', qa_decision = 'return_for_rework', reviewer_id = '00000000-0000-0000-0000-00000000c0a2', qa_at = now()
   where id = '00000000-0000-0000-0000-00000000c0aa' $$, 'Rückgabe ohne Zielphase');
update report_version set status = 'returned', qa_decision = 'return_for_rework', rework_target = 'collecting_evidence', qa_reason = 'Export unvollständig',
       reviewer_id = '00000000-0000-0000-0000-00000000c0a2', qa_at = now() where id = '00000000-0000-0000-0000-00000000c0aa';
select pg_temp.expect_fail($$
  update report_version set status = 'published', published_by = '00000000-0000-0000-0000-00000000c0a1', published_at = now()
   where id = '00000000-0000-0000-0000-00000000c0aa' $$, 'zurückgewiesene Version veröffentlichen');
select pg_temp.expect_fail($$ update assessment_case set status = 'published' where id = '00000000-0000-0000-0000-00000000c0f1' $$,
  'Prüfvorgang veröffentlichen ohne gesperrte Version');
update assessment_case set status = 'rework' where id = '00000000-0000-0000-0000-00000000c0f1';
update assessment_case set status = 'qa' where id = '00000000-0000-0000-0000-00000000c0f1';

-- Version 2 nach Nacharbeit: Freigabe mit benannten Grenzen, Veröffentlichung
insert into report_version (id, case_id, version, scope_version_id, content, report_text, author_id, material_unknowns)
values ('00000000-0000-0000-0000-00000000c0ab', '00000000-0000-0000-0000-00000000c0f1', 2, '00000000-0000-0000-0000-00000000c001',
        '{"findings":["F-1"],"rev":2}', :pflicht, '00000000-0000-0000-0000-00000000c0a1', array['Updateprozess Mobil-App']);
update report_version set status = 'in_qa' where id = '00000000-0000-0000-0000-00000000c0ab';
update report_version set status = 'approved', qa_decision = 'approve_with_explicit_limitations',
       limitations = 'Nicht beurteilt: Updateprozess Mobil-App (keine Nachweise vorgelegt).',
       reviewer_id = '00000000-0000-0000-0000-00000000c0a2', qa_at = now() where id = '00000000-0000-0000-0000-00000000c0ab';
update assessment_case set status = 'approved' where id = '00000000-0000-0000-0000-00000000c0f1';
select pg_temp.expect_fail($$
  update report_version set status = 'published', published_by = '00000000-0000-0000-0000-00000000c0a3', published_at = now(),
         content_sha256 = repeat('d', 64), evidence_snapshot = '[]' where id = '00000000-0000-0000-0000-00000000c0ab' $$,
  'Veröffentlichung durch Consultant');
update report_version set status = 'published', published_by = '00000000-0000-0000-0000-00000000c0a1', published_at = now(),
       content_sha256 = repeat('d', 64), evidence_snapshot = '[{"evidence_id":"E-1","sha256":"..."}]' where id = '00000000-0000-0000-0000-00000000c0ab';
do $$ begin
  if (select status from isms.assessment_case where id = '00000000-0000-0000-0000-00000000c0f1') <> 'published' then
    raise exception 'Prüfvorgang nicht veröffentlicht';
  end if;
  raise notice 'ok – Version 2 mit benannten Grenzen veröffentlicht';
end $$;

-- US-D2: gesperrt
select pg_temp.expect_fail($$ update report_version set report_text = 'geändert' where id = '00000000-0000-0000-0000-00000000c0ab' $$,
  'veröffentlichten Bericht ändern');
select pg_temp.expect_fail($$ delete from report_version where id = '00000000-0000-0000-0000-00000000c0ab' $$, 'veröffentlichten Bericht löschen');
select pg_temp.expect_fail($$
  insert into report_version (case_id, version, scope_version_id, content, report_text, author_id, previous_id)
  values ('00000000-0000-0000-0000-00000000c0f1', 3, '00000000-0000-0000-0000-00000000c001', '{}', 'x', '00000000-0000-0000-0000-00000000c0a1',
          '00000000-0000-0000-0000-00000000c0ab') $$, 'neue Version ohne Änderungsprotokoll');
-- TC-16: Abschluss nur mit Einschränkungen
select pg_temp.expect_fail($$ update assessment_case set status = 'closed' where id = '00000000-0000-0000-0000-00000000c0f1' $$,
  '„closed“ trotz Bericht mit Einschränkungen');
update assessment_case set status = 'closed_with_limitations', limitations = 'Updateprozess Mobil-App nicht beurteilt'
 where id = '00000000-0000-0000-0000-00000000c0f1';

-- Kunde sieht nur die veröffentlichte Version
create role isms_app_report nologin;
grant usage on schema isms to isms_app_report;
grant select on all tables in schema isms to isms_app_report;
set local role isms_app_report;
set local app.person_id = '00000000-0000-0000-0000-00000000c0d1';
do $$ begin
  if (select count(*) from isms.report_version) <> 1 or (select version from isms.report_version) <> 2 then
    raise exception 'Kunde sieht Entwürfe oder zurückgewiesene Versionen';
  end if;
  raise notice 'ok – Kunde sieht nur die veröffentlichte Berichtsversion';
end $$;
reset role;
rollback;
