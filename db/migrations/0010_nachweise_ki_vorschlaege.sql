-- =============================================================================
-- 0010 – Nachweise und KI-Vorschläge (MVP WP-06/WP-08; 02 §4.4, §7.2; TC-10, TC-11, TC-12)
--   · Nachweise: Hash bei gespeicherter Datei, Deduplikation je Mandat, Klassifikation
--   · Verknüpfung mit Bewertungsumfang; Wiederverwendung aus anderem Mandat zählt erst nach
--     erneuter Bewertung (Geltungsbereich, Stand, Zulassung, Aussagekraft) durch DT Agency
--   · ai_proposal: Fundstelle, Modell-/Promptversion, Scope, Unsicherheit; Status nach 02 §4.4;
--     gesperrte Stände unveränderlich
--   · KI-Sitzung (app.actor_kind = 'ai'): schreibt nur Vorschläge, liest nur das eigene Mandat
--     (app.ai_mandate) – Anweisungen in Dokumenten können daran nichts ändern
-- =============================================================================
set search_path = isms, public;

create function isms.is_ai_session() returns boolean
  language sql stable as $$ select coalesce(current_setting('app.actor_kind', true), '') = 'ai' $$;
create function isms.ai_mandate() returns uuid
  language sql stable as $$ select nullif(current_setting('app.ai_mandate', true), '')::uuid $$;

-- -----------------------------------------------------------------------------
-- Nachweise
-- -----------------------------------------------------------------------------
alter table evidence add column classification text not null default 'confidential'
  check (classification in ('public', 'internal', 'confidential', 'strictly_confidential'));
alter table evidence add column storage_ref text;
alter table evidence add constraint stored_file_has_hash check (storage_ref is null or sha256 is not null);
create unique index evidence_dedup on evidence (mandate_id, sha256) where sha256 is not null;

-- -----------------------------------------------------------------------------
-- Verknüpfung mit Bewertungsumfang (EvidenceLink)
-- -----------------------------------------------------------------------------
alter table assessment_evidence
  add column link_state text not null default 'confirmed' check (link_state in ('confirmed', 'pending_review', 'rejected')),
  add column open_checks text[] not null default '{}',
  add column scope_version_id uuid references scope_version,
  add column reviewed_by uuid references person,
  add column reviewed_at timestamptz,
  add column review_note text;

create function isms.evidence_link_context() returns trigger
  language plpgsql as $$
declare v_ev_mandate uuid; v_ev_org uuid; v_valid date; v_target_mandate uuid; v_target_org uuid;
begin
  select e.mandate_id, m.customer_id, e.valid_until into v_ev_mandate, v_ev_org, v_valid
    from isms.evidence e join isms.mandate m on m.id = e.mandate_id where e.id = new.evidence_id;
  select coalesce(ca.mandate_id, ra.mandate_id) into v_target_mandate
    from (select 1) x
    left join isms.control_assessment ca on ca.id = new.control_assessment_id
    left join isms.requirement_assessment ra on ra.id = new.requirement_assessment_id;
  select customer_id into v_target_org from isms.mandate where id = v_target_mandate;

  if tg_op = 'INSERT' then
    if v_ev_org is distinct from v_target_org then
      raise exception 'Zulassung fehlt: Nachweis einer anderen Organisation (Mandantentrennung)' using errcode = 'check_violation';
    end if;
    if v_ev_mandate <> v_target_mandate then
      new.link_state := 'pending_review';
      new.open_checks := array['scope_fit', 'currency', 'permission', 'applicability'];
    elsif v_valid is not null and v_valid < current_date then
      new.link_state := 'pending_review';
      new.open_checks := array['currency'];
    else
      new.link_state := 'confirmed';
      new.open_checks := '{}';
    end if;
    return new;
  end if;

  -- Bestätigung nur durch DT Agency und nur ohne offene Prüfpunkte
  if new.link_state = 'confirmed' and old.link_state <> 'confirmed' then
    if cardinality(new.open_checks) > 0 then
      raise exception 'Wiederverwendung: offene Prüfpunkte %', new.open_checks using errcode = 'check_violation';
    end if;
    if is_ai_session() or not exists (select 1 from isms.person where id = new.reviewed_by and party = 'agency') or new.reviewed_at is null then
      raise exception 'Wiederverwendung bestätigt nur ein Mensch von DT Agency' using errcode = 'check_violation';
    end if;
  end if;
  if new.link_state = 'rejected' and length(trim(coalesce(new.review_note, ''))) = 0 then
    raise exception 'Ablehnung einer Verknüpfung ohne Begründung' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger evidence_link_context before insert or update on assessment_evidence
  for each row execute function isms.evidence_link_context();

