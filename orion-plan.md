# Orion — Care Access & Referral Coordination

## 1. What are we trying to build?

Orion is a simple care-coordination platform for rural and underserved areas.

The idea is not to build another hospital-management system, telemedicine app, EHR, or AI doctor. A lot of those pieces already exist in the public-health ecosystem.

Our focus is the point where a patient has to move from one health facility to another.

For example:

**AAM / Sub-Centre → PHC → CHC → District Hospital**

At this stage, information can get lost, the receiving facility may not know that the patient is coming, the required service may not be available there, and the original health worker may never get to know what happened after the referral.

Orion is meant to make this transition more organised and trackable.

The core flow is:

```text
Patient assessed at origin facility
        ↓
Short protocol-based assessment
        ↓
Required level of care identified
        ↓
Suitable destination selected
        ↓
Digital referral / Handoff created
        ↓
Receiving facility gets the request
        ↓
Accept / Cannot Accept / Redirect
        ↓
Patient Arrived / No-show
        ↓
Treatment / next action
        ↓
Outcome sent back to origin
        ↓
Follow-up / Close
```

The same referral gets a single ID so that both facilities are talking about the same case instead of relying only on a paper slip or a phone call.

---



## 2. Why does this problem matter?

The problem in rural healthcare is not only that a hospital may be far away.

A patient can still lose time and money even after reaching a health worker if the next step is not coordinated properly.

Some common situations are:

- The referral information is incomplete.
- The patient is sent to a facility that cannot provide the required service.
- The receiving facility is not informed in advance.
- The patient reaches the destination and is redirected again.
- The origin health worker does not know whether the patient actually reached the facility.
- The outcome of the referral does not come back to the original facility.
- Poor internet connectivity makes digital workflows difficult at the point of care.

This can lead to unnecessary travel, delays, repeated explanations, and loss of continuity.

Orion focuses on this specific transition instead of trying to solve every healthcare problem inside one application.

---



## 3. What already exists?

We are not assuming that nothing exists in India.

There are already systems for different parts of healthcare, such as:

- **eSanjeevani** for teleconsultation.
- **ABDM / ABHA** for digital-health identity and interoperability-related infrastructure.
- Programme-specific systems for areas such as maternal and child health or non-communicable diseases.
- Hospital-management systems for registration, encounters and hospital workflows.
- Medicine and inventory systems such as DVDMS.
- Ambulance and emergency transport systems such as 108/102 in relevant states/programmes.

There are also state-level systems where referral workflows are already implemented inside a particular health-system ecosystem.

So our claim is **not**:

> "India does not have digital referral systems."

Our focus is narrower:

> In places where the originating facility and receiving facility do not share the same application or workflow, the patient handoff can still depend heavily on paper, phone calls, and manual coordination.

Orion is designed as a lightweight coordination layer around that transition.

We want to strengthen existing systems, not replace them.

---



## 4. What exactly is the gap we are trying to solve?

The biggest gap we are targeting is **ownership of the referral after it is created**.

A normal paper referral mostly tells us:

> "This patient should go there."

We want the digital workflow to answer more questions:

- Has the referral reached the receiving facility?
- Has someone checked it?
- Can the facility accept the case?
- If not, why not?
- Should the patient be redirected somewhere else?
- Has the patient actually arrived?
- What happened after arrival?
- What should the originating health worker do next?

This turns the referral from a document into a trackable workflow.

---



## 5. The main idea: a shared Handoff

The central object in Orion is a **Handoff**.

A Handoff is a digital referral record shared between the originating and receiving facilities.

It contains the information needed to understand why the patient is being referred and what action is expected from the next facility.

A Handoff has:

- a unique ID
- patient information
- originating facility
- destination facility
- urgency level
- protocol used for assessment
- structured referral information
- destination capability information used at the time of referral
- current status
- event history

The important part is that both sides work on the same Handoff.

The origin creates it.
The receiving facility acts on it.
The outcome comes back through the same object.

---



## 6. Product scope

For the SIH prototype, Orion will stay intentionally small.

We are focusing on five main capabilities.

