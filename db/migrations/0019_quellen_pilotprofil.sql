-- =============================================================================
-- 0019 – P-A3 (Lastenheft Kap. 7, F-020, F-022, F-023, F-025, F-026; A-04, A-15)
--        ENT-045 (Option 1, freigegeben 2026-11-15): Pilotprofil als Entwurf, Freigabe je Kriterium
--   Quelle → Quellelement → Kriterium (mit Referenzart) → Bewertung → Bericht.
--   · Quellen und Quellelemente sind unveränderlich; neue Ausgabe = neue Quelle (Versionierung).
--   · Kein Normtext: Quellelemente tragen Kennung, eigene Themenbezeichnung, eigene Zusammenfassung.
--   · Mapping zwischen Quellelementen ist eine fachliche Zuordnung, keine Gleichsetzung;
--     mit Begründung, Abdeckung, Unsicherheit und menschlicher Freigabe.
--   · Assessmentprofil versioniert; nach Freigabe gesperrt. Freigegebene Kriterien werden als
--     Einträge im Prüfkatalog (Tabelle control) veröffentlicht – Lebenszyklus, Human Gates und
--     Berichtslogik bleiben dieselben wie für jede andere Quelle (F-025, A-15).
--   · Verbindlichkeit wird je Fall bestätigt; eine Leitlinie/Best Practice ohne bestätigte
--     Verbindlichkeit ergibt keine Nichtkonformität (F-023, Lastenheft 7.2.2).
-- =============================================================================
set search_path = isms, public;

create table source (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (length(trim(code)) > 0),   -- z. B. ISO/IEC 27002:2022
  publisher      text not null,
  title          text not null,                                         -- bibliografischer Titel, kein Inhalt
  edition        text not null,
  language       text,
  published_on   date,
  kind           text not null check (kind in ('standard', 'law', 'regulation', 'contract', 'internal', 'guideline', 'best_practice', 'method')),
  license_status text not null check (license_status in ('reference_only', 'licensed', 'public', 'own_wording', 'unclear')),
  created_at     timestamptz not null default now()
);

create table source_element (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references source,
  element_ref  text not null check (length(trim(element_ref)) > 0),     -- Klausel, Control, Artikel, Vertragsziffer …
  element_type text not null check (element_type in ('clause', 'control', 'article', 'section', 'criterion', 'contract_clause', 'internal_rule')),
  topic        text,                                                    -- eigene Themenbezeichnung (§A17.2)
  summary      text,                                                    -- eigene Zusammenfassung, nie Normtext
  unique (source_id, element_ref)
);
create trigger source_immutable before update or delete on source for each row execute function isms.append_only();
create trigger source_element_immutable before update or delete on source_element for each row execute function isms.append_only();

create table source_mapping (
  id           uuid primary key default gen_random_uuid(),
  from_element uuid not null references source_element,
  to_element   uuid not null references source_element,
  mapping_type text not null check (mapping_type in ('overlaps', 'supports', 'related')),
  coverage     text not null check (coverage in ('full', 'partial', 'minimal')),
  rationale    text not null check (length(trim(rationale)) > 0),
  uncertainty  text,
  version      integer not null default 1 check (version > 0),
  status       text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected')),
  approved_by  uuid references person,
  approved_at  timestamptz,
  check (from_element <> to_element),
  constraint mapping_approved_complete check (status = 'proposed' or (approved_by is not null and approved_at is not null))
);

-- -----------------------------------------------------------------------------
-- Assessmentprofil und Kriterien
-- -----------------------------------------------------------------------------
create table assessment_profile (
  id            uuid primary key default gen_random_uuid(),
  code          text not null check (code ~ '^[A-Z0-9][A-Z0-9-]*$'),
  version       integer not null check (version > 0),
  title         text not null,
  rating_method text not null,                          -- Verweis auf die Bewertungsmethode (vorschriften.md §A8, ENT-040/041)
  status        text not null default 'draft' check (status in ('draft', 'approved', 'superseded')),
  approved_by   uuid references person,
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (code, version),
  constraint profile_approved_complete check (status = 'draft' or (approved_by is not null and approved_at is not null))
);

