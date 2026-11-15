-- 0017 · Bewertungsmatrix (ENT-040) und Prüfschritt-Protokoll – Lastenheft A-29, A-30, A-31
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

-- fiktive Testdaten
insert into organization (id, name) values ('00000000-0000-0000-0000-0000000017c1', 'Lieferant 17 (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-0000000017a1', 'agency', null, 'Lead 17 (fiktiv)'),
  ('00000000-0000-0000-0000-0000000017a2', 'agency', null, 'Koordination 17 (fiktiv)'),
  ('00000000-0000-0000-0000-0000000017d1', 'customer', '00000000-0000-0000-0000-0000000017c1', 'Kunde 17 (fiktiv)');
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-0000000017f1', '00000000-0000-0000-0000-0000000017c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-0000000017a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-0000000017b1', '00000000-0000-0000-0000-0000000017f1', 2, 'none', '00000000-0000-0000-0000-0000000017a1');
insert into mandate (id, customer_id, scope, engagement_type, profile_decision_id, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-0000000017c1', '3PA', 'third_party_assessment',
        '00000000-0000-0000-0000-0000000017b1', 2, 'active', '2026-11-15');
insert into mandate_participant select '00000000-0000-0000-0000-0000000017e1', id from person where id::text like '%17%';
insert into mandate_role values
  ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-0000000017a1', 'engagement_lead'),
  ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-0000000017a2', 'engagement_coordinator'),
  ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-0000000017d1', 'primary_contact');
insert into control (id, title) values ('T17.1', 'Richtlinie Zugriffsschutz (fiktiv)'), ('T17.2', 'Außerhalb (fiktiv)'), ('T17.3', 'Ungeklärt (fiktiv)');
insert into control_assessment (id, mandate_id, control_id, applicability, base_depth, required_depth, implementation, level) values
  ('00000000-0000-0000-0000-00000000171a', '00000000-0000-0000-0000-0000000017e1', 'T17.1', 'applicable', 2, 2, 'unknown', 'supplier');
insert into evidence (id, mandate_id, kind, source, captured_at, captured_by, review_state, reviewed_by, reviewed_at) values
  ('00000000-0000-0000-0000-0000000017e7', '00000000-0000-0000-0000-0000000017e1', 'evidence', 'Richtlinie v3 (fiktiv)', '2026-11-15',
   '00000000-0000-0000-0000-0000000017a1', 'suitable', '00000000-0000-0000-0000-0000000017a1', now()),
  ('00000000-0000-0000-0000-0000000017e8', '00000000-0000-0000-0000-0000000017e1', 'claim', 'Interviewnotiz (fiktiv)', '2026-11-15',
   '00000000-0000-0000-0000-0000000017a1', 'received', null, null);

-- Prüfstatus wird abgeleitet: Aussage → E1, Dokument → E2; kein Upload hebt auf E3
select pg_temp.expect_eq(evidence_grade('00000000-0000-0000-0000-00000000171a', null), 'E0', 'ohne Beleg');
insert into assessment_evidence (evidence_id, control_assessment_id) values ('00000000-0000-0000-0000-0000000017e8', '00000000-0000-0000-0000-00000000171a');
select pg_temp.expect_eq(evidence_grade('00000000-0000-0000-0000-00000000171a', null), 'E1', 'nur Eigenauskunft');
insert into assessment_evidence (evidence_id, control_assessment_id) values ('00000000-0000-0000-0000-0000000017e7', '00000000-0000-0000-0000-00000000171a');
select pg_temp.expect_eq(evidence_grade('00000000-0000-0000-0000-00000000171a', null), 'E2', 'Dokument verknüpft, geprüft „geeignet“, aber ohne Prüfschritt');

-- A-29: „ausreichend“ ohne protokollierten Prüfschritt scheitert
savepoint a29;
set constraints all immediate;
select pg_temp.expect_fail($$ update control_assessment set evidence_state = 'sufficient' where id = '00000000-0000-0000-0000-00000000171a' $$,
  'A-29 ausreichend bei E2');
rollback to savepoint a29;

-- A-31: Prüfschritt nur durch Menschen mit fachlicher Rolle, nur für sich selbst, unveränderlich
select set_config('app.person_id', '00000000-0000-0000-0000-0000000017a2', true);
select pg_temp.expect_fail($$
  insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, source_ref, result, limitations)
  values ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-00000000171a', 'examine', '00000000-0000-0000-0000-0000000017a2', now(), 'Richtlinie', 'S. 2', 'x', 'y') $$,
  'A-31 Koordination ohne fachliche Rolle');
select pg_temp.expect_fail($$
  insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, source_ref, result, limitations)
  values ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-00000000171a', 'examine', '00000000-0000-0000-0000-0000000017a1', now(), 'Richtlinie', 'S. 2', 'x', 'y') $$,
  'A-31 Schritt im Namen einer anderen Person');
select set_config('app.person_id', '00000000-0000-0000-0000-0000000017d1', true);
select pg_temp.expect_fail($$
  insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, source_ref, result, limitations)
  values ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-00000000171a', 'examine', '00000000-0000-0000-0000-0000000017d1', now(), 'Richtlinie', 'S. 2', 'x', 'y') $$,
  'A-31 Kunde protokolliert Prüfschritt');
