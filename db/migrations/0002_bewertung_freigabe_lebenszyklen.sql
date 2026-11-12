-- =============================================================================
-- 0002 – Umsetzung der Entscheidungen vom 2026-11-12 (Paul)
--   ENT-018 C  Bewertungsmodell: Achsen gespeichert, Berichtsstatus berechnet
--   ENT-027 A  ein Freigabebegriff; Feststellungen mit denselben Stufen + Kundenreaktion
--   ENT-028 A  Lebenszyklen für Nachweis, Risiko, Korrekturmaßnahme
-- Plattform-Codes englisch; deutsche Bezeichnungen siehe vorschriften.md §A17.1:
--   open=offen · proposed=vorgeschlagen · approved=freigegeben · filed=abgelegt · rejected=verworfen
-- Regeln R1–R5 siehe vorschriften.md §A8.2.
-- =============================================================================

set search_path = isms, public;

-- -----------------------------------------------------------------------------
-- ENT-027: Feststellungen
-- -----------------------------------------------------------------------------
alter table finding drop constraint finding_status_check;
alter table finding add column customer_response text not null default 'pending'
  check (customer_response in ('pending', 'discussed', 'accepted', 'disputed'));

update finding set
  customer_response = case status
    when 'customer_discussion' then 'discussed'
    when 'accepted' then 'accepted'
    when 'disputed' then 'disputed'
    else 'pending' end,
  status = case status
    when 'draft' then 'open'
    when 'in_review' then 'proposed'
    when 'confirmed' then 'approved'
    when 'customer_discussion' then 'filed'
    when 'accepted' then 'filed'
    when 'disputed' then 'filed'
    when 'withdrawn' then 'rejected'
    else status end;

alter table finding alter column status set default 'open';
alter table finding add constraint finding_status_check
  check (status in ('open', 'proposed', 'approved', 'filed', 'rejected'));
alter table finding add constraint customer_response_after_filing
  check (customer_response = 'pending' or status = 'filed');

alter table finding_transition drop constraint finding_transition_action_check;
alter table finding_transition add constraint finding_transition_action_check
  check (action in ('submit', 'return', 'approve', 'file', 'reject', 'discuss', 'accept', 'dispute', 'rereview'));

drop policy finding_customer on finding;
create policy finding_customer on finding
  for select using (
    not isms.is_agency()
    and isms.participates(mandate_id)
    and status = 'filed' and customer_response <> 'pending');

-- -----------------------------------------------------------------------------
-- ENT-028: Nachweise
-- -----------------------------------------------------------------------------
create table evidence (
  id           uuid primary key default gen_random_uuid(),
  mandate_id   uuid not null,
  kind         text not null check (kind in ('claim', 'evidence')),
  source       text not null,
  captured_at  date not null,
  captured_by  uuid not null,
  version      text,
  sha256       text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  review_state text not null default 'received' check (review_state in ('received', 'suitable', 'unsuitable', 'expired')),
  reviewed_by  uuid,
  reviewed_at  timestamptz,
  valid_until  date,
  foreign key (mandate_id, captured_by) references mandate_participant,
  foreign key (mandate_id, reviewed_by) references mandate_participant,
  -- nur Nachweise (nicht Aussagen) werden geprüft; geprüft heißt: Mensch und Zeitpunkt
  constraint review_only_for_evidence check (kind = 'evidence' or review_state = 'received'),
  constraint reviewed_by_human check (review_state in ('received', 'expired') or (reviewed_by is not null and reviewed_at is not null))
);

create function isms.evidence_suitable(e isms.evidence) returns boolean
  language sql stable
  as $$ select e.kind = 'evidence' and e.review_state = 'suitable' and (e.valid_until is null or e.valid_until >= current_date) $$;

