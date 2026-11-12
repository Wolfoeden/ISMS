-- =============================================================================
-- 0012 – Review, QA und gesperrte Berichtsversion (MVP WP-10; TC-13, TC-15, TC-16, US-D2)
--   Gleiche Regeln wie src/engagement/report.ts
-- =============================================================================
set search_path = isms, public;

create table report_version (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         text not null default 'dt-agency' references tenant,
  case_id           uuid not null references assessment_case,
  version           integer not null check (version > 0),
  scope_version_id  uuid not null references scope_version,
  status            text not null default 'draft' check (status in ('draft', 'in_qa', 'returned', 'stopped', 'approved', 'published', 'superseded')),
  content           jsonb not null,
  report_text       text not null,
  limitations       text,
  material_unknowns text[] not null default '{}',
  author_id         uuid not null references person,
  reviewer_id       uuid references person,
  qa_decision       text check (qa_decision in ('approve', 'approve_with_explicit_limitations', 'return_for_rework', 'reject_stop')),
  qa_reason         text,
  rework_target     text check (rework_target in ('scope_draft', 'collecting_evidence', 'ready_for_assessment', 'assessing', 'internal_review')),
  qa_at             timestamptz,
  published_by      uuid references person,
  published_at      timestamptz,
  content_sha256    text check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$'),
  evidence_snapshot jsonb,
  previous_id       uuid references report_version,
  change_log        text,
  created_at        timestamptz not null default now(),
  unique (case_id, version),
  -- TC-13: QA ist nie der Autor
  constraint reviewer_not_author check (reviewer_id is null or reviewer_id <> author_id),
  constraint qa_complete check (qa_decision is null or (reviewer_id is not null and qa_at is not null)),
  -- TC-15: Rückgabe nennt die Zielphase, Stopp eine Begründung
  constraint rework_has_target check (qa_decision is distinct from 'return_for_rework' or rework_target is not null),
  constraint stop_has_reason check (qa_decision is distinct from 'reject_stop' or length(trim(coalesce(qa_reason, ''))) > 0),
  -- TC-16: Freigabe trotz materieller Unbekannter nur mit benannten Einschränkungen
  constraint unknowns_need_limitations check (qa_decision is distinct from 'approve' or cardinality(material_unknowns) = 0),
  constraint limitations_named check (qa_decision is distinct from 'approve_with_explicit_limitations' or length(trim(coalesce(limitations, ''))) > 0),
  constraint status_matches_qa check (
    (status in ('approved', 'published', 'superseded') and qa_decision in ('approve', 'approve_with_explicit_limitations'))
    or (status = 'returned' and qa_decision = 'return_for_rework')
    or (status = 'stopped' and qa_decision = 'reject_stop')
    or (status in ('draft', 'in_qa') and qa_decision is null)),
  constraint published_complete check (status not in ('published', 'superseded')
    or (published_by is not null and published_at is not null and content_sha256 is not null and evidence_snapshot is not null)),
  -- Pflichtbaustein Einschränkungen (vorschriften.md §A17.3)
  constraint mandatory_limitation_text check (status not in ('approved', 'published')
    or position('Dieses Ergebnis ist keine Zertifizierung und kein Audit einer akkreditierten Stelle.' in report_text) > 0),
  constraint new_version_has_changelog check (previous_id is null or length(trim(coalesce(change_log, ''))) > 0)
);

create function isms.report_rules() returns trigger
  language plpgsql as $$
