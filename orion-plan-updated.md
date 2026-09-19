# Orion — Care Access, Referral & Care-Transition Coordination

> **Version:** SIH 2026 Maharashtra-aligned comprehensive plan  
> **Purpose:** Define the product, workflow, technical architecture, Maharashtra-specific fit, SIH coverage, MVP scope, demo plan, deployment path, risks, and implementation boundaries.  
> **Core principle:** Existing public-health systems already handle many individual functions. Orion focuses on the **care transition between facilities** and makes that transition more organised, visible, traceable, and accountable.

---

# 0. Executive Product Definition

## Product

**Orion — Care Access & Care-Transition Coordination**

## One-line description

> **Orion helps authorised frontline and facility staff coordinate a patient's movement between levels of public healthcare by creating a shared digital Handoff, selecting an appropriate destination using available capability information, tracking acceptance and arrival, returning the outcome to the originating facility, and triggering follow-up — even when connectivity is unreliable.**

## The one problem we are actually solving

A referral should not end when a clinician writes:

> **"Send this patient to the next facility."**

The real workflow continues:

```text
Assess
  ↓
Determine need for higher/lateral care
  ↓
Choose an appropriate destination
  ↓
Create structured referral
  ↓
Receiving facility receives it
  ↓
Accept / Cannot Accept / Redirect
  ↓
Patient arrives / No-show
  ↓
Care / diagnostics / teleconsult / treatment
  ↓
Outcome returned to origin
  ↓
Counter-referral / follow-up
  ↓
Close episode
```

Orion turns that movement into a **trackable care transition** rather than a one-way document.

## Core object

### Handoff

The Handoff is the central operational object.

It links:

- patient / synthetic demo patient
- origin facility
- destination facility
- protocol used
- referral reason
- urgency
- requested service
- available destination capability information
- referral status
- event history
- arrival status
- return outcome
- follow-up requirement

Both the origin and receiving side work with the **same Handoff**.

## Core users

### Origin-side authorised staff

- CHO
- ANM
- Medical Officer
- other authorised frontline/primary-care staff, depending on deployment policy

### Destination-side authorised staff

- referral desk
- registration/referral nodal staff
- emergency/referral staff
- authorised PHC/CHC/RH/SDH/DH staff

### Supervisory users

- block/district supervisors
- programme managers
- quality/operations staff

### Patient/caregiver

A **lightweight status/instruction layer**, not a full citizen super-app.

---

# 1. Maharashtra-Specific Context

The plan is intended for the Maharashtra public-health context described in the SIH problem statement and the Maharashtra healthcare research assembled for Orion.

## Simplified facility flow

```text
Community / Village
        ↓
ASHA / Community mobilisation
        ↓
AAM / Sub-Centre
        ↓
PHC
        ↓
Rural Hospital / CHC
        ↓
SDH / Women Hospital, where applicable
        ↓
District / Civil Hospital
        ↓
Medical College / Tertiary Care
```

The exact pathway can vary by programme, facility capability, emergency condition, geography, and local administrative arrangements. Orion therefore treats the hierarchy as **configuration data**, not an irreversible hard-coded route.

## Maharashtra-specific system landscape to account for

The research indicates a dense existing digital ecosystem, including examples such as:

- eSanjeevani for teleconsultation
- ABDM/ABHA ecosystem for digital-health identity/interoperability
- e-Sushrut / HMIS-type hospital workflows
- programme systems such as RCH/ANMOL and NCD workflows
- e-Aushadhi / medicine supply-chain workflows
- emergency transport such as MEMS 108
- MJPJAY workflows for eligible tertiary care

The key design principle is:

> **Orion must complement these systems instead of rebuilding them.**

The Maharashtra analysis also warns that frontline workers can already face application fragmentation and data-entry burden. Orion therefore must reduce duplicated work rather than create another disconnected data-entry silo.

---

# 2. SIH Problem Statement Coverage

The SIH problem statement is intentionally broad. Orion should cover the problem comprehensively at the **care-transition layer** without pretending one application can eliminate every structural healthcare problem.

| SIH problem / expected area | Orion response |
|---|---|
| Long travel distances | Capability-aware destination selection, clearer referral information, reduced unnecessary repeat/incorrect-facility travel |
| Specialist shortages | Show known specialist/service capability with freshness; route to a facility capable of handling the need; optional teleconsult pathway |
| Irregular diagnostics | Carry requested diagnostic/service need; show known diagnostic capability/freshness; coordinate referral/result follow-up |
| Fragmented medical records | Handoff packet + care-transition timeline + event history + FHIR-aligned representation |
| Delayed referrals | Destination inbox, acknowledgement, acceptance, escalation, referral ageing |
| Limited awareness of services | Facility/service discovery with capability status and verification time |
| Constrained staff | Short protocol forms, structured referral packets, role-based screens, minimal data entry |
| Equipment constraints | Capability visibility, Cannot Accept reason, Redirect workflow |
| Connectivity | Offline-first referral creation + local queue + synchronisation |
| Language barriers | Marathi/Hindi/English UI; optional voice/input assistance; localisation-ready architecture |
| Health literacy | Patient-friendly referral explanation/instructions/status |
| Affordability | Indirect reduction in avoidable travel/repeat visits; surface known public-service information where supported |
| Timely access | Pre-alert + destination selection + acknowledgement + escalation |
| Continuity | Same Handoff across origin, destination, outcome and follow-up |
| Quality monitoring | Referral operational metrics + ageing + redirect/no-show/outcome/follow-up indicators |
| Accountability | Auditable event timeline with actor/time/old state/new state/reason |
| Assisted teleconsultation | Integrate by reference with existing teleconsult pathway rather than rebuilding video |
| Appointment/queue support | Referral appointment/expected arrival workflow, not full OPD queue management |
| Digital triage | Protocol-assisted risk/referral assessment; no autonomous diagnosis |
| Longitudinal follow-up | Care-transition timeline and follow-up tasks; not a full EHR |
| Medicine availability | Verified/attested availability snapshots where available; never fake real-time stock |
| High-risk patient follow-up | Follow-up task, due date, completion/missed/escalated state |
| Emergency escalation | Escalation to existing emergency pathway; no parallel ambulance dispatch |
| Interoperable records | FHIR-aligned data model/export; future approved integration |

The current product plan already centres the Handoff lifecycle and deliberately avoids replacing EMR, telemedicine, ambulance, or HMIS functions.

---

# 3. What Orion Is and Is Not

## Orion IS

- a care-transition coordination layer
- a structured referral workflow
- a shared Handoff between facilities
- a capability-aware destination workflow
- an offline-friendly referral tool
- an outcome/counter-referral mechanism
- a follow-up coordination layer
- a lightweight operational dashboard
- an interoperability-ready representation

## Orion IS NOT

- a full EHR
- a hospital information system replacement
- a telemedicine video replacement
- an AI doctor
- an autonomous diagnosis engine
- a medicine procurement system
- a laboratory information system
- an ambulance dispatch platform
- a nationwide live bed-availability system
- a citizen healthcare super-app
- a replacement for ABDM
- a replacement for eSanjeevani
- a replacement for existing HMIS/programme systems

## Product discipline rule

> **Every feature must directly improve the care transition or the continuity/accountability around that transition.**

---

# 4. Care Episode Model

To cover the full SIH statement without creating ten disconnected applications, Orion should treat the journey as a **Care Episode**.

The Handoff remains the core transaction inside the episode.

