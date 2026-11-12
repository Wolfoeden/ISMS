-- 0006 · Mandatstypen (ENT-020)
set search_path = isms, public;
do $$
begin
  if (select count(*) from isms.engagement_template where id in ('initial-assessment', 'gap-assessment', 'product-security-assessment')) <> 3 then
    raise exception 'Templates fehlen';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mandate_engagement_type_check'
                 and pg_get_constraintdef(oid) like '%product_security_assessment%') then
    raise exception 'Mandatstyp product_security_assessment fehlt';
  end if;
  raise notice 'OK: drei neue Mandatstypen mit Templates';
end $$;
