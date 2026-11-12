-- 0006 · ENT-020 (Option 1, freigegeben 2026-11-12): Mandatstypen je Leistungsart
set search_path = isms, public;

alter table mandate drop constraint mandate_engagement_type_check;
alter table mandate add constraint mandate_engagement_type_check check (engagement_type in (
  'initial_assessment', 'gap_assessment', 'product_security_assessment',
  'security_assessment', 'iso27001_readiness', 'iso27001_implementation',
  'nis2_readiness', 'third_party_assessment', 'internal_audit', 'continuous_operation'));

insert into engagement_template (id, name, engagement_type, allowed_profiles, profile_source, team, deliverables) values
  ('initial-assessment', 'Initial Assessment', 'initial_assessment', '{1,2,3,4}', 'pre_assessment',
   '[{"role":"engagement_lead","requirement":"required"},{"role":"junior_consultant","requirement":"optional"}]',
   '["Initial Assessment Report","priorisierte nächste Schritte"]'),
  ('gap-assessment', 'Gap Assessment', 'gap_assessment', '{1,2,3,4}', 'pre_assessment',
   '[{"role":"engagement_lead","requirement":"required"},{"role":"consultant","requirement":"optional"}]',
   '["Gap Analysis Report gegen die vereinbarten Kriterien","Maßnahmenplan"]'),
  ('product-security-assessment', 'Product Security Assessment', 'product_security_assessment', '{1,2,3,4}', 'third_party_pre_assessment',
   '[{"role":"engagement_lead","requirement":"required"},{"role":"subject_matter_expert","requirement":"optional"}]',
   '["Software Product Security Assessment Report (abgegrenztes Produkt, Version)","Findings und Empfehlungen"]')
on conflict (id) do nothing;
