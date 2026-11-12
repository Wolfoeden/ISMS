-- 0009 · Intake nach Variante C, Fakten, Kandidaten, offene Fragen (TC-01, TC-02, TC-09)
\set ON_ERROR_STOP on
begin;
set search_path = isms, public;

create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ERWARTETER FEHLER BLIEB AUS: %', label;
exception when check_violation or not_null_violation or unique_violation or insufficient_privilege then
  raise notice 'ok – abgelehnt: % (%)', label, sqlerrm;
end $$;

insert into organization (id, name) values ('00000000-0000-0000-0000-0000000009c1', 'Intake GmbH (fiktiv)'), ('00000000-0000-0000-0000-0000000009c2', 'Andere GmbH (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-0000000009a1', 'agency', null, 'Lead (fiktiv)'),
  ('00000000-0000-0000-0000-0000000009d1', 'customer', '00000000-0000-0000-0000-0000000009c1', 'Interessent (fiktiv)'),
  ('00000000-0000-0000-0000-0000000009d2', 'customer', '00000000-0000-0000-0000-0000000009c2', 'Andere Person (fiktiv)');

select pg_temp.expect_fail($$
  insert into intake_case (entry_route, goal_code) values ('known_need', 'software_product_security') $$,
  'Intake ohne Datenschutzhinweis');
select pg_temp.expect_fail($$
  insert into intake_case (entry_route, consent_at) values ('known_need', now()) $$,
  'Einstieg A ohne Ziel');

-- TC-01: Einstieg A, Softwareprodukt
insert into intake_case (id, entry_route, goal_code, consent_at, created_by)
values ('00000000-0000-0000-0000-0000000009f1', 'known_need', 'software_product_security', now(), '00000000-0000-0000-0000-0000000009d1');
insert into context_fact (intake_id, fact_key, value, source_type, source_ref) values
  ('00000000-0000-0000-0000-0000000009f1', 'object_type', '"product"', 'customer_input', 'Zielauswahl'),
  ('00000000-0000-0000-0000-0000000009f1', 'markets', '["DE","EU"]', 'customer_input', 'Intake-Formular');
select pg_temp.expect_fail($$
  insert into context_fact (intake_id, fact_key, value, source_type) values
  ('00000000-0000-0000-0000-0000000009f1', 'markets', '["DE"]', 'customer_input') $$, 'denselben Fakt doppelt (Ask once)');
select pg_temp.expect_fail($$
  insert into framework_candidate (intake_id, framework_code, status, reason, basis)
  values ('00000000-0000-0000-0000-0000000009f1', 'NIS2_DE_BSIG', 'applicable', 'x', 'x') $$, 'Kandidat „anwendbar“ im Intake');
select pg_temp.expect_fail($$
  insert into framework_candidate (intake_id, framework_code, status, binding_determination, reason, basis)
  values ('00000000-0000-0000-0000-0000000009f1', 'CRA', 'requires_expert_review', true, 'x', 'x') $$, 'verbindliche Einordnung im Intake');
insert into framework_candidate (intake_id, framework_code, status, reason, basis)
values ('00000000-0000-0000-0000-0000000009f1', 'CRA', 'requires_expert_review', 'Vom Kunden gewählt; fachliche Prüfung erforderlich', 'Zielauswahl; ENT-017');
select pg_temp.expect_fail($$
  update context_fact set verification_status = 'verified', verified_by = '00000000-0000-0000-0000-0000000009d1'
   where fact_key = 'markets' $$, 'Kunde verifiziert eigenen Fakt');
update context_fact set verification_status = 'verified', verified_by = '00000000-0000-0000-0000-0000000009a1' where fact_key = 'markets';

-- Wegwechsel wird protokolliert
update intake_case set entry_route = 'guided_discovery' where id = '00000000-0000-0000-0000-0000000009f1';
do $$ begin
  if not exists (select 1 from isms.audit_event where object_table = 'intake_case' and details ->> 'to' = 'guided_discovery') then
    raise exception 'Wegwechsel nicht protokolliert';
  end if;
  raise notice 'ok – Wegwechsel protokolliert';
end $$;

-- unbekannt ≠ nicht anwendbar
select pg_temp.expect_fail($$
  insert into open_question (intake_id, question_code, text, materiality, state)
  values ('00000000-0000-0000-0000-0000000009f1', 'IQ-05', 'Bereitstellung', 'material', 'not_applicable') $$, 'N/A ohne Begründung');
select pg_temp.expect_fail($$
  insert into open_question (intake_id, question_code, text, materiality, state)
  values ('00000000-0000-0000-0000-0000000009f1', 'IQ-05', 'Bereitstellung', 'material', 'deferred') $$, 'vertagt ohne Verantwortlichen und Frist');