select set_config('app.person_id', '00000000-0000-0000-0000-0000000017a1', true);
select set_config('app.actor_kind', 'ai', true);
select pg_temp.expect_fail($$
  insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, source_ref, result, limitations)
  values ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-00000000171a', 'test', '00000000-0000-0000-0000-0000000017a1', now(), 'App', 'Testfall 1', 'bestanden', 'keine') $$,
  'A-31 KI behauptet Durchführung');
select set_config('app.actor_kind', '', true);
select pg_temp.expect_fail($$
  insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, source_ref, result, limitations)
  values ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-00000000171a', 'test', '00000000-0000-0000-0000-0000000017a1', now(), 'App', 'Testfall 1', 'bestanden', 'nur Rolle Leser') $$,
  'Test ohne Stichprobe');

-- Dokumentprüfung durch den Lead → E3
insert into assessment_step (id, mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, source_ref, evidence_id, result, limitations)
values ('00000000-0000-0000-0000-00000000175a', '00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-00000000171a', 'examine',
        '00000000-0000-0000-0000-0000000017a1', now(), 'Richtlinie Zugriffsschutz v3', 'Abschnitt 4.2', '00000000-0000-0000-0000-0000000017e7',
        'Regelung zu Rollen und Rezertifizierung beschrieben', 'nur Dokument; Durchsetzung nicht geprüft');
select pg_temp.expect_eq(evidence_grade('00000000-0000-0000-0000-00000000171a', null), 'E3', 'nach Dokumentprüfung');
select pg_temp.expect_fail($$ update assessment_step set result = 'geändert' where id = '00000000-0000-0000-0000-00000000175a' $$, 'Prüfschritt unveränderlich');
do $$ begin
  if not exists (select 1 from isms.audit_event where object_table = 'assessment_step' and object_id = '00000000-0000-0000-0000-00000000175a'
                   and mandate_id = '00000000-0000-0000-0000-0000000017e1') then
    raise exception 'Prüfschritt nicht protokolliert';
  end if;
  raise notice 'ok – Prüfschritt im Mandatsprotokoll';
end $$;

-- A-30: Beleg geprüft (E3, ausreichend für die Aussage), Umsetzung bleibt offen → nicht bewertet, nie „erfüllt“
update control_assessment set evidence_state = 'sufficient' where id = '00000000-0000-0000-0000-00000000171a';
set constraints all immediate;
select pg_temp.expect_eq((select report_status from control_assessment where id = '00000000-0000-0000-0000-00000000171a'), 'not_assessed',
  'A-30 Dokument geprüft, Umsetzung unbekannt');
set constraints all deferred;

-- Wirksamkeit: „wirksam“ nur mit Stichprobe; „nicht nachgewiesen“ ≠ „nicht wirksam“
update control_assessment set implementation = 'present' where id = '00000000-0000-0000-0000-00000000171a';
savepoint w;
set constraints all immediate;
select pg_temp.expect_fail($$ update control_assessment set effectiveness = 'effective' where id = '00000000-0000-0000-0000-00000000171a' $$,
  'wirksam ohne Stichprobe');
rollback to savepoint w;
update control_assessment set effectiveness = 'not_demonstrated' where id = '00000000-0000-0000-0000-00000000171a';
select pg_temp.expect_eq((select report_status from control_assessment where id = '00000000-0000-0000-0000-00000000171a'), 'insufficient_evidence',
  'Wirksamkeit nicht nachgewiesen → nicht ausreichend beurteilbar, keine Lücke');
insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, sample, source_ref, result, limitations)
values ('00000000-0000-0000-0000-0000000017e1', '00000000-0000-0000-0000-00000000171a', 'test', '00000000-0000-0000-0000-0000000017a1', now(),
        'Rechteprüfung im Testsystem', '5 von 40 Benutzerkonten, zufällig', 'Testprotokoll 2026-11-15', 'Rechte entsprechen der Rollenmatrix',
        'nur Testsystem; Stichprobe 5/40');
select pg_temp.expect_eq(evidence_grade('00000000-0000-0000-0000-00000000171a', null), 'E4', 'nach Test mit Stichprobe');
update control_assessment set effectiveness = 'effective' where id = '00000000-0000-0000-0000-00000000171a';
set constraints all immediate;
select pg_temp.expect_eq((select report_status from control_assessment where id = '00000000-0000-0000-0000-00000000171a'), 'met',
  'umgesetzt, geprüft, Stichprobe wirksam');
set constraints all deferred;

-- Prüfbezug: außerhalb ist keine Nichtanwendbarkeit; ungeklärt ist nicht abschließbar
select pg_temp.expect_fail($$
  insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, scope_relation)
  values ('00000000-0000-0000-0000-0000000017e1', 'T17.2', 'applicable', 1, 1, 'out_of_scope') $$, 'außerhalb ohne Begründung');
insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, scope_relation, scope_note)
values ('00000000-0000-0000-0000-0000000017e1', 'T17.2', 'applicable', 1, 1, 'out_of_scope', 'Rechenzentrum des Betreibers nicht beauftragt (Scope v1)');
select pg_temp.expect_eq((select report_status from control_assessment where control_id = 'T17.2'), 'out_of_scope', 'Scope-Ausschluss');
select pg_temp.expect_fail($$
  insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, scope_relation, approval, level)
  values ('00000000-0000-0000-0000-0000000017e1', 'T17.3', 'applicable', 1, 1, 'unclear', 'approved', 'product') $$, 'ungeklärter Prüfbezug freigegeben');

rollback;