declare v_mandate uuid; v_unknown text;
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'Berichtsversion % kann nicht gelöscht werden', old.version using errcode = 'check_violation'; end if;
    return old;
  end if;
  v_mandate := isms.case_mandate(new.case_id);

  if tg_op = 'UPDATE' then
    -- US-D2: veröffentlicht = gesperrt; nur published → superseded
    if old.status in ('published', 'superseded', 'stopped') then
      if old.status = 'published' and new.status = 'superseded' and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then
        return new;
      end if;
      raise exception 'Berichtsversion % ist gesperrt – Änderung nur als neue Version mit Änderungsprotokoll', old.version
        using errcode = 'check_violation';
    end if;
    if old.status in ('approved', 'returned') and (new.content is distinct from old.content or new.report_text is distinct from old.report_text
        or new.limitations is distinct from old.limitations) then
      raise exception 'Inhalt nach QA-Entscheidung unveränderlich – neue Version anlegen' using errcode = 'check_violation';
    end if;
    if not (old.status, new.status) in (('draft', 'draft'), ('draft', 'in_qa'), ('in_qa', 'in_qa'), ('in_qa', 'approved'), ('in_qa', 'returned'),
                                        ('in_qa', 'stopped'), ('approved', 'published'), ('approved', 'approved'), ('returned', 'returned')) then
      raise exception 'Berichtsstatus % → % nicht zulässig', old.status, new.status using errcode = 'check_violation';
    end if;
  elsif new.status <> 'draft' then
    raise exception 'Berichtsversionen entstehen als Entwurf' using errcode = 'check_violation';
  end if;

  -- QA nur durch Independent Reviewer des Mandats (DEC-05, D-11)
  if new.qa_decision is not null and (tg_op = 'INSERT' or old.qa_decision is null) then
    if is_ai_session() or not exists (select 1 from isms.mandate_role where mandate_id = v_mandate and person_id = new.reviewer_id and role = 'independent_reviewer') then
      raise exception 'QA-Entscheidung nur durch einen Independent Reviewer des Mandats' using errcode = 'check_violation';
    end if;
    if new.qa_decision = 'approve_with_explicit_limitations' then
      foreach v_unknown in array new.material_unknowns loop
        if position(v_unknown in new.limitations) = 0 then
          raise exception 'Einschränkungen nennen nicht: % (TC-16)', v_unknown using errcode = 'check_violation';
        end if;
      end loop;
    end if;
  end if;
  if new.status = 'published' and old.status = 'approved' then
    if not exists (select 1 from isms.mandate_role where mandate_id = v_mandate and person_id = new.published_by and role in ('engagement_lead', 'independent_reviewer')) then
      raise exception 'Veröffentlichung nur durch Engagement Lead oder Independent Reviewer' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger report_rules before insert or update or delete on report_version
  for each row execute function isms.report_rules();
create trigger audit_report after insert or update of status on report_version
  for each row execute function isms.audit_status('status');

-- Veröffentlichung ersetzt die Vorversion (bleibt reproduzierbar) und setzt den Prüfvorgang
create function isms.report_published() returns trigger
  language plpgsql as $$
begin
  if new.status = 'published' and old.status = 'approved' then
    if new.previous_id is not null then
      update isms.report_version set status = 'superseded' where id = new.previous_id and status = 'published';
    end if;
    update isms.assessment_case set status = 'published' where id = new.case_id and status = 'approved';
  end if;
  return new;
end $$;
create trigger report_published after update of status on report_version
  for each row execute function isms.report_published();

-- Prüfvorgang: Veröffentlichung/Freigabe nur mit passender Berichtsversion; Abschluss nach QA-Entscheidung
create function isms.case_report_gate() returns trigger
  language plpgsql as $$
begin
  if new.status = 'approved' and old.status <> 'approved'
     and not exists (select 1 from isms.report_version where case_id = new.id and status = 'approved') then
    raise exception 'Prüfvorgang „approved“ nur mit QA-freigegebener Berichtsversion' using errcode = 'check_violation';
  end if;
  if new.status = 'published' and old.status <> 'published'
     and not exists (select 1 from isms.report_version where case_id = new.id and status = 'published') then
    raise exception 'Keine Veröffentlichung ohne gesperrte Berichtsversion (TC-15)' using errcode = 'check_violation';
  end if;
  if new.status = 'closed' and exists (select 1 from isms.report_version where case_id = new.id and status = 'published'
                                         and qa_decision = 'approve_with_explicit_limitations') then
    raise exception 'Bericht mit Einschränkungen: Abschluss nur als closed_with_limitations (TC-16)' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger case_report_gate before update of status on assessment_case
  for each row execute function isms.case_report_gate();

-- Zugriffsschutz: DT Agency im Mandat; Kunde sieht nur veröffentlichte Versionen
alter table report_version enable row level security;
create policy report_agency on report_version for all using (agency_in(case_mandate(case_id))) with check (agency_in(case_mandate(case_id)));
create policy report_customer on report_version for select
  using (not is_agency() and status in ('published', 'superseded') and participates(case_mandate(case_id)));
create policy ai_read_scope on report_version as restrictive for select using (not is_ai_session() or case_mandate(case_id) = ai_mandate());
create policy ai_no_insert on report_version as restrictive for insert with check (not is_ai_session());
create policy ai_no_update on report_version as restrictive for update using (not is_ai_session());
create policy ai_no_delete on report_version as restrictive for delete using (not is_ai_session());