```text
Care Episode
│
├── Patient / case context
├── Assessment
├── Protocol / urgency
├── Requested service
├── Destination search
├── Capability snapshot
├── Handoff
│   ├── Sent
│   ├── Acknowledged
│   ├── Accepted / Cannot Accept / Redirected
│   ├── Arrived / No-show
│   └── Outcome
├── Diagnostics
├── Teleconsult reference
├── Medicine information
├── Counter-referral
├── Follow-up task(s)
└── Closure
```

## Why this model matters

The SIH problem mentions many apparently separate features. They become coherent when tied to the same care episode:

```text
Patient needs higher care
        ↓
Assessment
        ↓
Destination
        ↓
Handoff
        ↓
Facility accepts
        ↓
Patient arrives
        ↓
Service / specialist / diagnostics
        ↓
Outcome
        ↓
Follow-up
```

---

# 5. End-to-End Clinical / Operational Workflow

## Step 1 — Patient arrives at origin facility

The authorised user selects the relevant protocol/workflow.

Examples:

- maternal / ANC danger signs
- adult general referral
- child danger-sign referral
- NCD/high-risk chronic referral
- diagnostic/service referral

## Step 2 — Protocol-assisted assessment

The user fills a short structured checklist.

Possible fields:

- basic demographic context
- presenting concern
- important danger signs
- relevant vitals if already measured
- relevant history available to the user
- actions already taken
- requested service
- urgency
- teleconsult attempted/booked, when relevant

The system performs **completeness and protocol checks**.

It does not independently diagnose the patient.

## Step 3 — Determine care level

The protocol may indicate that the case requires:

- local management / follow-up
- PHC-level review
- first referral unit / RH / CHC
- SDH/DH
- tertiary/specialist pathway
- emergency escalation

The final clinical decision remains with the authorised health professional.

## Step 4 — Destination selection

Orion evaluates available facility information using:

- required level of care
- facility class
- requested service
- known capability
- freshness of capability information
- optional distance
- existing referral constraints

The system can recommend a suitable destination class/list, but the authorised user confirms the actual destination.

## Step 5 — Create Handoff

Generate:

- Handoff ID
- structured referral packet
- urgency
- destination
- requested service
- sync state
- audit entry

## Step 6 — Destination receives

The receiving side sees an incoming-referral inbox.

The desk can understand quickly:

- who is being referred
- why
- urgency
- requested service
- origin
- referral age
- relevant capability context

## Step 7 — Destination action

Three core actions:

### Accept

Facility can handle the case.

### Cannot Accept

Facility cannot currently handle the case.

Mandatory reason:

- specialist unavailable
- equipment unavailable
- service unavailable
- bed/capacity issue
- wrong facility level
- operational constraint
- other recorded reason

### Redirect

Route to another suitable facility.

The redirect should remain part of the **same Care Episode/Handoff history** rather than becoming an unrelated case.

## Step 8 — Arrival

Receiving facility marks:

- arrived
- no-show

## Step 9 — Care / outcome

Destination records a concise structured return note.

Example:

```text
Disposition: Treated and sent back
Diagnosis/clinical outcome: [authorised entry]
Tests advised: CBC
Next action: Continue treatment
Follow-up: 14 days
```

Do not make this a complete hospital EMR.

## Step 10 — Counter-referral

Outcome goes back to the origin facility.

Origin sees the same Handoff and can create the next follow-up action.

## Step 11 — Follow-up

Follow-up object contains:

- due date
- responsible facility
- responsible role
- task
- status
- completion timestamp
- escalation if missed/high-risk

## Step 12 — Close

Care episode closes when:

- outcome recorded
- follow-up completed or appropriately transferred
- no unresolved referral action remains

---

# 6. Digital Handoff Specification

## Core fields

```text
handoff_id
public_code
care_episode_id
patient_reference
origin_facility
origin_actor
destination_facility
protocol
urgency
reason_for_referral
requested_services
clinical_summary
key_observations
actions_already_taken
teleconsult_reference
capability_snapshot_ids
appointment/expected_arrival (if used)
transport_required
state
created_at
updated_at
```

## Handoff states

```text
draft
  ↓
sent
  ↓
acknowledged
  ├── accepted
  ├── cannot_accept
  ├── redirected
  └── expired (optional)

accepted
  ├── arrived
  └── no_show

arrived
  ↓
in_care
  ↓
outcome_recorded
  ↓
follow_up_pending
  ↓
closed
```

## Redirect rule

A redirect should capture:

- why the current facility cannot accept
- who performed the redirect
- when
- new destination
- reason for the new destination

The new destination is part of the same care episode.

---

# 7. Protocol-Assisted Triage and Assessment

## Principle

> **Use deterministic/public-health protocols for decision support; do not use an LLM as an autonomous clinical decision maker.**

## What the system can do

- require relevant fields
- validate ranges/required inputs
- identify explicit protocol danger signs
- assign an operational urgency category where the chosen protocol defines one
- determine whether required referral information is missing
- identify requested service
- suggest an appropriate level of care for clinician review

## What the system must not do

- independently diagnose disease
- prescribe treatment
- override clinicians
- make emergency decisions without human confirmation
- present probabilistic AI output as a medical fact

## Initial protocols

### A. Maternal / ANC danger-sign referral

Example data:

- gestational age
- danger signs
- available vitals
- relevant observations
- service required
- urgency

### B. Adult general referral

Example:

- age
- sex
- presenting problem
- relevant signs/vitals
- reason for referral
- requested service

### C. Child danger-sign workflow

Use approved child-health protocol content for the prototype; keep scope limited to a small set of explicit danger-sign pathways.

### D. NCD/high-risk follow-up

Example:

- hypertension/diabetes screening result
- current concern
- treatment/follow-up need
- referral requirement

Additional protocols can be added later.

---

# 8. Destination and Facility Intelligence

## Core concept

**Do not select only the nearest facility. Select an appropriate facility using known capability information.**

## Facility profile

```text
Facility Name
Facility Type
Level / Tier
Location
Services
Specialities
Diagnostics
Emergency capability
Known medicine availability
Teleconsult pathway
Last verified timestamps
Source of information
```

## Capability status

Use explicit states:

```text
VERIFIED_AVAILABLE
VERIFIED_UNAVAILABLE
STALE
UNKNOWN
```

## Freshness

Every operational fact should carry:

- value
- timestamp
- source/attestor
- optional note

Example:

```text
Gynaecology
AVAILABLE
Last verified: 09:20 today
Source: authorised facility user
```

## Critical rule

Never display:

> **"Doctor available now"**

unless a trusted live source actually provides that information.

Instead display:

> **"Gynaecology — last verified 09:20"**

or:

> **"Availability unknown"**

## Capability-aware routing

For a requested service:

```text
Requested service
      ↓
Facility capability list
      ↓
Freshness filter
      ↓
Suitable facilities
      ↓
Authorised user confirms destination
```

---

# 9. Diagnostics Coordination

## Goal

Coordinate diagnostic access without becoming a laboratory information system.

## Workflow

```text
Service needed: CBC
        ↓
Can origin facility perform it?
        ↓
YES → perform locally
NO
        ↓
Find known capable facility
        ↓
Include request in Handoff
        ↓
Patient / sample reaches destination
        ↓
Result available
        ↓
Origin receives result/status where approved
```

## Diagnostic object

```text
diagnostic_request_id
service_code
requested_by
origin_facility
destination_facility
status
capability_last_verified
sample_required
result_status
result_reference
created_at
updated_at
```

## MVP limitation

Use capability notes/fixtures and structured requests.

Do not build:

