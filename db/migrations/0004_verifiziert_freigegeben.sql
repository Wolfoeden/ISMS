-- =============================================================================
-- 0004 – ENT-029 (Option 3, freigegeben 2026-11-12): zwei Stufen
--   verified (verifiziert)  = fachlich gegen Quelle/Nachweise geprüft
--   approved (freigegeben)  = zur Verwendung/Weitergabe genehmigt
-- Stufenfolge: open → proposed → verified → approved → filed
-- =============================================================================
set search_path = isms, public;

-- Feststellungen: verify (Quality Gate) vor approve (Engagement Lead)
alter table finding drop constraint finding_status_check;
alter table finding add constraint finding_status_check
  check (status in ('open', 'proposed', 'verified', 'approved', 'filed', 'rejected'));
alter table finding_transition drop constraint finding_transition_action_check;
alter table finding_transition add constraint finding_transition_action_check
  check (action in ('submit', 'return', 'verify', 'approve', 'file', 'reject', 'discuss', 'accept', 'dispute', 'rereview'));

-- Bewertungen: Wertebereich der Freigabe-Achse erweitern
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
    from pg_constraint c
    where c.contype = 'c'
      and c.conrelid in ('isms.control_assessment'::regclass, 'isms.requirement_assessment'::regclass)
      and pg_get_constraintdef(c.oid) ~ 'approval = ANY'
      and pg_get_constraintdef(c.oid) ~ '''open'''
      and pg_get_constraintdef(c.oid) !~ 'conflicting'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;
alter table control_assessment add constraint control_assessment_approval_check
  check (approval in ('open', 'proposed', 'verified', 'approved', 'filed'));
alter table requirement_assessment add constraint requirement_assessment_approval_check
  check (approval in ('open', 'proposed', 'verified', 'approved', 'filed'));

-- Berichtsstatus: verifiziert, aber nicht freigegeben → needs_review (wie src/bewertung/modell.ts)
create or replace function isms.report_status(
  p_kind text, p_applicability text, p_fulfillment text, p_implementation text,
  p_effectiveness text, p_evidence_state text, p_approval text, p_depth integer
) returns text
  language sql immutable
  as $$
    select case
      when p_applicability = 'not_applicable' then 'not_applicable'
      when p_evidence_state = 'conflicting' or p_approval in ('proposed', 'verified') then 'needs_review'
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

-- gespeicherte Berichtsstatus neu berechnen
update control_assessment set approval = approval;
update requirement_assessment set approval = approval;
