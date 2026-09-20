# Orion — SIH Demo Script (MVP)

> One coherent synthetic Central State journey. No live government data. No live APIs.
> Fallback: `pnpm demo:reset` (pre-baked mid-journey seed) + recorded video + screenshots.

## Scenario

**Anita Devi (synthetic demo patient)**, 26, 34 weeks pregnant, presents at
**AAM Rampur** (Central district) with severe headache and blurred vision.
Demo corridor: AAM Rampur → PHC Beta → CHC North Block → District Hospital Central.

Cast: CHO (origin) · CHC referral desk · DH referral desk · Supervisor (DHO).

## Scenes

### Scene 1 — Login & role-based entry
- Screen: `/login` (quick-demo account buttons).
- Judge learns: authenticated, role-scoped staff portal.
- Backend: Better Auth session; role stored on user record.

### Scene 2 — Protocol assessment, incomplete referral blocked
- Screen: origin `/app/new` wizard → ANC Danger Signs protocol.
- Action: toggle "Severe Headache / Blurred Vision"; try to proceed — blocked, BP missing.
- Complete BP → live triage computes **Orange urgency**.
- Judge learns: protocol-assisted completeness; deterministic rules; **no AI diagnosis**.

### Scene 3 — Capability-aware destination selection
- Screen: destination picker.
- CHC North Block: Obstetrics VERIFIED_AVAILABLE (verified yesterday), OT VERIFIED_UNAVAILABLE.
- DH Central: Obstetrics + OT VERIFIED_AVAILABLE (verified today).
- Action: CHO chooses CHC first (closer). **Human confirms — no auto-routing.**
- Judge learns: capability + freshness labels; stale data is visibly stale.

### Scene 4 — Offline handoff creation
- Action: airplane mode ON → Dispatch Handoff.
- Screen: "Saved offline — will send when network returns." Sync badge: pending.
- Judge learns: offline-first; referral creation never depends on connectivity.
- DB: IndexedDB localHandoffs + mutationQueue only (no server row yet).

### Scene 5 — Sync on reconnect
- Action: airplane mode OFF → queue flushes (idempotent).
- Result: Handoff gets public code; origin timeline gains `handoff_sent`;
  CHC inbox shows the incoming referral. Outbox logs a mock SMS (Handoff ID only, no PHI).
- Judge learns: reliable sync, duplicate-safe.

### Scene 6 — Destination Cannot Accept → Redirect
- Screen: CHC desk `/destination` inbox → detail.
- Actions: Acknowledge → **Cannot Accept** (reason required: "specialist unavailable")
  → **Redirect** to DH Central (same Care Episode, redirect count 1).
- Judge learns: receiving facility is an active participant; redirect preserves history.

### Scene 7 — Accept → Arrival → Care → Outcome
- Screen: DH desk.
- Actions: Accept (expected arrival window) → Mark Arrived → Start Care →
  Record Outcome (disposition: treated & returned; BP monitoring advice; follow-up 14 days).
- Backend: outcome transaction auto-creates the follow-up task.
- Judge learns: the loop has a return direction.

### Scene 8 — Counter-referral & follow-up at origin
- Screen: CHO origin app — handoff timeline shows full history; follow-up worklist
  shows the 14-day task. Complete it → Close Episode.
- Judge learns: the referral loop is closed; nothing is lost.

### Scene 9 — Supervisor dashboard
- Screen: `/supervisor`.
- Shows: referral ageing, accept/cannot-accept/redirect counts, redirect-reason
  breakdown, no-show rate, outcome-return rate, follow-up completion, capability staleness.
- Judge learns: operational accountability without a giant analytics product.

### Scene 10 — FHIR-aligned export
- Screen: handoff detail → "FHIR JSON".
- Shows: FHIR-aligned bundle (ServiceRequest + EpisodeOfCare + Encounter + Task).
- Closing line: **"We complement Central State's existing telemedicine, hospital, medicine,
  emergency and digital-health systems — Orion makes the movement of the patient
  between them organised, visible and accountable."**

## Fallback path (network/backend failure)

1. `pnpm demo:reset` restores a deterministic pre-baked state at any scene boundary.
2. If the API is unreachable: the offline scene (4–5) still works live — it needs no network.
3. Recorded video + annotated screenshots mirror every scene as a last resort.
