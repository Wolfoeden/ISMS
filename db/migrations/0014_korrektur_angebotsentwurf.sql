-- 0014 · Korrekturen: Angebotsentwurf ersetzen (zu 0011); fester Suchpfad aller Funktionen
-- Versandregeln (Frist, Pflichtbausteine) zu erfüllen. Ersetzt ein versandtes Angebot, bleiben
-- dessen Angaben ohnehin unverändert erhalten (Unveränderlichkeit nach Versand).
set search_path = isms, public;

alter table offer drop constraint sent_has_deadline;
alter table offer drop constraint no_certification_claim;
alter table offer drop constraint certificate_wish_answered;
alter table offer add constraint sent_has_deadline
  check (status in ('draft', 'superseded') or (sent_at is not null and valid_until is not null and valid_until >= sent_at));
alter table offer add constraint no_certification_claim
  check (status in ('draft', 'superseded') or position('Es ist keine Zertifizierung und kein Audit einer akkreditierten Stelle' in service_description) > 0);
alter table offer add constraint certificate_wish_answered
  check (status in ('draft', 'superseded') or not customer_wants_certificate
    or position('kann nur eine dafür akkreditierte Zertifizierungsstelle' in service_description) > 0);

-- Korrektur: alle Funktionen des Schemas mit festem Suchpfad – Regeln wirken unabhängig von der
-- Sitzung (die Anwendung setzt keinen Suchpfad) und lassen sich nicht über den Suchpfad umlenken.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
            where p.pronamespace = 'isms'::regnamespace
              and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%') loop
    execute format('alter function %s set search_path = isms, public', f.sig);
  end loop;
end $$;

-- Korrektur: Kunde darf eine eigene, ungeprüfte Angabe ersetzen (Ask once: neue Antwort ersetzt die alte).
-- Nur das Ersetzungsdatum, nie Inhalt oder Prüfstatus.
create policy fact_owner_supersede on context_fact for update
  using (intake_visible(intake_id) and source_type = 'customer_input' and verification_status = 'unverified' and superseded_at is null)
  with check (intake_visible(intake_id) and source_type = 'customer_input' and verification_status = 'unverified' and superseded_at is not null);

create function isms.fact_supersede_only() returns trigger
  language plpgsql set search_path = isms, public as $$
begin
  if current_person_id() is not null and not is_agency() and (new.value is distinct from old.value or new.fact_key is distinct from old.fact_key
      or new.source_type is distinct from old.source_type or new.verification_status is distinct from old.verification_status) then
    raise exception 'Angaben werden nicht geändert, sondern durch eine neue ersetzt' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger context_fact_supersede_only before update on context_fact
  for each row execute function isms.fact_supersede_only();
