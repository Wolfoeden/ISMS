-- 0019 · Quellen, Pilotprofil, Verbindlichkeit, Prüfmethoden – Lastenheft A-04, A-15, F-023, F-025, ENT-045
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

insert into organization (id, name) values ('00000000-0000-0000-0000-0000000019c1', 'Kunde 19 (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-0000000019a1', 'agency', null, 'Lead Assessor 19 (fiktiv)'),
  ('00000000-0000-0000-0000-0000000019d1', 'customer', '00000000-0000-0000-0000-0000000019c1', 'Kunde 19 (fiktiv)');

-- Quellen: Norm (nur Kennung) und Vertrag – unterschiedliche Elementtypen
insert into source (id, code, publisher, title, edition, kind, license_status) values
  ('00000000-0000-0000-0000-00000000195a', 'ISO/IEC 27002:2022', 'ISO/IEC', 'Information security controls', '2022', 'standard', 'reference_only'),
  ('00000000-0000-0000-0000-00000000195b', 'Vertrag-19 Anlage 3', 'Kunde 19 (fiktiv)', 'Sicherheitsanlage zum Liefervertrag', '2026-10', 'contract', 'own_wording');
insert into source_element (id, source_id, element_ref, element_type, topic) values
  ('00000000-0000-0000-0000-00000000196a', '00000000-0000-0000-0000-00000000195a', '8.3', 'control', 'Zugriffsbeschränkung'),
  ('00000000-0000-0000-0000-00000000196b', '00000000-0000-0000-0000-00000000195b', 'Ziff. 4.1', 'contract_clause', 'Rollenkonzept vertraglich zugesagt');
select pg_temp.expect_fail($$ update source set edition = '2013' where id = '00000000-0000-0000-0000-00000000195a' $$, 'Quelle unveränderlich (neue Ausgabe = neue Quelle)');

-- Mapping: Zuordnung, keine Gleichsetzung; Freigabe nur Mensch von DT Agency, danach unveränderlich
insert into source_mapping (id, from_element, to_element, mapping_type, coverage, rationale, uncertainty)
values ('00000000-0000-0000-0000-00000000197a', '00000000-0000-0000-0000-00000000196b', '00000000-0000-0000-0000-00000000196a', 'overlaps', 'partial',
        'Vertragsziffer verlangt Rollenkonzept; Control behandelt Zugriffsbeschränkung allgemein', 'Vertrag nennt keine Prüftiefe');
select set_config('app.person_id', '00000000-0000-0000-0000-0000000019d1', true);
select pg_temp.expect_fail($$ update source_mapping set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000019d1', approved_at = now()
  where id = '00000000-0000-0000-0000-00000000197a' $$, 'Kunde gibt Mapping frei');
select set_config('app.person_id', '00000000-0000-0000-0000-0000000019a1', true);
update source_mapping set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000019a1', approved_at = now() where id = '00000000-0000-0000-0000-00000000197a';
select pg_temp.expect_fail($$ update source_mapping set coverage = 'full' where id = '00000000-0000-0000-0000-00000000197a' $$, 'entschiedenes Mapping ändern');

-- Profil mit zwei Kriterien
insert into assessment_profile (id, code, version, title, rating_method)
values ('00000000-0000-0000-0000-00000000198a', '3PA-TEST', 1, 'Testprofil (fiktiv)', 'vorschriften.md §A8.3 (ENT-040), Risikohinweis qualitativ (ENT-041)');
insert into profile_criterion (id, profile_id, code, area, reference_type, question, objective) values
  ('00000000-0000-0000-0000-00000000199a', '00000000-0000-0000-0000-00000000198a', 'PRD-02', 'Produktsicherheit', 'control_reference',
   'Auf welcher Ebene werden Benutzerrechte technisch durchgesetzt?', 'Autorisierung auf allen Zugriffspfaden wirksam'),
  ('00000000-0000-0000-0000-00000000199b', '00000000-0000-0000-0000-00000000198a', 'VTR-01', 'Vertrag', 'contractual',
   'Ist das vertraglich zugesagte Rollenkonzept umgesetzt?', 'Rollenkonzept nach Vertragsziffer 4.1 umgesetzt');
insert into criterion_reference (criterion_id, element_id) values
  ('00000000-0000-0000-0000-00000000199a', '00000000-0000-0000-0000-00000000196a'),
  ('00000000-0000-0000-0000-00000000199b', '00000000-0000-0000-0000-00000000196b');

select pg_temp.expect_fail($$ update assessment_profile set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000019a1', approved_at = now()
  where id = '00000000-0000-0000-0000-00000000198a' $$, 'Profil mit offenen Kriterien freigeben');
select pg_temp.expect_fail($$ update profile_criterion set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000019a1', approved_at = now()
  where id = '00000000-0000-0000-0000-00000000199a' $$, 'unvollständiges Kriterium freigeben (Ebene, Methode, Mindestnachweis, Owner)');
