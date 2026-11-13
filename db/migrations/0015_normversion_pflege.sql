-- 0015 · Normversionen pflegt DT Agency (Methodik). Im Prototyp ohne eigene Methodik-Rolle;
-- jede Änderung erzeugt über framework_version_impact Folgeprüfungen (TC-17).
-- Hinterlegte Versionen sind unveränderlich – eine Korrektur ist eine neue Version.
set search_path = isms, public;
create policy framework_version_agency_insert on framework_version for insert with check (is_agency());
create trigger framework_version_immutable before update or delete on framework_version
  for each row execute function isms.append_only();

-- Korrektur (gefunden durch WP-11, N-04): Der Fristen-Lauf ist ein Systemprozess ohne Person und
-- sah unter dem Zugriffsschutz keine Angebote – abgelaufene Angebote blieben offen.
-- Er läuft jetzt mit Systemrechten; aufrufen dürfen nur Systemprozess oder DT Agency.
create or replace function isms.expire_offers(p_today date default current_date) returns integer
  language plpgsql security definer set search_path = isms, public as $$
declare n integer;
begin
  if is_ai_session() or (current_person_id() is not null and not is_agency()) then
    raise exception 'Fristen-Lauf nur durch Systemprozess oder DT Agency' using errcode = 'insufficient_privilege';
  end if;
  update offer set status = 'expired' where status = 'sent' and valid_until < p_today;
  get diagnostics n = row_count;
  return n;
end $$;

-- Korrektur (gefunden durch WP-11, Spurprotokoll): Protokolleinträge zu Berichtsversion, Angebot und
-- Folgeprüfung hatten keinen Mandatsbezug. Sie fehlten im Mandatsprotokoll und waren – ohne Bezug –
-- für alle Agenturpersonen sichtbar. Jeder Eintrag mit Prüfvorgang wird jetzt dem Mandat zugeordnet.
create or replace function isms.audit_status() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
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
    case when v_new ->> 'case_id' is not null then (select mandate_id from isms.assessment_case where id = (v_new ->> 'case_id')::uuid) end,
    case when tg_table_name = 'assessment_evidence' then (select mandate_id from isms.evidence where id = (v_new ->> 'evidence_id')::uuid) end);
  insert into isms.audit_event (actor_id, actor_kind, event_type, object_table, object_id, mandate_id, details)
  values (v_actor, case when isms.is_ai_session() then 'ai' when v_actor is null then 'system' else 'human' end,
          tg_table_name || case when tg_op = 'INSERT' then '.created' else '.status_changed' end,
          tg_table_name, coalesce(v_new ->> 'id', v_new ->> 'evidence_id', ''), v_mandate,
          jsonb_build_object('from', v_old ->> v_col, 'to', v_new ->> v_col));
  return new;
end $$;
