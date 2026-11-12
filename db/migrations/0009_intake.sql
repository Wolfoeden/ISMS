-- =============================================================================
-- 0009 – Intake nach Variante C (MVP WP-02/WP-03; 02 §3, 04 EPIC A, TC-01/02/09)
--   intake_case · context_fact (Fakten mit Herkunft) · framework_candidate (nie verbindlich)
--   · open_question (unbekannt ≠ nicht anwendbar). Gleiche Regeln wie src/intake/.
-- =============================================================================
set search_path = isms, public;

create table intake_case (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     text not null default 'dt-agency' references tenant,
  entry_route   text not null check (entry_route in ('known_need', 'guided_discovery')),
  goal_code     text,
  concern       text,                       -- Freitext des Kunden: Daten, keine Anweisung
  consent_at    timestamptz not null,       -- S01: ohne Hinweisbestätigung kein Speichern
  phase         text not null default 'intake' check (phase in ('intake', 'orientation', 'scope_proposed', 'converted', 'closed')),
  created_by    uuid references person,
  created_at    timestamptz not null default now(),
  check (entry_route = 'guided_discovery' or goal_code is not null)
);

alter table assessment_case add column intake_id uuid references intake_case;

create table context_fact (
  id                  uuid primary key default gen_random_uuid(),
  intake_id           uuid not null references intake_case on delete cascade,
  object_id           uuid references assessment_object,
  fact_key            text not null,
  value               jsonb not null,
  source_type         text not null check (source_type in ('customer_input', 'document', 'consultant', 'public_source')),
  source_ref          text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'verified', 'disputed', 'stale')),
  verified_by         uuid references person,
  recorded_at         timestamptz not null default now(),
  superseded_at       timestamptz,
  constraint verified_has_person check (verification_status <> 'verified' or verified_by is not null)
);
-- Ask once: je Schlüssel und Objekt genau ein aktueller Fakt
create unique index context_fact_current on context_fact (intake_id, fact_key, object_id) nulls not distinct where superseded_at is null;

create function isms.fact_verified_by_agency() returns trigger
  language plpgsql as $$
begin
  if new.verification_status = 'verified'
     and not exists (select 1 from isms.person where id = new.verified_by and party = 'agency') then
    raise exception 'Fakten verifiziert nur DT Agency (Mensch, benannt)' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger context_fact_verified before insert or update on context_fact
  for each row execute function isms.fact_verified_by_agency();

create table framework_candidate (
  id                    uuid primary key default gen_random_uuid(),
  intake_id             uuid not null references intake_case on delete cascade,
  object_id             uuid references assessment_object,
  framework_code        text not null,
  -- im Intake nie „anwendbar“: verbindlich wird erst eine verifizierte regulatorische Entscheidung
  status                text not null check (status in ('customer_named', 'possibly_applicable', 'possibly_not_applicable',
                                                        'requires_expert_review', 'optional_criterion')),
  binding_determination boolean not null default false check (binding_determination = false),
  reason                text not null check (length(trim(reason)) > 0),
  basis                 text not null check (length(trim(basis)) > 0),
  rule_version          text,
  created_at            timestamptz not null default now()
);

create table open_question (
  id               uuid primary key default gen_random_uuid(),
  intake_id        uuid references intake_case on delete cascade,
  case_id          uuid references assessment_case on delete cascade,
  question_code    text not null,
  text             text not null,
  materiality      text not null check (materiality in ('material', 'nonmaterial')),
  state            text not null default 'open' check (state in ('open', 'answered', 'unknown', 'not_applicable', 'deferred')),
  na_justification text,
  limitation_ref   text,
  owner            text,
  due_at           date,
  created_at       timestamptz not null default now(),
  check ((intake_id is not null) <> (case_id is not null)),
  -- unbekannt ≠ nicht anwendbar: N/A nur mit eigener Begründung
  constraint na_justified check (state <> 'not_applicable' or length(trim(coalesce(na_justification, ''))) > 0),
  constraint deferred_has_owner check (state <> 'deferred' or (length(trim(coalesce(owner, ''))) > 0 and due_at is not null))
);

-- D-06 auf Datenbankebene: Prüfvorgang geht nicht in die Bewertung, solange eine materielle
-- Frage offen/unbekannt/vertagt ist und keine Einschränkung ausweist (TC-09)
create function isms.case_material_questions_resolved() returns trigger
  language plpgsql as $$
begin
  if new.status in ('assessing', 'internal_review', 'qa', 'approved', 'published', 'closed')
     and exists (select 1 from isms.open_question
                  where case_id = new.id and materiality = 'material'
                    and state in ('open', 'unknown', 'deferred') and limitation_ref is null) then
    raise exception 'Materielle Frage offen – Klärung oder ausdrückliche Einschränkung nötig (D-06)'
      using errcode = 'check_violation';
  end if;
  if new.status = 'closed' and exists (select 1 from isms.open_question
                  where case_id = new.id and materiality = 'material' and limitation_ref is not null
                    and state in ('open', 'unknown', 'deferred')) then
    raise exception 'Mit ausgewiesenen Einschränkungen nur „closed_with_limitations“, nicht „closed“'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger case_material_questions before update of status on assessment_case
  for each row execute function isms.case_material_questions_resolved();

-- Protokoll
create trigger audit_intake after insert or update of phase on intake_case
  for each row execute function isms.audit_status('phase');
create trigger audit_intake_route after update of entry_route on intake_case
  for each row execute function isms.audit_status('entry_route');
create trigger audit_open_question after insert or update of state on open_question
  for each row execute function isms.audit_status('state');

-- Zugriffsschutz: Intake vor Mandat sieht DT Agency und die Person, die ihn angelegt hat
create function isms.intake_visible(p_intake uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from intake_case where id = p_intake
                        and (is_agency() or created_by = current_person_id())) $$;

alter table intake_case enable row level security;
create policy intake_agency on intake_case for all using (is_agency()) with check (is_agency());
create policy intake_owner_read on intake_case for select using (created_by = current_person_id());
create policy intake_owner_insert on intake_case for insert with check (created_by = current_person_id());

alter table context_fact enable row level security;
create policy fact_agency on context_fact for all using (is_agency()) with check (is_agency());
create policy fact_owner_read on context_fact for select using (intake_visible(intake_id));
-- Kunden erfassen Fakten nur als eigene, ungeprüfte Angaben
create policy fact_owner_insert on context_fact for insert
  with check (intake_visible(intake_id) and source_type = 'customer_input' and verification_status = 'unverified');

alter table framework_candidate enable row level security;
create policy candidate_agency on framework_candidate for all using (is_agency()) with check (is_agency());
create policy candidate_owner_read on framework_candidate for select using (intake_visible(intake_id));

alter table open_question enable row level security;
create policy question_agency on open_question for all
  using (is_agency() and (case_id is null or participates(case_mandate(case_id))))
  with check (is_agency() and (case_id is null or participates(case_mandate(case_id))));
create policy question_owner_read on open_question for select
  using ((intake_id is not null and intake_visible(intake_id))
      or (case_id is not null and not is_agency() and participates(case_mandate(case_id))));