-- R1/R2: nur bestätigte Verknüpfungen tragen eine Bewertung
create or replace function isms.check_evidence_backing() returns trigger
  language plpgsql as $$
declare v_ok boolean;
begin
  if tg_table_name = 'control_assessment' then
    if new.evidence_state = 'sufficient' or new.effectiveness in ('effective', 'ineffective') then
      select exists (
        select 1 from isms.assessment_evidence ae join isms.evidence e on e.id = ae.evidence_id
         where ae.control_assessment_id = new.id and ae.link_state = 'confirmed' and isms.evidence_suitable(e))
        into v_ok;
      if not v_ok then
        raise exception 'R1/R2: % % braucht einen geeigneten, bestätigt verknüpften Nachweis', new.mandate_id, new.control_id
          using errcode = 'check_violation';
      end if;
    end if;
  else
    if new.evidence_state = 'sufficient' then
      select exists (
        select 1 from isms.assessment_evidence ae join isms.evidence e on e.id = ae.evidence_id
         where ae.requirement_assessment_id = new.id and ae.link_state = 'confirmed' and isms.evidence_suitable(e))
        into v_ok;
      if not v_ok then
        raise exception 'R1: Anforderung % braucht einen geeigneten, bestätigt verknüpften Nachweis', new.clause
          using errcode = 'check_violation';
      end if;
    end if;
  end if;
  return null;
end $$;

-- -----------------------------------------------------------------------------
-- KI-Vorschläge
-- -----------------------------------------------------------------------------
create table ai_proposal (
  id               uuid primary key default gen_random_uuid(),
  mandate_id       uuid not null references mandate on delete cascade,
  target_table     text not null,
  target_id        text not null,
  payload          jsonb not null,
  original_payload jsonb,
  sources          jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) > 0),
  model            text not null check (length(trim(model)) > 0),
  prompt_version   text not null check (length(trim(prompt_version)) > 0),
  scope_version_id uuid not null references scope_version,
  uncertainty      text not null check (length(trim(uncertainty)) > 0),
  status           text not null default 'ai_proposed' check (status in ('ai_proposed', 'in_review', 'verified', 'persisted_locked',
                     'superseded', 'rejected_with_reason', 'deferred_with_owner_impact_trigger')),
  supersedes       uuid references ai_proposal,
  reviewed_by      uuid references person,
  reviewed_at      timestamptz,
  reason           text,
  defer_owner      text,
  defer_impact     text,
  defer_trigger    text,
  created_at       timestamptz not null default now(),
  constraint rejected_has_reason check (status <> 'rejected_with_reason' or length(trim(coalesce(reason, ''))) > 0),
  constraint deferred_complete check (status <> 'deferred_with_owner_impact_trigger'
    or (length(trim(coalesce(defer_owner, ''))) > 0 and length(trim(coalesce(defer_impact, ''))) > 0 and length(trim(coalesce(defer_trigger, ''))) > 0)),
  constraint human_decided check (status in ('ai_proposed', 'in_review') or (reviewed_by is not null and reviewed_at is not null))
);

