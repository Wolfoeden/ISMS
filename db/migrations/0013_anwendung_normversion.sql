-- =============================================================================
-- 0013 – Anwendungsrolle und Normversionen (MVP Etappe 1; TC-17)
--   · isms_app: Rolle, unter der die Anwendung jede Anfrage ausführt (RLS greift)
--   · framework_version + scope_version.criteria_versions: Kriterien sind je Scope auf eine
--     Version festgelegt (Version-Pin). Neue Version → Folgeprüfung (version_impact) für jeden
--     laufenden Prüfvorgang; ohne Entscheidung keine QA/Freigabe/Veröffentlichung (02 §8)
-- =============================================================================
set search_path = isms, public;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'isms_app') then create role isms_app nologin; end if;
end $$;
grant usage on schema isms to isms_app;
grant select, insert, update, delete on all tables in schema isms to isms_app;
grant usage on all sequences in schema isms to isms_app;
grant execute on all functions in schema isms to isms_app;
alter default privileges in schema isms grant select, insert, update, delete on tables to isms_app;
alter default privileges in schema isms grant execute on functions to isms_app;

-- -----------------------------------------------------------------------------
-- Normversionen
-- -----------------------------------------------------------------------------
create table framework_version (
  framework      text not null,
  version        text not null,
  effective_from date not null,
  supersedes     text,
  note           text,
  primary key (framework, version)
);
insert into framework_version (framework, version, effective_from) values
  ('ISO/IEC 27001', '2022', '2022-10-25'),
  ('BSIG', '2026-10-22', '2026-10-22');

alter table scope_version add column criteria_versions jsonb not null default '{}'
  check (jsonb_typeof(criteria_versions) = 'object');

create function isms.scope_criteria_known() returns trigger
  language plpgsql as $$
declare k text; v text;
begin
  for k, v in select * from jsonb_each_text(new.criteria_versions) loop
    if not exists (select 1 from isms.framework_version where framework = k and version = v) then
      raise exception 'Kriterium % in Version % ist nicht hinterlegt', k, v using errcode = 'check_violation';
    end if;
  end loop;
  return new;
end $$;
create trigger scope_criteria_known before insert or update of criteria_versions on scope_version
  for each row execute function isms.scope_criteria_known();

create table version_impact (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references assessment_case on delete cascade,
  framework   text not null,
  old_version text not null,
  new_version text not null,
  decision    text check (decision in ('keep_pinned', 'migrate')),
  rationale   text,
  decided_by  uuid references person,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (case_id, framework, new_version),
  constraint decision_complete check (decision is null
    or (decided_by is not null and decided_at is not null and length(trim(coalesce(rationale, ''))) > 0))
);

-- Neue Version → Folgeprüfung für jeden laufenden Prüfvorgang, der die Vorgängerversion festgelegt hat
create function isms.framework_version_impact() returns trigger
  language plpgsql security definer set search_path = isms as $$
begin
  if new.supersedes is not null then
    insert into version_impact (case_id, framework, old_version, new_version)
    select s.case_id, new.framework, new.supersedes, new.version
      from scope_version s join assessment_case c on c.id = s.case_id
     where s.status = 'approved' and s.criteria_versions ->> new.framework = new.supersedes
       and c.status not in ('published', 'closed', 'closed_with_limitations', 'cancelled')
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger framework_version_impact after insert on framework_version
  for each row execute function isms.framework_version_impact();

create function isms.version_impact_decided_by_lead() returns trigger
  language plpgsql as $$
begin
  if new.decision is not null and not exists (
      select 1 from isms.mandate_role r join isms.assessment_case c on c.mandate_id = r.mandate_id
       where c.id = new.case_id and r.person_id = new.decided_by and r.role = 'engagement_lead') then
    raise exception 'Über Normversionen entscheidet der Engagement Lead des Mandats' using errcode = 'check_violation';
  end if;
  if old.decision is not null then
    raise exception 'Entscheidung zur Normversion ist bereits getroffen' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger version_impact_decision before update on version_impact
  for each row execute function isms.version_impact_decided_by_lead();

-- Ohne Entscheidung zur Normversion keine QA, keine Freigabe, keine Veröffentlichung
create function isms.case_version_impact_gate() returns trigger
  language plpgsql as $$
begin
  if new.status in ('qa', 'approved', 'published') and exists (
      select 1 from isms.version_impact where case_id = new.id and decision is null) then
    raise exception 'Offene Folgeprüfung zur Normversion – erst entscheiden (TC-17)' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger case_version_impact_gate before update of status on assessment_case
  for each row execute function isms.case_version_impact_gate();

create trigger audit_version_impact after insert or update of decision on version_impact
  for each row execute function isms.audit_status('decision');

-- Zugriffsschutz
alter table framework_version enable row level security;
create policy framework_version_read on framework_version for select using (current_person_id() is not null);

alter table version_impact enable row level security;
create policy version_impact_agency on version_impact for all
  using (agency_in(case_mandate(case_id))) with check (agency_in(case_mandate(case_id)));
create policy ai_read_scope on version_impact as restrictive for select using (not is_ai_session() or case_mandate(case_id) = ai_mandate());
create policy ai_no_insert on version_impact as restrictive for insert with check (not is_ai_session());
create policy ai_no_update on version_impact as restrictive for update using (not is_ai_session());
create policy ai_no_insert on framework_version as restrictive for insert with check (not is_ai_session());

-- Rechte auch für die in dieser Migration angelegten Objekte
grant select, insert, update, delete on all tables in schema isms to isms_app;
grant execute on all functions in schema isms to isms_app;