### 6.1 Protocol-based referral form

Instead of asking a health worker to fill a large medical record, Orion uses a short checklist for the specific referral situation.

The first prototype can start with two workflows:

1. **Maternal / ANC danger-sign referral**
2. **Adult general referral**

The form can capture things such as:

- age
- sex
- main reason for visit
- important danger signs
- vitals, when already available
- what has already been done at the origin facility
- what service is being requested
- whether teleconsultation has already been attempted or booked

The checklist is meant to improve the quality of information being sent.

It is not meant to diagnose the patient.

The triage logic is rule-based and should be based on the selected public-health protocols rather than an LLM making medical decisions.

---



### 6.2 Offline referral creation

Poor connectivity is an important constraint in rural healthcare.

So the origin side should continue to work when internet access is temporarily unavailable.

When the health worker creates a referral:

1. A unique Handoff ID is generated locally.
2. The referral is stored on the device.
3. The user can see the referral immediately.
4. A QR code can be generated locally.
5. A small SMS/reference message can contain the Handoff ID.
6. When the network comes back, the referral is synchronised with the server.

Important point:

**Offline creation does not mean that the receiving facility automatically gets the complete referral while there is no connection.**

The local device first stores the data. The server and receiving facility get the full information after synchronisation.

A simple state can therefore look like:

```text
LOCAL CREATED
    ↓
QUEUED FOR SYNC
    ↓
SERVER RECEIVED
    ↓
DESTINATION ACTION
```

For emergency situations, patient care should never wait for synchronisation. Existing emergency communication and transport procedures can still be used.

---



### 6.3 Receiving facility inbox

The receiving facility gets an inbox of incoming referrals.

The desk should immediately be able to understand:

- who is being referred
- why the patient is being referred
- how urgent the referral is
- where the patient is coming from
- what service is being requested
- how long the referral has been waiting

The main actions are:

#### Accept

The facility can handle the referral and expects to receive the patient.

#### Cannot Accept

The facility cannot handle the referral at that moment.

A reason is mandatory.

Example reasons:

- required specialist not available
- required equipment unavailable
- no appropriate bed
- blood/service unavailable
- wrong level of facility
- other operational reason

We use **Cannot Accept** rather than simply saying "Reject Patient" because the system is not rejecting the person. It is recording that the facility cannot currently take that referral.

#### Redirect

The receiving facility can direct the referral to another appropriate facility.

For the SIH prototype, this can use a small predefined list of facilities.

---



### 6.4 Facility capability information

We do not want Orion to display fake real-time information.

For example, we should not write:

> "Obstetrician available now"

unless we genuinely have a trusted live source for that information.

Instead, the prototype can show information such as:

```text
ObGyn
Last verified: 26 hours ago

Functional OT
Last verified: 3 days ago

Metformin
Stock-out reported: 11 days ago
```

This makes the age of the information visible.

Possible status values:

- verified available + verification time
- verified unavailable + verification time
- unknown

For SIH, these values can come from a fixture/attestation dataset rather than a live government API.

The final decision still remains with the health worker.

Orion should help the health worker make an informed choice; it should not pretend to know the live condition of every facility.

---



### 6.5 Return outcome and follow-up

The referral should not end when the patient reaches the hospital.

After the patient has been treated or assessed, the destination facility can add a short return note.

For example:

```text
Disposition: Treated and sent back
Next action: Continue medicine and review after 14 days
Tests advised: CBC
```

The origin facility can then see this outcome on the same Handoff.

This provides a basic level of continuity without trying to build another full longitudinal EHR.

---



## 7. Users of Orion



### Primary users



#### Origin side

- CHO
- ANM
- Medical Officer
- authorised frontline/primary-care staff at AAM, Sub-Centre or PHC

Their job is to assess the patient, create the referral and track what happens next.

#### Destination side

- referral desk
- registration/emergency/referral nodal staff
- authorised staff at PHC, CHC or District Hospital

Their job is to review incoming referrals and decide whether the facility can accept, redirect or process the case.

### Secondary user

A supervisor can have a simple read-oriented dashboard showing:

