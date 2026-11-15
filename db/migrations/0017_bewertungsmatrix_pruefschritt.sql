-- =============================================================================
-- 0017 – ENT-040 (Option 1, freigegeben 2026-11-15): Bewertungsmatrix 3PA in §A8
--   · Prüfbezug je Bewertung: im Auftrag · außerhalb · ungeklärt (Lastenheft 7.2.3)
--     Ein Scope-Ausschluss ist keine Nichtanwendbarkeit → eigener Berichtsstatus out_of_scope.
--   · Wirksamkeit „nicht nachgewiesen“ (geprüft, Beleg reicht nicht) ≠ „nicht wirksam“
--   · Prüfstatus E0–E4 wird ABGELEITET, nie gesetzt (kein Upload hebt ihn an, AE-01.02):
--       E4 Prüfschritt Test/Beobachtung · E3 Prüfschritt Dokumentprüfung/Interview
--       E2 verknüpfter Nachweis (ungeprüft genügt) · E1 nur Aussage · E0 nichts
--   · „Nachweis ausreichend“ verlangt zusätzlich E3/E4; „wirksam“ verlangt einen Prüfschritt
--     mit Stichprobe (AE-01.01/.02, A-29/A-30).
-- P-A4 (AE-01.03, F-067, A-31): Prüfschritt-Protokoll. Nur ein Mensch von DT Agency mit
--   fachlicher Rolle im Mandat protokolliert, und nur für sich selbst; Einträge sind
--   unveränderlich. Ein KI-Vorschlag kann referenziert werden, ersetzt den Schritt nie.
-- =============================================================================
set search_path = isms, public;

-- Hilfsfunktion: einschränkende KI-Richtlinien für neue Tabellen (wie 0010)
create function isms.apply_ai_restrictions(p_table text, p_using text) returns void
  language plpgsql set search_path = isms, public as $$
begin
  execute format('create policy ai_read_scope on isms.%I as restrictive for select using (%s)', p_table, p_using);
  execute format('create policy ai_no_insert on isms.%I as restrictive for insert with check (not isms.is_ai_session())', p_table);
  execute format('create policy ai_no_update on isms.%I as restrictive for update using (not isms.is_ai_session())', p_table);
  execute format('create policy ai_no_delete on isms.%I as restrictive for delete using (not isms.is_ai_session())', p_table);
end $$;

-- -----------------------------------------------------------------------------
-- Neue Achsen
-- -----------------------------------------------------------------------------
alter table control_assessment
  add column scope_relation text not null default 'in_scope' check (scope_relation in ('in_scope', 'out_of_scope', 'unclear')),
  add column scope_note     text;
alter table requirement_assessment
  add column scope_relation text not null default 'in_scope' check (scope_relation in ('in_scope', 'out_of_scope', 'unclear')),
  add column scope_note     text;

-- Wirksamkeit um „nicht nachgewiesen“ erweitern (inline-Check aus 0002 ersetzen)
do $$
declare r record;
begin
  for r in select c.conname from pg_constraint c
            where c.conrelid = 'isms.control_assessment'::regclass and c.contype = 'c'
              and pg_get_constraintdef(c.oid) ~ 'effectiveness = ANY' loop
    execute format('alter table isms.control_assessment drop constraint %I', r.conname);
  end loop;
end $$;
alter table control_assessment
  add constraint control_assessment_effectiveness_check
    check (effectiveness in ('not_verified', 'not_demonstrated', 'effective', 'ineffective')),
  add constraint out_of_scope_has_note
    check (scope_relation <> 'out_of_scope' or length(trim(coalesce(scope_note, ''))) > 0),
  -- ungeklärter Prüfbezug ist nicht fachlich abschließbar
  add constraint unclear_scope_not_approved
    check (scope_relation <> 'unclear' or approval in ('open', 'proposed'));
alter table requirement_assessment
  add constraint out_of_scope_has_note
    check (scope_relation <> 'out_of_scope' or length(trim(coalesce(scope_note, ''))) > 0),
  add constraint unclear_scope_not_approved
    check (scope_relation <> 'unclear' or approval in ('open', 'proposed'));

