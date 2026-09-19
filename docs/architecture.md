# Orion — Target Architecture (MVP → Final)

> Source of truth for WHAT the product is: `orion-plan-updated.md` (product plan).
> Source of truth for HOW we build it: `implementation-plan.md` (approved roadmap).
> This document describes the agreed technical shape both stages share.

## 1. High-level shape — modular monolith (no microservices)

```
┌──────────────────────────────────────────────────────────────┐
│                    apps/web (Next.js PWA)                    │
│  Origin app (mobile-first) │ Destination desk │ Supervisor   │
│  Offline layer: Dexie (IndexedDB) + mutation queue + sync    │
│  engine + connectivity monitor + TanStack Query cache        │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTPS / JSON (Better Auth cookie session)
┌──────────────▼───────────────────────────────────────────────┐
│                apps/api (Express 5 modular monolith)         │
│  modules: auth │ patients │ facilities │ episodes │ handoffs │
│           follow-ups │ dashboard │ sync │ fhir-export        │
│  cross-cutting: requireAuth → requireRole → facilityScope    │
│                 → zod validation → service → domain rules    │
├──────────────────────────────────────────────────────────────┤
│  @orion/domain (state machine, guards)  @orion/protocols     │
│  (triage engine)  @orion/shared (DTOs, roles, permissions)   │
│  @orion/fhir (Orion → FHIR-aligned mapper, export only)      │
├──────────────────────────────────────────────────────────────┤
│  @orion/db (Drizzle) → PostgreSQL 16                         │
└──────────────────────────────────────────────────────────────┘
   outbox worker → mock SMS/notification sink (MVP)
   [FUTURE] adapter seam → ABDM / state HMIS / eSanjeevani refs
```

## 2. Binding architectural decisions

1. **Modular monolith.** Small team, SIH timeline, single tightly-coupled aggregate (Handoff).
   Module boundaries (`modules/<domain>/{routes,service}`) preserve a future split path.
2. **Domain rules live in `@orion/domain`, not in routes or React.** State transitions and
   triage are enforced identically on the server (authority) and client (UX preview).
3. **Event-sourced history, state-machine current state.** `handoffs.state` is the current
   pointer; `handoff_events` is the immutable, append-only truth. Every transition is one
   DB transaction: update state + insert event + enqueue outbox job.
4. **The server is the only authority on transitions.** Clients propose transitions
   (carrying `clientEventId`); the server validates against current state + role +
   facility scope. This is what makes offline sync safe.
5. **Offline = client-side write-behind queue, not CRDTs.** A handoff is acted on by one
   facility at a time, so server-validation + explicit conflict surfacing is sufficient.
6. **Never claim live data.** Capability info is stored as attested snapshots;
   STALE is derived from freshness windows. No "live availability" without an approved source.
7. **Emergency care never waits on software.** The digital record can sync later.

## 3. Handoff state machine (12 states, backend-enforced)

```
draft → sent → acknowledged → accepted → arrived → in_care
                     │   │        │                  ↓
                     │   │        └→ no_show        outcome_recorded
                     │   │             │                 ↓
                     │   │             └→ closed    follow_up_pending → closed
                     │   └→ cannot_accept ─→ redirected → sent (new destination leg)
                     │            └→ closed
                     └→ (same three actions)
```

- `cannot_accept` **requires a reason** (enum + optional note).
- `redirect` keeps the same Care Episode and handoff history; `redirectCount` capped at 3.
- `outcome_recorded` auto-creates the follow-up task in the same transaction.
- Invalid transition → `409 INVALID_TRANSITION` with `{currentState, validNextStates}`;
  no state change, no event written.

## 4. Database (PostgreSQL via Drizzle)

Server tables: `users/sessions/accounts/verifications` (Better Auth), `organizations`,
`facilities`, `patients` (synthetic), `protocols`, `care_episodes`, `assessments`,
`handoffs`, `handoff_events`, `capability_snapshots`, `outcomes`, `follow_ups`,
`outbox_jobs`. Stage 2 adds `diagnostic_requests`, `notifications`.

Client (IndexedDB via Dexie, never localStorage): `localHandoffs`, `localPatients`,
`mutationQueue`, `referenceCache` (facilities/capabilities/protocols mirror), `syncMeta`.

## 5. AuthN / AuthZ

- **Authentication:** Better Auth email+password, httpOnly cookie session (existing).
- **Authorization:** `requireRole(...)` + service-layer scope assertions
  (`assertPartyToHandoff`, `assertCurrentDestination`, `assertResponsibleFacility`).
  Facility scope is always derived from the session, never from the request body.
- Roles: `origin`, `destination`, `supervisor`, `admin`.

## 6. Offline / sync contract

Mutation queue entries carry `idempotencyKey` (creation) or `clientEventId`
(transitions). Server replays are safe via unique constraints + payload-hash identity.
Sync flush = `POST /api/v1/sync/batch`; catch-up = `GET /api/v1/sync/pull?since=`.
Conflicts resolve **server-wins**, surfaced to the user, never silently dropped.
MVP scope: offline covers origin-side handoff *creation*; destination actions are online-only.

## 7. Interoperability boundary

1. Orion internal model (DB tables).
2. FHIR-aligned representation via `@orion/fhir` mapper.
3. FHIR export = `GET /api/v1/handoffs/:id/fhir` (JSON bundle).
4. Actual interoperability: none claimed in MVP.
5. ABDM / state integrations: [FUTURE/EXTERNAL], adapter seam only, gated on approval.

## 8. Security baseline (MVP)

helmet, strict CORS origin, zod on every input, facility isolation enforced + tested
in the service layer, secrets via env only (`.env*` gitignored), no clinical detail in
SMS/outbox payloads, public status endpoint exposes non-clinical fields only, synthetic
patient data only for SIH.

