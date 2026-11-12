# 08 – BPMN-L0-zu-UX-/Daten-/Regel-Mapping

**Stand 12.11.2026**

Die Datei `03_BPMN_L0_COLLABORATION.bpmn` enthaelt **drei Diagramme**: Collaboration L0, Assessment Setup und Assessment Execution. Alle Prozesse sind bewusst *nicht ausfuehrbar* modelliert. Die Call Activities referenzieren reale weitere Prozesse in derselben Datei.

## 1. Teilnehmer / Korrelation

| Teilnehmer | BPMN Process | Instanzsemantik | Korrelation |
|---|---|---|---|
| Kunde (Blackbox) | keine interne Prozessdefinition | unabhaengiger externer Teilnehmer | Token + Kunde + Tenant |
| DT Agency Discovery | `Process_DiscoveryRun` | ein Suchlauf kann 0..n Kandidaten emittieren | `discoveryRunId` → `candidateId` |
| DT Agency Case | `Process_OpportunityToAssessment` | **eine** Opportunity / **ein** Assessment-Lifecycle | `intakeId` / `opportunityId` / `assessmentId` |
| Wiederverwendbares Setup | `Process_AssessmentSetup` | von Case als Call Activity aufgerufen | `assessmentId`, `scopeVersion` |
| Wiederverwendbare Bewertung | `Process_AssessmentExecution` | von Case als Call Activity aufgerufen | `assessmentId`, `methodVersion` |

BPMN Message-Flows verbinden **Pools**, nicht Lanes. Sequence Flows bleiben innerhalb eines Prozesses. Customer-Events sind beim Customer Blackbox-Modell Nachrichten an und von diesem Pool.

## 2. Kernstrecke

| BPMN IDs | UX-Schritt | Domain Objects | Rules / Kontrollen |
|---|---|---|---|
| `D_Start`, `D_Policy`, `D_Find`, `D_Publish` | nicht kundenseitig | `DiscoveryRun`, `Candidate`, `SourceRef` | Quellen-/Privacy-Gate; 0..n candidate publications |
| `Start_Candidate` / `Start_Inbound`, `T_Intake`, `G_Route` | S01 Einstieg | `IntakeCase`, `Contact`, `entryRoute` | deduplicate/correlate, default no outreach |
| `T_PublicContext`, `T_PreScreen`, `T_Qualify` | Opportunity Triage S08 | `ContextFact`, `Indicator`, `Opportunity` | D-02 Indikatoren, Lead Verification |
| `T_OutreachRules`, `G_Outreach`, `T_ApproveOutreach`, `G_ContactApproved` | Vertrieb | `OutreachEligibility`, `Consent/LegalReview` | D-03; kein unkontrollierter automatischer Versand |
| `T_SendContact`, `G_Response`, `Catch_Reaction`, `Catch_NoReaction`, `G_Interested` | Kunde reagiert | `OpportunityStage`, `Message` | Message Event + Timer; kein Interesse beendet |
| `T_Discovery`, `T_SendDiscovery`, `G_DiscoveryWait`, `Catch_DiscoveryContext` | S02 adaptive Discovery | `AssessmentGoal`, `AssessmentObject`, `OpenQuestion` | D-01, korrelierte Kundenantwort; Timeout Exit |
| `T_FrameworkPreview` | S03 Orientierung | `FrameworkCandidate`, `ContextFact` | D-04; nur indicative, kein Verbindlichkeitsclaim |
| `T_ProvisionalScope`, `T_SendOffer`, `G_OfferWait`, `Catch_Signed` | S04 Angebot | `Offer`, `ProvisionalScope`, `Mandate` | Zustimmung, Angebotsversion und Fristen |
| `Catch_OfferChange`, `Catch_OfferDecline`, `Catch_OfferTimeout` | S04 | `ScopeChange`, `OpportunityOutcome` | Ablehnung, Nachverhandlung, Ablauf |
| `T_CreateMandate`, `T_FinalScope` | S04/S08 | `Mandate`, `ScopeVersion`, `CaseRole` | autorisierte Scope-/Datenrahmenfreigabe |
| `T_EvidenceIntake`, `T_Readiness`, `G_Ready` | S05/S06/S10 | `Evidence`, `ContextFact`, `OpenQuestion` | D-06, keine `unknown = N/A`-Regel |
| `T_RequestEvidence`, `G_ClarifyWait`, `Catch_Clarification`, `Catch_ClarifyTimeout` | S06 | `ClientTask`, `Message` | korrelierte Antworten, Reminder/Frist |
| `T_MaterialDecision`, `G_Limit`, `End_Stopped` | S09/S11 | `LimitationDecision`, `CaseStatus` | materielle Unklarheit erfordert human decision |
| `Call_Configure` | S09 | `RegulatoryDetermination`, `AssuranceProfile`, `CriteriaSet` | D-05, D-07, D-08; interne Subprozessgrafik |
| `Call_Assess` | S10/S11 | `EvidenceLink`, `Finding`, `Risk`, `Action` | AI proposes / consultant verifies; interne Subprozessgrafik |
| `T_Draft`, `T_LeadReview`, `T_Completion`, `G_Complete` | S12 | `ReportDraft`, `CompletionDecision` | D-13 |
| `T_Rework`, `G_Rework` | S11/S12 | `ReworkTicket` | D-12 zielgerichtetes Routing |
| `T_QA`, `G_QA`, `End_QAStop` | S13 | `Review`, `ApprovalRecord`, `SoDCheck` | SoD/Unabhaengigkeit, Stop / Rework |
| `T_Publish`, `G_FinalType`, `End_Completed`, `End_Limited` | S07 | `ReportVersion`, `ReportDistribution` | Version Lock, Grenzen explizit |

## 3. L1 Setup (Call Activity)

`S_RegRules` → `S_RegVerify` → `S_RegPersist` → `S_ProfileRules` → `S_ProfileVerify` → `S_ProfilePersist` → `S_Requirements` → `S_ReqVerify` → `S_ReqPersist`.

Im L2 muss der Setupprozess je nach **materialem Klaerungsbedarf** eigene Nachforderungs-/Eskalationspfade bekommen. L0 garantiert nur die semantische Reihenfolge Vorschlag → menschliche Verifikation → unveraenderliche Persistierung.

## 4. L1 Assessment Execution (Call Activity)

`A_AssessEvidence` (automatisierte Beleganalyse) → `A_Propose` (AI-Vorschlaege) → `A_Verify` (fachliche Verantwortung) → `A_Enough` → `A_Clarify` oder `A_Persist` → `A_End`.

**Nicht als „Auditor kann sich selbst zertifizieren“ interpretieren.** QA erfolgt danach im uebergeordneten Prozess.

## 5. Deskriptive Grenzen und bekannte L2-Aufgaben

- Timerdauern P14D / P21D sind illustrative Platzhalter, noch keine freigegebenen SLAs.
- Dynamische Customer Tasks und Interviews liegen im Case-/Task-Service, nicht als hunderte BPMN-Aktivitaeten.
- Case-Cancellation, Scope-Change waehrend Assessment, Error Boundary Events, technische Retry/Compensation, Incident-Handling, SSO, AVV und Data Retention benoetigen L2-Ausarbeitung.
- DMN-Tabellen, API Messages, Formulare, User-Assignment, Mail-/Portal-Integration und technische Prozessvariablen sind noch nicht implementiert.
- `Candidate`-Multiinstanz ist im Discovery-Task gekennzeichnet; der konkrete Dateninput und die Message-Korrelation sind vor Engine-Ausfuehrung zu spezifizieren.
