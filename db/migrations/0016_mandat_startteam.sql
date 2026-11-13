-- 0016 · Korrektur (gefunden durch die Oberfläche, Etappe 3): Nach der Unterschrift sah der
-- Engagement Lead seinen Fall nicht mehr – der Zugriffsschutz verlangt ab dem Mandat Beteiligung,
-- die es erst nach der Teamzuordnung gab. Mit der Unterschrift entsteht jetzt das Startteam:
--   · wer das Angebot erstellt hat → Engagement Lead
--   · wer die Anfrage gestellt hat (Kunde) → Ansprechpartner (primary_contact)
-- Weitere Rollen ordnet der Engagement Lead zu.
set search_path = isms, public;

create or replace function isms.handle_signed_mandate(p_event_id text, p_offer uuid) returns uuid
  language plpgsql security definer set search_path = isms, public as $$
declare v_result uuid; v_offer isms.offer; v_mandate uuid; v_kunde uuid;
begin
  if isms.is_ai_session() or (isms.current_person_id() is not null and not isms.is_agency()) then
    raise exception 'Mandatsanlage nur durch Systemprozess oder DT Agency' using errcode = 'insufficient_privilege';
  end if;
  select result_id into v_result from isms.processed_event where event_id = p_event_id;
  if found then return v_result; end if;
  select id into v_mandate from isms.mandate where offer_id = p_offer;
  if found then
    insert into isms.processed_event (event_id, handler, result_id) values (p_event_id, 'signed_mandate', v_mandate);
    return v_mandate;
  end if;

  select * into v_offer from isms.offer where id = p_offer for update;
  if v_offer.status <> 'sent' then
    raise exception 'Angebot ist % – kein Mandat', v_offer.status using errcode = 'check_violation';
  end if;
  update isms.offer set status = 'accepted' where id = p_offer;
  insert into isms.mandate (customer_id, scope, engagement_type, depth_profile, status, start_date, offer_id)
  select v_offer.customer_id, 'Scope-Version ' || sv.version || ': ' || sv.goal, v_offer.engagement_type, v_offer.depth_profile,
         'signed', v_offer.planned_start, v_offer.id
    from isms.scope_version sv where sv.id = v_offer.scope_version_id
  returning id into v_mandate;
  update isms.assessment_case set mandate_id = v_mandate where id = v_offer.case_id and mandate_id is null;

  -- Startteam
  if v_offer.created_by is not null then
    insert into isms.mandate_participant values (v_mandate, v_offer.created_by) on conflict do nothing;
    insert into isms.mandate_role values (v_mandate, v_offer.created_by, 'engagement_lead') on conflict do nothing;
  end if;
  select i.created_by into v_kunde from isms.assessment_case c join isms.intake_case i on i.id = c.intake_id
   join isms.person p on p.id = i.created_by
   where c.id = v_offer.case_id and p.party = 'customer' and p.organization_id = v_offer.customer_id;
  if v_kunde is not null then
    insert into isms.mandate_participant values (v_mandate, v_kunde) on conflict do nothing;
    insert into isms.mandate_role values (v_mandate, v_kunde, 'primary_contact') on conflict do nothing;
  end if;

  insert into isms.processed_event (event_id, handler, result_id) values (p_event_id, 'signed_mandate', v_mandate);
  return v_mandate;
end $$;

-- Korrektur (gefunden durch die Oberfläche): Funktionstrennung im Team. Engagement Lead und
-- Independent Reviewer dürfen im selben Mandat nicht dieselbe Person sein (DEC-05, Regel G6) –
-- sonst prüfte die Leitung ihre eigene Arbeit.
create function isms.mandate_role_sod() returns trigger
  language plpgsql set search_path = isms, public as $$
begin
  if (new.role = 'independent_reviewer' and exists (select 1 from mandate_role where mandate_id = new.mandate_id and person_id = new.person_id and role = 'engagement_lead'))
     or (new.role = 'engagement_lead' and exists (select 1 from mandate_role where mandate_id = new.mandate_id and person_id = new.person_id and role = 'independent_reviewer')) then
    raise exception 'Funktionstrennung: Engagement Lead und Independent Reviewer im selben Mandat nicht dieselbe Person' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger mandate_role_sod before insert or update on mandate_role
  for each row execute function isms.mandate_role_sod();