- open referrals
- referrals waiting for action
- redirected referrals
- referrals with no arrival update
- referrals waiting for a return note



### Not part of the MVP

We are not making:

- a full citizen healthcare super-app
- a separate ASHA application
- a pharmacy-management application
- a national administration dashboard
- a replacement for existing hospital systems

---



## 8. User experience

We do **not** need two completely separate applications.

Orion can be one product/codebase with role-based screens.

### Origin experience

The origin user sees:

1. My open referrals
2. New referral
3. Protocol selection
4. Short assessment form
5. Destination selection
6. Confirm and create Handoff
7. Handoff timeline
8. Outcome / follow-up



### Destination experience

The receiving user sees:

1. Incoming referrals
2. Referral details
3. Accept / Cannot Accept / Redirect
4. Arrived / No-show
5. Return note

The backend and Handoff object are shared.

For the SIH demo, we can simply use two devices or browser windows with two different roles.

Example:

```text
Laptop 1
CHO / AAM account
       ↓
creates Handoff HF-7K2P
       ↓
Laptop 2
CHC Desk account
       ↓
Accept / Cannot Accept / Redirect
       ↓
Laptop 1 sees updated status
```

---



## 9. Handoff lifecycle

The Handoff follows a simple state machine.

```text
draft
  ↓
sent
  ├── accepted
  ├── cannot_accept
  ├── redirected
  └── expired (optional)

accepted
  ├── arrived
  └── no_show

arrived
  ↓
return_noted
  ↓
closed
```

Every important change creates an event.

An event records:

- who performed the action
- when it happened
- previous state
- new state
- reason, where applicable

Example:

```text
HF-7K2P

10:32  Created by CHO at AAM Rampur
10:33  Sent to CHC Purnia
10:36  Viewed by CHC desk
10:38  Cannot Accept — required specialist unavailable
10:39  Redirected to District Hospital
10:45  Accepted by District Hospital
11:12  Patient Arrived
14:20  Return note added
```

This event history is the main accountability mechanism in the prototype.

---



## 10. Main user flow



### Step 1 — Patient comes to the origin facility

The CHO/ANM/MO assesses the patient using the relevant short form.

### Step 2 — System checks the referral information

If important required fields are missing, the system asks the user to complete them.

For example, a high-risk ANC referral should not be sent with important danger-sign information missing.

The system is checking completeness; it is not making a diagnosis.

### Step 3 — Destination selection

The user sees suitable facilities based on:

- required level of care
- facility type/class
- capability information available in the system
- freshness of that information
- optional distance information in the prototype

The system can suggest a suitable facility class, but the final destination is confirmed by the health worker.

### Step 4 — Create Handoff

The user presses **Send Referral**.

The system generates:

- Handoff ID
- QR code
- local record
- sync status

If the device is offline, the Handoff remains queued locally until synchronisation is possible.

### Step 5 — Receiving facility acts

The destination desk opens the incoming Handoff and chooses:

- Accept
- Cannot Accept
- Redirect



### Step 6 — Patient arrival

After the patient reaches the destination, the desk can mark:

- Arrived
- No-show



### Step 7 — Outcome

After assessment/treatment, the receiving facility adds a short return note.

### Step 8 — Origin gets the update

The origin health worker sees the updated Handoff and can continue the patient's follow-up.

---



## 11. Important failure paths

A good demo should not show only the happy path.

### Failure path 1 — Incomplete high-risk referral

A CHO starts a Red/urgent ANC referral.

Important fields are missing.

The system blocks the send and clearly shows what is missing.

The user completes the required information and continues.

---



### Failure path 2 — Destination cannot accept

The referral reaches the CHC.

The CHC desk checks it and selects:

> Cannot Accept — required specialist unavailable

The action is recorded.

The origin side gets the updated state.

---



### Failure path 3 — Redirect

Instead of ending the workflow, the CHC selects another facility.

Example:

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

The patient therefore gets a new destination without creating an entirely separate referral story.

---



### Failure path 4 — Offline creation

Turn the internet off on the origin device.

The CHO creates the referral.

