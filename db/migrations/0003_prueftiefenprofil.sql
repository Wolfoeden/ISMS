-- 0003 · ENT-030 (freigegeben 2026-11-12): Stufe 1–4 heißt „Prüftiefenprofil“.
-- „Assurance“ bleibt der Aussagequalität (Review, Unabhängigkeit) vorbehalten.
set search_path = isms, public;

alter table mandate rename column assurance_profile to depth_profile;

create or replace function isms.mandate_profile_consistent() returns trigger
  language plpgsql as $$
declare v_profile smallint; v_allowed smallint[];
begin
  if new.profile_decision_id is not null then
    select profile into v_profile from isms.profile_decision where id = new.profile_decision_id;
    if v_profile <> new.depth_profile then
      raise exception 'depth_profile (%) weicht von der Profilentscheidung (%) ab', new.depth_profile, v_profile
        using errcode = 'check_violation';
    end if;
  end if;
  if new.template_id is not null then
    select allowed_profiles into v_allowed from isms.engagement_template where id = new.template_id;
    if not new.depth_profile = any (v_allowed) then
      raise exception 'Template % ist für Profil % nicht vorgesehen', new.template_id, new.depth_profile
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

comment on column mandate.depth_profile is 'Prüftiefenprofil 1–4 (intern); nach außen Basis/Standard/Enhanced (ENT-035)';

-- ENT-035 (freigegeben 2026-11-12): nach außen drei Tiefen, intern vier Profile.
create function isms.offered_depth(p_profile integer) returns text
  language sql immutable as $$
  select case p_profile when 1 then 'basis' when 2 then 'standard' when 3 then 'enhanced' when 4 then 'enhanced' end
$$;

alter table mandate add column offered_depth text generated always as (isms.offered_depth(depth_profile)) stored;