-- -----------------------------------------------------------------------------
-- ENT-018: Berichtsstatus (identisch mit src/bewertung/modell.ts)
-- -----------------------------------------------------------------------------
create function isms.report_status(
  p_kind text, p_applicability text, p_fulfillment text, p_implementation text,
  p_effectiveness text, p_evidence_state text, p_approval text, p_depth integer
) returns text
  language sql immutable
  as $$
    select case
      when p_applicability = 'not_applicable' then 'not_applicable'
      when p_evidence_state = 'conflicting' or p_approval = 'proposed' then 'needs_review'
      when p_applicability = 'undecided' then 'not_assessed'
      when p_kind = 'requirement' and p_fulfillment = 'open' then 'not_assessed'
      when p_kind = 'control' and p_implementation = 'unknown' then 'not_assessed'
      when p_fulfillment = 'not_met' or p_implementation = 'absent' or p_effectiveness = 'ineffective' then 'not_met'
      when p_evidence_state = 'none' then 'evidence_missing'
      when p_evidence_state in ('claim_only', 'insufficient') then 'insufficient_evidence'
      when p_kind = 'control' and p_implementation = 'present' and coalesce(p_depth, 1) >= 3
           and coalesce(p_effectiveness, 'not_verified') <> 'effective' then 'insufficient_evidence'
      when p_fulfillment = 'partially_met' or p_implementation = 'partial' then 'partially_met'
      else 'met'
    end
  $$;

-- Controls: control_applicability wird zur Bewertung mit Achsen
alter table control_applicability rename to control_assessment;
alter table control_assessment
  add column applicability   text not null default 'undecided' check (applicability in ('undecided', 'applicable', 'not_applicable')),
  add column implementation  text not null default 'unknown' check (implementation in ('unknown', 'absent', 'partial', 'present')),
  add column effectiveness   text not null default 'not_verified' check (effectiveness in ('not_verified', 'effective', 'ineffective')),
  add column evidence_state  text not null default 'none' check (evidence_state in ('none', 'claim_only', 'insufficient', 'sufficient', 'conflicting')),
  add column approval        text not null default 'open' check (approval in ('open', 'proposed', 'approved', 'filed')),
  add column decision_ref    text;
update control_assessment set applicability = case when applicable then 'applicable' else 'not_applicable' end;
alter table control_assessment drop constraint na_requires_justification;
alter table control_assessment drop constraint applicable_requires_depth;
alter table control_assessment drop column applicable;
alter table control_assessment
  add column report_status text generated always as (
    isms.report_status('control', applicability, null, implementation, effectiveness, evidence_state, approval, required_depth)) stored,
  -- R2
  add constraint r2_effectiveness_needs_implementation
    check (effectiveness = 'not_verified' or implementation in ('partial', 'present')),
  -- R3 (Tiefe vorhanden, sobald anwendbar)
  add constraint applicable_requires_depth
    check (applicability <> 'applicable' or (base_depth is not null and required_depth >= base_depth)),
  -- R4
  add constraint r4_not_applicable_justified
    check (applicability <> 'not_applicable'
           or (length(trim(coalesce(na_justification, ''))) > 0 and decision_ref is not null and approval in ('approved', 'filed'))),
  -- R5
  add constraint r5_conflicting_not_approved
    check (evidence_state <> 'conflicting' or approval in ('open', 'proposed'));

-- Anforderungen (ISO/IEC 27001 4–10, Gesetzes- und Vertragspflichten)
create table requirement_assessment (
  id              uuid primary key default gen_random_uuid(),
  mandate_id      uuid not null references mandate on delete cascade,
  framework       text not null,
  edition         text not null,
  clause          text not null,
  mandatory       boolean not null default false,
  applicability   text not null default 'applicable' check (applicability in ('undecided', 'applicable', 'not_applicable')),
  fulfillment     text not null default 'open' check (fulfillment in ('open', 'met', 'partially_met', 'not_met')),
  evidence_state  text not null default 'none' check (evidence_state in ('none', 'claim_only', 'insufficient', 'sufficient', 'conflicting')),
  approval        text not null default 'open' check (approval in ('open', 'proposed', 'approved', 'filed')),
  justification   text,
  decision_ref    text,
  report_status   text generated always as (
    isms.report_status('requirement', applicability, fulfillment, null, null, evidence_state, approval, null)) stored,
  unique (mandate_id, framework, edition, clause),
  constraint r4_mandatory_always_applicable check (not (mandatory and applicability = 'not_applicable')),
  constraint r4_not_applicable_justified
    check (applicability <> 'not_applicable'
           or (length(trim(coalesce(justification, ''))) > 0 and decision_ref is not null and approval in ('approved', 'filed'))),
  constraint r5_conflicting_not_approved check (evidence_state <> 'conflicting' or approval in ('open', 'proposed'))
);