create table profile_criterion (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references assessment_profile on delete cascade,
  code               text not null check (code ~ '^[A-Z0-9][A-Z0-9-]*$'),
  area               text not null,
  level              text check (level in ('supplier', 'product', 'operation', 'cross_cutting')),
  reference_type     text not null check (reference_type in (
                       'normative', 'legal', 'contractual', 'internal', 'control_reference', 'guideline', 'best_practice')),
  question           text not null check (length(trim(question)) > 0),
  objective          text,                              -- Prüfziel / Mindestziel (eigene Formulierung)
  interpretation     text,
  applicability_rule text not null default 'all',
  expected_evidence  text[] not null default '{}',
  allowed_methods    text[] not null default '{}',
  rating_rule        text,
  risk_note          text,
  followup           text,
  owner_role         text,
  status             text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected')),
  approved_by        uuid references person,
  approved_at        timestamptz,
  unique (profile_id, code),
  constraint methods_known check (allowed_methods <@ array['examine', 'interview', 'test', 'observation']),
  -- Lastenheft 7.2: freigegeben nur vollständig
  constraint criterion_approved_complete check (status <> 'approved' or (
    level is not null and cardinality(allowed_methods) > 0 and cardinality(expected_evidence) > 0
    and length(trim(coalesce(owner_role, ''))) > 0 and length(trim(coalesce(rating_rule, ''))) > 0
    and approved_by is not null and approved_at is not null))
);

create table criterion_reference (
  criterion_id uuid not null references profile_criterion on delete cascade,
  element_id   uuid not null references source_element,
  relation     text not null default 'references' check (relation in ('references', 'derived_from', 'related')),
  primary key (criterion_id, element_id)
);

-- Prüfkatalog: freigegebene Kriterien sind Katalogeinträge wie Controls
alter table control
  add column profile_criterion_id uuid references profile_criterion,
  add column catalog text not null default 'iso27002';

-- -----------------------------------------------------------------------------
-- Regeln: Freigabe nur durch Menschen von DT Agency; freigegebenes Profil gesperrt
-- -----------------------------------------------------------------------------
create function isms.human_agency_approval(p_by uuid) returns void
  language plpgsql set search_path = isms, public as $$
begin
  if isms.is_ai_session() then raise exception 'Freigabe nur durch einen Menschen' using errcode = 'insufficient_privilege'; end if;
  if isms.current_person_id() is not null and p_by <> isms.current_person_id() then
    raise exception 'Freigabe nur im eigenen Namen' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from person where id = p_by and party = 'agency') then
    raise exception 'Freigabe nur durch DT Agency' using errcode = 'insufficient_privilege';
  end if;
end $$;

create function isms.profile_rules() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
declare v_open int; v_ok int;
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'Freigegebenes Profil kann nicht gelöscht werden' using errcode = 'check_violation'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.status = 'approved' then
    if new.status = 'superseded' and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then return new; end if;
    raise exception 'Profil % v% ist freigegeben und gesperrt – Änderung nur als neue Version', old.code, old.version using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' and old.status = 'superseded' then
    raise exception 'Ersetztes Profil ist unveränderlich' using errcode = 'check_violation';
  end if;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status = 'draft') then
    perform isms.human_agency_approval(new.approved_by);
    select count(*) filter (where status = 'proposed'), count(*) filter (where status = 'approved') into v_open, v_ok
      from profile_criterion where profile_id = new.id;
    if v_open > 0 then raise exception 'Profil hat % noch nicht entschiedene Kriterien', v_open using errcode = 'check_violation'; end if;
    if v_ok = 0 then raise exception 'Profil ohne freigegebenes Kriterium' using errcode = 'check_violation'; end if;
  end if;
  return new;
end $$;
create trigger profile_rules before insert or update or delete on assessment_profile
  for each row execute function isms.profile_rules();

-- Veröffentlichung in den Prüfkatalog bei Profilfreigabe; frühere Version wird ersetzt
create function isms.publish_profile() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
begin
  if new.status = 'approved' and old.status = 'draft' then
    update assessment_profile set status = 'superseded' where code = new.code and status = 'approved' and id <> new.id;
    insert into control (id, title, requirement_refs, profile_criterion_id, catalog)
    select new.code || '@' || new.version || ':' || c.code, c.question,
           coalesce((select array_agg(s.code || ' ' || e.element_ref order by s.code, e.element_ref)
                       from criterion_reference r join source_element e on e.id = r.element_id join source s on s.id = e.source_id
                      where r.criterion_id = c.id), '{}'),
           c.id, new.code || '@' || new.version
      from profile_criterion c where c.profile_id = new.id and c.status = 'approved';
  end if;
  return new;
