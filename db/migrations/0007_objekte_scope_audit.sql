-- =============================================================================
-- 0007 – MVP WP-01/WP-04 (docs/plattform/MVP_TECHNICAL_PLAN.md)
--   ENT-021 (Option 3): Bewertungsobjekte; jede Bewertung kann einem Objekt gehören
--   Scope-Versionen: nach Freigabe gesperrt, Änderung = neue Version (02 §3, US-B1, DEC-14)
--   Modus und Assurance-Aussage getrennt, Assurance nie über dem Modus (02 §5.2, ENT-030)
--   Audit-Protokoll: nur anfügen, jede Statusänderung (Service Blueprint §1)
-- Codes englisch, deutsche Bezeichnungen in vorschriften.md / src.
-- =============================================================================
set search_path = isms, public;

-- -----------------------------------------------------------------------------
-- Bewertungsobjekte (Organization 1:n AssessmentObject)
-- -----------------------------------------------------------------------------
create table assessment_object (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null default 'dt-agency' references tenant,
  organization_id uuid not null references organization,
  object_type     text not null check (object_type in ('organization', 'product', 'site', 'service', 'supplier', 'ai_system')),
  name            text not null check (length(trim(name)) > 0),
  version         text,
  boundaries      text not null check (length(trim(boundaries)) > 0),
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Scope-Versionen
-- -----------------------------------------------------------------------------
create table scope_version (
  id                  uuid primary key default gen_random_uuid(),
  case_id             uuid not null references assessment_case on delete cascade,
  version             integer not null check (version > 0),
  status              text not null default 'draft' check (status in ('draft', 'approved', 'superseded')),
  goal                text not null check (length(trim(goal)) > 0),
  criteria            text not null check (length(trim(criteria)) > 0),
  exclusions          text,
  handling_mode       text not null check (handling_mode in ('digital', 'assisted', 'managed')),
  assurance_statement text not null check (assurance_statement in ('indicative', 'professionally_reviewed', 'independently_assessed')),
  depth_profile       smallint check (depth_profile between 1 and 4),
  approved_by         uuid references person,
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique (case_id, version),
  constraint approved_has_approver check (status = 'draft' or (approved_by is not null and approved_at is not null)),
  -- 02 §5.2: Digital/Self ergibt nur eine indikative Aussage; „unabhängig geprüft“ nur bei Managed
  constraint digital_only_indicative check (handling_mode <> 'digital' or assurance_statement = 'indicative'),
  constraint independent_needs_managed check (assurance_statement <> 'independently_assessed' or handling_mode = 'managed')
);
create unique index one_approved_scope on scope_version (case_id) where status = 'approved';

create table scope_object (
  scope_version_id uuid not null references scope_version on delete cascade,
  object_id        uuid not null references assessment_object,
  primary key (scope_version_id, object_id)
);

-- Gesperrt nach Freigabe: nur approved → superseded, sonst nichts
create function isms.scope_version_locked() returns trigger
  language plpgsql as $$
declare v_mandate uuid; v_objects int;
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Freigegebene Scope-Version % kann nicht gelöscht werden', old.version using errcode = 'check_violation';
    end if;
    return old;
  end if;
  if old.status = 'approved' then
    if new.status = 'superseded' and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then return new; end if;
    raise exception 'Scope-Version % ist freigegeben und gesperrt – Änderung nur als neue Version', old.version
      using errcode = 'check_violation';
  end if;
  if old.status = 'superseded' then
    raise exception 'Ersetzte Scope-Version % ist unveränderlich', old.version using errcode = 'check_violation';
  end if;
  if new.status = 'approved' then
    select count(*) into v_objects from isms.scope_object where scope_version_id = new.id;
    if v_objects = 0 then
      raise exception 'Scope-Version ohne Bewertungsobjekt kann nicht freigegeben werden' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from isms.person where id = new.approved_by and party = 'agency') then
      raise exception 'Scope gibt DT Agency frei (Engagement Lead)' using errcode = 'check_violation';
    end if;
    select mandate_id into v_mandate from isms.assessment_case where id = new.case_id;
    if v_mandate is not null and not exists (
      select 1 from isms.mandate_role where mandate_id = v_mandate and person_id = new.approved_by and role = 'engagement_lead') then
      raise exception 'Scope gibt der Engagement Lead des Mandats frei' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger scope_version_lock
  before update or delete on scope_version
  for each row execute function isms.scope_version_locked();