The app still generates the Handoff ID.

The UI clearly shows:

> Saved offline — waiting for network

When the network is restored, the referral syncs and appears in the destination inbox.

---



### Failure path 5 — Stale capability information

The origin user sees:

```text
Metformin stock status
Last verified: 11 days ago
```

The application does not treat this as live stock data.

The age of the information is visible so that the health worker understands the limitation.

---



## 12. Teleconsultation

Orion does not need to rebuild a video consultation system.

Where an existing teleconsultation pathway such as eSanjeevani is used, Orion can simply store a reference such as:

- teleconsultation requested
- teleconsultation booked
- ticket/reference number

The teleconsultation itself remains with the existing service.

This keeps Orion focused on care coordination instead of duplicating another platform.

---



## 13. Diagnostics and medicines

Diagnostics and medicines are important parts of the overall healthcare journey, but they should not turn Orion into a laboratory-information or inventory-management system.

### Diagnostics

For the SIH prototype, diagnostics can be represented as part of the requested service or as a capability note.

Example:

```text
Requested service: CBC

Facility:
District Hospital

Lab capability:
Last verified 2 days ago
```

The full lab-management workflow remains outside the MVP.

### Medicines

Similarly, Orion should not pretend to replace DVDMS or another inventory platform.

A capability/stock note can be shown when available, together with its verification age.

---



## 14. Appointment and queue management

We should not build a general OPD queue-management system.

The relevant part for Orion is the referral itself.

Once a facility accepts a referral, the receiving team knows that a patient is coming and can prepare for the required service.

A future version could connect this with an existing appointment or queue system, but that is not necessary for the SIH MVP.

---



## 15. Emergency cases

Emergency cases should not depend on a digital workflow being successfully completed.

For the prototype, the Handoff can include a simple field such as:

```text
Urgent transport required: Yes / No
108 reference number: ______
```

We do not need to integrate a real ambulance-dispatch API for the SIH prototype.

The important idea is that Orion supports coordination around the referral while existing emergency channels remain available.

---



## 16. Technology architecture

The architecture should stay small enough to build and demonstrate properly.

### Frontend

- Next.js
- PWA approach
- mobile-first origin interface
- tablet/desktop-friendly destination interface
- Tailwind CSS / shadcn-style UI if desired



### Backend

- Node.js
- Express.js or equivalent REST API
- PostgreSQL
- Drizzle ORM



### Authentication

- Better Auth / role-based authentication for the prototype
- facility-scoped access



### Offline support

- IndexedDB for browser-side local storage
- Service Worker for PWA behaviour
- local event queue
- sync mechanism when network returns



### Interoperability

- FHIR-aligned data model
- JSON export containing relevant resources such as:
  - Patient
  - ServiceRequest
  - Task
  - optional Encounter



### Optional integrations / references

- eSanjeevani reference or ticket field
- QR generation
- mock SMS

The SIH prototype does not need to depend on live government APIs for the core demo.

---



## 17. Offline architecture in more detail

The offline part is one of the important technical parts of the project.

### Local storage

When there is no connection, the origin device stores:

- Handoff draft
- protocol form data
- generated local ID
- pending events

IndexedDB is preferred over simple localStorage for this because we may need more structured data and multiple records, not just a few key-value pairs.

### Service Worker

The service worker helps the PWA continue working reliably and can support caching of the application shell and offline assets.

It is not itself the database.

A simple architecture is:

```text
UI
 ↓
Application logic
 ↓
IndexedDB
 ↓
Offline event queue
 ↓
Sync when network returns
 ↓
Backend API
 ↓
PostgreSQL
```



### Conflict handling

We should avoid simply using last-write-wins for the Handoff state.

Important actions are stored as events.

For example:

```text
created
sent
accepted
arrived
return_noted
closed
```

The current state can then be derived from the valid sequence of events.

For the SIH prototype, conflict rules can remain simple and clearly defined.

---



## 18. Data model

The minimum database can contain the following tables.

### facilities

```text
id
name
tier            // AAM / PHC / CHC / DH
fru              // true / false
block
latitude         // optional
longitude        // optional
```