update profile_criterion set level = 'product', allowed_methods = '{examine,test}', expected_evidence = '{Rechtematrix,Negativtest}',
       owner_role = 'Lead Assessor', rating_rule = 'erfüllt nur mit Negativtest je Rolle (E4)', status = 'approved',
       approved_by = '00000000-0000-0000-0000-0000000019a1', approved_at = now()
 where id = '00000000-0000-0000-0000-00000000199a';
update profile_criterion set level = 'supplier', allowed_methods = '{examine,interview}', expected_evidence = '{Rollenkonzept}',
       owner_role = 'Lead Assessor', rating_rule = 'Abgleich Vertragsziffer mit Rollenkonzept', status = 'approved',
       approved_by = '00000000-0000-0000-0000-0000000019a1', approved_at = now()
 where id = '00000000-0000-0000-0000-00000000199b';
update assessment_profile set status = 'approved', approved_by = '00000000-0000-0000-0000-0000000019a1', approved_at = now()
 where id = '00000000-0000-0000-0000-00000000198a';

-- A-15: beide Quellenarten im Prüfkatalog, mit Kennung und Ausgabe (A-04)
select pg_temp.expect_eq((select array_to_string(requirement_refs, ';') from control where id = '3PA-TEST@1:PRD-02'), 'ISO/IEC 27002:2022 8.3', 'A-04 Kennung mit Ausgabe');
select pg_temp.expect_eq((select array_to_string(requirement_refs, ';') from control where id = '3PA-TEST@1:VTR-01'), 'Vertrag-19 Anlage 3 Ziff. 4.1', 'A-15 Vertragsquelle im Katalog');
select pg_temp.expect_fail($$ update profile_criterion set question = 'geändert' where id = '00000000-0000-0000-0000-00000000199a' $$, 'Kriterium im freigegebenen Profil');
select pg_temp.expect_fail($$ update assessment_profile set title = 'geändert' where id = '00000000-0000-0000-0000-00000000198a' $$, 'freigegebenes Profil ändern');

-- Fall: Verbindlichkeit und zulässige Prüfmethoden
select set_config('app.person_id', '', true);
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by)
values ('00000000-0000-0000-0000-0000000019f1', '00000000-0000-0000-0000-0000000019c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-0000000019a1');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by)
values ('00000000-0000-0000-0000-0000000019b1', '00000000-0000-0000-0000-0000000019f1', 2, 'none', '00000000-0000-0000-0000-0000000019a1');
insert into mandate (id, customer_id, scope, engagement_type, profile_decision_id, depth_profile, status, start_date)
values ('00000000-0000-0000-0000-0000000019e1', '00000000-0000-0000-0000-0000000019c1', '3PA', 'third_party_assessment',
        '00000000-0000-0000-0000-0000000019b1', 2, 'active', '2026-11-15');
insert into mandate_participant select '00000000-0000-0000-0000-0000000019e1', id from person where id::text like '%19%';
insert into mandate_role values ('00000000-0000-0000-0000-0000000019e1', '00000000-0000-0000-0000-0000000019a1', 'engagement_lead');
insert into control_assessment (id, mandate_id, control_id, applicability, base_depth, required_depth, implementation, level) values
  ('00000000-0000-0000-0000-0000000019ca', '00000000-0000-0000-0000-0000000019e1', '3PA-TEST@1:PRD-02', 'applicable', 1, 1, 'partial', 'product');
select pg_temp.expect_fail($$ update control_assessment set approval = 'verified' where id = '00000000-0000-0000-0000-0000000019ca' $$,
  'F-023 Prüfung ohne bestätigte Verbindlichkeit');
update control_assessment set binding = 'guidance', approval = 'verified' where id = '00000000-0000-0000-0000-0000000019ca';
select pg_temp.expect_fail($$
  insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, source_ref, result, limitations)
  values ('00000000-0000-0000-0000-0000000019e1', '00000000-0000-0000-0000-0000000019ca', 'interview', '00000000-0000-0000-0000-0000000019a1', now(),
          'Entwickler', 'Gespräch 2026-11-15', 'Rechte im Backend', 'nur Aussage') $$, 'Interview für dieses Kriterium nicht zugelassen');
insert into assessment_step (mandate_id, control_assessment_id, method, performed_by, performed_at, object_examined, sample, source_ref, result, limitations)
values ('00000000-0000-0000-0000-0000000019e1', '00000000-0000-0000-0000-0000000019ca', 'test', '00000000-0000-0000-0000-0000000019a1', now(),
        'API im Testsystem', '3 Rollen × 4 Endpunkte', 'Testprotokoll T-19', '2 von 12 Aufrufen nicht abgewiesen', 'nur Testsystem');
select pg_temp.expect_eq(evidence_grade('00000000-0000-0000-0000-0000000019ca', null), 'E4', 'Test mit Stichprobe');

rollback;