- full LIS
- pathology billing
- analyser integration
- complete sample logistics platform

## Future extension

With approved integration:

- sample status
- report availability
- delayed-result alerts
- result reference in the care episode

---

# 10. Medicine Availability Visibility

## Goal

Make known medicine availability more visible without replacing the government procurement/supply-chain system.

## Example

```text
Medicine: Metformin
Facility: PHC X
Status: VERIFIED_AVAILABLE
Last verified: 10:40 today
Source: authorised facility attestation / approved feed
```

Or:

```text
Status: UNKNOWN
Last verified: 12 days ago
```

## Why freshness is necessary

Stock status can change.

Therefore:

> **No freshness information = no claim of live availability.**

## MVP

Use fixture/attestation data.

## Production direction

If the state exposes an approved integration/API, Orion can become a **read/visibility layer** over that system.

Orion should not rebuild procurement, warehousing, purchase orders, or inventory accounting.

---

# 11. Teleconsultation / Assisted Teleconsultation

## Principle

Do not build a second video platform when an existing government teleconsultation pathway can be used.

## Orion role

```text
Assessment
   ↓
Teleconsult appropriate?
   ↓
Existing teleconsult pathway
   ↓
Reference / ticket / status
   ↓
Specialist consultation
   ↓
Outcome attached to Handoff
```

## Stored teleconsult fields

```text
requested
booked
reference_id
consultation_status
outcome_reference
```

## Optional future assistance

Orion may provide:

- structured pre-consultation information
- symptom capture
- protocol-based prioritisation
- local-language input assistance
- patient preparation

It should not replace the actual authorised teleconsultation platform.

---

# 12. Appointment and Queue Support

## MVP principle

Do not build a complete OPD queue-management system.

Use a **referral appointment / expected-arrival workflow**.

## Example

```text
Referral accepted
       ↓
Preferred/assigned date
       ↓
Expected arrival window
       ↓
Facility prepared for requested service
```

## Future integration

If the state/hospital already has an appointment/queue platform, Orion can store/reference the relevant identifier and status rather than rebuilding it.

---

# 13. Emergency Escalation

## Principle

A digital workflow must never delay emergency care.

## Emergency flow

```text
Emergency / Red condition
        ↓
Immediate clinical action
        ↓
Existing emergency transport / escalation pathway
        ↓
Destination facility
```

Orion can store:

- urgency
- transport required yes/no
- emergency reference number if provided
- destination
- pre-alert status

## Not in scope

- ambulance dispatch engine
- ambulance GPS fleet management
- replacement emergency number

## Safety rule

If network is down:

> **Emergency care proceeds through existing offline/voice/transport procedures.**

The system can synchronise the digital record later.

---

# 14. Maternal Care Workflow

Maternal health should be a first-class prototype scenario because the SIH outcome explicitly includes maternal follow-up and Maharashtra evidence highlights referral-phase continuity gaps.

## Workflow

```text
ANC encounter
     ↓
Danger-sign assessment
     ↓
Normal / higher-risk pathway
     ↓
If referral required
     ↓
Capability-aware destination
     ↓
Handoff
     ↓
Accept / redirect
     ↓
Arrival
     ↓
Specialist / hospital care
     ↓
Return outcome
     ↓
Counter-referral
     ↓
Follow-up task
```

## High-risk pregnancy follow-up

Track:

- high-risk flag
- referral created
- referral acknowledged
- patient arrived
- specialist outcome
- discharge/counter-referral
- next follow-up date
- overdue status

---

# 15. Child Health Workflow

Use a limited protocol-based child-health referral workflow for the prototype.

## Example

```text
Child presents
    ↓
Danger-sign checklist
    ↓
Protocol result / urgency
    ↓
Required care level
    ↓
Destination
    ↓
Handoff
    ↓
Arrival
    ↓
Outcome
    ↓
Follow-up
```

The checklist should be based on the selected approved public-health protocol; the application should not invent clinical rules.

---

# 16. NCD / Chronic Care Workflow

## Example: hypertension

```text
Community / AAM screening
        ↓
Elevated result / concern
        ↓
PHC assessment
        ↓
Referral if required
        ↓
Treatment adjustment
        ↓
Outcome
        ↓
Follow-up due
        ↓
CHO/ANM follow-up task
        ↓
Completed / Missed / Escalated
```

## Chronic-care timeline

The Care Episode can show:

```text
Screened
→ Referred
→ Seen by clinician
→ Treatment change
→ Follow-up due
→ Follow-up completed
```

This gives continuity without building a full longitudinal EHR.

---

# 17. Counter-Referral / Return Outcome

The referral should have a **return direction**.

## Upward

```text
AAM → PHC → RH/CHC → DH
```

## Downward / counter-referral

```text
DH → PHC → AAM / community follow-up
```

## Return note

Minimum fields:

- disposition
- summary/outcome
- tests advised
- medicine/advice summary
- follow-up date
- follow-up location
- special instructions

The return note is not intended to reproduce the entire discharge summary/medical record.

---

# 18. Patient / Caregiver Layer

The product remains provider/facility-focused, but the patient should not be completely invisible.

## Minimal patient interface

```text
Referral ID
Current status
Destination
Expected date/time
What to carry
Where to report
Follow-up date
```

## Patient-friendly explanation

Example:

```text
Why are you being referred?
→ Specialist review is required.

Where do you need to go?
→ District Hospital.

When?
→ Today.

What should you carry?
→ Existing reports and referral ID.
```

## No full citizen super-app

The patient layer exists to reduce confusion around an active Care Episode.

---

# 19. Multilingual and Voice Support

## Language priorities for Maharashtra prototype

- Marathi
- Hindi
- English

Architecture should remain localisation-ready for additional languages/dialects.

## Voice assistance

Possible workflow:

```text
User speaks
  ↓
Speech-to-text
  ↓
Field suggestion
  ↓
User confirmation
  ↓
Structured form value
```

## Voice must not

- diagnose
- choose treatment autonomously
- overwrite clinical values silently

## Health literacy support

Use:

- simple labels
- icons where appropriate
- short sentences
- audio prompts where practical
- patient-facing explanation of referral destination and next step

---

# 20. Notifications and Communication

## Event notifications

Examples:

- referral sent
- referral acknowledged
- accepted
- cannot accept
- redirected
- appointment/expected arrival
- no-show
- patient arrived
- outcome available
- follow-up due
- follow-up overdue

## Channels

- in-app notification
- controlled SMS/reference message where approved
- QR/reference ID

## SMS rule

Do not put sensitive clinical information in ordinary SMS.

Use:

> **Handoff ID + minimal non-sensitive instructions**

---

# 21. Quality and Accountability Dashboard

The dashboard should be operational, not a giant AI analytics product.

## Supervisor metrics

### Referral flow

- total referrals
- referrals pending acknowledgement
- accepted
- cannot accept
- redirected
- arrived
- no-show
- outcome pending
- closed

### Time metrics

- referral creation → first action
- first action → acceptance
- acceptance → arrival
- arrival → outcome
- outcome → follow-up completion

### Service metrics

- most requested services
- most common redirect reasons
- specialist unavailable reasons
- diagnostic availability issues
- medicine visibility issues

### Quality metrics

- referral completeness
- redirect rate
- no-show rate
- outcome-return rate
- high-risk follow-up completion
- stale capability data
- open referral ageing

## Drill-down

```text
State / District
      ↓
Facility
      ↓
Referral category
      ↓
Individual Handoff event trail
```

Use only the minimum data necessary for the supervisor role.

---

# 22. Audit Trail and Accountability