### capability_snapshots

```text
id
facility_id
service_code
status           // available / unavailable / unknown
attested_at
attested_by
note
```



### actors

```text
id
role             // origin / desk / supervisor
facility_id
display_name
```



### patients

For SIH, use synthetic patients.

```text
id
display_name
age
sex
abha_mock       // optional mock value
```



### handoffs

```text
id
public_code
patient_id
origin_id
destination_id
protocol
urgency
state
packet_json
created_at
updated_at
```



### events

```text
id
handoff_id
type
actor_id
payload_json
created_at
```

This is enough to demonstrate the workflow without creating a huge healthcare database.

---



## 19. Example referral packet

A simplified ANC referral could look like:

```json
{
  "protocol": "anc_danger",
  "gestation_weeks": 34,
  "danger": {
    "bleeding": true,
    "severe_headache": false,
    "convulsion": false,
    "fever": false,
    "reduced_movements": true
  },
  "bp": "150/100",
  "already_done": [
    "first_aid",
    "called_phc"
  ],
  "request": [
    "obgyn_review",
    "possible_admit"
  ],
  "esanjeevani_ticket": null
}
```

This is an example of the kind of structured information that can travel with the referral.

---



## 20. FHIR / ABDM approach

FHIR is used as an interoperability format, not as a marketing label.

For the prototype, Orion can export a Handoff into a FHIR-style JSON structure containing resources such as:

```text
Patient
ServiceRequest
Task
Encounter (optional)
```

Conceptually:

- **ServiceRequest** represents what service/care is being requested.
- **Task** represents the work/status of the referral.
- **Patient** identifies the person.
- **Encounter** can represent the actual care interaction when applicable.

For SIH, we can provide a downloadable JSON file for a Handoff.

We should not claim that the SIH prototype is already a production ABDM-integrated system.

Production ABDM integration would require the relevant standards, security, consent, certification and implementation work.

---



## 21. Security and privacy

Even though this is a prototype, healthcare data should not be handled casually.

For the SIH demo:

- use synthetic patient data
- use role-based logins
- restrict users to their facility scope
- keep the clinical information inside the authenticated application
- do not put medical details in ordinary SMS
- maintain an audit trail of important actions
- show a prototype/not-for-real-patient-use notice

The SMS/QR should mainly provide the Handoff reference ID, not the patient's complete medical information.

---



## 22. What we are deliberately NOT building

Keeping the scope under control is important.

For the SIH prototype, we are **not** building:

- a full EHR
- a complete telemedicine video platform
- an AI doctor
- an autonomous diagnosis system
- a live nationwide medicine-stock platform
- a nationwide live bed-availability platform
- a complete ambulance-dispatch system
- a full ASHA application
- a citizen super-app
- a full laboratory-information system
- a replacement for DVDMS
- a replacement for eSanjeevani
- a replacement for existing HMIS
- production-level ABDM integration
- complex map routing
- a large analytics/AI dashboard

Every feature we include should have a clear connection to the care transition.

---



## 23. Why this approach is practical

A major advantage of this approach is that Orion does not need every government platform to be replaced or rebuilt.

The product can be treated as a coordination layer.

For example:

```text
Existing system       Orion              Existing system

ABHA / ABDM      ←→   Care transition   ←→  HMIS

eSanjeevani      ←→   Handoff           ←→  Hospital workflow

DVDMS            ←→   Capability info   ←→  Medicine system

Programme tools  ←→   Referral context  ←→  Facility care
```

The SIH prototype will use mock/fixture data where live integration is not realistically available.

A future deployment could integrate with the relevant state systems through proper APIs/adapters instead of asking every facility to abandon its existing software.

---



## 24. Future deployment path



### Phase 1 — SIH prototype

Use:

- two roles
- two main facilities
- one additional facility for redirect
- synthetic patients
- offline creation
- destination inbox
- accept/cannot accept/redirect
- arrival/no-show
- return note
- capability freshness
- QR/mock SMS
- FHIR JSON export

No live government API dependency is required for the core demo.