-- Jede Fundstelle: Nachweis des eigenen Mandats + Stelle im Beleg (US-C1)
create function isms.proposal_sources_valid() returns trigger
  language plpgsql as $$
declare s jsonb;
begin
  for s in select * from jsonb_array_elements(new.sources) loop
    if length(trim(coalesce(s ->> 'locator', ''))) = 0 then
      raise exception 'Fundstelle fehlt' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from isms.evidence where id = (s ->> 'evidence_id')::uuid and mandate_id = new.mandate_id) then
      raise exception 'Quelle % gehört nicht zum Mandat', s ->> 'evidence_id' using errcode = 'check_violation';
    end if;
  end loop;
  return new;
end $$;
create trigger proposal_sources before insert or update of sources on ai_proposal
  for each row execute function isms.proposal_sources_valid();

create function isms.proposal_transition() returns trigger
  language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status not in ('ai_proposed', 'in_review') then
      raise exception 'Vorschläge entstehen als ai_proposed bzw. in_review' using errcode = 'check_violation';
    end if;
    return new;
  end if;
  if old.status in ('persisted_locked', 'superseded', 'rejected_with_reason') then
    if old.status = 'persisted_locked' and new.status = 'superseded'
       and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') and not is_ai_session() then
      return new;
    end if;
    raise exception 'Gesperrter Stand (%) ist unveränderlich – Änderung nur als neuer Vorschlag', old.status
      using errcode = 'check_violation';
  end if;
  if new.status is distinct from old.status or new.payload is distinct from old.payload then
    if is_ai_session() then
      raise exception 'KI darf Vorschläge nicht prüfen, ändern, verifizieren oder sperren' using errcode = 'check_violation';
    end if;
    if not (old.status, new.status) in (
      ('ai_proposed', 'in_review'), ('deferred_with_owner_impact_trigger', 'in_review'),
      ('in_review', 'verified'), ('in_review', 'in_review'),
      ('ai_proposed', 'rejected_with_reason'), ('in_review', 'rejected_with_reason'),
      ('ai_proposed', 'deferred_with_owner_impact_trigger'), ('in_review', 'deferred_with_owner_impact_trigger'),
      ('verified', 'persisted_locked')) then
      raise exception 'Vorschlagsstatus % → % nicht zulässig', old.status, new.status using errcode = 'check_violation';
    end if;
    if new.status in ('verified', 'persisted_locked', 'rejected_with_reason', 'deferred_with_owner_impact_trigger')
       and not exists (select 1 from isms.person where id = new.reviewed_by and party = 'agency') then
      raise exception 'Vorschläge entscheidet ein Mensch von DT Agency' using errcode = 'check_violation';
    end if;
    -- Korrektur: der ursprüngliche KI-Inhalt bleibt erhalten
    if new.payload is distinct from old.payload and new.original_payload is null then
      new.original_payload := old.payload;
    end if;
  end if;
  return new;
end $$;
create trigger proposal_transition before insert or update on ai_proposal
  for each row execute function isms.proposal_transition();
create trigger proposal_no_delete before delete on ai_proposal
  for each row execute function isms.append_only();

create trigger audit_proposal after insert or update of status on ai_proposal
  for each row execute function isms.audit_status('status');
create trigger audit_evidence_link after update of link_state on assessment_evidence
  for each row execute function isms.audit_status('link_state');

alter table ai_proposal enable row level security;
create policy proposal_agency on ai_proposal for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));

-- -----------------------------------------------------------------------------
-- Protokoll: KI als Akteur, Sicherheitsereignisse
-- -----------------------------------------------------------------------------
alter table audit_event drop constraint audit_event_actor_kind_check;
alter table audit_event add constraint audit_event_actor_kind_check check (actor_kind in ('human', 'system', 'ai'));