Every important action becomes an immutable/logged event conceptually.

## Event

```text
id
handoff_id
actor_id
actor_role
action
previous_state
new_state
reason
created_at
metadata
```

## Example

```text
10:32 Created by CHO
10:34 Sent to PHC
10:38 Viewed by referral desk
10:41 Cannot Accept — specialist unavailable
10:43 Redirected to DH
10:50 DH accepted
11:20 Patient arrived
14:15 Outcome recorded
```

## Why this matters

The Handoff is no longer merely a document.

It becomes an **accountable workflow**.

---

# 23. Role-Based Access Control

## Origin roles

### CHO

Can:

- create/refine permitted referrals
- see assigned facility cases
- track active Handoffs
- perform follow-up tasks within authorised scope

### ANM

Can:

- access relevant maternal/child workflows according to policy
- create/assist referrals within authorised scope
- track follow-up

### Medical Officer

Can:

- review referrals
- create/confirm referrals
- update clinical/referral information within scope
- review outcomes

## Destination/referral desk

Can:

- view incoming referrals
- accept/cannot accept/redirect
- record arrival/no-show
- add return notes within scope

## Supervisor

Can:

- view operational aggregates
- inspect referral ageing
- inspect quality metrics
- access only data permitted by policy

## Patient/caregiver

Can:

- view limited referral status/instructions

## Facility scoping

A user should not automatically see every facility's patient data.

---

# 24. Security and Privacy

For the SIH prototype:

- synthetic patient data only
- role-based authentication
- facility-scoped access
- minimal necessary data
- audit trail
- secure authenticated requests
- no medical details in ordinary SMS
- privacy/prototype warning
- no unnecessary exposure of identifiers

## Production considerations

A real deployment would require formal work on:

- consent
- identity
- authorisation
- encryption
- secure hosting
- logging/monitoring
- retention rules
- incident response
- state/government IT governance
- applicable privacy/data-protection requirements
- interoperability compliance
- certification/approval where applicable

Do not claim production compliance from an SIH prototype.

---

# 25. Offline-First Architecture

Offline capability is a core operational requirement, not a cosmetic feature.

## Offline flow

```text
UI
 ↓
Application logic
 ↓
IndexedDB
 ↓
Local Handoff/event queue
 ↓
Network returns
 ↓
Sync engine
 ↓
Backend API
 ↓
PostgreSQL
 ↓
Destination inbox
```

## Data stored locally

- draft Handoff
- structured form data
- temporary local reference
- pending events
- sync status

## Service Worker role

Service Worker:

- caches the application shell/assets
- supports PWA behaviour
- helps the application continue to load/work appropriately offline

It is **not** the database.

## Unique local IDs

Generate a local-safe ID before server sync so the user can continue working offline.

Use a server reconciliation strategy so the eventual server-side public Handoff ID remains authoritative.

## Event-based sync

Prefer events over simply overwriting the entire Handoff on sync.

Example events:

```text
handoff_created
handoff_sent
handoff_acknowledged
handoff_accepted
handoff_cannot_accept
handoff_redirected
patient_arrived
patient_no_show
outcome_added
followup_created
followup_completed
handoff_closed
```

## Idempotency

Every queued event should have a stable client/event ID so that retrying the same event does not create duplicate actions.

## Conflict handling

Do not rely blindly on last-write-wins.

For the prototype:

- validate state transitions
- reject invalid transitions
- record conflicting actions
- preserve the event history
- allow an authorised user to resolve appropriate operational conflicts

## Critical safety rule

> **Offline mode must never delay emergency care.**

---

# 26. Technical Architecture

## Frontend

- Next.js
- PWA architecture
- mobile-first origin interface
- tablet/desktop-friendly destination interface
- accessible forms
- localisation support

## Offline

- IndexedDB
- Service Worker
- local event queue
- sync engine

## Backend

- Node.js
- Express.js REST API
- PostgreSQL
- Drizzle ORM

## Authentication

- Better Auth / equivalent role-aware auth for prototype
- facility-scoped authorisation

## Interoperability

- FHIR-aligned domain model
- structured referral representation
- exportable JSON

## Communication

- QR
- reference IDs
- controlled/mock SMS for prototype

## Hosting

Prototype can use standard cloud deployment such as:

- Vercel for frontend
- Render/similar service for backend
- managed PostgreSQL

Vendor choice is not part of the product value proposition.

---

# 27. FHIR / ABDM Approach

## Positioning

FHIR is an interoperability standard, not a marketing label.

For the SIH prototype, Orion should maintain an **FHIR-aligned data representation**.

Possible resources/concepts include:

- Patient
- ServiceRequest
- Task
- Encounter, where applicable

## Conceptual mapping

### Patient
Represents the patient reference/context.

### ServiceRequest
Represents the requested service/care/referral request.

### Task
Represents workflow/status of referral-related work.

### Encounter
Can represent an actual care interaction when appropriate.

## Prototype claim

Say:

> **"FHIR-aligned prototype data model / export."**

Do not say:

> **"Production ABDM integration is complete."**

## Production requirement

Production ABDM integration would require appropriate:

- standards implementation
- consent model
- identity handling
- security
- approved APIs/gateways
- certification/authorisation
- deployment governance

## ABHA

The prototype should be designed so that an approved production pathway can use the public-health digital identity ecosystem where applicable.

Do not create an independent proprietary national health ID.

## HFR/HPR

For production facility/provider discovery, prefer approved government registries/integrations rather than inventing an isolated national database.

---

# 28. Data Model

## facilities

```text
id
name
type             // AAM / PHC / RH / CHC / SDH / DH / tertiary
level
block
district
state
latitude         // optional
longitude        // optional
status
```

## facility_capabilities

```text
id
facility_id
service_code
status             // available / unavailable / stale / unknown
attested_at
attested_by
source_type
note
```

## actors

```text
id
role
facility_id
display_name
status
```

## patients

For prototype:

```text
id
display_name
age
sex
synthetic_reference
abha_mock           // optional demo-only placeholder, clearly marked
```

## care_episodes

```text
episode_id
patient_id
protocol
primary_reason
urgency
created_at
updated_at
status
```

## handoffs

```text
id
public_code
episode_id
patient_id
origin_id
destination_id
protocol
urgency
request_summary
state
created_at
updated_at
```

## handoff_events

```text
id
handoff_id
client_event_id
actor_id
event_type
previous_state
new_state
reason
payload_json
created_at
```

## diagnostic_requests

```text
diagnostic_request_id
episode_id
service_code
origin_facility
destination_facility
status
capability_reference
result_reference
created_at
updated_at
```

## medication_visibility

```text
id
facility_id
medicine_code
status
attested_at
attested_by
source_type
note
```

## followups

```text
id
episode_id
assigned_facility
assigned_role
due_at
status
completed_at
notes
```

## teleconsult_references

```text
id
episode_id
provider
reference_id
status
requested_at
completed_at
outcome_reference
```

## appointments

```text
id
handoff_id
facility_id
scheduled_for
status
slot_reference
```

---

# 29. API Design

Example REST surface:

