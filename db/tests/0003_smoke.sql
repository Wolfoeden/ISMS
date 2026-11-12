-- 0003 · Prüftiefenprofil (ENT-030) und angebotene Tiefe (ENT-035)
set search_path = isms, public;
do $$
declare v_col int; v_old int;
begin
  select count(*) into v_col from information_schema.columns where table_schema='isms' and table_name='mandate' and column_name='depth_profile';
  select count(*) into v_old from information_schema.columns where table_schema='isms' and table_name='mandate' and column_name='assurance_profile';
  if v_col <> 1 or v_old <> 0 then raise exception 'Spalte nicht umbenannt'; end if;
  if isms.offered_depth(1) <> 'basis' or isms.offered_depth(2) <> 'standard'
     or isms.offered_depth(3) <> 'enhanced' or isms.offered_depth(4) <> 'enhanced' then
    raise exception 'offered_depth falsch';
  end if;
  raise notice 'OK: depth_profile und offered_depth (4 → 3)';
end $$;