### Phase 2 — Small pilot

A possible pilot corridor could be:

```text
AAM / Sub-Centre
      ↓
PHC
      ↓
CHC
```

The goal would be to test whether the digital Handoff can actually reduce paper/phone dependency and improve acknowledgement and follow-up.

### Phase 3 — Integration

A production deployment could connect Orion with the relevant state HMIS and approved digital-health infrastructure.

At that stage, security, consent, identity, interoperability, hosting, governance and government IT requirements would need to be addressed properly.

---



## 25. How Orion addresses the SIH problem statement


| SIH problem area            | What Orion does                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Long travel                 | Helps avoid unnecessary trips caused by poor referral coordination and an unsuitable first destination      |
| Specialist shortage         | Shows facility/service information with a clear verification time instead of pretending it is live          |
| Irregular diagnostics       | Can carry the required diagnostic/service request and capability information; does not replace a lab system |
| Fragmented records          | Keeps referral information and events together under one Handoff ID                                         |
| Delayed referrals           | Gives the destination an inbox and records the first action taken                                           |
| Limited awareness           | Shows what is known about the destination and how fresh that information is                                 |
| Constrained staff/equipment | Uses short forms and fast accept/cannot accept/redirect actions                                             |
| Poor connectivity           | Supports local referral creation and later synchronisation                                                  |
| Continuity                  | Sends the outcome back through the same Handoff                                                             |
| Quality/accountability      | Stores the event timeline and referral ageing information                                                   |


The important point is that Orion is not claiming to solve every problem independently.

It is concentrating on the transition between levels of care.

---



## 26. Quality and accountability metrics

We do not need a giant hospital analytics system for the prototype.

A simple supervisor view can track:

- referral packet completeness
- time from referral sent to first destination action
- number of Cannot Accept decisions
- reasons for Cannot Accept
- number of redirects
- arrival vs no-show
- time until return note
- age of the capability information used during referral
- number of open referrals waiting for action

These metrics help us understand whether the referral process itself is improving.

---



## 27. Suggested screens



### Origin side



#### Screen 1 — Home

Show:

- Open referrals
- current status
- waiting time
- New Referral button



#### Screen 2 — Select protocol

Cards:

- ANC / Maternal danger signs
- Adult general referral



#### Screen 3 — Referral form

Short checklist with clear required fields.

#### Screen 4 — Choose destination

Show:

- facility name
- facility type
- relevant capability information
- last verified time
- optional distance



#### Screen 5 — Confirmation

Show:

- Handoff ID
- QR
- sync/offline status
- destination



#### Screen 6 — Handoff detail

Show the full timeline and later return note.

### Destination side



#### Screen 1 — Incoming referrals

Sort urgent referrals first.

#### Screen 2 — Referral detail

Actions:

- Accept
- Cannot Accept
- Redirect



#### Screen 3 — Arrival

Mark:

- Arrived
- No-show



#### Screen 4 — Return note

Add:

- disposition
- next action
- medicines/tests advised



#### Screen 5 — Supervisor

Optional simple ageing list.

---



## 28. Demo plan for SIH

The demo should be around the workflow, not around showing a huge number of screens.

### Part 1 — Problem

Start with a patient at an AAM/primary facility who needs higher-level care.

Explain that the problem is not simply creating a referral. The important question is what happens after the referral is created.

### Part 2 — Incomplete referral

Create a high-risk ANC referral with required information missing.

The app blocks the send.

Explain:

> "We are checking whether the receiving facility is getting the information it actually needs."



### Part 3 — Destination information

Show:

```text
ObGyn — last verified 26 hours ago
OT — last verified 3 days ago
```

Explain that Orion shows the age of the information rather than pretending it is live.

### Part 4 — Offline

Turn off internet.

Create the Handoff.

Show:

```text
Handoff: HF-7K2P
Status: Saved offline
```

Turn internet back on.

The Handoff synchronises.

### Part 5 — Cannot Accept

On the CHC desk:

```text
Cannot Accept
Reason: Required specialist unavailable
```



### Part 6 — Redirect