create or replace function isms.audit_status() returns trigger
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
    case when tg_table_name = 'scope_version' then (select mandate_id from isms.assessment_case where id = (v_new ->> 'case_id')::uuid) end,
    case when tg_table_name = 'open_question' and v_new ->> 'case_id' is not null then (select mandate_id from isms.assessment_case where id = (v_new ->> 'case_id')::uuid) end,
    case when tg_table_name = 'assessment_evidence' then (select mandate_id from isms.evidence where id = (v_new ->> 'evidence_id')::uuid) end);
  insert into isms.audit_event (actor_id, actor_kind, event_type, object_table, object_id, mandate_id, details)
  values (v_actor, case when isms.is_ai_session() then 'ai' when v_actor is null then 'system' else 'human' end,
          tg_table_name || case when tg_op = 'INSERT' then '.created' else '.status_changed' end,
          tg_table_name, coalesce(v_new ->> 'id', v_new ->> 'evidence_id', ''), v_mandate,
          jsonb_build_object('from', v_old ->> v_col, 'to', v_new ->> v_col));
  return new;
end $$;

-- Sicherheitsereignis (z. B. anweisungsähnlicher Inhalt in einem Dokument) – nur protokollieren
create function isms.log_security_event(p_mandate uuid, p_evidence uuid, p_findings text[]) returns void
  language sql security definer set search_path = isms as $$
  insert into audit_event (actor_id, actor_kind, event_type, object_table, object_id, mandate_id, details)
  values (current_person_id(), case when is_ai_session() then 'ai' else 'human' end,
          'security.untrusted_instruction', 'evidence', p_evidence::text, p_mandate,
          jsonb_build_object('findings', to_jsonb(p_findings), 'handling', 'treated_as_content'))
$$;

-- -----------------------------------------------------------------------------
-- KI-Sitzung: einschränkende Richtlinien auf allen Tabellen
-- -----------------------------------------------------------------------------
do $$
declare r record; v_ref boolean; v_mandate boolean; v_using text;
begin
  for r in select c.relname from pg_class c where c.relnamespace = 'isms'::regnamespace and c.relkind = 'r' loop
    v_ref := r.relname in ('tenant', 'control', 'control_depth_spec', 'engagement_template');
    v_mandate := exists (select 1 from information_schema.columns
                          where table_schema = 'isms' and table_name = r.relname and column_name = 'mandate_id');
    v_using := case
      when v_ref then 'true'
      when r.relname = 'mandate' then 'not isms.is_ai_session() or id = isms.ai_mandate()'
      when r.relname = 'assessment_evidence' then 'not isms.is_ai_session() or isms.evidence_mandate(evidence_id) = isms.ai_mandate()'
      when r.relname = 'scope_version' then 'not isms.is_ai_session() or isms.case_mandate(case_id) = isms.ai_mandate()'
      when r.relname = 'finding_transition' then 'not isms.is_ai_session() or isms.finding_mandate(finding_id) = isms.ai_mandate()'
      when v_mandate then 'not isms.is_ai_session() or mandate_id = isms.ai_mandate()'
      else 'not isms.is_ai_session()' end;
    execute format('create policy ai_read_scope on isms.%I as restrictive for select using (%s)', r.relname, v_using);
    if r.relname = 'ai_proposal' then
      execute 'create policy ai_insert_only on isms.ai_proposal as restrictive for insert with check (not isms.is_ai_session() or (status = ''ai_proposed'' and mandate_id = isms.ai_mandate()))';
      execute 'create policy ai_no_update on isms.ai_proposal as restrictive for update using (not isms.is_ai_session())';
      execute 'create policy ai_no_delete on isms.ai_proposal as restrictive for delete using (not isms.is_ai_session())';
    else
      execute format('create policy ai_no_insert on isms.%I as restrictive for insert with check (not isms.is_ai_session())', r.relname);
      execute format('create policy ai_no_update on isms.%I as restrictive for update using (not isms.is_ai_session())', r.relname);
      execute format('create policy ai_no_delete on isms.%I as restrictive for delete using (not isms.is_ai_session())', r.relname);
    end if;
  end loop;
end $$;