-- Zuordnung Nachweis ↔ Bewertung
create table assessment_evidence (
  evidence_id                uuid not null references evidence on delete restrict,
  control_mandate_id         uuid,
  control_id                 text,
  requirement_assessment_id  uuid references requirement_assessment on delete cascade,
  foreign key (control_mandate_id, control_id) references control_assessment (mandate_id, control_id) on delete cascade,
  check ((control_id is not null) <> (requirement_assessment_id is not null))
);

-- R1 / R2: „ausreichend“ und Wirksamkeitsaussagen nur mit geeignetem Nachweis – geprüft am Transaktionsende
create function isms.check_evidence_backing() returns trigger
  language plpgsql as $$
declare v_ok boolean;
begin
  if tg_table_name = 'control_assessment' then
    if new.evidence_state = 'sufficient' or new.effectiveness in ('effective', 'ineffective') then
      select exists (
        select 1 from isms.assessment_evidence ae join isms.evidence e on e.id = ae.evidence_id
         where ae.control_mandate_id = new.mandate_id and ae.control_id = new.control_id and isms.evidence_suitable(e))
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

create constraint trigger control_assessment_evidence
  after insert or update on control_assessment deferrable initially deferred
  for each row execute function isms.check_evidence_backing();
create constraint trigger requirement_assessment_evidence
  after insert or update on requirement_assessment deferrable initially deferred
  for each row execute function isms.check_evidence_backing();

-- -----------------------------------------------------------------------------
-- ENT-028: Risiken und Korrekturmaßnahmen
-- -----------------------------------------------------------------------------
create table risk (
  id            uuid primary key default gen_random_uuid(),
  mandate_id    uuid not null references mandate on delete cascade,
  title         text not null,
  phase         text not null default 'identified' check (phase in (
                  'identified', 'assessed', 'treatment_decided', 'residual_accepted', 'monitored', 'closed')),
  treatment     text check (treatment in ('avoid', 'reduce', 'share', 'retain')),
  owner_id      uuid,
  accepted_by   uuid,
  accepted_at   timestamptz,
  review_due    date,
  foreign key (mandate_id, owner_id) references mandate_participant,
  foreign key (mandate_id, accepted_by) references mandate_participant,
  constraint treatment_from_decision check (phase in ('identified', 'assessed') or treatment is not null),
  constraint acceptance_recorded check (phase not in ('residual_accepted', 'monitored', 'closed')
                                        or (accepted_by is not null and accepted_at is not null))
);

-- Restrisiko akzeptiert nur ein Risk Owner des Mandats
create function isms.risk_accepted_by_owner() returns trigger
  language plpgsql as $$
begin
  if new.accepted_by is not null and not exists (
       select 1 from isms.mandate_role
        where mandate_id = new.mandate_id and person_id = new.accepted_by and role = 'risk_owner') then
    raise exception 'Restrisiko kann nur ein Risk Owner akzeptieren' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger risk_owner_acceptance before insert or update on risk
  for each row execute function isms.risk_accepted_by_owner();

create table measure (
  id              uuid primary key default gen_random_uuid(),
  mandate_id      uuid not null references mandate on delete cascade,
  finding_id      uuid references finding,
  title           text not null,
  phase           text not null default 'open' check (phase in (
                    'open', 'decided', 'in_progress', 'implemented', 'effectiveness_confirmed', 'rejected')),
  responsible_id  uuid,
  due_date        date,
  evidence_id     uuid references evidence,
  foreign key (mandate_id, responsible_id) references mandate_participant,
  constraint decided_has_owner_and_due check (phase in ('open', 'rejected') or (responsible_id is not null and due_date is not null)),
  constraint confirmed_has_evidence check (phase <> 'effectiveness_confirmed' or evidence_id is not null)
);

create function isms.measure_evidence_suitable() returns trigger
  language plpgsql as $$
begin
  if new.phase = 'effectiveness_confirmed'
     and not (select isms.evidence_suitable(e) from isms.evidence e where e.id = new.evidence_id) then
    raise exception 'Wirksamkeit nur mit geeignetem Nachweis bestätigt' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger measure_effectiveness before insert or update on measure
  for each row execute function isms.measure_evidence_suitable();
