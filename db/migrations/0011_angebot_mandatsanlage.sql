-- =============================================================================
-- 0011 – Angebot, idempotente Mandatsanlage, Storno (MVP WP-05; TC-07, TC-08, TC-19, TC-20, TC-22)
--   Gleiche Regeln wie src/engagement/offer.ts
-- =============================================================================
set search_path = isms, public;

create table offer (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   text not null default 'dt-agency' references tenant,
  case_id                     uuid not null references assessment_case on delete cascade,
  version                     integer not null check (version > 0),
  scope_version_id            uuid not null references scope_version,
  customer_id                 uuid not null references organization,
  engagement_type             text not null,
  depth_profile               smallint not null check (depth_profile between 1 and 4),
  planned_start               date not null,
  service_description         text not null,
  customer_wants_certificate  boolean not null default false,
  status                      text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired', 'superseded')),
  sent_at                     date,
  valid_until                 date,
  created_by                  uuid references person,
  created_at                  timestamptz not null default now(),
  unique (case_id, version),
  constraint sent_has_deadline check (status = 'draft' or (sent_at is not null and valid_until is not null and valid_until >= sent_at)),
  -- TC-22: Pflichtbaustein Leistungsabgrenzung (vorschriften.md §A17.3)
  constraint no_certification_claim check (status = 'draft' or position('Es ist keine Zertifizierung und kein Audit einer akkreditierten Stelle' in service_description) > 0),
  constraint certificate_wish_answered check (status = 'draft' or not customer_wants_certificate
    or position('kann nur eine dafür akkreditierte Zertifizierungsstelle' in service_description) > 0)
);
-- je Prüfvorgang höchstens ein offenes Angebot
create unique index one_open_offer on offer (case_id) where status in ('draft', 'sent');

create function isms.offer_rules() returns trigger
  language plpgsql as $$
declare v_scope_status text; v_scope_case uuid;
begin
  select status, case_id into v_scope_status, v_scope_case from isms.scope_version where id = new.scope_version_id;
  if v_scope_case <> new.case_id then
    raise exception 'Scope-Version gehört nicht zum Prüfvorgang' using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' then
    if old.status <> 'draft' then
      -- nach Versand unveränderlich; nur Statuswechsel
      if (to_jsonb(new) - 'status') <> (to_jsonb(old) - 'status') then
        raise exception 'Versandtes Angebot ist unveränderlich – Änderung nur als neue Version (TC-08)' using errcode = 'check_violation';
      end if;
      if not (old.status, new.status) in (('sent', 'accepted'), ('sent', 'declined'), ('sent', 'expired'), ('sent', 'superseded')) then
        raise exception 'Angebotsstatus % → % nicht zulässig', old.status, new.status using errcode = 'check_violation';
      end if;
      if new.status = 'accepted' and old.valid_until < current_date then
        raise exception 'Angebotsfrist abgelaufen – keine Annahme (TC-07)' using errcode = 'check_violation';
      end if;
      return new;
    end if;
    if new.status not in ('draft', 'sent', 'superseded') then
      raise exception 'Entwurf kann nur versandt oder ersetzt werden' using errcode = 'check_violation';
    end if;
  end if;
  if new.status = 'sent' and v_scope_status <> 'approved' then
    raise exception 'Angebot nur auf Grundlage einer freigegebenen Scope-Version' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger offer_rules before insert or update on offer for each row execute function isms.offer_rules();

create trigger audit_offer after insert or update of status on offer
  for each row execute function isms.audit_status('status');

-- Abgelaufene Angebote (Timer, DEC-10) – gibt die Zahl der geänderten Angebote zurück
create function isms.expire_offers(p_today date default current_date) returns integer
  language sql as $$
  with x as (update isms.offer set status = 'expired' where status = 'sent' and valid_until < p_today returning 1)
  select count(*)::integer from x
$$;

-- -----------------------------------------------------------------------------
-- Mandatsanlage aus der Unterschrift – genau ein Mandat je Angebot (TC-20)
-- -----------------------------------------------------------------------------
alter table mandate add column offer_id uuid references offer;
create unique index one_mandate_per_offer on mandate (offer_id) where offer_id is not null;

create table processed_event (
  event_id     text primary key,
  handler      text not null,
  result_id    uuid,
  processed_at timestamptz not null default now()
);

-- Läuft mit Systemrechten (Nachrichtenverarbeitung); aufrufen dürfen nur der Systemprozess
-- (ohne angemeldete Person) oder DT Agency – nie Kunden oder eine KI-Sitzung.
create function isms.handle_signed_mandate(p_event_id text, p_offer uuid) returns uuid
  language plpgsql security definer set search_path = isms as $$
