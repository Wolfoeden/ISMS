-- =============================================================================
-- 0008 – Zugriffsschutz (Row Level Security) auf allen Tabellen
--   MVP WP-01, Fachtest TC-18 (Mandantentrennung), vorschriften.md §A2 Nr. 7
--
-- Grundsätze:
--   · Ohne angemeldete Person (app.person_id) sieht niemand etwas.
--   · DT Agency sieht Mandatsdaten nur in Mandaten, an denen sie teilnimmt;
--     organisationsweite Vorarbeiten (Einstufung, Objekte) sieht das Agenturteam.
--   · Kunden sehen nur ihre Organisation, ihre Mandate und dort nur Freigegebenes:
--     Bewertungen ab „freigegeben“, Scope ab Freigabe, Feststellungen nach Ablage
--     und Besprechung (0002). Interne Daten (Aufwände, Zuweisungen, Ausnahmen,
--     Protokoll, Statusverläufe) sieht nur DT Agency.
--   · Kunden liefern Nachweise nur als „eingegangen“ und nur in eigenem Namen.
-- Hilfsfunktionen laufen als security definer, damit Richtlinien sich nicht
-- gegenseitig rekursiv auswerten.
-- =============================================================================
set search_path = isms, public;

create function isms.own_organization(p_org uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from person where id = current_person_id() and organization_id = p_org) $$;

create function isms.shares_mandate(p_person uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from mandate_participant a join mandate_participant b using (mandate_id)
                        where a.person_id = current_person_id() and b.person_id = p_person) $$;

create function isms.case_mandate(p_case uuid) returns uuid
  language sql stable security definer set search_path = isms
  as $$ select mandate_id from assessment_case where id = p_case $$;

create function isms.assessment_organization(p_ca uuid) returns uuid
  language sql stable security definer set search_path = isms
  as $$ select organization_id from complexity_assessment where id = p_ca $$;

create function isms.evidence_mandate(p_evidence uuid) returns uuid
  language sql stable security definer set search_path = isms
  as $$ select mandate_id from evidence where id = p_evidence $$;

create function isms.finding_mandate(p_finding uuid) returns uuid
  language sql stable security definer set search_path = isms
  as $$ select mandate_id from finding where id = p_finding $$;

create function isms.scope_visible_to_customer(p_scope uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select exists (select 1 from scope_version s join assessment_case c on c.id = s.case_id
                        where s.id = p_scope and s.status <> 'draft' and c.mandate_id is not null
                          and participates(c.mandate_id)) $$;

-- Agenturmitglied in einem Mandat
create function isms.agency_in(p_mandate uuid) returns boolean
  language sql stable security definer set search_path = isms
  as $$ select is_agency() and participates(p_mandate) $$;

-- -----------------------------------------------------------------------------
-- Referenzdaten: lesbar für angemeldete Personen, schreibbar nur über Migrationen
-- -----------------------------------------------------------------------------
alter table tenant enable row level security;
alter table control enable row level security;
alter table control_depth_spec enable row level security;
alter table engagement_template enable row level security;
create policy tenant_read on tenant for select using (current_person_id() is not null);
create policy control_read on control for select using (current_person_id() is not null);
create policy control_depth_spec_read on control_depth_spec for select using (current_person_id() is not null);
create policy engagement_template_read on engagement_template for select using (current_person_id() is not null);

-- -----------------------------------------------------------------------------
-- Organisationen, Personen, Einstufung, Objekte
-- -----------------------------------------------------------------------------
alter table organization enable row level security;
create policy organization_read on organization for select using (is_agency() or own_organization(id));
create policy organization_agency on organization for all using (is_agency()) with check (is_agency());

alter table person enable row level security;
create policy person_read on person for select
  using (is_agency() or id = current_person_id() or shares_mandate(id));
create policy person_agency on person for all using (is_agency()) with check (is_agency());

alter table complexity_assessment enable row level security;
create policy complexity_read on complexity_assessment for select using (is_agency() or own_organization(organization_id));
create policy complexity_agency on complexity_assessment for all using (is_agency()) with check (is_agency());

alter table profile_decision enable row level security;
create policy profile_decision_read on profile_decision for select
  using (is_agency() or own_organization(assessment_organization(complexity_assessment_id)));
create policy profile_decision_agency on profile_decision for all using (is_agency()) with check (is_agency());

alter table assessment_object enable row level security;
create policy object_read on assessment_object for select using (is_agency() or own_organization(organization_id));
create policy object_agency on assessment_object for all using (is_agency()) with check (is_agency());

-- -----------------------------------------------------------------------------
-- Mandat und Team
-- -----------------------------------------------------------------------------
create policy mandate_agency_insert on mandate for insert with check (is_agency());
create policy mandate_agency_update on mandate for update using (agency_in(id)) with check (agency_in(id));

alter table mandate_participant enable row level security;
create policy participant_read on mandate_participant for select using (participates(mandate_id));
create policy participant_agency on mandate_participant for all using (is_agency()) with check (is_agency());

alter table mandate_role enable row level security;
create policy role_read on mandate_role for select using (participates(mandate_id));
create policy role_agency on mandate_role for all using (is_agency()) with check (is_agency());

-- intern: nur DT Agency im Mandat
alter table segregation_exception enable row level security;
create policy segregation_agency on segregation_exception for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
alter table work_assignment enable row level security;
create policy assignment_agency on work_assignment for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
alter table effort_entry enable row level security;
create policy effort_agency on effort_entry for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));