```text
POST   /auth/*
GET    /facilities
GET    /facilities/:id
GET    /facilities/:id/capabilities
POST   /capabilities/attest

POST   /episodes
GET    /episodes/:id

POST   /handoffs
GET    /handoffs/:id
POST   /handoffs/:id/send
POST   /handoffs/:id/acknowledge
POST   /handoffs/:id/accept
POST   /handoffs/:id/cannot-accept
POST   /handoffs/:id/redirect
POST   /handoffs/:id/arrive
POST   /handoffs/:id/no-show
POST   /handoffs/:id/outcome
POST   /handoffs/:id/close
GET    /handoffs/:id/events

POST   /followups
GET    /followups
POST   /followups/:id/complete
POST   /followups/:id/escalate

POST   /diagnostics
GET    /diagnostics/:id

POST   /teleconsults/reference

POST   /sync/events
GET    /sync/status

GET    /dashboard/referrals
GET    /dashboard/quality

GET    /interop/fhir/episodes/:id
```

The exact endpoint structure can change; the state/workflow contract should remain stable.

---

# 30. Event-Driven State Rules

The backend should reject impossible transitions.

Example:

```text
DRAFT → SENT             valid
SENT → ACKNOWLEDGED      valid
ACKNOWLEDGED → ACCEPTED  valid
ACCEPTED → ARRIVED       valid
ARRIVED → OUTCOME        valid
OUTCOME → CLOSED         valid
```

Invalid examples:

```text
CLOSED → ACCEPTED
NO_SHOW → ARRIVED         // only if policy explicitly supports correction
DRAFT → ARRIVED
```

Any correction should be represented as an authorised event rather than silently rewriting history.

---

# 31. Failure Paths — Core Demo

The demo should deliberately include failure cases.

## Failure 1 — Incomplete referral

```text
High-risk ANC referral
        ↓
Required danger-sign information missing
        ↓
Send blocked
        ↓
Missing fields shown
        ↓
User completes information
        ↓
Send succeeds
```

## Failure 2 — Destination cannot accept

```text
CHC receives
   ↓
Cannot Accept
   ↓
Reason: specialist unavailable
   ↓
Origin notified
```

## Failure 3 — Redirect

```text
AAM
 ↓
CHC
 ↓
Cannot Accept
 ↓
Redirect
 ↓
District Hospital
 ↓
Accept
```

## Failure 4 — Offline creation

```text
Network OFF
 ↓
Create Handoff
 ↓
Saved locally
 ↓
Queued

Network ON
 ↓
Sync
 ↓
Destination receives
```

## Failure 5 — Stale capability

```text
Ultrasound
Last verified: 3 days ago

System displays freshness
rather than saying "available now".
```

## Failure 6 — No-show

```text
Accepted
 ↓
Expected arrival passes
 ↓
No-show
 ↓
Origin notified
 ↓
Follow-up task
```

## Failure 7 — Missed follow-up

```text
Follow-up due
 ↓
Not completed
 ↓
Overdue
 ↓
Assigned staff alerted
 ↓
High-risk escalation if protocol/policy requires
```

---

# 32. Facility Capability Attestation

Because fully live state-system feeds may not be available to a prototype, Orion needs an explicit **attestation concept**.

## Who can attest?

An authorised facility user.

## What can they attest?

- specialist availability state
- service availability
- diagnostic capability
- equipment functional status
- selected medicine availability
- temporary operational constraints

## Attestation record

```text
facility
value
status
attested_by
attested_at
expires_at (optional)
note
```

## Example

```text
Facility: DH X
Service: Ultrasound
Status: AVAILABLE
Attested by: authorised facility user
Verified: 18 Sep 09:20
```

This is better than inventing live APIs in the SIH prototype.

---

# 33. Offline + Capability Interaction

Important edge case:

> What if the referral is created offline but capability data is old?

Solution:

```text
Offline user
 ↓
Existing local capability snapshot
 ↓
Display age clearly
 ↓
User acknowledges freshness
 ↓
Referral created
 ↓
When online, system refreshes capability data
```

The system must never silently convert old information into a "live" claim.

---

# 34. Appointment / Expected Arrival Logic

If the receiving facility accepts:

```text
status = ACCEPTED
expected_arrival = timestamp/window
```

Facility can see:

```text
Incoming today
Incoming in next 2h
High urgency
Service required
```

This is not a complete queue system.

It is **referral-aware preparation**.

---

# 35. Patient Communication Flow

## After Handoff creation

Patient receives:

```text
Referral created
ID: OR-1023
Destination: District Hospital
Urgency: Today
```

## After acceptance

```text
Destination has accepted the referral.
```

## After redirect

```text
Original facility cannot currently accept.
Updated destination: District Hospital.
```

## After follow-up

```text
Follow-up due: 25 Sep
Location: AAM
```

Sensitive clinical information stays inside the authenticated system.

---

# 36. Quality Metrics and Impact Metrics

The solution should not claim measured impact before a pilot.

## Prototype metrics

Measure whether the workflow works:

- referral packet completeness rate
- send success rate
- sync success rate
- average first facility response time in demo data
- redirect flow completion
- arrival-state completion
- outcome-return completion
- follow-up task completion in demo/pilot

## Pilot outcome metrics

Potential metrics:

- reduction in incomplete referrals
- reduction in duplicate/avoidable destination visits
- reduction in time-to-acknowledgement
- increase in referral completion rate
- increase in counter-referral/outcome completion
- reduction in unresolved referral ageing
- improved high-risk follow-up completion
- reduction in repeat information entry

Do not present pilot targets as already achieved outcomes.

---

# 37. SIH Impact Mapping

## Patients

- fewer unnecessary trips
- less waiting caused by poor coordination
- clearer destination information
- greater continuity
- clearer follow-up instructions

## Frontline workers

- shorter structured referral forms
- less repeated explanation
- referral status visibility
- follow-up task visibility
- offline workflow

## Receiving facilities

- early referral visibility
- structured information
- accept/cannot accept/redirect workflow
- preparation for incoming cases

## Supervisors

- referral ageing
- bottleneck visibility
- redirect reasons
- completion/follow-up metrics
- facility-level operational signals

## Public-health system

- better coordination across existing systems
- less duplication
- auditable referral lifecycle
- interoperability-ready architecture

---

# 38. Existing Systems — Integration Matrix

| Existing system / ecosystem | What it already does | Orion should do |
|---|---|---|
| eSanjeevani | Teleconsultation | Carry reference/status; prepare structured referral context; do not rebuild video |
| ABDM / ABHA | Digital identity/interoperability ecosystem | Stay compatible; use approved integration path; do not invent national identity |
| HFR/HPR | Facility/provider discovery where supported | Use approved registry/integration for production discovery |
| e-Sushrut / HMIS | Hospital/facility operational workflows | Complement; do not replace |
| RCH/ANMOL | Maternal/child tracking workflows | Coordinate referral/follow-up; avoid duplicate data-entry where integration exists |
| NCD systems | Screening/follow-up programme workflows | Coordinate referral and care-transition tasks; do not recreate programme databases |
| e-Aushadhi / medicine system | Supply/procurement/inventory workflows | Visibility layer only where authorised |
| MEMS/108 | Emergency transport | Escalate to existing pathway; do not build dispatch |
| MJPJAY | Eligible tertiary care transaction/assistance workflow | Store/referral context where useful and authorised; do not replace eligibility/claims platform |

---

# 39. What Orion Should NOT Claim

Never claim without proof:

- "India's first referral system"
- "India has no closed-loop referral systems"
- "ABDM cannot support referrals"
- "FHIR does not support referrals"
- "live national facility availability"
- "live medicine availability" without live authorised source
- "production ABDM integration" from a mock prototype
- "AI diagnoses patients"
- "Orion guarantees specialist availability"
- "Orion guarantees medicine stock"
- "Orion guarantees ambulance availability"

Better positioning:

> **A lightweight, offline-friendly, two-sided care-transition workflow that keeps the referral lifecycle visible from creation to outcome and follow-up.**