-- -----------------------------------------------------------------------------
-- Berichtsstatus mit Prüfbezug (identisch mit src/bewertung/modell.ts)
-- -----------------------------------------------------------------------------
create function isms.report_status(
  p_kind text, p_scope_relation text, p_applicability text, p_fulfillment text, p_implementation text,
  p_effectiveness text, p_evidence_state text, p_approval text, p_depth integer
) returns text
  language sql immutable
  as $$
    select case
      when p_scope_relation = 'out_of_scope' then 'out_of_scope'
      when p_applicability = 'not_applicable' then 'not_applicable'
      when p_evidence_state = 'conflicting' or p_approval in ('proposed', 'verified') then 'needs_review'
      when p_scope_relation = 'unclear' or p_applicability = 'undecided' then 'not_assessed'
      when p_kind = 'requirement' and p_fulfillment = 'open' then 'not_assessed'
      when p_kind = 'control' and p_implementation = 'unknown' then 'not_assessed'
      when p_fulfillment = 'not_met' or p_implementation = 'absent' or p_effectiveness = 'ineffective' then 'not_met'
      when p_evidence_state = 'none' then 'evidence_missing'
      when p_evidence_state in ('claim_only', 'insufficient') then 'insufficient_evidence'
      when p_kind = 'control' and p_effectiveness = 'not_demonstrated' then 'insufficient_evidence'
      when p_kind = 'control' and p_implementation = 'present' and coalesce(p_depth, 1) >= 3
           and coalesce(p_effectiveness, 'not_verified') <> 'effective' then 'insufficient_evidence'
      when p_fulfillment = 'partially_met' or p_implementation = 'partial' then 'partially_met'
      else 'met'
    end
  $$;

-- alte Signatur bleibt (Werkzeuge, Tests) und rechnet mit „im Auftrag“
create or replace function isms.report_status(
  p_kind text, p_applicability text, p_fulfillment text, p_implementation text,
  p_effectiveness text, p_evidence_state text, p_approval text, p_depth integer
) returns text
  language sql immutable
  as $$ select isms.report_status(p_kind, 'in_scope', p_applicability, p_fulfillment, p_implementation,
                                  p_effectiveness, p_evidence_state, p_approval, p_depth) $$;

alter table control_assessment drop column report_status;
alter table control_assessment add column report_status text generated always as (
  isms.report_status('control', scope_relation, applicability, null, implementation, effectiveness, evidence_state, approval, required_depth)) stored;
alter table requirement_assessment drop column report_status;
alter table requirement_assessment add column report_status text generated always as (
  isms.report_status('requirement', scope_relation, applicability, fulfillment, null, null, evidence_state, approval, null)) stored;

-- -----------------------------------------------------------------------------
-- P-A4: Prüfschritt-Protokoll
-- -----------------------------------------------------------------------------
create table assessment_step (
  id                        uuid primary key default gen_random_uuid(),
  mandate_id                uuid not null references mandate on delete cascade,
  control_assessment_id     uuid references control_assessment on delete cascade,
  requirement_assessment_id uuid references requirement_assessment on delete cascade,
  method                    text not null check (method in ('examine', 'interview', 'test', 'observation')),
  performed_by              uuid not null,
  performed_at              timestamptz not null,
  object_examined           text not null check (length(trim(object_examined)) > 0),
  sample                    text,
  source_ref                text not null check (length(trim(source_ref)) > 0),
  evidence_id               uuid references evidence,
  result                    text not null check (length(trim(result)) > 0),
  limitations               text not null check (length(trim(limitations)) > 0),
  ai_proposal_id            uuid references ai_proposal,
  recorded_at               timestamptz not null default now(),
  foreign key (mandate_id, performed_by) references mandate_participant,
  constraint step_one_target check ((control_assessment_id is not null) <> (requirement_assessment_id is not null)),
  constraint step_not_in_future check (performed_at <= recorded_at + interval '5 minutes')
);
create index assessment_step_control on assessment_step (control_assessment_id);
create index assessment_step_requirement on assessment_step (requirement_assessment_id);