declare v_result uuid; v_offer isms.offer; v_mandate uuid;
begin
  if isms.is_ai_session() or (isms.current_person_id() is not null and not isms.is_agency()) then
    raise exception 'Mandatsanlage nur durch Systemprozess oder DT Agency' using errcode = 'insufficient_privilege';
  end if;
  -- dieselbe Nachricht erneut: gespeichertes Ergebnis zurückgeben
  select result_id into v_result from isms.processed_event where event_id = p_event_id;
  if found then return v_result; end if;
  -- andere Nachricht zum selben Angebot: bestehendes Mandat
  select id into v_mandate from isms.mandate where offer_id = p_offer;
  if found then
    insert into isms.processed_event (event_id, handler, result_id) values (p_event_id, 'signed_mandate', v_mandate);
    return v_mandate;
  end if;

  select * into v_offer from isms.offer where id = p_offer for update;
  if v_offer.status <> 'sent' then
    raise exception 'Angebot ist % – kein Mandat', v_offer.status using errcode = 'check_violation';
  end if;
  update isms.offer set status = 'accepted' where id = p_offer;  -- prüft Frist (TC-07)
  insert into isms.mandate (customer_id, scope, engagement_type, depth_profile, status, start_date, offer_id)
  select v_offer.customer_id, 'Scope-Version ' || sv.version || ': ' || sv.goal, v_offer.engagement_type, v_offer.depth_profile,
         'signed', v_offer.planned_start, v_offer.id
    from isms.scope_version sv where sv.id = v_offer.scope_version_id
  returning id into v_mandate;
  update isms.assessment_case set mandate_id = v_mandate where id = v_offer.case_id and mandate_id is null;
  insert into isms.processed_event (event_id, handler, result_id) values (p_event_id, 'signed_mandate', v_mandate);
  return v_mandate;
end $$;

-- -----------------------------------------------------------------------------
-- Storno (TC-19): nur mit dokumentierter Daten- und Vertragsentscheidung
-- -----------------------------------------------------------------------------
create table mandate_termination (
  mandate_id        uuid primary key references mandate,
  reason            text not null check (length(trim(reason)) > 0),
  data_decision     text not null check (data_decision in ('delete', 'retain')),
  retain_until      date,
  retention_basis   text,
  contract_decision text not null check (length(trim(contract_decision)) > 0),
  decided_by        uuid not null references person,
  decided_at        timestamptz not null default now(),
  constraint retain_complete check (data_decision = 'delete' or (retain_until is not null and length(trim(coalesce(retention_basis, ''))) > 0))
);

create function isms.termination_rules() returns trigger
  language plpgsql as $$
begin
  if tg_table_name = 'mandate_termination' then
    if not exists (select 1 from isms.person where id = new.decided_by and party = 'agency') then
      raise exception 'Storno-Entscheidung dokumentiert DT Agency' using errcode = 'check_violation';
    end if;
    return new;
  end if;
  if new.status = 'terminated' and old.status <> 'terminated' then
    if not exists (select 1 from isms.mandate_termination where mandate_id = new.id) then
      raise exception 'Storno ohne dokumentierte Daten- und Vertragsentscheidung (TC-19)' using errcode = 'check_violation';
    end if;
    -- laufende Prüfvorgänge stoppen
    update isms.assessment_case set status = 'cancelled'
     where mandate_id = new.id and status not in ('closed', 'closed_with_limitations', 'cancelled');
  end if;
  return new;
end $$;
create trigger termination_decision before insert or update on mandate_termination
  for each row execute function isms.termination_rules();
create trigger mandate_termination_rules after update of status on mandate
  for each row execute function isms.termination_rules();

-- -----------------------------------------------------------------------------
-- Zugriffsschutz
-- -----------------------------------------------------------------------------
alter table offer enable row level security;
create policy offer_agency on offer for all
  using (is_agency() and (case_mandate(case_id) is null or participates(case_mandate(case_id))))
  with check (is_agency() and (case_mandate(case_id) is null or participates(case_mandate(case_id))));
create policy offer_customer on offer for select
  using (not is_agency() and status <> 'draft' and (own_organization(customer_id)));

alter table processed_event enable row level security;
create policy processed_event_agency on processed_event for select using (is_agency());

alter table mandate_termination enable row level security;
create policy termination_agency on mandate_termination for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
create policy termination_customer on mandate_termination for select using (not is_agency() and participates(mandate_id));

-- KI-Sitzung: keine Schreibrechte, Lesen nur im eigenen Mandat (wie 0010)
create policy ai_read_scope on offer as restrictive for select using (not is_ai_session() or case_mandate(case_id) = ai_mandate());
create policy ai_no_insert on offer as restrictive for insert with check (not is_ai_session());
create policy ai_no_update on offer as restrictive for update using (not is_ai_session());
create policy ai_no_delete on offer as restrictive for delete using (not is_ai_session());
create policy ai_read_scope on processed_event as restrictive for select using (not is_ai_session());
create policy ai_no_insert on processed_event as restrictive for insert with check (not is_ai_session());
create policy ai_read_scope on mandate_termination as restrictive for select using (not is_ai_session() or mandate_id = ai_mandate());
create policy ai_no_insert on mandate_termination as restrictive for insert with check (not is_ai_session());
create policy ai_no_update on mandate_termination as restrictive for update using (not is_ai_session());