---

# 40. Demo Environment

## Facilities

Use a small synthetic corridor:

```text
1 AAM / Sub-Centre
      ↓
1 PHC
      ↓
1 CHC / RH
      ↓
1 District Hospital
```

## Roles

- CHO / origin
- PHC/MO
- referral desk
- district facility
- supervisor
- optional patient view

## Demo patients

Use synthetic cases only.

Recommended:

1. high-risk ANC case
2. adult/NCD case
3. optional child-health case

---

# 41. Best SIH Demo Story

Do not demo fifty unrelated features.

Demo one coherent patient journey.

## Scenario

A pregnant woman at a rural AAM requires higher-level assessment.

### Scene 1 — Assessment

CHO opens maternal protocol.

Required field missing.

System blocks send.

### Scene 2 — Complete referral

User completes the checklist.

Orion determines that higher-level review is required under the chosen protocol.

### Scene 3 — Destination selection

Show two facilities:

```text
CHC A
Gynaecology: available
OT: unavailable
Verified: yesterday

District Hospital B
Gynaecology: available
OT: available
Verified: today
```

### Scene 4 — Offline

Turn internet off.

Create Handoff.

Show:

> Saved offline — waiting for network.

### Scene 5 — Sync

Turn internet on.

Handoff reaches destination inbox.

### Scene 6 — Cannot Accept

CHC cannot accept:

> Required specialist unavailable.

### Scene 7 — Redirect

CHC redirects to District Hospital.

### Scene 8 — Accept

District Hospital accepts.

### Scene 9 — Arrival

Mark patient arrived.

### Scene 10 — Outcome

Add return note.

### Scene 11 — Follow-up

Origin sees:

> Follow-up due in 14 days.

### Scene 12 — Dashboard

Supervisor sees:

- referral completion
- redirect reason
- no unresolved handoff
- follow-up pending/completed

### Scene 13 — Interoperability

Show FHIR-aligned JSON export.

### Closing statement

> **"We are not replacing Maharashtra's existing telemedicine, hospital, medicine, emergency, or digital-health systems. Orion makes the movement of the patient between those systems more organised, visible and accountable."**

---

# 42. Secondary Demo Scenario — NCD

A patient screened for hypertension at the primary-care level needs physician review.

```text
NCD screening
 ↓
PHC referral
 ↓
Handoff
 ↓
PHC accepts
 ↓
Treatment adjustment
 ↓
Return outcome
 ↓
Follow-up in 30 days
 ↓
Follow-up due
 ↓
Completed
```

This demonstrates longitudinal continuity.

---

# 43. Secondary Demo Scenario — Child Health

Use a small child danger-sign workflow to show that the architecture is protocol-driven rather than disease-specific.

```text
Child assessment
 ↓
Danger-sign protocol
 ↓
Urgency
 ↓
Destination
 ↓
Handoff
 ↓
Arrival
 ↓
Outcome
 ↓
Follow-up
```

---

# 44. Product UX Principles

1. **Short origin workflow**
2. **Few taps for the next action**
3. **No unnecessary fields**
4. **Never hide data freshness**
5. **Never block emergency care because of software**
6. **Keep Handoff ID visible**
7. **Show current status clearly**
8. **Make Cannot Accept and Redirect first-class actions**
9. **Keep clinical information protected**
10. **Design for low-connectivity use**
11. **Localise language**
12. **Prefer simple operational interfaces over crowded dashboards**

---

# 45. Screen Structure

## Origin app

### Screen 1 — Home

- open referrals
- follow-up due
- pending actions
- new referral

### Screen 2 — Select protocol

- Maternal / ANC
- Adult
- Child
- NCD

### Screen 3 — Assessment

- short structured fields
- required-field validation
- risk/urgency result
- submit/continue

### Screen 4 — Destination

- facilities
- service availability
- freshness
- distance where available
- reason for recommendation

### Screen 5 — Confirmation

- Handoff ID
- destination
- urgency
- offline/sync status
- QR

### Screen 6 — Handoff timeline

- status
- event history
- destination action
- patient arrival
- outcome
- follow-up

## Destination app

### Screen 1 — Incoming referrals

Sort by:

- urgency
- waiting time
- service needed

### Screen 2 — Referral detail

Actions:

- Accept
- Cannot Accept
- Redirect

### Screen 3 — Arrival

- Arrived
- No-show

### Screen 4 — Outcome

- disposition
- next action
- tests
- follow-up

## Supervisor dashboard

- referral ageing
- acceptance rate
- redirects
- no-shows
- outstanding outcomes
- follow-ups
- capability freshness

## Patient layer

- referral status
- destination
- time/instructions
- follow-up date

---

# 46. Development Plan

Build in this order.

## Phase 1 — Foundation

1. Authentication
2. Role-based access
3. Facility scoping
4. Database schema
5. Facility seed data

## Phase 2 — Core Handoff

6. Create episode
7. Protocol forms
8. Create Handoff
9. Handoff state machine
10. Event log

## Phase 3 — Destination

11. Incoming inbox
12. Accept
13. Cannot Accept + reason
14. Redirect
15. Arrived
16. No-show
17. Outcome

## Phase 4 — Offline

18. IndexedDB
19. local event queue
20. offline creation
21. sync
22. idempotency/conflict rules

## Phase 5 — Capability layer

23. Facility capability model
24. Freshness
25. Attestation
26. Destination selection

## Phase 6 — Continuity

27. Counter-referral
28. Follow-up tasks
29. Follow-up dashboard
30. patient status layer

## Phase 7 — Domain coverage

31. Maternal workflow
32. Child workflow
33. Adult/NCD workflow

## Phase 8 — Supporting functions

34. Diagnostics request
35. Medicine visibility
36. Teleconsult reference
37. Appointment/expected-arrival
38. Emergency reference
39. Multilingual UI
40. QR
41. mock SMS

## Phase 9 — Interoperability/security

42. FHIR-aligned export
43. audit improvements
44. privacy hardening
45. permission testing

## Phase 10 — Quality/demo

46. supervisor dashboard
47. failure paths
48. demo dataset
49. performance/testing
50. final polish

---

# 47. Testing Plan

## Functional tests

- referral creation
- referral acceptance
- cannot-accept path
- redirect
- arrival
- no-show
- outcome
- follow-up

## Offline tests

- create offline
- refresh offline
- multiple queued events
- network restoration
- duplicate event retry
- failed sync recovery

## Security tests

- role isolation
- facility isolation
- unauthorised route access
- session expiry
- audit trail completeness

## Workflow tests

- invalid state transition
- redirect preservation
- stale capability visibility
- emergency does not wait for sync
- incomplete protocol submission blocked

## Data tests

- synthetic data only
- no clinical details in SMS
- no silent data loss
- event chronology consistent

---

# 48. Practical Deployment Path

## Phase 1 — SIH Prototype

Scope:

- synthetic patients
- 2–4 facilities
- 2–3 workflows
- Handoff lifecycle
- offline mode
- capability freshness
- outcome/follow-up
- dashboard
- FHIR export

No live government API is required for the core demo.

## Phase 2 — Small pilot

Example corridor:

```text
AAM / Sub-Centre
      ↓
PHC
      ↓
CHC / RH
      ↓
District Hospital
```

Pilot questions:

- Does referral acknowledgement improve?
- Are fewer referrals redirected after arrival?
- Does outcome return rate improve?
- Does follow-up completion improve?
- Does data-entry burden stay manageable?
- Does offline sync work in real network conditions?