create function isms.assessment_step_rules() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
declare v_target_mandate uuid; v_evidence_mandate uuid;
begin
  if isms.is_ai_session() then
    raise exception 'Prüfschritte protokolliert nur ein Mensch – die KI darf eine Durchführung nur vorschlagen' using errcode = 'insufficient_privilege';
  end if;
  if isms.current_person_id() is not null and new.performed_by <> isms.current_person_id() then
    raise exception 'Prüfschritt nur für sich selbst protokollieren' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from mandate_role r join person p on p.id = r.person_id
                  where r.mandate_id = new.mandate_id and r.person_id = new.performed_by and p.party = 'agency'
                    and r.role in ('engagement_lead', 'consultant', 'junior_consultant', 'subject_matter_expert', 'independent_reviewer')) then
    raise exception 'Prüfschritt nur durch DT Agency mit fachlicher Rolle im Mandat' using errcode = 'insufficient_privilege';
  end if;
  select mandate_id into v_target_mandate from control_assessment where id = new.control_assessment_id;
  if v_target_mandate is null then
    select mandate_id into v_target_mandate from requirement_assessment where id = new.requirement_assessment_id;
  end if;
  if v_target_mandate is distinct from new.mandate_id then
    raise exception 'Prüfschritt und Bewertung gehören zu verschiedenen Mandaten' using errcode = 'check_violation';
  end if;
  if new.evidence_id is not null then
    select mandate_id into v_evidence_mandate from evidence where id = new.evidence_id;
    if v_evidence_mandate is distinct from new.mandate_id then
      raise exception 'Nachweis gehört zu einem anderen Mandat' using errcode = 'check_violation';
    end if;
  end if;
  if new.method in ('test', 'observation') and length(trim(coalesce(new.sample, ''))) = 0 then
    raise exception 'Test und Beobachtung nennen die Stichprobe' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger assessment_step_rules before insert on assessment_step
  for each row execute function isms.assessment_step_rules();
create trigger assessment_step_append_only before update or delete on assessment_step
  for each row execute function isms.append_only();
create trigger audit_assessment_step after insert on assessment_step
  for each row execute function isms.audit_status('method');

alter table assessment_step enable row level security;
-- interne Arbeitspapiere: nur DT Agency im Mandat; Korrektur = neuer Schritt
create policy step_agency_read on assessment_step for select using (agency_in(mandate_id));
create policy step_agency_insert on assessment_step for insert with check (agency_in(mandate_id));
select isms.apply_ai_restrictions('assessment_step', 'not isms.is_ai_session() or mandate_id = isms.ai_mandate()');

-- -----------------------------------------------------------------------------
-- Abgeleiteter Prüfstatus E0–E4
-- -----------------------------------------------------------------------------
create function isms.evidence_grade(p_control uuid, p_requirement uuid) returns text
  language sql stable security definer set search_path = isms, public as $$
  select case
    when exists (select 1 from assessment_step s where (s.control_assessment_id = p_control or s.requirement_assessment_id = p_requirement)
                   and s.method in ('test', 'observation')) then 'E4'
    when exists (select 1 from assessment_step s where s.control_assessment_id = p_control or s.requirement_assessment_id = p_requirement) then 'E3'
    when exists (select 1 from assessment_evidence ae join evidence e on e.id = ae.evidence_id
                  where (ae.control_assessment_id = p_control or ae.requirement_assessment_id = p_requirement) and e.kind = 'evidence') then 'E2'
    when exists (select 1 from assessment_evidence ae join evidence e on e.id = ae.evidence_id
                  where (ae.control_assessment_id = p_control or ae.requirement_assessment_id = p_requirement) and e.kind = 'claim') then 'E1'
    else 'E0'
  end
$$;

-- R1/R2 erweitert: „ausreichend“ nur mit menschlichem Prüfschritt (E3/E4), „wirksam“ nur mit Stichprobe
create function isms.check_evidence_grade() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
declare v_grade text; v_label text;
begin
  if tg_table_name = 'control_assessment' then
    v_grade := isms.evidence_grade(new.id, null);
    v_label := new.control_id;
    if new.effectiveness = 'effective' and not exists (
         select 1 from assessment_step s where s.control_assessment_id = new.id and length(trim(coalesce(s.sample, ''))) > 0) then
      raise exception 'Wirksamkeit für % nur mit protokolliertem Prüfschritt samt Stichprobe', v_label using errcode = 'check_violation';
    end if;
  else
    v_grade := isms.evidence_grade(null, new.id);
    v_label := new.clause;
  end if;
  if new.evidence_state = 'sufficient' and v_grade not in ('E3', 'E4') then
    raise exception '„Nachweis ausreichend“ für % verlangt einen protokollierten Prüfschritt (Prüfstatus E3/E4, ist %)', v_label, v_grade
      using errcode = 'check_violation';
  end if;
  return null;
end $$;
create constraint trigger control_assessment_grade
  after insert or update on control_assessment deferrable initially deferred
  for each row execute function isms.check_evidence_grade();
create constraint trigger requirement_assessment_grade
  after insert or update on requirement_assessment deferrable initially deferred
  for each row execute function isms.check_evidence_grade();

grant select, insert on assessment_step to isms_app;
grant execute on all functions in schema isms to isms_app;