end $$;
create trigger publish_profile after update of status on assessment_profile
  for each row execute function isms.publish_profile();

create function isms.criterion_rules() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
declare v_status text;
begin
  select status into v_status from assessment_profile where id = coalesce(new.profile_id, old.profile_id);
  if v_status <> 'draft' then
    raise exception 'Kriterien eines freigegebenen Profils sind gesperrt' using errcode = 'check_violation';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.status in ('approved', 'rejected') and (tg_op = 'INSERT' or old.status = 'proposed') then
    perform isms.human_agency_approval(new.approved_by);
  end if;
  if tg_op = 'UPDATE' and old.status = 'approved' and new.status = 'approved' and (to_jsonb(new) <> to_jsonb(old)) then
    raise exception 'Freigegebenes Kriterium ändern: erst zurück auf „vorgeschlagen“' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger criterion_rules before insert or update or delete on profile_criterion
  for each row execute function isms.criterion_rules();

create function isms.criterion_reference_rules() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
begin
  if (select p.status from profile_criterion c join assessment_profile p on p.id = c.profile_id
       where c.id = coalesce(new.criterion_id, old.criterion_id)) <> 'draft' then
    raise exception 'Referenzen eines freigegebenen Profils sind gesperrt' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;
create trigger criterion_reference_rules before insert or update or delete on criterion_reference
  for each row execute function isms.criterion_reference_rules();

create function isms.mapping_rules() returns trigger
  language plpgsql set search_path = isms, public as $$
begin
  if new.status in ('approved', 'rejected') and (tg_op = 'INSERT' or old.status = 'proposed') then
    perform isms.human_agency_approval(new.approved_by);
  end if;
  if tg_op = 'UPDATE' and old.status <> 'proposed' then
    raise exception 'Entschiedenes Mapping ist unveränderlich – neue Version anlegen' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger mapping_rules before insert or update on source_mapping for each row execute function isms.mapping_rules();

create trigger audit_profile after insert or update of status on assessment_profile for each row execute function isms.audit_status('status');
create trigger audit_criterion after insert or update of status on profile_criterion for each row execute function isms.audit_status('status');
create trigger audit_mapping after insert or update of status on source_mapping for each row execute function isms.audit_status('status');

-- -----------------------------------------------------------------------------
-- Verbindlichkeit je Fall und zulässige Prüfmethoden
-- -----------------------------------------------------------------------------
alter table control_assessment
  add column binding text check (binding in ('mandatory', 'agreed', 'guidance', 'unclear'));

create function isms.criterion_binding_rules() returns trigger
  language plpgsql set search_path = isms, public as $$
begin
  if new.approval in ('verified', 'approved', 'filed')
     and exists (select 1 from control where id = new.control_id and profile_criterion_id is not null)
     and coalesce(new.binding, 'unclear') = 'unclear' then
    raise exception 'Vor der fachlichen Prüfung die Verbindlichkeit des Kriteriums im Fall bestätigen' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger control_assessment_binding before insert or update on control_assessment
  for each row execute function isms.criterion_binding_rules();

create function isms.step_method_allowed() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
declare v_methods text[];
begin
  select c.allowed_methods into v_methods
    from control_assessment ca join control k on k.id = ca.control_id join profile_criterion c on c.id = k.profile_criterion_id
   where ca.id = new.control_assessment_id;
  if v_methods is not null and not (new.method = any (v_methods)) then
    raise exception 'Prüfmethode % ist für dieses Kriterium nicht zugelassen (%)', new.method, array_to_string(v_methods, ', ')
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger assessment_step_method before insert on assessment_step
  for each row execute function isms.step_method_allowed();

-- -----------------------------------------------------------------------------
-- Zugriffsschutz: Methodik pflegt DT Agency; KI liest, schreibt nie
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['source', 'source_element', 'source_mapping', 'assessment_profile', 'profile_criterion', 'criterion_reference'] loop
    execute format('alter table isms.%I enable row level security', t);
    execute format('create policy %I on isms.%I for select using (isms.current_person_id() is not null and isms.is_agency())', t || '_read', t);
    execute format('create policy %I on isms.%I for all using (isms.is_agency()) with check (isms.is_agency())', t || '_agency', t);
    perform isms.apply_ai_restrictions(t, 'true');
  end loop;
end $$;

grant select, insert, update, delete on source, source_element, source_mapping, assessment_profile, profile_criterion, criterion_reference to isms_app;
grant execute on all functions in schema isms to isms_app;