create function isms.scope_object_locked() returns trigger
  language plpgsql as $$
declare v_status text;
begin
  select status into v_status from isms.scope_version
   where id = coalesce(new.scope_version_id, old.scope_version_id);
  if v_status is distinct from 'draft' then
    raise exception 'Objekte einer freigegebenen Scope-Version sind gesperrt' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

create trigger scope_object_lock
  before insert or update or delete on scope_object
  for each row execute function isms.scope_object_locked();

-- Prüfvorgang ab scope_approved braucht eine freigegebene Scope-Version
create function isms.case_requires_approved_scope() returns trigger
  language plpgsql as $$
begin
  if new.status in ('scope_approved', 'collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review',
                    'qa', 'approved', 'published', 'closed', 'closed_with_limitations')
     and not exists (select 1 from isms.scope_version where case_id = new.id and status = 'approved') then
    raise exception 'Prüfvorgang im Status % braucht eine freigegebene Scope-Version', new.status
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger case_approved_scope
  before insert or update of status on assessment_case
  for each row execute function isms.case_requires_approved_scope();

-- -----------------------------------------------------------------------------
-- ENT-021: Bewertungen je Objekt
-- -----------------------------------------------------------------------------
alter table control_assessment add column id uuid not null default gen_random_uuid();
alter table control_assessment add column object_id uuid references assessment_object;

-- Nachweiszuordnung von (mandate_id, control_id) auf die Bewertungs-ID umstellen
alter table assessment_evidence add column control_assessment_id uuid;
update assessment_evidence ae set control_assessment_id = ca.id
  from control_assessment ca where ca.mandate_id = ae.control_mandate_id and ca.control_id = ae.control_id;
alter table assessment_evidence drop constraint assessment_evidence_control_mandate_id_control_id_fkey;
alter table assessment_evidence drop constraint assessment_evidence_check;
alter table assessment_evidence drop column control_mandate_id;
alter table assessment_evidence drop column control_id;

alter table control_assessment drop constraint control_applicability_pkey;
alter table control_assessment add primary key (id);
alter table assessment_evidence add constraint assessment_evidence_control_assessment_fkey
  foreign key (control_assessment_id) references control_assessment (id) on delete cascade;
alter table assessment_evidence add constraint assessment_evidence_one_target
  check ((control_assessment_id is not null) <> (requirement_assessment_id is not null));
create unique index control_assessment_per_object on control_assessment (mandate_id, control_id, object_id) nulls not distinct;

alter table requirement_assessment add column object_id uuid references assessment_object;
alter table requirement_assessment drop constraint requirement_assessment_mandate_id_framework_edition_clause_key;
create unique index requirement_assessment_per_object
  on requirement_assessment (mandate_id, framework, edition, clause, object_id) nulls not distinct;

alter table finding add column object_id uuid references assessment_object;
alter table risk add column object_id uuid references assessment_object;

-- Objekt muss zur Kundenorganisation des Mandats gehören
create function isms.object_belongs_to_mandate() returns trigger
  language plpgsql as $$
begin
  if new.object_id is not null and not exists (
    select 1 from isms.assessment_object o join isms.mandate m on m.customer_id = o.organization_id
     where o.id = new.object_id and m.id = new.mandate_id) then
    raise exception 'Bewertungsobjekt gehört nicht zur Organisation des Mandats' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger control_assessment_object before insert or update of object_id on control_assessment
  for each row execute function isms.object_belongs_to_mandate();
create trigger requirement_assessment_object before insert or update of object_id on requirement_assessment
  for each row execute function isms.object_belongs_to_mandate();
create trigger finding_object before insert or update of object_id on finding
  for each row execute function isms.object_belongs_to_mandate();
create trigger risk_object before insert or update of object_id on risk
  for each row execute function isms.object_belongs_to_mandate();

