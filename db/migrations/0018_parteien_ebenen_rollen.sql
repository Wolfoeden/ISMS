-- =============================================================================
-- 0018 – P-A2 (Lastenheft AE-06, F-001, F-003, F-004, F-012, F-041; A-13, A-44 – A-46)
--   · Beteiligte je Prüfvorgang mit Rolle; unbekannte Zuordnung bleibt „offen“ (kein Raten)
--   · Beziehungen Beteiligter ↔ Bewertungsobjekt (entwickelt, betreibt, liefert, …), bestätigt oder offen
--     Produkt, Lieferant, Betreiber und Auftraggeber werden nie still gleichgesetzt.
--   · Ebene je Bewertung, Feststellung, Risiko, Maßnahme: Lieferant · Produkt · Betrieb · übergreifend
--     (übergreifend nur mit Begründung). In 3PA/Produktprüfungen Pflicht vor der fachlichen Prüfung.
--   · Freigaberecht nach Mandatsrolle, nicht nach Agenturzugehörigkeit (AE-06.03):
--       verifiziert: Engagement Lead, Consultant, Fachexperte, Independent Reviewer
--       freigegeben/abgelegt: nur Engagement Lead
--   · Scope-Bestätigung getrennt: Kunde bestätigt Tatsachen und Abgrenzung, Berater fachlich (F-012).
--     In 3PA/Produktprüfungen geht kein Bericht ohne Kundenbestätigung der Scope-Version in die QA-Freigabe.
-- =============================================================================
set search_path = isms, public;

-- -----------------------------------------------------------------------------
-- Beteiligte und Beziehungen
-- -----------------------------------------------------------------------------
create table case_party (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references assessment_case on delete cascade,
  role            text not null check (role in (
                    'client',             -- Auftraggeber / Initiator
                    'assessee',           -- geprüfte Organisation / Lieferant
                    'product_developer',  -- Hersteller / Entwickler des Produkts
                    'operator',           -- betreibende Organisation (z. B. SaaS-Betrieb)
                    'subcontractor',      -- Unterauftragnehmer
                    'report_recipient')), -- Berichtsempfänger
  name            text,                   -- null = noch unbekannt
  organization_id uuid references organization,
  status          text not null default 'open' check (status in ('open', 'confirmed')),
  basis           text,                   -- Quelle der Angabe (Kundenaussage, Vertrag, …)
  confirmed_by    uuid references person,
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now(),
  constraint party_confirmed_complete check (status = 'open'
    or (length(trim(coalesce(name, ''))) > 0 and length(trim(coalesce(basis, ''))) > 0
        and confirmed_by is not null and confirmed_at is not null))
);

create table object_relation (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references assessment_case on delete cascade,
  party_id    uuid not null references case_party on delete cascade,
  object_id   uuid not null references assessment_object,
  relation    text not null check (relation in ('develops', 'operates', 'supplies', 'owns', 'uses', 'supports')),
  status      text not null default 'open' check (status in ('open', 'confirmed')),
  basis       text,
  confirmed_by uuid references person,
  confirmed_at timestamptz,
  unique (party_id, object_id, relation),
  constraint relation_confirmed_complete check (status = 'open'
    or (length(trim(coalesce(basis, ''))) > 0 and confirmed_by is not null and confirmed_at is not null))
);

create function isms.party_rules() returns trigger
  language plpgsql set search_path = isms, public as $$
begin
  if tg_table_name = 'object_relation' then
    if not exists (select 1 from case_party where id = (to_jsonb(new) ->> 'party_id')::uuid and case_id = new.case_id) then
      raise exception 'Beziehung und Beteiligter gehören zu verschiedenen Prüfvorgängen' using errcode = 'check_violation';
    end if;
  end if;
  -- Kunde bestätigt nur (Status, Grundlage, eigener Name) – Inhalte ändert DT Agency
  if tg_op = 'UPDATE' and isms.current_person_id() is not null and not isms.is_agency()
     and (to_jsonb(new) - array['status', 'basis', 'confirmed_by', 'confirmed_at']) <> (to_jsonb(old) - array['status', 'basis', 'confirmed_by', 'confirmed_at']) then
    raise exception 'Kunde kann Angaben nur bestätigen, nicht ändern' using errcode = 'insufficient_privilege';
  end if;
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status = 'open') then
    if isms.is_ai_session() then
      raise exception 'Bestätigung nur durch einen Menschen' using errcode = 'insufficient_privilege';
    end if;
    if isms.current_person_id() is not null and new.confirmed_by <> isms.current_person_id() then
      raise exception 'Bestätigung nur im eigenen Namen' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;