-- -----------------------------------------------------------------------------
-- Prüfvorgang und Scope
-- -----------------------------------------------------------------------------
alter table scope_version enable row level security;
create policy scope_agency on scope_version for all
  using (is_agency() and (case_mandate(case_id) is null or participates(case_mandate(case_id))))
  with check (is_agency() and (case_mandate(case_id) is null or participates(case_mandate(case_id))));
create policy scope_customer on scope_version for select using (not is_agency() and scope_visible_to_customer(id));

alter table scope_object enable row level security;
create policy scope_object_agency on scope_object for all using (is_agency()) with check (is_agency());
create policy scope_object_customer on scope_object for select using (not is_agency() and scope_visible_to_customer(scope_version_id));

-- -----------------------------------------------------------------------------
-- Bewertungen, Nachweise, Feststellungen, Risiken, Maßnahmen
-- -----------------------------------------------------------------------------
alter table control_assessment enable row level security;
create policy control_assessment_agency on control_assessment for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
create policy control_assessment_customer on control_assessment for select
  using (not is_agency() and participates(mandate_id) and approval in ('approved', 'filed'));

alter table requirement_assessment enable row level security;
create policy requirement_assessment_agency on requirement_assessment for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
create policy requirement_assessment_customer on requirement_assessment for select
  using (not is_agency() and participates(mandate_id) and approval in ('approved', 'filed'));

alter table evidence enable row level security;
create policy evidence_agency on evidence for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
create policy evidence_customer_read on evidence for select using (not is_agency() and participates(mandate_id));
create policy evidence_customer_upload on evidence for insert
  with check (not is_agency() and participates(mandate_id) and captured_by = current_person_id() and review_state = 'received');

alter table assessment_evidence enable row level security;
create policy assessment_evidence_agency on assessment_evidence for all
  using (agency_in(evidence_mandate(evidence_id))) with check (agency_in(evidence_mandate(evidence_id)));

alter table finding_transition enable row level security;
create policy finding_transition_agency on finding_transition for all
  using (agency_in(finding_mandate(finding_id))) with check (agency_in(finding_mandate(finding_id)));

alter table risk enable row level security;
create policy risk_agency on risk for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
create policy risk_customer_read on risk for select using (not is_agency() and participates(mandate_id));
-- Risikoakzeptanz durch den Risk Owner des Kunden (Trigger prüft die Rolle)
create policy risk_customer_update on risk for update
  using (not is_agency() and participates(mandate_id)) with check (not is_agency() and participates(mandate_id));

alter table measure enable row level security;
create policy measure_agency on measure for all using (agency_in(mandate_id)) with check (agency_in(mandate_id));
create policy measure_customer_read on measure for select using (not is_agency() and participates(mandate_id));
create policy measure_customer_update on measure for update
  using (not is_agency() and participates(mandate_id)) with check (not is_agency() and participates(mandate_id));

-- -----------------------------------------------------------------------------
-- Protokoll: nur DT Agency im Mandat liest; geschrieben wird nur über audit_status()
-- -----------------------------------------------------------------------------
alter table audit_event enable row level security;
create policy audit_agency_read on audit_event for select
  using (is_agency() and (mandate_id is null or participates(mandate_id)));
