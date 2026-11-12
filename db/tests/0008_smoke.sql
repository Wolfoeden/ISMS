-- 0008 · Zugriffsschutz auf allen Tabellen (TC-18 Mandantentrennung)
\set ON_ERROR_STOP on
begin;
set search_path = isms, public;

-- Struktur: jede Tabelle hat RLS und mindestens eine Richtlinie
do $$
declare r record; v_fehlt text := '';
begin
  for r in select c.relname, c.relrowsecurity,
                  (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
             from pg_class c where c.relnamespace = 'isms'::regnamespace and c.relkind = 'r' loop
    if not r.relrowsecurity or r.policies = 0 then v_fehlt := v_fehlt || ' ' || r.relname; end if;
  end loop;
  if v_fehlt <> '' then raise exception 'Tabellen ohne Zugriffsschutz:%', v_fehlt; end if;
  raise notice 'ok – alle Tabellen mit RLS und Richtlinien';
end $$;

-- fiktive Testdaten: zwei Kunden, zwei Mandate, eine Agenturperson je Mandat
insert into organization (id, name) values
  ('00000000-0000-0000-0000-0000000008c1', 'Kunde A (fiktiv)'),
  ('00000000-0000-0000-0000-0000000008c2', 'Kunde B (fiktiv)');
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-0000-0000-0000000008a1', 'agency', null, 'Lead A (fiktiv)'),
  ('00000000-0000-0000-0000-0000000008a2', 'agency', null, 'Lead B (fiktiv)'),
  ('00000000-0000-0000-0000-0000000008d1', 'customer', '00000000-0000-0000-0000-0000000008c1', 'Kontakt A (fiktiv)'),
  ('00000000-0000-0000-0000-0000000008d2', 'customer', '00000000-0000-0000-0000-0000000008c2', 'Kontakt B (fiktiv)');
insert into complexity_assessment (id, organization_id, facts, policy_version, derivation, recommended_profile, min_profile, assessed_by) values
  ('00000000-0000-0000-0000-0000000008f1', '00000000-0000-0000-0000-0000000008c1', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-0000000008a1'),
  ('00000000-0000-0000-0000-0000000008f2', '00000000-0000-0000-0000-0000000008c2', '{}', '2026-11.1', '{}', 2, 1, '00000000-0000-0000-0000-0000000008a2');
insert into profile_decision (id, complexity_assessment_id, profile, deviation, decided_by) values
  ('00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008f1', 2, 'none', '00000000-0000-0000-0000-0000000008a1'),
  ('00000000-0000-0000-0000-0000000008b2', '00000000-0000-0000-0000-0000000008f2', 2, 'none', '00000000-0000-0000-0000-0000000008a2');
insert into mandate (id, customer_id, scope, engagement_type, profile_decision_id, depth_profile, status, start_date) values
  ('00000000-0000-0000-0000-0000000008e1', '00000000-0000-0000-0000-0000000008c1', 'A', 'gap_assessment', '00000000-0000-0000-0000-0000000008b1', 2, 'active', '2026-11-12'),
  ('00000000-0000-0000-0000-0000000008e2', '00000000-0000-0000-0000-0000000008c2', 'B', 'gap_assessment', '00000000-0000-0000-0000-0000000008b2', 2, 'active', '2026-11-12');
insert into mandate_participant values
  ('00000000-0000-0000-0000-0000000008e1', '00000000-0000-0000-0000-0000000008a1'),
  ('00000000-0000-0000-0000-0000000008e1', '00000000-0000-0000-0000-0000000008d1'),
  ('00000000-0000-0000-0000-0000000008e2', '00000000-0000-0000-0000-0000000008a2'),
  ('00000000-0000-0000-0000-0000000008e2', '00000000-0000-0000-0000-0000000008d2');
insert into control (id, title) values ('A.5.15', 'Zugangssteuerung') on conflict do nothing;
insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, approval) values
  ('00000000-0000-0000-0000-0000000008e1', 'A.5.15', 'applicable', 2, 2, 'approved'),
  ('00000000-0000-0000-0000-0000000008e2', 'A.5.15', 'applicable', 2, 2, 'approved');
insert into control (id, title) values ('A.5.16', 'Identitätsmanagement') on conflict do nothing;
insert into control_assessment (mandate_id, control_id, applicability, base_depth, required_depth, approval) values
  ('00000000-0000-0000-0000-0000000008e1', 'A.5.16', 'applicable', 2, 2, 'proposed');
insert into evidence (mandate_id, kind, source, captured_at, captured_by) values
  ('00000000-0000-0000-0000-0000000008e1', 'evidence', 'Export A', '2026-11-12', '00000000-0000-0000-0000-0000000008a1'),
  ('00000000-0000-0000-0000-0000000008e2', 'evidence', 'Export B', '2026-11-12', '00000000-0000-0000-0000-0000000008a2');
insert into risk (mandate_id, title, phase, owner_id) values
  ('00000000-0000-0000-0000-0000000008e1', 'Risiko A', 'identified', '00000000-0000-0000-0000-0000000008d1'),
  ('00000000-0000-0000-0000-0000000008e2', 'Risiko B', 'identified', '00000000-0000-0000-0000-0000000008d2');
insert into effort_entry (mandate_id, person_id, activity, work_date, hours) values
  ('00000000-0000-0000-0000-0000000008e1', '00000000-0000-0000-0000-0000000008a1', 'coordination', '2026-11-12', 1);

create role isms_app_rls nologin;
grant usage on schema isms to isms_app_rls;
grant select, insert, update, delete on all tables in schema isms to isms_app_rls;
set local role isms_app_rls;

create function pg_temp.anzahl(t text) returns bigint language plpgsql as $$
declare n bigint; begin execute format('select count(*) from isms.%I', t) into n; return n; end $$;

-- ohne Anmeldung: nichts
set local app.person_id = '';
do $$ begin
  if pg_temp.anzahl('mandate') + pg_temp.anzahl('control') + pg_temp.anzahl('organization') + pg_temp.anzahl('person') <> 0 then
    raise exception 'Ohne Anmeldung sichtbar';
  end if;
  raise notice 'ok – ohne Anmeldung keine Daten';
end $$;

-- Kunde A
set local app.person_id = '00000000-0000-0000-0000-0000000008d1';
do $$ begin
  if pg_temp.anzahl('mandate') <> 1 then raise exception 'Kunde A sieht fremde Mandate'; end if;
  if pg_temp.anzahl('organization') <> 1 then raise exception 'Kunde A sieht fremde Organisationen'; end if;
  if pg_temp.anzahl('complexity_assessment') <> 1 or pg_temp.anzahl('profile_decision') <> 1 then raise exception 'Kunde A sieht fremde Einstufungen'; end if;
  if pg_temp.anzahl('control_assessment') <> 1 then raise exception 'Kunde A sieht fremde oder nicht freigegebene Bewertungen'; end if;
  if pg_temp.anzahl('evidence') <> 1 or pg_temp.anzahl('risk') <> 1 then raise exception 'Kunde A sieht fremde Nachweise/Risiken'; end if;
  if pg_temp.anzahl('person') <> 2 then raise exception 'Kunde A sieht Personen außerhalb seines Mandats'; end if;
  if pg_temp.anzahl('effort_entry') + pg_temp.anzahl('audit_event') <> 0 then raise exception 'Kunde A sieht interne Daten'; end if;
  raise notice 'ok – Kunde A sieht nur eigenes Mandat, nur Freigegebenes, keine internen Daten';
end $$;

-- Kunde A lädt einen Nachweis hoch – nur in eigenem Namen, nur „eingegangen“, nur ins eigene Mandat
insert into evidence (mandate_id, kind, source, captured_at, captured_by)
values ('00000000-0000-0000-0000-0000000008e1', 'evidence', 'Upload A', '2026-11-12', '00000000-0000-0000-0000-0000000008d1');
do $$ begin
  begin
    insert into isms.evidence (mandate_id, kind, source, captured_at, captured_by)
    values ('00000000-0000-0000-0000-0000000008e2', 'evidence', 'fremd', '2026-11-12', '00000000-0000-0000-0000-0000000008d1');
    raise exception 'Kunde A konnte in Mandat B hochladen';
  exception when insufficient_privilege or check_violation then null; end;
  begin
    insert into isms.evidence (mandate_id, kind, source, captured_at, captured_by)
    values ('00000000-0000-0000-0000-0000000008e1', 'evidence', 'im Namen anderer', '2026-11-12', '00000000-0000-0000-0000-0000000008a1');
    raise exception 'Kunde A konnte im Namen anderer hochladen';
  exception when insufficient_privilege then null; end;
  if (select count(*) from isms.control_assessment where mandate_id = '00000000-0000-0000-0000-0000000008e2') <> 0 then
    raise exception 'Kunde A sieht Bewertungen von B';
  end if;
  update isms.control_assessment set approval = 'filed' where mandate_id = '00000000-0000-0000-0000-0000000008e1';
  if found then raise exception 'Kunde A konnte eine Bewertung ändern'; end if;
  raise notice 'ok – Kunde lädt nur eigene Nachweise ins eigene Mandat und ändert keine Bewertungen';
end $$;

-- Agentur B
set local app.person_id = '00000000-0000-0000-0000-0000000008a2';
do $$ begin
  if pg_temp.anzahl('mandate') <> 1 then raise exception 'Agentur B sieht Mandat A'; end if;
  if pg_temp.anzahl('control_assessment') <> 1 or pg_temp.anzahl('evidence') <> 1 then raise exception 'Agentur B sieht Daten aus Mandat A'; end if;
  if pg_temp.anzahl('effort_entry') <> 0 then raise exception 'Agentur B sieht Aufwände aus A'; end if;
  if (select count(*) from isms.audit_event where mandate_id = '00000000-0000-0000-0000-0000000008e1') <> 0 then raise exception 'Agentur B sieht Protokoll von A'; end if;
  raise notice 'ok – Agentur sieht Mandatsdaten nur in eigenen Mandaten (inkl. Protokoll)';
end $$;

-- Agentur A
set local app.person_id = '00000000-0000-0000-0000-0000000008a1';
do $$ begin
  if pg_temp.anzahl('control_assessment') <> 2 or pg_temp.anzahl('evidence') <> 2 or pg_temp.anzahl('effort_entry') <> 1 then
    raise exception 'Agentur A sieht ihr Mandat nicht vollständig';
  end if;
  if (select count(*) from isms.audit_event where mandate_id = '00000000-0000-0000-0000-0000000008e1') = 0 then
    raise exception 'Agentur A sieht das Protokoll ihres Mandats nicht';
  end if;
  raise notice 'ok – Agentur A sieht ihr Mandat vollständig, inkl. Entwürfen und Protokoll';
end $$;

reset role;
rollback;