create trigger case_party_rules before insert or update on case_party for each row execute function isms.party_rules();
create trigger object_relation_rules before insert or update on object_relation for each row execute function isms.party_rules();
create trigger audit_case_party after insert or update of status on case_party for each row execute function isms.audit_status('status');
create trigger audit_object_relation after insert or update of status on object_relation for each row execute function isms.audit_status('status');

create function isms.case_visible(p_case uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from assessment_case c left join intake_case i on i.id = c.intake_id
                        where c.id = p_case
                          and ((is_agency() and (c.mandate_id is null or participates(c.mandate_id)))
                               or (not is_agency() and (participates(c.mandate_id) or i.created_by = current_person_id())))) $$;

alter table case_party enable row level security;
create policy party_agency on case_party for all
  using (is_agency() and case_visible(case_id)) with check (is_agency() and case_visible(case_id));
create policy party_customer_read on case_party for select using (not is_agency() and case_visible(case_id));
-- Kunde bestätigt Tatsachen zu Beteiligten (eigener Name, nur Status/Grundlage)
create policy party_customer_confirm on case_party for update
  using (not is_agency() and case_visible(case_id)) with check (not is_agency() and case_visible(case_id));
select isms.apply_ai_restrictions('case_party', 'not isms.is_ai_session() or isms.case_mandate(case_id) = isms.ai_mandate()');

alter table object_relation enable row level security;
create policy relation_agency on object_relation for all
  using (is_agency() and case_visible(case_id)) with check (is_agency() and case_visible(case_id));
create policy relation_customer_read on object_relation for select using (not is_agency() and case_visible(case_id));
create policy relation_customer_confirm on object_relation for update
  using (not is_agency() and case_visible(case_id)) with check (not is_agency() and case_visible(case_id));
select isms.apply_ai_restrictions('object_relation', 'not isms.is_ai_session() or isms.case_mandate(case_id) = isms.ai_mandate()');

