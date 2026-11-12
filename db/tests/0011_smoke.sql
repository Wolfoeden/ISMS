-- 0011 · Angebot, idempotente Mandatsanlage, Storno (TC-07, TC-08, TC-19, TC-20, TC-22)
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

insert into organization (id, name) values ('00000000-0000-0000-0000-00000000b0c1', 'Angebot GmbH (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-00000000b0a1', 'agency', null, 'Lead (fiktiv)'),
  ('00000000-0000-0000-0000-00000000b0d1', 'customer', '00000000-0000-0000-0000-00000000b0c1', 'Kunde (fiktiv)');
insert into assessment_case (id, entry_route, status) values ('00000000-0000-0000-0000-00000000b0f1', 'known_need', 'scope_draft');
insert into assessment_object (id, organization_id, object_type, name, boundaries)
values ('00000000-0000-0000-0000-00000000b0b1', '00000000-0000-0000-0000-00000000b0c1', 'product', 'App (fiktiv)', 'Backend, App');
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement, depth_profile)
values ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000b0f1', 1, 'Kundennachweis', 'Kriterien', 'assisted', 'professionally_reviewed', 2);
insert into scope_object values ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000b0b1');

\set text '''Sicherheitsbewertung App 2.3. Dieses Angebot umfasst eine beratende Bewertung der Informationssicherheit im vereinbarten Umfang nach der beschriebenen Methodik. Es ist keine Zertifizierung und kein Audit einer akkreditierten Stelle; ein Zertifikat wird nicht ausgestellt.'''

insert into offer (id, case_id, version, scope_version_id, customer_id, engagement_type, depth_profile, planned_start, service_description, customer_wants_certificate)
values ('00000000-0000-0000-0000-00000000b0e1', '00000000-0000-0000-0000-00000000b0f1', 1, '00000000-0000-0000-0000-00000000b001',
        '00000000-0000-0000-0000-00000000b0c1', 'product_security_assessment', 2, '2026-12-01', :text, true);
select pg_temp.expect_fail($$
  update offer set status = 'sent', sent_at = '2026-11-12', valid_until = '2026-12-03' where id = '00000000-0000-0000-0000-00000000b0e1' $$,
  'Versand ohne freigegebenen Scope');
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-00000000b0a1', approved_at = now()
 where id = '00000000-0000-0000-0000-00000000b001';
select pg_temp.expect_fail($$
  update offer set status = 'sent', sent_at = '2026-11-12', valid_until = '2026-12-03' where id = '00000000-0000-0000-0000-00000000b0e1' $$,
  'Zertifikatswunsch nicht beantwortet (TC-22)');
update offer set customer_wants_certificate = false where id = '00000000-0000-0000-0000-00000000b0e1';
select pg_temp.expect_fail($$
  update offer set status = 'sent', sent_at = '2026-11-12', valid_until = '2026-12-03', service_description = 'Sicherheitsbewertung'
   where id = '00000000-0000-0000-0000-00000000b0e1' $$, 'ohne Leistungsabgrenzung (TC-22)');
update offer set status = 'sent', sent_at = '2026-11-12', valid_until = '2026-12-03' where id = '00000000-0000-0000-0000-00000000b0e1';
select pg_temp.expect_fail($$
  update offer set depth_profile = 1 where id = '00000000-0000-0000-0000-00000000b0e1' $$, 'versandtes Angebot ändern (TC-08)');

-- TC-08: Änderungswunsch → altes Angebot ersetzt, neue Version als Entwurf, kein Mandat
update offer set status = 'superseded' where id = '00000000-0000-0000-0000-00000000b0e1';
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement, depth_profile)
values ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000b0f1', 2, 'Kundennachweis inkl. Build-Pipeline', 'Kriterien Rev. 2', 'assisted', 'professionally_reviewed', 2);
insert into scope_object values ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000b0b1');
update scope_version set status = 'superseded' where id = '00000000-0000-0000-0000-00000000b001';
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-00000000b0a1', approved_at = now()
 where id = '00000000-0000-0000-0000-00000000b002';
insert into offer (id, case_id, version, scope_version_id, customer_id, engagement_type, depth_profile, planned_start, service_description, status, sent_at, valid_until)
values ('00000000-0000-0000-0000-00000000b0e2', '00000000-0000-0000-0000-00000000b0f1', 2, '00000000-0000-0000-0000-00000000b002',
        '00000000-0000-0000-0000-00000000b0c1', 'product_security_assessment', 2, '2026-12-01', :text, 'sent', current_date, current_date + 21);
do $$ begin
  if exists (select 1 from isms.mandate where offer_id is not null) then raise exception 'Mandat ohne Unterschrift entstanden'; end if;
  raise notice 'ok – Änderungswunsch: neue Scope- und Angebotsversion, kein Mandat';
end $$;

-- TC-20: Unterschrift doppelt zugestellt → genau ein Mandat
do $$
declare a uuid; b uuid; c uuid;
begin
  a := isms.handle_signed_mandate('EV-SIGN-1', '00000000-0000-0000-0000-00000000b0e2');
  b := isms.handle_signed_mandate('EV-SIGN-1', '00000000-0000-0000-0000-00000000b0e2');
  c := isms.handle_signed_mandate('EV-SIGN-2', '00000000-0000-0000-0000-00000000b0e2');
  if a <> b or a <> c or (select count(*) from isms.mandate where offer_id = '00000000-0000-0000-0000-00000000b0e2') <> 1 then
    raise exception 'mehr als ein Mandat';
  end if;
  if (select status from isms.mandate where id = a) <> 'signed'
     or (select mandate_id from isms.assessment_case where id = '00000000-0000-0000-0000-00000000b0f1') <> a
     or (select status from isms.offer where id = '00000000-0000-0000-0000-00000000b0e2') <> 'accepted' then
    raise exception 'Mandat, Prüfvorgang oder Angebot nicht korrekt verbunden';
  end if;
  raise notice 'ok – dreimal zugestellt, genau ein Mandat (signed), Prüfvorgang verbunden';