-- R1/R2 auf die neue Zuordnung umstellen
create or replace function isms.check_evidence_backing() returns trigger
  language plpgsql as $$
declare v_ok boolean;
begin
  if tg_table_name = 'control_assessment' then
    if new.evidence_state = 'sufficient' or new.effectiveness in ('effective', 'ineffective') then
      select exists (
        select 1 from isms.assessment_evidence ae join isms.evidence e on e.id = ae.evidence_id
         where ae.control_assessment_id = new.id and isms.evidence_suitable(e))
        into v_ok;
      if not v_ok then
        raise exception 'R1/R2: % % braucht einen geeigneten Nachweis der Art evidence', new.mandate_id, new.control_id
          using errcode = 'check_violation';
      end if;
    end if;
  else
    if new.evidence_state = 'sufficient' then
      select exists (
        select 1 from isms.assessment_evidence ae join isms.evidence e on e.id = ae.evidence_id
         where ae.requirement_assessment_id = new.id and isms.evidence_suitable(e))
        into v_ok;
      if not v_ok then
        raise exception 'R1: Anforderung % braucht einen geeigneten Nachweis der Art evidence', new.clause
          using errcode = 'check_violation';
      end if;
    end if;
  end if;
  return null;
end $$;

-- -----------------------------------------------------------------------------
-- Audit-Protokoll (nur anfügen)
-- -----------------------------------------------------------------------------
create table audit_event (
  id           bigint generated always as identity primary key,
  tenant_id    text not null default 'dt-agency' references tenant,
  occurred_at  timestamptz not null default now(),
  actor_id     uuid,
  actor_kind   text not null check (actor_kind in ('human', 'system')),
  event_type   text not null,
  object_table text not null,
  object_id    text not null,
  mandate_id   uuid,
  details      jsonb not null default '{}'
);
create index audit_event_mandate on audit_event (mandate_id, occurred_at);

create trigger audit_event_append_only
  before update or delete on audit_event
  for each row execute function isms.append_only();

-- Generischer Statusprotokollierer; TG_ARGV[0] = Statusspalte
create function isms.audit_status() returns trigger
  language plpgsql security definer set search_path = isms as $$
declare
  v_col text := tg_argv[0];
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  v_mandate uuid;
  v_actor uuid := isms.current_person_id();
begin
  if tg_op = 'UPDATE' and v_old ->> v_col is not distinct from v_new ->> v_col then return new; end if;
  v_mandate := coalesce(
    (v_new ->> 'mandate_id')::uuid,
    case when tg_table_name = 'mandate' then (v_new ->> 'id')::uuid end,
    case when tg_table_name = 'scope_version' then (select mandate_id from isms.assessment_case where id = (v_new ->> 'case_id')::uuid) end);
  insert into isms.audit_event (actor_id, actor_kind, event_type, object_table, object_id, mandate_id, details)
  values (v_actor, case when v_actor is null then 'system' else 'human' end,
          tg_table_name || case when tg_op = 'INSERT' then '.created' else '.status_changed' end,
          tg_table_name, coalesce(v_new ->> 'id', ''), v_mandate,
          jsonb_build_object('from', v_old ->> v_col, 'to', v_new ->> v_col));
  return new;
end $$;

create trigger audit_mandate after insert or update of status on mandate
  for each row execute function isms.audit_status('status');
create trigger audit_case after insert or update of status on assessment_case
  for each row execute function isms.audit_status('status');
create trigger audit_scope after insert or update of status on scope_version
  for each row execute function isms.audit_status('status');
create trigger audit_finding after insert or update of status on finding
  for each row execute function isms.audit_status('status');
create trigger audit_evidence after insert or update of review_state on evidence
  for each row execute function isms.audit_status('review_state');
create trigger audit_risk after insert or update of phase on risk
  for each row execute function isms.audit_status('phase');
create trigger audit_measure after insert or update of phase on measure
  for each row execute function isms.audit_status('phase');
create trigger audit_control_assessment after insert or update of approval on control_assessment
  for each row execute function isms.audit_status('approval');
create trigger audit_requirement_assessment after insert or update of approval on requirement_assessment
  for each row execute function isms.audit_status('approval');