-- -----------------------------------------------------------------------------
-- Ebene je Ergebnis
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['control_assessment', 'requirement_assessment', 'finding', 'risk', 'measure'] loop
    execute format('alter table isms.%I add column level text check (level in (''supplier'', ''product'', ''operation'', ''cross_cutting''))', t);
    execute format('alter table isms.%I add column level_basis text', t);
    execute format('alter table isms.%I add constraint cross_cutting_justified check (level is distinct from ''cross_cutting'' or length(trim(coalesce(level_basis, ''''))) > 0)', t);
  end loop;
end $$;

create function isms.level_mandatory(p_mandate uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select engagement_type in ('third_party_assessment', 'product_security_assessment') from mandate where id = p_mandate $$;

-- -----------------------------------------------------------------------------
-- Freigaberecht nach Mandatsrolle + Ebene vor der fachlichen Prüfung
-- -----------------------------------------------------------------------------
create function isms.has_role(p_mandate uuid, p_roles text[]) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from mandate_role where mandate_id = p_mandate and person_id = current_person_id() and role = any (p_roles)) $$;

create function isms.assessment_approval_rules() returns trigger
  language plpgsql set search_path = isms, public as $$
begin
  if tg_op = 'UPDATE' and new.approval is not distinct from old.approval then return new; end if;
  if new.approval in ('verified', 'approved', 'filed') and new.level is null and isms.level_mandatory(new.mandate_id) then
    raise exception 'Vor der fachlichen Prüfung die betroffene Ebene festlegen (Lieferant, Produkt, Betrieb, übergreifend)'
      using errcode = 'check_violation';
  end if;
  if isms.current_person_id() is null then return new; end if;  -- Migration/Systemprozess
  if new.approval = 'verified' and not isms.has_role(new.mandate_id, array['engagement_lead', 'consultant', 'subject_matter_expert', 'independent_reviewer']) then
    raise exception 'Fachliche Prüfung nur mit fachlicher Rolle im Mandat' using errcode = 'insufficient_privilege';
  end if;
  if new.approval in ('approved', 'filed') and not isms.has_role(new.mandate_id, array['engagement_lead']) then
    raise exception 'Fachliche Freigabe nur durch den Engagement Lead des Mandats' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger control_assessment_approval_rules before insert or update on control_assessment
  for each row execute function isms.assessment_approval_rules();
create trigger requirement_assessment_approval_rules before insert or update on requirement_assessment
  for each row execute function isms.assessment_approval_rules();

create function isms.finding_level_rules() returns trigger
  language plpgsql set search_path = isms, public as $$
begin
  if new.status in ('verified', 'approved', 'filed') and new.level is null and isms.level_mandatory(new.mandate_id) then
    raise exception 'Feststellung ohne betroffene Ebene kann nicht geprüft oder freigegeben werden' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger finding_level before insert or update on finding for each row execute function isms.finding_level_rules();

-- -----------------------------------------------------------------------------
-- Scope-Bestätigung getrennt nach Kunde und Berater
-- -----------------------------------------------------------------------------
create table scope_confirmation (
  scope_version_id uuid not null references scope_version on delete cascade,
  kind             text not null check (kind in ('customer_facts', 'assessor_scope')),
  person_id        uuid not null references person,
  confirmed_at     timestamptz not null default now(),
  note             text,
  primary key (scope_version_id, kind, person_id)
);

create function isms.scope_confirmation_rules() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
declare v_party text; v_status text; v_mandate uuid;
begin
  if isms.is_ai_session() then raise exception 'Bestätigung nur durch einen Menschen' using errcode = 'insufficient_privilege'; end if;
  if isms.current_person_id() is not null and new.person_id <> isms.current_person_id() then
    raise exception 'Bestätigung nur im eigenen Namen' using errcode = 'insufficient_privilege';
  end if;
  select p.party into v_party from person p where p.id = new.person_id;
  select s.status, c.mandate_id into v_status, v_mandate from scope_version s join assessment_case c on c.id = s.case_id where s.id = new.scope_version_id;
  if v_status <> 'approved' then
    raise exception 'Bestätigt wird nur die freigegebene Scope-Version' using errcode = 'check_violation';
  end if;
  if (new.kind = 'customer_facts') <> (v_party = 'customer') then
    raise exception 'Tatsachen bestätigt der Kunde, den Scope fachlich DT Agency' using errcode = 'check_violation';
  end if;
  if v_party = 'customer' and (v_mandate is null or not exists (select 1 from mandate_participant where mandate_id = v_mandate and person_id = new.person_id)) then
    raise exception 'Nur Beteiligte des Mandats bestätigen' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger scope_confirmation_rules before insert on scope_confirmation
  for each row execute function isms.scope_confirmation_rules();
create trigger scope_confirmation_append_only before update or delete on scope_confirmation
  for each row execute function isms.append_only();

create function isms.audit_scope_confirmation() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
begin
  insert into audit_event (actor_id, actor_kind, event_type, object_table, object_id, mandate_id, details)
  values (new.person_id, case when isms.current_person_id() is null then 'system' else 'human' end,
          'scope_confirmation.' || new.kind, 'scope_version', new.scope_version_id::text,
          (select c.mandate_id from scope_version s join assessment_case c on c.id = s.case_id where s.id = new.scope_version_id),
          jsonb_build_object('note', new.note));
  return new;
end $$;
create trigger audit_scope_confirmation after insert on scope_confirmation
  for each row execute function isms.audit_scope_confirmation();

-- Fachliche Scope-Freigabe des Beraters ist zugleich seine Bestätigung
create function isms.scope_assessor_confirmation() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
begin
  if new.status = 'approved' and old.status = 'draft' then
    insert into scope_confirmation (scope_version_id, kind, person_id, confirmed_at)
    values (new.id, 'assessor_scope', new.approved_by, new.approved_at) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger scope_assessor_confirmation after update of status on scope_version
  for each row execute function isms.scope_assessor_confirmation();

alter table scope_confirmation enable row level security;
create policy scope_confirmation_read on scope_confirmation for select
  using ((is_agency() and case_visible((select case_id from scope_version where id = scope_version_id))) or scope_visible_to_customer(scope_version_id));
create policy scope_confirmation_insert on scope_confirmation for insert
  with check (person_id = current_person_id() and ((is_agency() and kind = 'assessor_scope') or (not is_agency() and scope_visible_to_customer(scope_version_id))));
select isms.apply_ai_restrictions('scope_confirmation', 'not isms.is_ai_session()');

-- Bericht in 3PA/Produktprüfungen erst nach Kundenbestätigung der zugrunde liegenden Scope-Version freigeben
create function isms.report_needs_customer_scope() returns trigger
  language plpgsql security definer set search_path = isms, public as $$
declare v_mandate uuid;
begin
  if new.status in ('approved', 'published') and old.status is distinct from new.status then
    select mandate_id into v_mandate from assessment_case where id = new.case_id;
    if isms.level_mandatory(v_mandate) and not exists (
         select 1 from scope_confirmation where scope_version_id = new.scope_version_id and kind = 'customer_facts') then
      raise exception 'Der Kunde hat die Tatsachen der Scope-Version noch nicht bestätigt' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger report_customer_scope before update on report_version
  for each row execute function isms.report_needs_customer_scope();

grant select, insert, update, delete on case_party, object_relation to isms_app;
grant select, insert on scope_confirmation to isms_app;
grant execute on all functions in schema isms to isms_app;
