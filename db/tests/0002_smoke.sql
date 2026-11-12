-- Smoke-Test der Migration 0002 (ENT-018, ENT-027, ENT-028). Läuft in einer Transaktion und rollt zurück.
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

-- Berichtsstatus: dieselben Beispiele wie test/bewertung.test.ts
select pg_temp.expect_eq(report_status('control','applicable',null,'present','not_verified','claim_only','filed',2), 'insufficient_evidence', 'MFA nur Aussage, Tiefe 2');
select pg_temp.expect_eq(report_status('control','applicable',null,'present','not_verified','sufficient','filed',2), 'met', 'MFA mit Export, Tiefe 2');
select pg_temp.expect_eq(report_status('control','applicable',null,'present','not_verified','sufficient','filed',4), 'insufficient_evidence', 'Backup ohne Test, Tiefe 4');
select pg_temp.expect_eq(report_status('control','applicable',null,'present','effective','sufficient','filed',4), 'met', 'Backup mit Test, Tiefe 4');
select pg_temp.expect_eq(report_status('control','applicable',null,'partial','not_verified','sufficient','filed',4), 'partially_met', 'teilweise, Tiefe 4');
select pg_temp.expect_eq(report_status('requirement','applicable','not_met',null,null,'claim_only','filed',null), 'not_met', 'eingestandene Lücke');
select pg_temp.expect_eq(report_status('requirement','applicable','met',null,null,'claim_only','filed',null), 'insufficient_evidence', 'behauptete Erfüllung');
select pg_temp.expect_eq(report_status('control','applicable',null,'present','not_verified','conflicting','proposed',2), 'needs_review', 'Widerspruch');

-- Testdaten
insert into organization (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Muster GmbH (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-00000000a001', 'agency', null, 'Erika Beispiel'),
  ('00000000-0000-0000-0000-00000000c001', 'customer', '00000000-0000-0000-0000-0000000000c1', 'Max Muster'),
  ('00000000-0000-0000-0000-00000000c002', 'customer', '00000000-0000-0000-0000-0000000000c1', 'Risikoeigentümerin');
insert into mandate (id, customer_id, scope, engagement_type, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', 'ISMS', 'security_assessment', 2, 'planned', '2026-11-01');
insert into mandate_participant (mandate_id, person_id) select '00000000-0000-0000-0000-0000000000e1', id from person;
insert into mandate_role values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000a001', 'engagement_lead'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000c001', 'executive_sponsor'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000c002', 'risk_owner');
insert into control (id, title) values ('A.8.5', 'Sichere Anmeldung');

-- ENT-027: Kundenreaktion erst nach Ablage
select pg_temp.expect_fail($$
  insert into finding (mandate_id, title, severity, status, customer_response, author_id)
  values ('00000000-0000-0000-0000-0000000000e1', 'x', 'low', 'approved', 'discussed', '00000000-0000-0000-0000-00000000a001') $$,
  'Kundenreaktion vor Ablage');

-- ENT-028 / R1: „ausreichend“ ohne geeigneten Nachweis scheitert am Transaktionsende
savepoint s1;
set constraints all immediate;
select pg_temp.expect_fail($$
  insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, implementation, evidence_state, approval)
  values ('00000000-0000-0000-0000-0000000000e1', 'A.8.5', 'applicable', 2, 2, 'present', 'sufficient', 'filed') $$,
  'R1 ausreichend ohne Nachweis');
rollback to savepoint s1;

insert into evidence (id, mandate_id, kind, source, captured_at, captured_by, review_state, reviewed_by, reviewed_at)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 'evidence', 'Export IdP', '2026-11-20',
        '00000000-0000-0000-0000-00000000a001', 'suitable', '00000000-0000-0000-0000-00000000a001', now());
select pg_temp.expect_fail($$
  insert into evidence (mandate_id, kind, source, captured_at, captured_by, review_state)
  values ('00000000-0000-0000-0000-0000000000e1', 'claim', 'Interview', '2026-11-20', '00000000-0000-0000-0000-00000000a001', 'suitable') $$,
  'Aussage kann nicht als geeignet geprüft werden');

insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, implementation, evidence_state, approval)
values ('00000000-0000-0000-0000-0000000000e1', 'A.8.5', 'applicable', 2, 2, 'present', 'sufficient', 'filed');
insert into assessment_evidence (evidence_id, control_mandate_id, control_id)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 'A.8.5');
set constraints all immediate;
select pg_temp.expect_eq((select report_status from control_assessment where control_id = 'A.8.5'), 'met', 'mit geeignetem Nachweis berechnet');
set constraints all deferred;

select pg_temp.expect_fail($$
  update control_assessment set evidence_state = 'conflicting' where control_id = 'A.8.5' $$,
  'R5 widersprüchlich und abgelegt');
select pg_temp.expect_fail($$
  insert into requirement_assessment (mandate_id, framework, edition, clause, mandatory, applicability, justification, decision_ref, approval)
  values ('00000000-0000-0000-0000-0000000000e1', 'ISO/IEC 27001', '2022', '6.1.2', true, 'not_applicable', 'x', 'E-001', 'filed') $$,
  'R4 Pflichtanforderung nicht anwendbar');

-- ENT-028: Restrisiko nur durch Risk Owner; Wirksamkeit nur mit geeignetem Nachweis
select pg_temp.expect_fail($$
  insert into risk (mandate_id, title, phase, treatment, accepted_by, accepted_at)
  values ('00000000-0000-0000-0000-0000000000e1', 'r', 'residual_accepted', 'retain', '00000000-0000-0000-0000-00000000c001', now()) $$,
  'Restrisiko durch Nicht-Risk-Owner');
insert into risk (mandate_id, title, phase, treatment, accepted_by, accepted_at)
values ('00000000-0000-0000-0000-0000000000e1', 'r', 'residual_accepted', 'retain', '00000000-0000-0000-0000-00000000c002', now());
do $$ begin raise notice 'ok – Restrisiko durch Risk Owner akzeptiert'; end $$;
select pg_temp.expect_fail($$
  insert into measure (mandate_id, title, phase) values ('00000000-0000-0000-0000-0000000000e1', 'm', 'decided') $$,
  'beschlossene Maßnahme ohne Verantwortliche/Frist');
update evidence set review_state = 'unsuitable' where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.expect_fail($$
  insert into measure (mandate_id, title, phase, responsible_id, due_date, evidence_id)
  values ('00000000-0000-0000-0000-0000000000e1', 'm', 'effectiveness_confirmed', '00000000-0000-0000-0000-00000000c001', '2027-01-31', '00000000-0000-0000-0000-0000000000b1') $$,
  'Wirksamkeit mit ungeeignetem Nachweis');

rollback;