## Phase 3 — Approved integration

Potential integrations, subject to government authorisation and technical availability:

- state HMIS
- ABDM ecosystem
- telemedicine pathway
- medicine availability source
- diagnostic capability/results
- facility registry
- programme systems

Production requirements must be separately validated.

---

# 49. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Stale capability data | Show freshness + source + unknown state |
| Wrong referral destination | Capability-aware suggestions + clinician confirmation |
| Clinical error | Protocol/rule checks + clinician responsibility + no autonomous diagnosis |
| Duplicate data entry | Keep Handoff short; integrate rather than duplicate existing programme data |
| Offline sync conflict | Event model + idempotency + state validation |
| Data privacy issue | RBAC, facility scope, synthetic data, audit trail |
| Government API unavailable | Fixture/attestation data in prototype; adapters later |
| App fatigue | Focus only on care transition workflow |
| Emergency delay | Emergency path bypasses normal digital dependency |
| Medicine data stale | Freshness indicator and unknown state |
| False "live" claims | Explicit source/time labels |
| Scope explosion | Strict MVP boundary |
| Poor frontline adoption | Short workflow, large touch targets, multilingual/voice assistance |
| Internet failure | Offline-first design |
| Poor health literacy | Patient-friendly explanation and status |
| Incomplete outcome feedback | Mandatory/structured return note before closure where appropriate |

---

# 50. Evidence / Validation Rules

## For the PPT and judge presentation

Every Maharashtra-specific claim should have a source.

For statistics, record:

- year
- geography
- population/sample
- source
- whether it is historical or current

## Before using a number

Verify from:

1. Government of Maharashtra
2. Maharashtra Public Health Department
3. NHM Maharashtra
4. MoHFW
5. NHA / ABDM
6. CAG
7. official programme reports
8. peer-reviewed/institutional research

## Important unresolved technical point

Before claiming production integration, verify whether the relevant state systems expose approved third-party APIs or integration channels for:

- real-time medicine availability
- referral status
- facility capability
- HMIS handoff

If not confirmed:

> **Use fixture/attestation data in the prototype and explicitly describe live integration as future/subject to authorisation.**

---

# 51. Maharashtra-Specific Problem-to-Orion Mapping

## Problem: long travel

**Root cause:** patient can travel to a facility that cannot provide the needed service.

**Orion response:** capability-aware destination visibility + clearer handoff.

## Problem: specialist shortage

**Root cause:** specialist may not be available at lower facility.

**Orion response:** known capability state + suitable referral + existing teleconsult pathway.

## Problem: diagnostics

**Root cause:** required tests/services may not be available or coordinated.

**Orion response:** requested diagnostic/service + capability + destination + status.

## Problem: fragmented records

**Root cause:** information may not move cleanly across tiers.

**Orion response:** structured Handoff + care-transition timeline + return outcome.

## Problem: delayed referral

**Root cause:** referral can sit in paper/phone/manual process.

**Orion response:** destination inbox + acknowledgement + time tracking.

## Problem: service awareness

**Root cause:** patient/frontline user may not know facility capability.

**Orion response:** service/capability visibility with freshness.

## Problem: connectivity

**Root cause:** rural network may be unreliable.

**Orion response:** local-first referral creation + sync.

## Problem: continuity

**Root cause:** destination outcome may not come back.

**Orion response:** return note + counter-referral + follow-up.

## Problem: quality/accountability

**Root cause:** referral bottlenecks are difficult to see operationally.

**Orion response:** audit trail + referral ageing + quality dashboard.

---

# 52. Feature Priority Matrix

## MUST HAVE

- Handoff
- protocol-assisted assessment
- destination selection
- capability freshness
- destination inbox
- accept/cannot accept/redirect
- arrival/no-show
- outcome
- counter-referral
- follow-up
- offline creation
- sync
- facility-scoped RBAC
- audit timeline

## SHOULD HAVE

- maternal protocol
- NCD protocol
- child protocol
- diagnostics request
- medicine visibility
- multilingual UI
- patient status
- QR
- expected arrival/appointment
- supervisor dashboard
- teleconsult reference
- emergency reference

## NICE TO HAVE

- voice input
- richer maps
- richer analytics
- multiple programme integrations
- deeper patient interface

## FUTURE

- approved ABDM integration
- live state-system capability feeds
- live medicine visibility
- diagnostic result integration
- HMIS adapters
- telemedicine adapters
- advanced quality analytics

---

# 53. What to Demonstrate vs What to Explain on Slides

## Demonstrate live

- login/roles
- protocol form
- Handoff creation
- offline creation
- sync
- destination inbox
- cannot accept
- redirect
- arrival
- outcome
- follow-up
- capability freshness
- dashboard

## Explain visually

- Maharashtra healthcare hierarchy
- existing government ecosystem
- ABDM/FHIR positioning
- production integration path
- scalability
- privacy/security
- impact model

Do not spend demo time opening every minor feature.

---

# 54. Suggested SIH 6-Slide Structure

## Slide 1 — Problem

### Title
**Closing the Care-Transition Gap in Rural Maharashtra**

Show:

```text
Patient
 ↓
AAM / PHC
 ↓
Referral
 ↓
RH / CHC / DH
```

Highlight:

- travel
- specialist availability
- diagnostics
- fragmented information
- delayed referrals
- connectivity

Use a small Maharashtra-specific evidence panel.

## Slide 2 — Solution

### Title
**Orion — Care Access & Referral Coordination**

Main visual:

```text
Assess
 ↓
Route
 ↓
Handoff
 ↓
Accept / Redirect
 ↓
Arrive
 ↓
Outcome
 ↓
Follow-up
```

Side badges:

- offline-first
- multilingual
- capability-aware
- interoperable
- existing-system compatible

## Slide 3 — Technical Approach

Show:

```text
Frontend / PWA
       ↓
Offline Layer
       ↓
API
       ↓
Handoff / Episode Engine
       ↓
PostgreSQL
       ↓
FHIR-aligned interoperability
       ↓
Existing public-health ecosystem
```

## Slide 4 — Feasibility & Viability

Show:

- complements existing systems
- offline operation
- role-based access
- protocol-based logic
- mock/live integration boundary
- pilot corridor
- risks + mitigations

## Slide 5 — Impact & Benefits

Four columns:

### Patient
Less avoidable travel

### Frontline worker
Less manual follow-up

### Facility
Better referral visibility

### System
Better accountability / continuity

## Slide 6 — Research & References

Primary emphasis:

- Maharashtra Public Health Department
- NHM Maharashtra
- CAG
- MoHFW/IPHS
- ABDM/NHA
- eSanjeevani official documentation
- relevant public-health protocols
- peer-reviewed referral/telemedicine evidence

---

# 55. Judge Questions We Should Be Ready For

## "Why do we need Orion if eSanjeevani already exists?"

Answer:

> eSanjeevani handles the teleconsultation pathway. Orion handles the broader referral lifecycle — creation, destination acceptance, redirect, arrival, outcome, and follow-up — around existing systems.

## "Why not just use e-Sushrut/HMIS?"

Answer:

> Orion is not replacing hospital management. It focuses on the cross-facility care transition and the shared Handoff state.

## "Where is live facility availability coming from?"

Answer:

> The prototype uses timestamped fixture/attestation data. Production live feeds would require approved government integration/API access. We do not pretend fixture data is live.

## "What if the internet is unavailable?"

Answer:

> Handoff creation continues locally using IndexedDB and a queued event model. Synchronisation happens when connectivity returns. Emergency care never waits for sync.

