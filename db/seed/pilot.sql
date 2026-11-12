-- Fiktive Startdaten für den lokalen Prototyp (keine Mandatsdaten).
-- Nur die Agenturpersonen werden direkt angelegt; alles andere entsteht über die Anwendung.
set search_path = isms, public;
insert into person (id, party, organization_id, display_name) values
  ('00000000-0000-4000-8000-000000000a01', 'agency', null, 'Lead (fiktiv)'),
  ('00000000-0000-4000-8000-000000000a02', 'agency', null, 'QA (fiktiv)'),
  ('00000000-0000-4000-8000-000000000a03', 'agency', null, 'Consultant (fiktiv)')
on conflict do nothing;
-- Kennungen nach ISO/IEC 27001 Anhang A, eigene Themenbezeichnungen aus BIB-ISO27002 (§A17.2)
insert into control (id, title) values
  ('A.5.17', 'Umgang mit Passwörtern und anderen Anmeldedaten'),
  ('A.8.5', 'Sichere Anmeldung (z. B. Mehr-Faktor-Authentisierung)'),
  ('A.8.13', 'Datensicherung und Wiederherstellung')
on conflict do nothing;