end $$;

-- TC-07: abgelaufenes Angebot → kein Mandat
insert into assessment_case (id, entry_route, status) values ('00000000-0000-0000-0000-00000000b0f2', 'known_need', 'scope_draft');
insert into scope_version (id, case_id, version, goal, criteria, handling_mode, assurance_statement)
values ('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000b0f2', 1, 'Erstbewertung', 'Kriterien', 'assisted', 'professionally_reviewed');
insert into scope_object values ('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000b0b1');
update scope_version set status = 'approved', approved_by = '00000000-0000-0000-0000-00000000b0a1', approved_at = now()
 where id = '00000000-0000-0000-0000-00000000b003';
insert into offer (id, case_id, version, scope_version_id, customer_id, engagement_type, depth_profile, planned_start, service_description, status, sent_at, valid_until)
values ('00000000-0000-0000-0000-00000000b0e3', '00000000-0000-0000-0000-00000000b0f2', 1, '00000000-0000-0000-0000-00000000b003',
        '00000000-0000-0000-0000-00000000b0c1', 'initial_assessment', 1, '2026-10-01', :text, 'sent', '2026-09-01', '2026-09-22');
select pg_temp.expect_fail($$ select isms.handle_signed_mandate('EV-SIGN-3', '00000000-0000-0000-0000-00000000b0e3') $$,
  'Unterschrift nach Fristablauf');
do $$
declare n integer;
begin
  n := isms.expire_offers();
  if n <> 1 or (select status from isms.offer where id = '00000000-0000-0000-0000-00000000b0e3') <> 'expired' then
    raise exception 'Fristablauf nicht verarbeitet';
  end if;
  if exists (select 1 from isms.mandate where offer_id = '00000000-0000-0000-0000-00000000b0e3') then raise exception 'Mandat trotz Ablauf'; end if;
  raise notice 'ok – abgelaufenes Angebot: expired, kein Mandat';
end $$;

-- TC-19: Storno nur mit dokumentierter Entscheidung; laufender Prüfvorgang stoppt
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-00000000b0a5', '00000000-0000-0000-0000-00000000b0c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-00000000b0a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-00000000b0b5', '00000000-0000-0000-0000-00000000b0a5', 2, 'none', '00000000-0000-0000-0000-00000000b0a1');
update mandate set status = 'active', profile_decision_id = '00000000-0000-0000-0000-00000000b0b5' where offer_id = '00000000-0000-0000-0000-00000000b0e2';
update assessment_case set status = 'collecting_evidence' where id = '00000000-0000-0000-0000-00000000b0f1';
select pg_temp.expect_fail($$ update mandate set status = 'terminated' where offer_id = '00000000-0000-0000-0000-00000000b0e2' $$,
  'Storno ohne dokumentierte Entscheidung');
select pg_temp.expect_fail($$
  insert into mandate_termination (mandate_id, reason, data_decision, contract_decision, decided_by)
  select id, 'Kunde widerruft', 'retain', 'erbrachte Leistungen abrechnen', '00000000-0000-0000-0000-00000000b0a1'
    from mandate where offer_id = '00000000-0000-0000-0000-00000000b0e2' $$, 'Aufbewahrung ohne Frist und Grundlage');
insert into mandate_termination (mandate_id, reason, data_decision, contract_decision, decided_by)
select id, 'Kunde widerruft Auftrag', 'delete', 'erbrachte Leistungen bis Storno abrechnen', '00000000-0000-0000-0000-00000000b0a1'
  from mandate where offer_id = '00000000-0000-0000-0000-00000000b0e2';
update mandate set status = 'terminated' where offer_id = '00000000-0000-0000-0000-00000000b0e2';
do $$ begin
  if (select status from isms.assessment_case where id = '00000000-0000-0000-0000-00000000b0f1') <> 'cancelled' then
    raise exception 'Prüfvorgang läuft nach Storno weiter';
  end if;
  raise notice 'ok – Storno mit Daten- und Vertragsentscheidung, Prüfvorgang gestoppt';
end $$;
select pg_temp.expect_fail($$
  insert into evidence (mandate_id, kind, source, captured_at, captured_by)
  select id, 'evidence', 'nach Storno', '2026-11-20', '00000000-0000-0000-0000-00000000b0a1' from mandate where offer_id = '00000000-0000-0000-0000-00000000b0e2' $$,
  'Nachweis nach Storno');

-- Kunde darf keine Mandate über die Funktion anlegen
create role isms_app_offer nologin;
grant usage on schema isms to isms_app_offer;
grant select, insert, update on all tables in schema isms to isms_app_offer;
grant execute on all functions in schema isms to isms_app_offer;
set local role isms_app_offer;
set local app.person_id = '00000000-0000-0000-0000-00000000b0d1';
select pg_temp.expect_fail($$ select isms.handle_signed_mandate('EV-X', '00000000-0000-0000-0000-00000000b0e2') $$,
  'Kunde löst Mandatsanlage aus');
do $$ begin
  if (select count(*) from isms.offer) <> 3 then raise exception 'Kunde sieht seine versandten Angebote nicht'; end if;
  raise notice 'ok – Kunde sieht seine versandten Angebote';
end $$;
reset role;
rollback;