## "Is this AI diagnosis?"

Answer:

> No. Protocol-based checks support referral completeness and urgency; clinical decisions remain with authorised health professionals.

## "Why not give ASHA full clinical control?"

Answer:

> ASHA supports community mobilisation and referral pathways, but clinical scope must follow official role definitions. Orion uses role-based screens so the clinical workflow remains with the appropriately authorised staff.

## "How does Orion solve specialist shortage?"

Answer:

> It cannot create specialists. It can improve routing, make known capability visible, and connect to existing teleconsultation pathways where appropriate.

## "How does it solve medicine shortage?"

Answer:

> It does not fix procurement. It provides visibility into known availability when authorised data is available, reducing avoidable travel.

## "How is this scalable?"

Answer:

> The core Handoff and Care Episode model is independent of a single facility. Facility, role, protocol and capability data are configurable. State integrations can be added through adapters.

## "Why FHIR?"

Answer:

> To structure the data in a standardised interoperability model and keep future integration possible without claiming that the prototype is already production-integrated.

## "What happens if a destination cannot accept?"

Answer:

> The referral remains part of the same care episode, the reason is recorded, and the destination can be redirected to another appropriate facility.

---

# 56. Core Differentiation

Do not compete on:

- number of features
- number of AI models
- number of screens
- fancy maps
- video calling
- generic dashboards

Compete on:

> **Completing the referral loop.**

The key difference is:

```text
Traditional referral
"Go there."

Orion
"We sent it → they received it → they accepted/redirected it → you arrived → here's what happened → here's the next follow-up." 
```

This is the product's most important conceptual distinction.

---

# 57. Product Rules

1. Keep origin workflow short.
2. Never ask for unnecessary data.
3. Never show stale information as live.
4. `Cannot Accept` must have a reason.
5. `Redirect` must preserve the same Care Episode.
6. Keep Handoff ID visible.
7. Keep clinical details out of ordinary SMS.
8. Use protocols for clinical checks.
9. Do not depend on internet for referral creation.
10. Never let the app delay emergency treatment.
11. Do not duplicate systems that already exist.
12. Show source/freshness for operational data.
13. Make outcome and follow-up first-class parts of the workflow.
14. Treat the receiving facility as an active participant, not just a database destination.
15. Use synthetic data for SIH prototype.

---

# 58. Future Extensions

After the core workflow is proven:

- additional referral protocols
- richer multilingual/voice support
- approved ABDM integration
- state HMIS adapters
- approved telemedicine adapter
- diagnostic sample/report tracking
- approved medicine availability integration
- appointment/queue integration
- stronger facility operational analytics
- reminder/notification orchestration
- population-level quality reporting where authorised
- cross-programme care coordination

These are extensions, not excuses to make the SIH MVP enormous.

---

# 59. MVP Scope — Final

The SIH MVP should prove **one thing extremely well**:

> **A rural referral can move from origin to destination to outcome without losing operational visibility.**

## MVP modules

### A. Identity & access

- origin login
- destination login
- supervisor login
- facility scoping

### B. Assessment

- maternal/ANC protocol
- adult/general protocol
- one child/NCD scenario if time allows

### C. Handoff

- create
- send
- receive
- acknowledge
- accept
- cannot accept
- redirect
- arrival
- no-show
- outcome
- close

### D. Offline

- IndexedDB
- local queue
- sync
- basic idempotency

### E. Capability

- facility profile
- capability snapshot
- freshness
- unknown state

### F. Continuity

- return note
- follow-up task
- patient status

### G. Interoperability

- FHIR-aligned export

### H. Quality

- referral ageing
- redirect/no-show/outcome metrics

### I. Communication

- QR
- mock SMS

---

# 60. Demo Acceptance Checklist

Before presenting, all of these should work:

- [ ] Origin login
- [ ] Destination login
- [ ] Facility-scoped access
- [ ] Protocol form
- [ ] Required-field validation
- [ ] Handoff ID
- [ ] Offline creation
- [ ] Sync
- [ ] Destination inbox
- [ ] Acknowledge
- [ ] Accept
- [ ] Cannot Accept + reason
- [ ] Redirect
- [ ] Arrived
- [ ] No-show
- [ ] Return outcome
- [ ] Counter-referral
- [ ] Follow-up task
- [ ] Follow-up completed/overdue
- [ ] Capability freshness
- [ ] Patient status view
- [ ] QR
- [ ] Mock SMS
- [ ] Event timeline
- [ ] Dashboard
- [ ] FHIR-aligned JSON export
- [ ] Failure-path demo
- [ ] Synthetic data
- [ ] Privacy/prototype warning

---

# 61. Final Product Pitch

> **Rural healthcare already has many digital systems, but the patient still has to move physically from one facility to another. During that transition, information can become incomplete, the receiving facility may not be ready, the patient may be redirected, and the outcome may never reach the original health worker.**
>
> **Orion focuses on that transition. An authorised frontline worker performs a short protocol-based assessment and creates a structured digital Handoff. The receiving facility gets the same case, can accept it or redirect it when necessary, and the patient's arrival and outcome are recorded. The outcome comes back to the origin facility, which can continue follow-up. The workflow is designed for unreliable connectivity and can represent the transition using an interoperability-ready data model.**
>
> **Orion does not replace Maharashtra's existing hospital, telemedicine, medicine, emergency, programme, or digital-health systems. It makes the movement of the patient between those systems more organised, visible, and accountable.**

---

# 62. Final Mental Model for the Team

Remember this single sentence:

> **"Existing systems handle individual healthcare activities; Orion connects the care transition between them."**

And remember this workflow:

```text
ASSESS
  ↓
ROUTE
  ↓
HANDOFF
  ↓
ACKNOWLEDGE
  ↓
ACCEPT / REDIRECT
  ↓
ARRIVE
  ↓
CARE
  ↓
OUTCOME
  ↓
COUNTER-REFER
  ↓
FOLLOW-UP
  ↓
CLOSE
```

Everything else should support this loop.

---

# 63. Research Basis and Source Discipline

The product direction in this document is grounded in:

- the SIH 2026 problem statement and expected outcome
- Maharashtra Public Health Department / NHM context
- Maharashtra-specific healthcare infrastructure and digital-health analysis assembled for the team
- official/public-health standards and programme documentation to be independently verified before final presentation claims
- ABDM/FHIR interoperability concepts
- referral, telemedicine, maternal/child/NCD, diagnostics, medicine, emergency, and quality-monitoring evidence

## Important source discipline

The team's Maharashtra research document contains both authoritative and secondary references. Before putting any specific statistic, live system count, API claim, or operational detail into the SIH PPT, independently verify it against the underlying primary source.

In particular, do not state that a live government API is available unless access and authorisation are actually confirmed.

---

# 64. Bottom Line

Orion does **not** need to become a giant healthcare super-app to cover the SIH problem statement.

The solution becomes comprehensive by making the **care episode** complete:

```text
Patient
 ↓
Assessment
 ↓
Triage / urgency
 ↓
Destination capability
 ↓
Digital Handoff
 ↓
Acceptance / Redirect
 ↓
Arrival
 ↓
Teleconsult / Specialist / Diagnostic / Medicine coordination
 ↓
Outcome
 ↓
Counter-referral
 ↓
Follow-up
 ↓
Quality / Accountability
 ↓
Closure
```

Around that core:

```text
Offline-first
Multilingual
Health-literacy support
Role-based access
Audit trail
FHIR-aligned
Existing-system compatible
```

**That is the complete Orion strategy.**