Redirect the Handoff to the District Hospital.

District Hospital accepts it.

Mark patient arrived.

### Part 7 — Outcome

Add a short return note.

Go back to the origin screen.

Show that the origin user now sees the outcome on the same Handoff ID.

### Part 8 — Interoperability

Download the FHIR JSON representation.

Briefly explain which resources are being represented.

### Closing line

> "We are not replacing eSanjeevani, ABDM, HMIS or medicine systems. We are making the movement of the patient between these parts more organised, trackable and accountable."

---



## 29. Demo dataset

For the prototype, keep the dataset small.

### Facilities

- 1 AAM / Sub-Centre
- 1 PHC
- 1 CHC that cannot handle one scenario
- 1 CHC/FRU or District Hospital that can accept the redirected case
- 1 District Hospital



### Capability examples

```text
CHC
ObGyn — available, verified 26h ago
OT — unavailable, verified 3d ago

District Hospital
ObGyn — available, verified 8h ago
OT — available, verified 6h ago
```



### Patients

Use two synthetic demo patients:

1. ANC high-risk case
2. Adult medicine-related case

The second case can be used to demonstrate stale medicine information without claiming live inventory.

---



## 30. Technology summary

```text
Frontend
Next.js + PWA

Offline
IndexedDB + Service Worker

Backend
Node.js + Express

Database
PostgreSQL

ORM
Drizzle

Authentication
Better Auth / role based access

Interoperability
FHIR-aligned JSON export

Communication
QR + mock SMS

Hosting
Vercel (frontend)
Render / similar platform (backend)
```

The exact hosting can be changed later; the product architecture does not depend on one vendor.

---



## 31. Folder / code structure idea

A simple project structure could be:

```text
orion/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── db/
│   ├── shared/
│   └── fhir/
│
├── docs/
│   ├── protocols/
│   └── architecture/
│
└── README.md
```

The important thing is to keep shared Handoff/state logic in one place so that origin and destination screens do not implement contradictory rules.

---



## 32. Development priority

Build in this order:

### Step 1

Authentication + roles + facility scoping

### Step 2

Facilities + capability snapshots

### Step 3

Create Handoff + protocol form

### Step 4

Handoff state machine + event log

### Step 5

Destination inbox

### Step 6

Accept / Cannot Accept / Redirect

### Step 7

Offline queue + IndexedDB

### Step 8

Sync mechanism

### Step 9

Arrival / no-show + return note

### Step 10

QR + mock SMS

### Step 11

FHIR JSON export

### Step 12

Polish the demo and failure paths

Do not spend the first half of the hackathon making a beautiful dashboard before the Handoff workflow works end-to-end.

---



## 33. Product rules we should follow

1. Keep the origin workflow short.
2. Do not ask frontline staff to enter unnecessary data.
3. Never show stale information as live information.
4. Make Cannot Accept and Redirect normal workflow options.
5. Always keep the Handoff ID visible.
6. Keep clinical details out of normal SMS.
7. Use rules for protocol checks, not an LLM diagnosis.
8. Do not make internet connectivity a requirement for creating a referral.
9. Do not duplicate systems that already exist.
10. Every feature should have a clear purpose in the care transition.

---



## 34. What makes Orion different?

The differentiation should not be presented as:

- "India's first referral system"
- "India has no closed-loop referral"
- "ABDM cannot do referrals"
- "FHIR does not support referrals"
- "We have live national facility availability"

Those are too broad and difficult to defend.

Instead, our focus is:

> **A lightweight, offline-friendly, two-sided care-transition workflow that can sit between heterogeneous facilities and keep the referral lifecycle visible from creation to outcome.**

The demo should prove this through the actual workflow:

```text
Create
  ↓
Sync
  ↓
Destination receives
  ↓
Cannot Accept / Redirect
  ↓
Accept
  ↓
Arrive
  ↓
Return outcome
```

---



## 35. Why we should keep the product small

The SIH problem statement is broad enough that it is tempting to add everything:

- AI
- video calls
- maps
- ambulance tracking
- medicine inventory
- lab management
- appointment system
- citizen app
- analytics
- chatbot
- national facility search

