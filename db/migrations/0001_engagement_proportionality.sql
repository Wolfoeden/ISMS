-- =============================================================================
-- Engagement & Proportionality Model – Schema v1
-- Fachkonzept: docs/01-engagement-proportionality-model.md
-- Ziel: PostgreSQL ≥ 15 (kompatibel mit Supabase). Fachlogik (Profilableitung,
-- Control-Tiefe, Quality Gates) liegt im Domänenkern src/; die Datenbank
-- erzwingt die Invarianten, die nie verletzt werden dürfen.
-- =============================================================================

create schema if not exists isms;
set search_path = isms, public;

-- Aktuelle Person der Sitzung. Für Supabase durch eine Abbildung von auth.uid()
-- ersetzen; lokal/in Tests über `set app.person_id = '<uuid>'`.
create or replace function isms.current_person_id() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.person_id', true), '')::uuid $$;

-- -----------------------------------------------------------------------------
-- Stammdaten
-- -----------------------------------------------------------------------------
create table organization (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table person (
  id              uuid primary key default gen_random_uuid(),
  party           text not null check (party in ('agency', 'customer')),
  organization_id uuid references organization,
  display_name    text not null,
  email           text unique,
  created_at      timestamptz not null default now(),
  constraint customer_person_has_org check (party = 'agency' or organization_id is not null)
);

-- -----------------------------------------------------------------------------
-- Organization Complexity Profile (§2) – versioniert, unveränderlich
-- -----------------------------------------------------------------------------
create table complexity_assessment (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organization,
  -- leer = Organisationsprofil; gesetzt = scope-spezifisches Profil eines Mandats
  scope_description   text,
  facts               jsonb not null,
  policy_version      text not null,
  derivation          jsonb not null,           -- Ratings, Scores, Floors, Begründung
  recommended_profile smallint not null check (recommended_profile between 1 and 4),
  min_profile         smallint not null check (min_profile between 1 and 4),
  assessed_by         uuid not null references person,
  assessed_at         timestamptz not null default now(),
  check (recommended_profile >= min_profile)
);

create table profile_decision (
  id                       uuid primary key default gen_random_uuid(),
  complexity_assessment_id uuid not null references complexity_assessment,
  profile                  smallint not null check (profile between 1 and 4),
  deviation                text not null check (deviation in ('none', 'borderline', 'upgrade', 'downgrade')),
  justification            text,
  decided_by               uuid not null references person,
  reviewed_by              uuid references person,
  decided_at               timestamptz not null default now(),
  constraint justification_on_deviation
    check (deviation = 'none' or length(trim(coalesce(justification, ''))) >= 30),
  constraint review_on_downgrade
    check (deviation <> 'downgrade' or (reviewed_by is not null and reviewed_by <> decided_by))
);

create function isms.profile_decision_respects_floor() returns trigger
  language plpgsql as $$
declare v_min smallint;
begin
  select min_profile into v_min from isms.complexity_assessment where id = new.complexity_assessment_id;
  if new.profile < v_min then
    raise exception 'Profil % unterschreitet die Untergrenze % des Complexity Assessments', new.profile, v_min
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger profile_decision_floor
  before insert or update on profile_decision
  for each row execute function isms.profile_decision_respects_floor();

-- -----------------------------------------------------------------------------
-- Engagement / Mandate (§10, §23)
-- -----------------------------------------------------------------------------
create table engagement_template (
  id               text primary key,
  name             text not null,
  engagement_type  text not null,
  allowed_profiles smallint[] not null,
  profile_source   text not null check (profile_source in ('pre_assessment', 'third_party_pre_assessment')),
  team             jsonb not null,
  deliverables     jsonb not null
);

create table mandate (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references organization,
  scope               text not null,
  engagement_type     text not null check (engagement_type in (
                        'security_assessment', 'iso27001_readiness', 'iso27001_implementation',
                        'nis2_readiness', 'third_party_assessment', 'internal_audit', 'continuous_operation')),
  template_id         text references engagement_template,
  profile_decision_id uuid references profile_decision,
  assurance_profile   smallint not null check (assurance_profile between 1 and 4),
  status              text not null default 'planned' check (status in ('planned', 'active', 'closed', 'cancelled')),
  start_date          date not null,
  end_date            date,
  created_at          timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  -- Ein Mandat wird erst aktiv, wenn das Profil entschieden ist.
  constraint active_requires_profile_decision check (status = 'planned' or profile_decision_id is not null)
);

create function isms.mandate_profile_consistent() returns trigger
  language plpgsql as $$
declare v_profile smallint; v_allowed smallint[];
begin
  if new.profile_decision_id is not null then
    select profile into v_profile from isms.profile_decision where id = new.profile_decision_id;
    if v_profile <> new.assurance_profile then
      raise exception 'assurance_profile (%) weicht von der Profilentscheidung (%) ab', new.assurance_profile, v_profile
        using errcode = 'check_violation';
    end if;
  end if;
  if new.template_id is not null then
    select allowed_profiles into v_allowed from isms.engagement_template where id = new.template_id;
    if not new.assurance_profile = any (v_allowed) then
      raise exception 'Template % ist für Profil % nicht vorgesehen', new.template_id, new.assurance_profile
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger mandate_profile
  before insert or update on mandate
  for each row execute function isms.mandate_profile_consistent();

-- Teilnehmer (eine Zeile je Person) und Rollen (Multi-Role, §18)
create table mandate_participant (
  mandate_id  uuid not null references mandate on delete cascade,
  person_id   uuid not null references person,
  sme_domains text[] not null default '{}',
  primary key (mandate_id, person_id)
);

create table mandate_role (
  mandate_id uuid not null,
  person_id  uuid not null,
  role       text not null check (role in (
               'engagement_lead', 'consultant', 'junior_consultant', 'subject_matter_expert',
               'independent_reviewer', 'engagement_coordinator',
               'executive_sponsor', 'primary_contact', 'isms_manager', 'isms_coordinator',
               'risk_owner', 'control_owner', 'evidence_contributor', 'approver')),
  primary key (mandate_id, person_id, role),
  foreign key (mandate_id, person_id) references mandate_participant on delete cascade
);

-- genau ein Engagement Lead je Mandat
create unique index one_engagement_lead on mandate_role (mandate_id) where role = 'engagement_lead';

create function isms.mandate_role_matches_party() returns trigger
  language plpgsql as $$
declare v_party text;
begin
  select party into v_party from isms.person where id = new.person_id;
  if (new.role in ('engagement_lead', 'consultant', 'junior_consultant', 'subject_matter_expert',
                   'independent_reviewer', 'engagement_coordinator')) <> (v_party = 'agency') then
    raise exception 'Rolle % passt nicht zur Partei % der Person', new.role, v_party
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger mandate_role_party
  before insert or update on mandate_role
  for each row execute function isms.mandate_role_matches_party();

-- Segregation not feasible → Reason → Compensating Control → Senior Review (§18)
create table segregation_exception (
  id                   uuid primary key default gen_random_uuid(),
  mandate_id           uuid not null,
  person_id            uuid not null,
  object_id            uuid,              -- leer = mandatsweit
  conflict             text not null,
  reason               text not null check (length(trim(reason)) > 0),
  compensating_control text not null check (length(trim(compensating_control)) > 0),
  reviewed_by          uuid not null,
  reviewed_at          timestamptz not null default now(),
  foreign key (mandate_id, person_id) references mandate_participant,
  foreign key (mandate_id, reviewed_by) references mandate_participant,
  check (reviewed_by <> person_id)
);

-- -----------------------------------------------------------------------------
-- Responsibility Model (§20, §21)
-- -----------------------------------------------------------------------------
create table work_assignment (
  id             uuid primary key default gen_random_uuid(),
  mandate_id     uuid not null,
  object_type    text not null check (object_type in (
                   'assessment', 'assessment_section', 'finding', 'risk', 'measure',
                   'evidence_review', 'report', 'deliverable')),
  object_id      uuid not null,
  person_id      uuid not null,
  responsibility text not null check (responsibility in ('owner', 'assignee', 'reviewer', 'approver', 'contributor')),
  assigned_at    timestamptz not null default now(),
  -- nur Mitglieder des Mandatsteams
  foreign key (mandate_id, person_id) references mandate_participant,
  unique (object_type, object_id, person_id, responsibility)
);

create unique index one_owner_per_object on work_assignment (object_type, object_id) where responsibility = 'owner';

-- -----------------------------------------------------------------------------
-- Dynamic Control Applicability (§9)
-- -----------------------------------------------------------------------------
create table control (
  id               text primary key,
  title            text not null,
  requirement_refs text[] not null default '{}'
);

create table control_depth_spec (
  control_id text not null references control on delete cascade,
  depth      smallint not null check (depth between 1 and 4),
  practice   text not null,
  frequency  text not null,
  evidence   text[] not null,
  roles      text[] not null,
  four_eyes  boolean not null,
  primary key (control_id, depth)
);

create table control_applicability (
  mandate_id              uuid not null references mandate on delete cascade,
  control_id              text not null references control,
  applicable              boolean not null,
  na_justification        text,
  base_depth              smallint check (base_depth between 1 and 4),
  required_depth          smallint check (required_depth between 1 and 4),
  raised_by               text[] not null default '{}',
  tailored_depth          smallint check (tailored_depth between 1 and 4),
  tailoring_justification text,
  risk_acceptance_ref     text,
  evaluated_at            timestamptz not null default now(),
  primary key (mandate_id, control_id),
  constraint na_requires_justification
    check (applicable or length(trim(coalesce(na_justification, ''))) > 0),
  constraint applicable_requires_depth
    check (not applicable or (base_depth is not null and required_depth >= base_depth)),
  constraint tailoring_requires_risk_acceptance
    check (tailored_depth is null or tailored_depth >= required_depth
           or (length(trim(coalesce(tailoring_justification, ''))) >= 30 and risk_acceptance_ref is not null))
);

-- -----------------------------------------------------------------------------
-- Findings & Quality Gate (§22)
-- -----------------------------------------------------------------------------
create table finding (
  id          uuid primary key default gen_random_uuid(),
  mandate_id  uuid not null references mandate,
  title       text not null,
  description text,
  severity    text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status      text not null default 'draft' check (status in (
                'draft', 'in_review', 'confirmed', 'customer_discussion', 'accepted', 'disputed', 'withdrawn')),
  author_id   uuid not null,
  ai_assisted boolean not null default false,
  sme_domain  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (mandate_id, author_id) references mandate_participant
);

-- Revisionssicherer Verlauf: nur Einfügen. Statuswechsel immer durch Menschen.
create table finding_transition (
  id          bigint generated always as identity primary key,
  finding_id  uuid not null references finding,
  action      text not null check (action in ('submit', 'return', 'confirm', 'present', 'accept', 'dispute', 'rereview', 'withdraw')),
  from_status text not null,
  to_status   text not null,
  actor_id    uuid not null references person,
  comment     text,
  occurred_at timestamptz not null default now()
);

create function isms.append_only() returns trigger
  language plpgsql as $$
begin
  raise exception '% ist append-only', tg_table_name using errcode = 'insufficient_privilege';
end $$;

create trigger finding_transition_append_only
  before update or delete on finding_transition
  for each row execute function isms.append_only();

-- -----------------------------------------------------------------------------
-- Ist-Aufwände (§24) – Grundlage für spätere Kalibrierung der Aufwandsschätzung
-- -----------------------------------------------------------------------------
create table effort_entry (
  id         uuid primary key default gen_random_uuid(),
  mandate_id uuid not null,
  person_id  uuid not null,
  activity   text not null check (activity in (
               'planning', 'interview', 'documentation_review', 'evidence_review', 'assessment',
               'finding_drafting', 'review_qa', 'reporting', 'customer_meeting', 'coordination')),
  work_date  date not null,
  hours      numeric(5, 2) not null check (hours > 0 and hours <= 24),
  foreign key (mandate_id, person_id) references mandate_participant
);

-- -----------------------------------------------------------------------------
-- Row Level Security – Referenzmuster
-- Agentur-Teilnehmer sehen alles in ihren Mandaten; Kunden sehen nur ihre
-- Mandate und Findings erst nach bestandenem Quality Gate (§22).
-- -----------------------------------------------------------------------------
create function isms.participates(p_mandate uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from mandate_participant
                        where mandate_id = p_mandate and person_id = current_person_id()) $$;

create function isms.is_agency() returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from person where id = current_person_id() and party = 'agency') $$;

alter table mandate enable row level security;
alter table finding enable row level security;

create policy mandate_participants on mandate
  for select using (isms.participates(id));

create policy finding_agency on finding
  for all using (isms.is_agency() and isms.participates(mandate_id))
  with check (isms.is_agency() and isms.participates(mandate_id));

create policy finding_customer on finding
  for select using (
    not isms.is_agency()
    and isms.participates(mandate_id)
    and status in ('customer_discussion', 'accepted', 'disputed'));