-- TC-09: materielle Unbekannte blockiert die Bewertung im Prüfvorgang
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-0000000009a5', '00000000-0000-0000-0000-0000000009c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-0000000009a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-0000000009b1', '00000000-0000-0000-0000-0000000009a5', 2, 'none', '00000000-0000-0000-0000-0000000009a1');
insert into mandate (id, customer_id, scope, engagement_type, profile_decision_id, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-0000000009e1', '00000000-0000-0000-0000-0000000009c1', 'Produkt', 'product_security_assessment',
        '00000000-0000-0000-0000-0000000009b1', 2, 'active', '2026-11-12');
insert into mandate_participant values ('00000000-0000-0000-0000-0000000009e1', '00000000-0000-0000-0000-0000000009a1');
insert into mandate_role values ('00000000-0000-0000-0000-0000000009e1', '00000000-0000-0000-0000-0000000009a1', 'engagement_lead');
insert into assessment_case (id, mandate_id, intake_id, entry_route, status)
values ('00000000-0000-0000-0000-0000000009f2', '00000000-0000-0000-0000-0000000009e1', '00000000-0000-0000-0000-0000000009f1', 'known_need', 'scope_draft');
insert into assessment_object (id, organization_id, object_type, name, boundaries)
values ('00000000-0000-0000-0000-0000000009b2', '00000000-0000-0000-0000-0000000009c1', 'product', 'Produkt (fiktiv)', 'Backend, App');
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement)
values ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009f2', 1, 'Kundennachweis', 'vereinbarte Kriterien', 'assisted', 'professionally_reviewed');
insert into scope_object values ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000009b2');
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000009a1', approved_at = now()
 where id = '00000000-0000-0000-0000-000000000901';
update assessment_case set status = 'collecting_evidence' where id = '00000000-0000-0000-0000-0000000009f2';
update assessment_case set status = 'ready_for_assessment' where id = '00000000-0000-0000-0000-0000000009f2';
insert into open_question (id, case_id, question_code, text, materiality, state)
values ('00000000-0000-0000-0000-0000000009a9', '00000000-0000-0000-0000-0000000009f2', 'PRD-UPD', 'Updateprozess des Produkts', 'material', 'unknown');
select pg_temp.expect_fail($$ update assessment_case set status = 'assessing' where id = '00000000-0000-0000-0000-0000000009f2' $$,
  'Bewertung trotz materieller Unbekannte');
update open_question set limitation_ref = 'E-012' where id = '00000000-0000-0000-0000-0000000009a9';
update assessment_case set status = 'assessing' where id = '00000000-0000-0000-0000-0000000009f2';
update assessment_case set status = 'internal_review' where id = '00000000-0000-0000-0000-0000000009f2';
select pg_temp.expect_fail($$ update assessment_case set status = 'closed' where id = '00000000-0000-0000-0000-0000000009f2' $$,
  '„closed“ trotz ausgewiesener Einschränkung');

-- Zugriffsschutz: Interessent sieht seinen Intake, andere nicht; Kunde erfasst nur ungeprüfte eigene Angaben
create role isms_app_intake nologin;
grant usage on schema isms to isms_app_intake;
grant select, insert, update on all tables in schema isms to isms_app_intake;
set local role isms_app_intake;
set local app.person_id = '00000000-0000-0000-0000-0000000009d1';
do $$ begin
  if (select count(*) from isms.intake_case) <> 1 or (select count(*) from isms.context_fact) <> 2 then
    raise exception 'Interessent sieht seinen Intake nicht';
  end if;
  begin
    insert into isms.context_fact (intake_id, fact_key, value, source_type, verification_status, verified_by)
    values ('00000000-0000-0000-0000-0000000009f1', 'purpose', '"customer_evidence"', 'customer_input', 'verified', '00000000-0000-0000-0000-0000000009a1');
    raise exception 'Kunde konnte einen verifizierten Fakt anlegen';
  exception when insufficient_privilege or check_violation then null; end;
  insert into isms.context_fact (intake_id, fact_key, value, source_type)
  values ('00000000-0000-0000-0000-0000000009f1', 'purpose', '"customer_evidence"', 'customer_input');
  raise notice 'ok – Interessent sieht eigenen Intake und erfasst nur ungeprüfte Angaben';
end $$;
set local app.person_id = '00000000-0000-0000-0000-0000000009d2';
do $$ begin
  if (select count(*) from isms.intake_case) + (select count(*) from isms.context_fact) + (select count(*) from isms.framework_candidate) <> 0 then
    raise exception 'Fremde Person sieht Intake';
  end if;
  raise notice 'ok – fremde Person sieht keinen Intake';
end $$;
reset role;
rollback;