That would make the product look bigger but would make the actual solution weaker.

A judge should be able to understand the product in one sentence and see it working in a few minutes.

The core question is:

> **Can Orion make a rural referral easier to create, easier to receive, easier to redirect when necessary, and easier to follow up?**

Everything else is secondary.

---



## 36. Practical limitations

Orion does not solve all healthcare access problems by itself.

For example:

- It cannot create specialists where there are none.
- It cannot create beds or equipment.
- It cannot guarantee that a facility will have stock.
- It cannot replace emergency transport.
- It cannot replace hospital clinical decision-making.
- It cannot replace the state's existing health-information system.

What it can do is make the information and coordination around a referral better.

That distinction is important for both the prototype and a future real deployment.

---



## 37. Future possibilities

Once the core workflow is proven, the platform could be extended with:

- more clinical referral protocols
- stronger multilingual support
- approved ABDM integration
- integration with state HMIS systems
- appointment/queue integration
- diagnostic sample/report tracking
- approved medicine-information integrations
- better supervisor dashboards
- follow-up reminders
- facility-level operational analytics
- integration with existing telemedicine pathways

These are future extensions, not part of the core SIH MVP.

---



## 38. Final product definition



### Product

**Orion — Care Access & Referral Coordination**

### One-line description

> Orion helps frontline health workers coordinate referrals between healthcare facilities by creating a shared digital Handoff, tracking whether the receiving facility can accept the case, following the patient's movement through the referral, and bringing the outcome back to the originating facility — even with unreliable connectivity.



### Core object

**Handoff**

### Core users

**Origin clinician + receiving facility desk**

### Core workflow

```text
Assess
 ↓
Create Handoff
 ↓
Choose destination
 ↓
Send / Save offline
 ↓
Receive
 ↓
Accept / Cannot Accept / Redirect
 ↓
Arrive / No-show
 ↓
Return outcome
 ↓
Follow-up / Close
```



### Core technologies

```text
Next.js
PWA
IndexedDB
Service Worker
Node.js
Express
PostgreSQL
Drizzle
Role-based Auth
FHIR JSON export
QR / mock SMS
```



### What Orion is NOT

```text
Not an EMR
Not a telemedicine replacement
Not an AI doctor
Not a live stock platform
Not an ambulance platform
Not a citizen super-app
Not a replacement for ABDM
Not a replacement for eSanjeevani
Not a replacement for HMIS
```



### The main idea in one sentence

> **Existing health systems already handle many individual parts of care; Orion focuses on making the transition between those parts more organised, visible and accountable.**

---



## 39. SIH MVP checklist

Before the demo, these should work end-to-end:

- [ ] Origin login
- [ ] Destination login
- [ ] Facility-scoped access
- [ ] ANC referral form
- [ ] Adult referral form
- [ ] Red/incomplete referral gate
- [ ] Handoff ID generation
- [ ] Offline creation
- [ ] Local queue
- [ ] Sync after network returns
- [ ] Destination inbox
- [ ] Accept
- [ ] Cannot Accept + reason
- [ ] Redirect
- [ ] Arrived
- [ ] No-show
- [ ] Return note
- [ ] Origin sees returned outcome
- [ ] Capability freshness information
- [ ] QR code
- [ ] Mock SMS
- [ ] FHIR JSON export
- [ ] Event timeline
- [ ] Failure-path demo
- [ ] Synthetic patient data
- [ ] Prototype/privacy warning

---



## 40. Final pitch

> Rural healthcare already has many digital systems, but the patient still has to move physically from one facility to another. During that transition, the referral can become incomplete, the receiving facility may not be ready, and the outcome may never reach the original health worker.
>
> Orion focuses on that transition. A frontline health worker creates a structured referral, the receiving facility gets the same Handoff, can accept it or redirect it when necessary, the patient's arrival and outcome are recorded, and the information comes back to the origin facility. The workflow is designed to work even when the originating facility has poor connectivity.
>
> We are not trying to replace existing government systems. We are trying to make the handoff between them more organised and trackable.

