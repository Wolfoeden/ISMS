-- =============================================================================
-- 0005 – ENT-036 (Option 1, freigegeben 2026-11-12): Mandats- und Prüfvorgangsstatus
--        nach Fachkonzept 02 §4.2/§4.3; ENT-011: Spalte für das Beratungshaus.
--   Mandat:       draft → offered → signed → active → closed
--                 Alternativen rejected, expired (Angebot), terminated (nach Signatur)
--   Prüfvorgang:  intake → scope_draft → scope_approved → collecting_evidence →
--                 ready_for_assessment → assessing → internal_review → qa → approved →
--                 published → closed; Ausnahmen on_hold, waiting_customer,
--                 blocked_material_unknown, rework, cancelled, closed_with_limitations
--   Vertrauliche Nachweise erst bei aktivem Mandat.
-- =============================================================================
set search_path = isms, public;

-- ENT-011: zunächst nur DT Agency, später White-Label
create table tenant (
  id   text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null
);
insert into tenant (id, name) values ('dt-agency', 'DT Agency');

-- ---------------------------------------------------------------------------
-- Mandat
-- ---------------------------------------------------------------------------
alter table mandate drop constraint active_requires_profile_decision;
alter table mandate drop constraint mandate_status_check;
update mandate set status = case status when 'planned' then 'draft' when 'cancelled' then 'terminated' else status end;
alter table mandate alter column status set default 'draft';
alter table mandate add constraint mandate_status_check
  check (status in ('draft', 'offered', 'signed', 'active', 'closed', 'rejected', 'expired', 'terminated'));
-- Ein Mandat wird erst aktiv, wenn das Profil entschieden ist (bisherige Regel).
alter table mandate add constraint active_requires_profile_decision
  check (status not in ('active', 'closed') or profile_decision_id is not null);
alter table mandate add column tenant_id text not null default 'dt-agency' references tenant;

create function isms.mandate_status_transition() returns trigger
  language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if not (old.status, new.status) in (
    ('draft', 'offered'),
    ('offered', 'draft'), ('offered', 'signed'), ('offered', 'rejected'), ('offered', 'expired'),
    ('signed', 'active'), ('signed', 'terminated'),
    ('active', 'closed'), ('active', 'terminated')
  ) then
    raise exception 'Mandatsstatus % → % nicht zulässig', old.status, new.status using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger mandate_status_transition
  before update of status on mandate
  for each row execute function isms.mandate_status_transition();

-- Vertrauliche Nachweise erst bei aktivem Mandat (02 §4.2, DEC-08)
create function isms.evidence_requires_active_mandate() returns trigger
  language plpgsql as $$
declare v_status text;
begin
  select status into v_status from isms.mandate where id = new.mandate_id;
  if v_status is distinct from 'active' then
    raise exception 'Nachweise erst bei aktivem Mandat (Status: %)', coalesce(v_status, 'unbekannt')
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger evidence_active_mandate
  before insert on evidence
  for each row execute function isms.evidence_requires_active_mandate();

-- ---------------------------------------------------------------------------
-- Prüfvorgang (AssessmentCase)
-- ---------------------------------------------------------------------------
create table assessment_case (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    text not null default 'dt-agency' references tenant,
  mandate_id   uuid references mandate,
  entry_route  text not null check (entry_route in ('known_need', 'guided_discovery')),
  status       text not null default 'intake' check (status in (
                 'intake', 'scope_draft', 'scope_approved', 'collecting_evidence', 'ready_for_assessment',
                 'assessing', 'internal_review', 'qa', 'approved', 'published', 'closed',
                 'on_hold', 'waiting_customer', 'blocked_material_unknown', 'rework', 'cancelled',
                 'closed_with_limitations')),
  limitations  text,
  created_at   timestamptz not null default now(),
  -- „closed with limitations“ ist kein positives Urteil: Grenzen müssen benannt sein
  constraint limitations_named check (status <> 'closed_with_limitations' or length(trim(coalesce(limitations, ''))) > 0)
);

create function isms.case_requires_active_mandate() returns trigger
  language plpgsql as $$
declare v_status text;
begin
  if new.status in ('collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review', 'qa', 'approved', 'published') then
    select status into v_status from isms.mandate where id = new.mandate_id;
    if v_status is distinct from 'active' then
      raise exception 'Prüfvorgang im Status % braucht ein aktives Mandat', new.status using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger case_active_mandate
  before insert or update on assessment_case
  for each row execute function isms.case_requires_active_mandate();

alter table assessment_case enable row level security;
create policy case_agency on assessment_case
  for all using (isms.is_agency() and (mandate_id is null or isms.participates(mandate_id)))
  with check (isms.is_agency() and (mandate_id is null or isms.participates(mandate_id)));
create policy case_customer on assessment_case
  for select using (not isms.is_agency() and mandate_id is not null and isms.participates(mandate_id));
