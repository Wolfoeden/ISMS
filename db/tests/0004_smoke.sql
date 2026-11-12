-- 0004 · zwei Stufen verifiziert/freigegeben (ENT-029)
set search_path = isms, public;
do $$
begin
  if isms.report_status('control', 'applicable', null, 'present', 'not_verified', 'sufficient', 'verified', 2) <> 'needs_review' then
    raise exception 'verified muss needs_review ergeben';
  end if;
  if isms.report_status('control', 'applicable', null, 'present', 'not_verified', 'sufficient', 'approved', 2) <> 'met' then
    raise exception 'approved muss met ergeben';
  end if;
  begin
    insert into isms.finding_transition (finding_id, action, from_status, to_status, actor_id)
    values (gen_random_uuid(), 'confirm', 'proposed', 'verified', gen_random_uuid());
    raise exception 'unbekannte Aktion angenommen';
  exception when check_violation or foreign_key_violation then null;
  end;
  if not exists (select 1 from pg_constraint where conname = 'finding_status_check' and pg_get_constraintdef(oid) like '%verified%') then
    raise exception 'finding_status_check ohne verified';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'r5_conflicting_not_approved') then
    raise exception 'R5 fehlt';
  end if;
  raise notice 'OK: verified → needs_review, approved → met; Statusliste mit verified';
end $$;
