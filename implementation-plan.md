Repository inspection is complete. I've read every schema file, the domain state machine, triage engine, all API modules/routes/services, the seed script, all frontend pages/layouts/providers, tests, and config. Below is the complete, implementation-ready roadmap. **No files were modified.**

---

# ORION — IMPLEMENTATION & ARCHITECTURE ROADMAP

---

## PART A — CURRENT REPOSITORY AUDIT

### A.1 CURRENT STATE SUMMARY

**Stack (confirmed from `package.json` files, configs, and source):**

| Layer | Current |
|---|---|
| Monorepo | pnpm 9 workspaces + Turborepo |
| API | Express 5, Better Auth 1.7 (email/password, cookie sessions), Drizzle ORM, PostgreSQL 16 (docker-compose), zod, helmet, cors, vitest + supertest |
| Web | Next.js 16 (App Router), React 19, shadcn/ui (full Radix set), Tailwind 4, TanStack Query, react-hook-form, better-auth/react client |
| Shared packages | `@orion/db` (schema+client), `@orion/domain` (state machine), `@orion/protocols` (triage engine + 2 protocols), `@orion/shared` (roles), `@orion/fhir` (placeholder), `@orion/config` (placeholder), `@orion/logger` (winston) |

**What exists and works (inferred from code + tests):**
- Auth: Better Auth email/password, sessions, `requireAuth` / `requireRole` middleware, 3 roles (`origin`, `destination`, `supervisor`), `users.role` + `users.facilityId` as Better Auth additional fields. Auth tests exist.
- DB schema: `organizations`, `facilities`, `patients`, `protocols`, `capabilities`, `handoffs`, `handoff_events`, `outbox_jobs`, Better Auth tables. One migration generated.
- Handoff creation: `POST /api/v1/handoffs` with idempotency key + payload-hash conflict detection, server-side protocol re-validation via `evaluateProtocol`, transactional handoff + event + outbox job insert, unique `public_code` with collision retry. Idempotency test exists.
- Read APIs: facility-scoped handoff list/detail+events, facilities list, per-facility latest capabilities, facility-scoped patients.
- Domain: `TRANSITIONS` state machine with `assertTransition`, `canTransition`, `getValidNextStates` + unit tests. Triage engine with urgency rules + completeness rules + tests.
- Frontend: login with role-based redirect; origin app (`/app`) with referral list, 5-step create wizard (patient → protocol → form with live triage → destination with capability freshness → confirm with idempotency key), handoff detail with event timeline. `/inbox` and `/supervisor` are **placeholder shells** (session card + "coming in Phase X" note). `/` is a 1430-line hardcoded marketing page.
- Seed: org + 5 facilities + 5 users + 25 capability rows + 2 synthetic patients. **Seeds "Bihar Health System" / Purnia — contradicts the Maharashtra source-of-truth and must change.**

**Critical gaps vs the product plan:**
1. **No destination-side workflow at all.** The state machine defines accept/cannot_accept/redirect/arrived/no_show/return_noted/closed, but **no API endpoint performs any transition after creation**. The entire second half of the loop (the product's core differentiator) is unimplemented.
2. **No Care Episode entity.** Handoffs exist with no episode wrapper; counter-referral chaining is impossible in the current schema.
3. **No Assessment entity.** Assessment answers are buried in `handoffs.packetJson` — not queryable, not reusable for counter-referrals.
4. **No Outcome/ReturnNote entity, no FollowUp entity, no notifications, no supervisor metrics API, no diagnostics, no QR.**
5. **No offline layer.** Zero IndexedDB, zero mutation queue, zero sync, zero connectivity handling. `confirm/page.tsx` even imports Node's `crypto` inside a client component (bundling bug; must use `crypto.randomUUID()` global).
6. **State machine drift from plan:** missing `acknowledged`, `in_care`, `outcome_recorded`, `follow_up_pending`; `return_noted` should become `outcome_recorded`. (Justified modification — see §13.)
7. **Patient visibility bug-by-design:** `getPatientByIdAndFacility` restricts to the *creating* facility, so the destination facility cannot read the patient referenced by a handoff it received. Authorization must be episode/handoff-scoped, not creator-scoped.
8. **`users.facilityId` is `text`, not a `uuid` FK** to `facilities` — no referential integrity, no join.
9. **Capability model** uses `available|unavailable|unknown` with no staleness computation; plan requires `VERIFIED_AVAILABLE | VERIFIED_UNAVAILABLE | STALE | UNKNOWN` with freshness windows.
10. **Landing page overclaims:** `/` shows fake live audit logs, "HMAC-SHA256 SIGNED" QR, "Auto-escalated by System Routing Protocol" — features that don't exist. Rule 12/39 violation risk for the demo.
11. **No role guard on handoff mutations beyond create** (because they don't exist); no supervisor-scoped queries; no `acknowledge` flow; no redirect loop protection beyond a counter column that is never written.
12. `packages/database/schema/index.ts` and `src/schema/index.ts` duplicate each other (drift risk); `apps/api/src/env.ts` is a dead legacy alias; `@orion/config` and `@orion/fhir` are empty placeholders.
13. Tests require a live seeded DB (no test DB isolation) — will block CI.

### A.2 CURRENT → TARGET MIGRATION MAP

| Current Path | Responsibility | Target Path | Action | Reason |
|---|---|---|---|---|
| `packages/database/src/schema/better-auth.ts` | Auth tables | same | MODIFY | `users.facilityId` → uuid FK to `facilities`; add `designation` |
| `packages/database/src/schema/facilities.ts` | Facility registry | same | MODIFY | add `type`, `level`, `phone`, referral-constraint fields |
| `packages/database/src/schema/patients.ts` | Synthetic patients | same | MODIFY | add `isSynthetic` flag, year-of-birth, contact (mock) |
| `packages/database/src/schema/handoffs.ts` | Handoff | same | MODIFY | add `careEpisodeId` FK, `assessmentId` FK, `urgency` already there, state enum extended, `redirectReason`, `closedAt` |
| `packages/database/src/schema/handoff-events.ts` | Event log | same | MODIFY | add `facilityId`, `reason`, actor role snapshot |
| `packages/database/src/schema/capabilities.ts` | Capability attestations | `capability_snapshots.ts` | RENAME + MODIFY | 4-state status, `source`, `validUntil`/freshness policy |
| `packages/database/src/schema/protocols.ts` | Protocol registry | same | KEEP | code-driven registry matches triage engine |
| `packages/database/src/schema/outbox-jobs.ts` | Mock notification queue | same | KEEP | add worker that drains it |
| `packages/database/src/schema/organizations.ts` | Org | same | KEEP | |
| — | Care episodes | `schema/care-episodes.ts` | CREATE | Core model from plan §4 |
| — | Assessments | `schema/assessments.ts` | CREATE | Separate from packetJson |
| — | Outcomes / return notes | `schema/outcomes.ts` | CREATE | Counter-referral payload |
| — | Follow-ups | `schema/follow-ups.ts` | CREATE | Due dates, status, escalation |
| — | Redirects (normalized) | inside `handoff_events` payload | KEEP (payload) | Redirect history already event-sourced |
| `packages/database/schema/index.ts` | Duplicate barrel | — | DELETE | Duplicates `src/schema/index.ts` |
| `packages/domain/src/handoff-state-machine.ts` | Transitions | same | MODIFY | add acknowledged/in_care/outcome_recorded/follow_up_pending; actor-role guards per transition |
| `packages/domain/src/handoff.types.ts` | State/event enums | same | MODIFY | new states, event types, follow-up statuses, capability statuses |
| `packages/protocols/src/*` | Triage engine + 2 protocols | same | KEEP + EXTEND | add `child_danger`, `ncd_htn` later (Stage 1 late / Stage 2) |
| `packages/shared/src/index.ts` | Roles | same | MODIFY | add `admin`, permission constants, API DTO types |
| `packages/fhir/src/index.ts` | Placeholder | same | MODIFY (MVP Phase 9) | FHIR-aligned export mapper (not full interop) |
| `packages/config/src/index.ts` | Empty placeholder | — | DELETE (or DECISION REQUIRED) | Unused; config lives in `apps/api/src/lib/config.ts` |
| `apps/api/src/modules/auth/*` | Auth mw + test routes | `modules/auth/` | KEEP + MODIFY | drop `*-test` routes once real guards exist; add facility-scope helper `assertFacilityAccess` |
| `apps/api/src/modules/handoffs/*` | Create/list/detail | same | MODIFY | split: `handoffs.routes.ts` (thin) + `handoffs.service.ts` + new `handoffs.transitions.ts` (accept/reject/redirect/arrive/no-show/outcome/acknowledge) |
| `apps/api/src/modules/patients/*` | Patient CRUD | same | MODIFY | fix access rule: visible if created by facility OR facility is party to a handoff for the patient |
| `apps/api/src/modules/facilities/*` | Facility/capability reads | same | MODIFY | add capability attestation POST (destination/supervisor), freshness derivation |
| — | Care episodes | `modules/episodes/*` | CREATE | episode detail = handoffs + events + outcomes + follow-ups |
| — | Follow-ups | `modules/follow-ups/*` | CREATE | |
| — | Supervisor metrics | `modules/dashboard/*` | CREATE | |
| — | Sync endpoint | `modules/sync/*` | CREATE | batch mutation intake w/ idempotency |
| — | Outbox worker | `src/workers/outbox.worker.ts` | CREATE | drains mock SMS/notification jobs |
| `apps/api/src/env.ts` | Legacy alias | — | DELETE | dead code |
| `apps/api/scripts/seed.ts` | Seed | same | REWRITE | Maharashtra synthetic corridor (AAM→PHC→CHC→DH), Marathi-named synthetic personas, stale-capability fixtures |
| `apps/web/app/page.tsx` | Marketing landing | same | MODIFY | strip fake "live" audit log / HMAC claims, or clearly label as illustrative — DECISION REQUIRED on keeping vs replacing with simple entry page |
| `apps/web/app/login/page.tsx` | Login | same | KEEP | works; add facility name display |
| `apps/web/app/app/*` (origin) | Origin workspace | same | MODIFY | wire follow-up tasks, outcome view, sync status |
| `apps/web/app/app/new/*` | Create wizard | same | REFACTOR | draft state → IndexedDB-backed draft (Dexie), not React-context-only; fix `crypto` import bug |
| `apps/web/app/inbox/page.tsx` | Destination placeholder | `app/destination/*` | REWRITE | full inbox, detail, accept/cannot-accept/redirect, arrival, outcome forms |
| `apps/web/app/supervisor/page.tsx` | Supervisor placeholder | same | REWRITE | real metrics from dashboard API |
| `apps/web/components/ui/*` | shadcn set | same | KEEP | |
| `apps/web/components/providers/query-provider.tsx` | React Query | same | MODIFY | persistence + offline-aware retry config |
| — | Offline layer | `apps/web/lib/offline/*` (Dexie db, queue, sync engine) | CREATE | core MVP requirement |
| — | API client | `apps/web/lib/api/client.ts` | CREATE | replaces scattered raw `fetch` calls |
| `apps/api/test/*` | API tests | same | MODIFY | add test-DB lifecycle; add transition/RBAC/isolation suites |
| `docker-compose.yml` | Postgres | same | KEEP | |

---

## PART B — TARGET ARCHITECTURE

### B.1 High-level architecture (modular monolith — deliberately NOT microservices)

```
┌────────────────────────────────────────────────────────────────┐
│                     apps/web (Next.js PWA)                     │
│  Origin app (mobile-first) │ Destination desk │ Supervisor     │
│  ────────────────────────────────────────────────────────────  │
│  Offline layer: Dexie (IndexedDB) + mutation queue + sync      │
│  engine + connectivity monitor + React Query cache             │
└──────────────┬─────────────────────────────────────────────────┘
               │ HTTPS / JSON (cookie session)
┌──────────────▼─────────────────────────────────────────────────┐
│                  apps/api (Express 5 modular monolith)         │
│  modules: auth │ patients │ facilities │ episodes │ handoffs   │
│           follow-ups │ dashboard │ sync │ fhir-export          │
│  cross-cutting: requireAuth → requireRole → facilityScope      │
│                 → zod validation → service → domain rules      │
├────────────────────────────────────────────────────────────────┤
│  @orion/domain (state machine, guards)   @orion/protocols      │
│  (triage)   @orion/shared (DTOs, roles)  @orion/fhir (mapper)  │
├────────────────────────────────────────────────────────────────┤
│  @orion/db (Drizzle) → PostgreSQL                              │
│  tables: users/facilities/patients/care_episodes/assessments/  │
│  handoffs/handoff_events/capability_snapshots/outcomes/        │
│  follow_ups/outbox_jobs                                        │
└────────────────────────────────────────────────────────────────┘
   outbox worker → mock SMS/notification sink (Stage 1)
   FHIR-aligned JSON export endpoint (Stage 1 late)
   [FUTURE] adapter seam → ABDM / state HMIS / eSanjeevani refs
```

**Key decisions and why:**
- **Modular monolith**: team is small, SIH timeline is short, domain is tightly coupled around one aggregate (Handoff). Microservices would add deployment/observability cost with zero demo value. Module boundaries (`modules/<domain>/{routes,service}`) keep a future split possible.
- **Domain rules in `@orion/domain`, not in routes or React**: state transitions and triage must be enforced identically on server (authority) and client (UX preview). Already the repo's pattern — keep and extend it.
- **Event-sourced history, state-machine current state**: `handoffs.state` is the current pointer; `handoff_events` is the immutable truth. Every transition = one transaction {update state, insert event, enqueue outbox job}. Already half-built — complete it.
- **Server is the only authority on transitions.** Clients *propose* transitions (with `clientEventId`); server validates against current state + role + facility scope. This is what makes offline sync safe.
- **Offline = client-side write-behind queue**, not CRDTs. The domain is low-contention (a handoff is acted on by one facility at a time), so last-writer-wins-with-server-validation + explicit conflict surfacing is sufficient and demonstrable.

### B.2 Target folder structure

```
orion/
├── apps/
│   ├── api/                          # Express modular monolith
│   │   ├── src/
│   │   │   ├── app.ts  server.ts  index.ts
│   │   │   ├── lib/                  # config, db, auth, logger
│   │   │   ├── middleware/           # request-id, error, not-found
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # requireAuth, requireRole, scope helpers
│   │   │   │   ├── patients/         # routes, service, schemas
│   │   │   │   ├── facilities/       # + capability attestation
│   │   │   │   ├── episodes/         # care episode aggregate reads
│   │   │   │   ├── handoffs/         # routes, service, transitions.ts, schemas.ts
│   │   │   │   ├── follow-ups/
│   │   │   │   ├── dashboard/        # supervisor metrics
│   │   │   │   ├── sync/             # POST /sync/batch
│   │   │   │   └── fhir/             # GET /handoffs/:id/fhir
│   │   │   └── workers/outbox.worker.ts
│   │   ├── scripts/seed.ts           # Maharashtra corridor
│   │   └── test/                     # supertest suites w/ test-db setup
│   └── web/                          # Next.js PWA
│       ├── app/
│       │   ├── page.tsx              # landing (de-hyped)
│       │   ├── login/
│       │   ├── app/                  # ORIGIN workspace (mobile-first)
│       │   │   ├── page.tsx          # home: open handoffs + follow-ups due
│       │   │   ├── new/              # wizard: patient→protocol→form→destination→confirm
│       │   │   ├── handoff/[id]/     # detail + timeline + sync badge
│       │   │   ├── follow-ups/
│       │   │   └── episode/[id]/
│       │   ├── destination/          # DESTINATION desk (tablet/desktop)
│       │   │   ├── page.tsx          # inbox (urgency/age sort)
│       │   │   └── handoff/[id]/     # accept / cannot-accept / redirect / arrive / outcome
│       │   ├── supervisor/           # dashboard
│       │   └── status/[code]/        # patient/caregiver read-only status by public code
│       ├── components/
│       │   ├── ui/                   # shadcn (keep)
│       │   ├── handoff/              # state badge, timeline, action buttons
│       │   ├── capability/           # freshness badge, capability list
│       │   └── offline/              # sync status pill, offline banner
│       ├── lib/
│       │   ├── api/client.ts         # typed fetch wrapper
│       │   ├── auth/auth-client.ts
│       │   └── offline/
│       │       ├── db.ts             # Dexie schema
│       │       ├── queue.ts          # mutation queue
│       │       ├── sync-engine.ts    # push/pull, retry, reconcile
│       │       └── connectivity.ts
│       └── hooks/                    # useHandoffs, useSyncStatus, useOnline
├── packages/
│   ├── database/  (drizzle schema + migrations + client)
│   ├── domain/    (state machine, transition guards, event types)
│   ├── protocols/ (protocol defs + triage engine)
│   ├── shared/    (roles, permissions, API DTOs, constants)
│   ├── fhir/      (Orion→FHIR-aligned mapper)
│   ├── logger/    (winston)
│   ├── eslint-config/  typescript-config/
├── docker-compose.yml  turbo.json  pnpm-workspace.yaml
```

`@orion/config` → **DELETE** (unused placeholder). **DECISION REQUIRED — VERIFY BEFORE REMOVING**: confirm no planned use; nothing imports it today.

### B.3 Database design (target)

**SERVER DATA (PostgreSQL, Drizzle):**

| Table | Purpose | Key fields (type) | Constraints / indexes |
|---|---|---|---|
| `users` (better-auth) | staff identity | id uuid PK, name, email uniq, role text enum(`origin,destination,supervisor,admin`), **facilityId uuid FK→facilities (nullable for supervisor)**, designation text | idx(facilityId) |
| `sessions/accounts/verifications` | better-auth | — | keep |
| `organizations` | health system | id, name, type | keep |
| `facilities` | facility registry | id uuid PK, orgId FK, name, type text, tier enum(`aam,sub_centre,phc,chc,rh,sdh,dh,medical_college`), isFru bool, block/district/state, lat/lng | idx(tier), idx(district) |
| `patients` | synthetic patients | id uuid PK, displayName, ageYears int, sex enum, abhaMock text (demo only), isSynthetic bool default true, createdByFacilityId FK, createdAt | idx(createdByFacilityId); **access via episode participation, not just creator** |
| `protocols` | protocol registry | code text PK, name, version, schemaJson, isActive | keep |
| `care_episodes` | journey wrapper | id uuid PK, publicCode uniq (`CE-XXXX`), patientId FK, openedByFacilityId FK, status enum(`open,closed`), openedAt, closedAt, closeReason | idx(patientId), idx(status) |
| `assessments` | protocol assessment | id uuid PK, episodeId FK, protocolCode FK, answersJson jsonb, triageJson jsonb (urgency, matched_rules, missing), assessedBy FK users, createdAt | idx(episodeId) |
| `handoffs` | central object | id uuid PK, publicCode uniq, **episodeId FK**, **assessmentId FK**, patientId FK, originFacilityId FK, destinationFacilityId FK, currentDestinationFacilityId FK, protocolCode FK, urgency enum, state enum(12 states), requestedServices text[], packetJson jsonb (clinical summary snapshot), reasonForReferral text, transportRequired bool, transportRef text, teleconsultRef text, expectedArrivalAt timestamptz, idempotencyKey uniq, redirectCount int, clientCreatedAt timestamptz (offline truth), syncedAt, createdAt, updatedAt, closedAt | uniq(publicCode), uniq(idempotencyKey), idx(currentDest,state,createdAt), idx(origin,createdAt), idx(episodeId) |
| `handoff_events` | immutable audit | id uuid PK, eventSeq bigserial uniq, handoffId FK, episodeId FK, eventType text, prevState, nextState, actorId FK, actorRole text, facilityId FK, reason text, payload jsonb, clientEventId, createdAt | partial uniq(clientEventId), idx(handoffId,eventSeq) |
| `capability_snapshots` | attested capability | id uuid PK, facilityId FK, serviceCode text, status enum(`verified_available,verified_unavailable,unknown`), source enum(`attestation,fixture,api`), attestedBy FK, attestedAt, note | idx(facilityId,serviceCode,attestedAt desc). **STALE is derived, never stored** |
| `outcomes` (return notes) | counter-referral content | id uuid PK, handoffId FK uniq, episodeId FK, disposition enum(`treated_returned,admitted,referred_on,deceased,other`), summary text, testsAdvised text[], adviceSummary text, followUpDueAt timestamptz, followUpFacilityId FK, recordedBy FK, createdAt | idx(episodeId) |
| `follow_ups` | follow-up tasks | id uuid PK, episodeId FK, handoffId FK, facilityId FK (responsible), assignedRole text, task text, dueAt, status enum(`pending,completed,missed,escalated`), completedAt, completedBy FK, idempotencyKey uniq | idx(facilityId,status,dueAt), idx(episodeId) |
| `outbox_jobs` | notification queue | keep + add `dedupeKey` | idx(status,runAfter) |
| `diagnostic_requests` | **[FINAL]** | id, episodeId, handoffId, serviceCode, status, resultRef | Stage 2 |
| `notifications` | **[FINAL]** in-app | id, userId/facilityId, type, payload, readAt | Stage 2 |

**LOCAL OFFLINE DATA (IndexedDB via Dexie — never localStorage):** `localHandoffs` (full draft + `localId` + `syncStatus: pending|syncing|synced|failed|conflict`), `localPatients`, `mutationQueue` (ordered: `clientMutationId`, `type`, `payload`, `attempts`, `lastError`, `createdAt`), `referenceCache` (facilities, capability snapshots, protocols — read-only mirror with `cachedAt`), `syncMeta` (lastPullAt, cursors).

**SYNC QUEUE DATA** = `mutationQueue` rows → each maps to one idempotent API call carrying `idempotencyKey`/`clientEventId`.
**EVENT DATA** = `handoff_events` (server) — clients never mutate it directly; transitions generate events server-side.
**DERIVED/DASHBOARD DATA** = SQL aggregation queries in Phase 9; materialized views only if needed later (**[FINAL]**).

### B.4 Handoff state machine (target — backend enforced)

States: `draft → sent → acknowledged → {accepted | cannot_accept | redirected} ; accepted → {arrived | no_show} ; arrived → in_care → outcome_recorded → follow_up_pending → closed ; cannot_accept → {redirected | closed} ; redirected → sent (new destination) ; no_show → closed ; (+ expired — DEFERRED to Stage 2)`

**Justified modifications vs current repo:** add `acknowledged` (destination "seen it" — plan §6 lists it; gives ageing metric a baseline), `in_care` (arrival ≠ care started; plan §13 of your prompt lists it), rename `return_noted`→`outcome_recorded` (clearer, matches plan), add `follow_up_pending` (makes "origin must act" queryable). Drop nothing.

| Transition | Actor role | Facility scope | Preconditions / required fields | Validation | Event | UI action |
|---|---|---|---|---|---|---|
| draft→sent | origin | origin facility | assessment complete (server re-runs triage), destination set | triage can_submit; destination ≠ origin; capability snapshot attached | `handoff_sent` | "Dispatch Handoff" |
| sent→acknowledged | destination | currentDestination | — | state==sent | `handoff_acknowledged` | auto on open or explicit "Acknowledge" |
| acknowledged→accepted | destination | currentDestination | optional expectedArrivalAt | state==acknowledged | `handoff_accepted` | "Accept" |
| acknowledged→cannot_accept | destination | currentDestination | **reason mandatory** (enum + free text) | reason in CANNOT_ACCEPT_REASONS | `handoff_cannot_accept` | "Cannot Accept" + reason form |
| acknowledged/cannot_accept→redirected | destination | currentDestination | newDestinationId + reason; redirectCount < 3 | new dest ≠ current; redirect limit | `handoff_redirected` (+ internally emits new `sent` leg) | "Redirect" w/ destination picker |
| accepted→arrived | destination | currentDestination | — | — | `patient_arrived` | "Mark Arrived" (QR/code optional Stage 2) |
| accepted→no_show | destination | currentDestination | after expectedArrivalAt + grace (configurable; manual in MVP) | — | `patient_no_show` | "Mark No-Show" |
| arrived→in_care | destination | currentDestination | — | — | `care_started` | "Start Care" |
| in_care→outcome_recorded | destination | currentDestination | outcome payload valid (disposition, summary, followUpDueAt) | zod schema; outcome uniq per handoff | `outcome_recorded` | "Record Outcome" form |
| outcome_recorded→follow_up_pending | system (same tx) | — | outcome.followUpDueAt present | auto-creates `follow_ups` row | `follow_up_created` | automatic |
| follow_up_pending→closed | origin (or system when no follow-up needed) | origin (responsible facility of follow-up) | all episode follow-ups completed OR marked not-needed with reason | episode check | `handoff_closed` / `episode_closed` | "Close Episode" |
| no_show→closed | origin | origin | acknowledgement note | — | `handoff_closed` | "Close (No-Show)" |

Invalid transition → `409 INVALID_TRANSITION` with `{currentState, attemptedTransition, validNextStates}`; no state change; no event written (attempt logged server-side only). Every successful transition writes an immutable event with actor/role/facility/prev/next/reason — **this is the audit trail**.

### B.5 API design (v1)

Conventions: cookie session auth; envelope `{ok, data|error{code,message,details}}`; all mutations accept `idempotencyKey` or `clientEventId`; zod-validated; facility scope derived from session, never from body.

**MVP [MVP]:**

| Method/Route | Purpose | Role | Scope rule | Idempotency | Event side-effect |
|---|---|---|---|---|---|
| GET `/api/v1/auth/me` | session context | any | — | — | — |
| GET/POST `/api/v1/patients`, GET `/:id` | synthetic patients | origin create; any read | creator OR episode participant | uniq(displayName,facility,dob-ish) soft | — |
| GET `/api/v1/facilities` | destination picker | any | all (reference data) | — | — |
| GET `/api/v1/facilities/:id/capabilities` | latest snapshot per service + derived freshness (`fresh|stale|unknown`) | any | — | — | — |
| POST `/api/v1/facilities/:id/capabilities` | attest capability | destination (own facility), supervisor | own facility only | natural (new row) | `capability_attested` (facility-level log) |
| POST `/api/v1/episodes` + `/assessments` (or combined `POST /api/v1/handoffs` with embedded assessment) | create episode+assessment+handoff in one tx | origin | origin facility | `idempotencyKey` | `episode_opened`, `assessment_recorded`, `handoff_sent` |
| GET `/api/v1/handoffs?role=outbound\|inbound&state=` | lists | origin/destination | origin=outbound; destination=inbound on currentDestination | — | — |
| GET `/api/v1/handoffs/:id` | detail + events + outcome + follow-ups | origin/destination | party to handoff | — | optional `handoff_viewed` |
| POST `/api/v1/handoffs/:id/acknowledge` | dest ack | destination | currentDestination | `clientEventId` | `handoff_acknowledged` |
| POST `/api/v1/handoffs/:id/accept` | accept | destination | currentDestination | `clientEventId` | `handoff_accepted` |
| POST `/api/v1/handoffs/:id/cannot-accept` `{reason, note}` | reject | destination | currentDestination | `clientEventId` | `handoff_cannot_accept` |
| POST `/api/v1/handoffs/:id/redirect` `{newDestinationFacilityId, reason}` | redirect | destination | currentDestination | `clientEventId` | `handoff_redirected` + new sent leg |
| POST `/api/v1/handoffs/:id/arrived` / `/no-show` | arrival | destination | currentDestination | `clientEventId` | respective |
| POST `/api/v1/handoffs/:id/start-care` | in_care | destination | currentDestination | `clientEventId` | `care_started` |
| POST `/api/v1/handoffs/:id/outcome` `{disposition, summary, testsAdvised, adviceSummary, followUpDueAt}` | return note | destination | currentDestination | `clientEventId`; uniq(handoffId) | `outcome_recorded`, `follow_up_created` |
| POST `/api/v1/episodes/:id/close` | close | origin | episode owner facility | natural | `episode_closed` |
| GET `/api/v1/follow-ups?status=` | follow-up worklist | origin/destination | responsible facility | — | — |
| POST `/api/v1/follow-ups/:id/complete` | complete | origin | responsible facility | `clientEventId` | `follow_up_completed` |
| POST `/api/v1/sync/batch` `{mutations[]}` | offline flush | any | per-mutation scope | per-mutation keys; returns per-item result | as per mutation |
| GET `/api/v1/sync/pull?since=` | reference data + own handoffs delta | any | scoped | — | — |
| GET `/api/v1/handoffs/:id/fhir` | FHIR-aligned JSON (ServiceRequest+Encounter+Task Bundle) | any party | party to handoff | — | — |
| GET `/api/v1/dashboard/summary` | supervisor metrics | supervisor | district scope (MVP: all demo org) | — | — |
| GET `/api/v1/status/:publicCode` | patient/caregiver read-only status (no clinical detail) | public w/ code | rate-limited | — | — |

**Stage 2 [FINAL]:** diagnostics requests CRUD, notifications list/ack, teleconsult reference attach, expected-arrival/appointment endpoints, admin user/facility management, capability bulk import. **[FUTURE/EXTERNAL]:** ABDM/HMIS adapter endpoints — design seam only; do not implement without approved access.

### B.6 Authentication + RBAC

Auth = Better Auth cookie session (keep). AuthZ = `requireRole` + **facility-scope assertion in the service layer** (`assertPartyToHandoff(user, handoff)`, `assertResponsibleFacility(user, followUp)`), never trusting client-sent facility IDs.

| Permission | origin | destination | supervisor | admin |
|---|---|---|---|---|
| create patient / assessment / handoff | ✅ own facility | ❌ | ❌ | ❌ |
| view handoff | party only | party only (currentDestination) | read-only, org-wide, no clinical free-text beyond need | ✅ |
| acknowledge/accept/cannot-accept/redirect/arrive/start-care/outcome | ❌ | ✅ own facility as currentDestination | ❌ | ❌ |
| complete follow-up / close episode | ✅ responsible facility | if responsible | ❌ | ❌ |
| attest capability | ❌ | ✅ own facility | ✅ | ✅ |
| dashboard metrics | ❌ | ❌ | ✅ | ✅ |
| manage users/facilities | ❌ | ❌ | ❌ | ✅ |
| patient status by public code | public (code = capability token, no PHI) | | | |

### B.7 Offline-first architecture

Libraries: **Dexie** (IndexedDB wrapper) + small custom sync engine; reuse existing TanStack Query for cache; `crypto.randomUUID()` (global, not Node import) for client IDs.

Flow: ONLINE → connectivity monitor (`online`/`offline` events + periodic `/health` probe) → OFFLINE → create handoff: validate with bundled `@orion/protocols` + `@orion/domain` (packages already run client-side — major existing asset) → write `localHandoffs` row (`localId`, syncStatus `pending`) + `mutationQueue` entry (`clientMutationId` = idempotencyKey) → UI shows "Saved offline — will send when network returns" → NETWORK RETURNS → sync engine drains queue FIFO → `POST /sync/batch` → server re-validates everything (triage, state machine, RBAC) → per-mutation result `{clientMutationId, status: applied|duplicate|rejected, serverId?, error?}` → reconcile: update local row with server IDs (`publicCode`), refresh React Query caches, event log appears in timeline → UI badge flips to "Synced".

Edge cases:
- **Duplicate sync**: server idempotency key + payload hash (already built) → returns 200 `duplicate`; client marks synced, no duplicate event (partial uniq on `clientEventId` already in schema — keep).
- **Multiple queued events**: FIFO, one failure doesn't block later independent mutations (dependent ones on same handoff halt and surface conflict).
- **Invalid transition during sync** (e.g. destination accepted via another device while origin queued an edit): server returns `rejected` with current server state → client marks `conflict`, pulls server truth, shows "This handoff was updated on the server" banner — server always wins; local optimistic change is discarded with explanation.
- **Stale local data**: `sync/pull?since=` refreshes reference + own-handoff data on reconnect and app start.
- **Retry**: exponential backoff (1s→2s→4s… max 5 attempts) then `failed` + manual "Retry" button; failures never silently dropped.
- **Offline reads**: facilities + capabilities mirrored to `referenceCache` with `cachedAt` so destination selection works offline with explicit "as of" timestamps.

### B.8 Capability system

Store: `verified_available | verified_unavailable | unknown` + `attestedAt` + `source` (`attestation|fixture|api`) + `attestedBy`. **STALE is computed**: `now - attestedAt > freshnessWindow[serviceCode]` (e.g. 24h staffing, 7d equipment, 30d static services — config table). UI renders four badges: `VERIFIED_AVAILABLE (verified 2h ago)`, `VERIFIED_UNAVAILABLE`, `STALE (last verified 9 days ago)`, `UNKNOWN`. Never "live". Destination ranking in MVP: simple deterministic score (required service available+fresh > tier match > distance); **user always confirms** (no auto-routing — the landing page's "System Routing Protocol auto-escalated" fiction must go).

### B.9 Events / audit

Creation: every mutation handler in one DB tx → update aggregate + insert `handoff_events` row (type, prev, next, actor id+role snapshot, facility, reason, payload, clientEventId) + optional outbox job. Synced events arrive via `/sync/batch` and are deduplicated by `clientEventId`. Rendering: timeline UI (already exists — extend with actor/role/facility/reason and event-type icons/colors). Events are append-only; no update/delete endpoints exist.

### B.10 FHIR / ABDM boundaries

1. **Orion internal model** = tables above. 2. **FHIR-aligned model [MVP]** = mapper in `@orion/fhir`: Handoff→`ServiceRequest`, episode→`EpisodeOfCare`, outcome→`Encounter`+`Communication`, follow-up→`Task`, exposed as `GET /handoffs/:id/fhir` JSON. 3. **FHIR export** = that endpoint only. 4. **Actual interoperability [FUTURE/EXTERNAL]** = none claimed. 5. **ABDM [FUTURE/EXTERNAL]** = `abhaMock` field clearly labeled synthetic; adapter seam documented, not built.

### B.11 Security + privacy

**MVP:** helmet (present), strict CORS origin, session cookies httpOnly/SameSite, zod on every input (present pattern — extend), facility isolation enforced in services + tested, secrets via env with `.env.example` only (verify `.env` files are gitignored — they appear committed locally; add to rotation checklist), no PHI in outbox/SMS payloads (Handoff ID + instructions only), public status endpoint exposes non-clinical fields only, error handler never leaks stack traces in prod mode, dependency audit. **FINAL:** rate limiting, CSRF tokens for cookie flows, session rotation/expiry policy, structured audit log shipping, encryption at rest, PII minimization review, RBAC pen-test checklist, backups, observability (request-id is present — extend to structured logs).

### B.12 Testing plan

Unit (vitest): state machine full transition matrix incl. invalid; triage engine per protocol; freshness derivation; idempotency hash. API integration (supertest + **dedicated test DB with per-suite reset** — fixes current seed dependency): every endpoint × {unauthenticated, wrong role, wrong facility, valid}; facility isolation (dest A cannot read dest B's inbound handoff — covers the patient-visibility fix); idempotent replay; sync batch partial failure. Offline: fake-indexeddb unit tests for queue/reconcile; E2E (Playwright — add) for the full SIH script incl. DevTools-offline handoff creation. Failure-path matrix: incomplete referral blocked, cannot-accept without reason 400, redirect preserves episode, no-show close, stale capability renders STALE, duplicate event safe, unauthorized 401/403, follow-up overdue escalates.

---

## PART C — STAGE 1: MVP PHASES

> Dependency spine: P0→P1→P2→P3→P4→P5→P6, then P7/P8/P9 can overlap, P10 last.

### MVP Phase 0 — Repository Audit + Architecture Preparation
**Objective:** lock decisions, clean the tree. **Why:** prevent building on drift. **Dependencies:** none (this document + your approval).
**Existing code:** keep monorepo/packages; delete `packages/database/schema/index.ts` duplicate, `apps/api/src/env.ts`, `@orion/config` (DECISION REQUIRED — verify unused); fix `crypto` import bug in confirm page.
**Files:** create `docs/architecture.md`, `docs/demo-script.md`; modify `.env.example`; gitignore audit.
**DB:** none. **Backend:** none. **Frontend:** none. **Offline:** none.
**Testing:** baseline `pnpm typecheck && pnpm lint && pnpm test` green on seeded DB.
**Acceptance:** all placeholder/dead code removed or ticketed; decisions log signed off.
**DoD:** clean `git status`, green checks, written decisions.
**Must work:** build+tests. **Can be mocked:** —. **Deferred:** all features.

### MVP Phase 1 — Foundation + Database (target schema)
**Objective:** one migration to target schema; Maharashtra seed. **Why:** every later phase depends on episodes/assessments/outcomes/follow-ups existing. **Dependencies:** P0.
**Existing code:** modify all schema files; REWRITE `seed.ts` (Bihar→Maharashtra corridor: AAM Wadgaon→PHC Chakan→CHC Rajgurunagar→DH Pune, synthetic Marathi-named personas, mixed capability freshness incl. stale rows).
**Files:** create `schema/care-episodes.ts`, `assessments.ts`, `outcomes.ts`, `follow-ups.ts`; rename capabilities→capability_snapshots; modify users FK; migration `0001_target_schema.sql`.
**DB:** full DDL per §B.3; seed org/facilities/users/capabilities/patients/protocols.
**Backend:** update `db.ts` barrel exports only. **Frontend:** none. **Offline:** none.
**Testing:** migration up/down on fresh DB; seed idempotent (run twice).
**Acceptance:** `pnpm db:migrate && pnpm --filter @orion/api seed` produces the demo corridor; drizzle-studio shows all 14 tables.
**DoD:** migration + seed committed; old Bihar data gone.
**Must work:** schema, seed. **Can be mocked:** —. **Deferred:** outbox worker.

### MVP Phase 2 — Authentication + RBAC + Facility Scoping
**Objective:** role+facility authorization that survives the destination workflow. **Dependencies:** P1.
**Existing code:** KEEP better-auth config; MODIFY middleware (drop test routes at end of phase); fix users.facilityId uuid typing end-to-end.
**Files:** create `modules/auth/scope.ts` (`assertPartyToHandoff`, `assertCurrentDestination`, `assertResponsibleFacility`, `assertSupervisor`); modify `auth.middleware.ts`.
**Backend:** scope helpers + permission matrix in `@orion/shared`.
**Frontend:** permission-aware nav helper `useSessionUser()`.
**Testing:** isolation suite — cross-facility reads 403/404; patient visible to destination *via handoff* (fixes current bug).
**Acceptance:** matrix in §B.6 enforced server-side; auth tests extended and green.
**Must work:** login, role guards, facility isolation. **Can be mocked:** admin UI (seed-only admin). **Deferred:** SSO/ABDM identity.

### MVP Phase 3 — Patient + Care Episode + Assessment
**Objective:** origin can select/create synthetic patient, run protocol assessment, persist episode+assessment. **Dependencies:** P2.
**Existing code:** patients module KEEP+MODIFY (access rule fix); triage engine KEEP; wizard patient/protocol/form pages KEEP (re-point to new APIs).
**Backend:** `POST /episodes` (or combined create), `GET /episodes/:id` aggregate; assessment validation server-side via `evaluateProtocol` (existing).
**Frontend:** wizard steps 1–3 write draft toward episode payload.
**DB:** uses P1 tables.
**Testing:** incomplete assessment → 400 with missing-field list; episode opens exactly once (idempotency).
**Acceptance:** assessment row + episode row created; triage result stored; UI blocks incomplete referral.
**Must work:** full assess→persist path. **Can be mocked:** —. **Deferred:** child/NCD protocols (add `child_danger` late-MVP if time, else Stage 2).

### MVP Phase 4 — Handoff Domain + State Machine (full)
**Objective:** all 12 states + transition API, backend-enforced. **Dependencies:** P3. **This is the product core.**
**Existing code:** MODIFY domain state machine (+acknowledged, in_care, outcome_recorded, follow_up_pending; per-transition role/facility guard metadata); handoffs service MODIFY (create now writes episode+assessment+handoff+events in one tx — mostly exists).
**Files:** create `handoffs.transitions.ts`, `handoffs.schemas.ts`; modify domain package + tests.
**Backend:** all transition endpoints from §B.5; redirect creates new leg on same handoff (`currentDestinationFacilityId` update + redirectCount++ + events), max 3 redirects.
**Frontend:** none yet (P5/P6 consume).
**Testing:** full transition matrix incl. invalid→409 with validNextStates; cannot-accept requires reason; redirect limit; concurrent transition race → one wins (unique/state-check in tx).
**Acceptance:** every transition in §B.4 executable via API with correct audit events.
**Must work:** state machine + events. **Can be mocked:** —. **Deferred:** `expired` state.

### MVP Phase 5 — Destination Inbox + Accept / Cannot Accept / Redirect
**Objective:** real destination desk. **Dependencies:** P4.
**Existing code:** REWRITE `app/inbox/page.tsx` → `app/destination/*`.
**Frontend:** inbox (sort urgency→waiting time), handoff detail with three action dialogs (cannot-accept reason form mandatory; redirect = destination picker reusing capability cards), acknowledge-on-open.
**Backend:** `GET /handoffs?role=inbound`.
**Testing:** E2E accept and cannot-accept→redirect→accept paths.
**Acceptance:** CHC desk can reject with reason and redirect to DH; DH accepts; origin sees all of it in timeline.
**Must work:** the whole rejection/redirect loop. **Can be mocked:** push notifications (in-app only). **Deferred:** bed reservation detail.

### MVP Phase 6 — Arrival + Outcome + Counter-referral + Follow-up + Close
**Objective:** close the loop. **Dependencies:** P5.
**Backend:** arrived/no-show/start-care/outcome endpoints; outcome tx creates follow_ups row; `GET /follow-ups`, complete, episode close; overdue = computed (dueAt < now && pending) + supervisor visibility.
**Frontend:** destination arrival + outcome forms; origin follow-up worklist + "Close Episode"; outcome visible to origin on handoff detail.
**Testing:** outcome→follow-up→complete→close chain; no-show close; overdue computation.
**Acceptance:** demo journey runs end-to-end online.
**Must work:** outcome returned to origin + follow-up lifecycle. **Can be mocked:** SMS (outbox row only). **Deferred:** escalation rules beyond overdue flag.

### MVP Phase 7 — Offline-first + IndexedDB + Sync
**Objective:** offline handoff creation + queue + sync + reconciliation. **Dependencies:** P4 (needs stable mutation contract), P3. Can start in parallel with P5/P6 UI.
**Existing code:** MODIFY query-provider (offline-aware retry), confirm page (queue instead of direct fetch).
**Files:** create `lib/offline/{db,queue,sync-engine,connectivity}.ts`, `components/offline/*`, `modules/sync/*` API.
**Backend:** `POST /sync/batch`, `GET /sync/pull`.
**Frontend:** sync status pill, offline banner, "Saved offline" confirmation state.
**Testing:** fake-indexeddb unit tests; E2E with browser offline: create → online → appears in destination inbox; duplicate flush safe; conflict path surfaces banner.
**Acceptance:** §B.7 flow demonstrable live with network toggle.
**Must work:** offline create + reliable sync + duplicate safety. **Can be mocked:** background-sync API (manual/auto poll acceptable). **Deferred:** offline writes for destination-side actions (destination assumed connected; document this boundary).

### MVP Phase 8 — Capability Snapshots + Destination Selection
**Objective:** 4-state freshness + attestation + ranking. **Dependencies:** P1 (schema), P2 (attestation authz). Parallel with P5–P7.
**Existing code:** MODIFY capabilities service (freshness derivation), destination page (badges + ranking + "as of" timestamps).
**Backend:** attestation POST; freshness windows config.
**Frontend:** destination cards with VERIFIED/STALE/UNKNOWN; capability attestation mini-screen for destination/supervisor.
**Testing:** stale derivation; attestation authz; never-live-claims UI copy review.
**Acceptance:** judge sees "Gynaecology — last verified 09:20" style labels; stale data visibly stale.
**Must work:** freshness display. **Can be mocked:** all data (fixtures/attestation). **Deferred:** live feeds [FUTURE/EXTERNAL].

### MVP Phase 9 — Audit + Dashboard + FHIR + Failure Paths
**Objective:** operational visibility + interop story. **Dependencies:** P6.
**Backend:** `GET /dashboard/summary` (counts by state, ageing buckets, redirect reasons, no-show rate, outcome-return rate, follow-up completion, capability freshness); `GET /handoffs/:id/fhir` via `@orion/fhir` mapper; outbox worker drains mock SMS (console/log sink).
**Frontend:** REWRITE supervisor page (KPI cards + ageing table + drill-down to handoff timeline); QR display on handoff detail (encodes public status URL only); public `/status/[code]` page (non-clinical); timeline polish.
**Testing:** metrics correctness vs known fixture; FHIR JSON shape; public code leaks no PHI.
**Acceptance:** supervisor dashboard answers "how many pending/redirected/no-show/overdue follow-ups" live.
**Must work:** dashboard + timeline + FHIR export JSON. **Can be mocked:** SMS (outbox log), QR scanner. **Deferred:** real notification channels [FUTURE/EXTERNAL].

### MVP Phase 10 — Testing + Security + Demo Hardening
**Objective:** reliable demo. **Dependencies:** all.
**Work:** full test matrix §B.12 green in CI; security pass §B.11-MVP; landing page de-hyped; seed "demo reset" script (`pnpm demo:reset` → deterministic pre-baked mid-journey states as backup); demo script rehearsed; error/empty/loading states audited; synthetic-data banner on every screen.
**Acceptance:** §E checklist 100%.
**Must work:** everything. **Can be mocked:** fallback video/screenshots of the journey.

---

## PART D — STAGE 2: FINAL PRODUCT PHASES

Classification applied: **[FINAL]** items below extend the MVP; nothing requires a rewrite.

### Stage 2 Phase 1 — Clinical/Programme Workflow Breadth
Maternal high-risk tracking enhancements, `child_danger` protocol, `ncd_htn` protocol + chronic timeline view. **Why:** SIH explicitly names maternal/child/NCD; triage engine is already protocol-generic. **DB:** new protocol rows only (+ optional `high_risk_flag` on episodes). **Backend:** minimal (engine generic). **Frontend:** protocol cards + program-specific follow-up templates. **Security:** none new. **Testing:** protocol rule tests vs approved protocol text (clinical content DECISION REQUIRED — must be sourced from approved public-health protocol, not invented). **Acceptance:** three protocol journeys complete end-to-end. Early in Stage 2 (high demo value, low risk).

### Stage 2 Phase 2 — Multilingual + Health Literacy + Patient Layer
Marathi/Hindi/English via `next-intl`; simple-language labels; patient `/status` expansion (what to carry, where to report); QR print. **Why:** Maharashtra context, health-literacy SIH bullet. **Impact:** i18n infrastructure, translation files (Marathi/Hindi need review by a fluent speaker — DECISION REQUIRED on reviewer). **Acceptance:** full origin workflow usable in Marathi. Early-mid.

### Stage 2 Phase 3 — Notifications + Appointments + Teleconsult Reference
In-app notification center; expected-arrival window on accept; teleconsult reference fields + pre-consult packet view. **Why:** reduces no-shows, formalizes eSanjeevani-by-reference. **DB:** `notifications` table; handoff `expectedArrivalAt` (already in target schema). **Integration:** none external (reference-only). Mid.

### Stage 2 Phase 4 — Diagnostics Coordination + Medicine Visibility
`diagnostic_requests` lifecycle (requested→performed→result_ref) inside episode; medicine availability as capability service codes with freshness. **Why:** SIH diagnostics/medicine bullets, but strictly visibility/coordination. **Explicitly not LIS/procurement [DO NOT BUILD].** Mid-late. Live feeds [FUTURE/EXTERNAL].

### Stage 2 Phase 5 — Supervisor Analytics + Longitudinal Timeline
Time-metric computations (created→ack, ack→accept, accept→arrival…), quality metrics, per-facility drill-downs, episode timeline across multiple handoffs. **DB:** possibly materialized views. Late-mid (needs real usage data to tune).

### Stage 2 Phase 6 — Production Hardening
Rate limiting, CSRF, session policies, structured audit shipping, observability, backups, load testing, PWA install prompts. Required before any pilot. Late.

### Stage 2 Phase 7 — Approved Integrations [FUTURE / EXTERNAL INTEGRATION]
ABDM, state HMIS, live capability feeds, telemedicine adapter — **only with confirmed authorization and API access**; adapter pattern at module boundary; each is its own gated sub-project. Last.

**Feature classification summary:** [MVP] = auth/RBAC, facility scoping, synthetic patients, episodes, 2 protocols, full handoff lifecycle, events/audit, offline+sync, capability freshness, follow-ups, counter-referral, supervisor dashboard (basic), FHIR-aligned export, QR display, mock SMS, public status page. [FINAL] = child/NCD protocols, i18n, notifications, diagnostics coordination, medicine visibility, teleconsult reference, appointments, analytics depth, production security, patient-layer expansion. [FUTURE/EXTERNAL] = ABDM, HMIS/state APIs, live medicine/facility feeds, eSanjeevani deep integration, MEMS/108 integration. [DO NOT BUILD] = EHR, HMIS, LIS, video telemedicine, ambulance dispatch, live bed board, AI diagnosis, citizen super-app, procurement, OPD queue management, microservices.

---

## PART E — DEFINITIONS OF DONE

### MVP DoD checklist
All of §23's items, expanded: auth (login/logout/session expiry/3 roles) ☐; RBAC matrix enforced + tested ☐; facility isolation incl. patient-via-handoff access ☐; synthetic patient create/select ☐; 2 protocols with required-field blocking ☐; incomplete referral blocked client AND server ☐; handoff create with unique public code ☐; idempotent create (same key+payload→200, different→409) ☐; destination inbox shows inbound ☐; acknowledge ☐; accept ☐; cannot-accept requires reason ☐; redirect preserves episode + increments count + limit ☐; arrived ☐; no-show ☐; in_care ☐; outcome with structured return note ☐; follow-up auto-created/completed/overdue ☐; origin sees outcome ☐; episode close ☐; audit timeline shows actor/role/facility/prev/next/reason ☐; capability 4-state freshness incl. STALE ☐; offline create → queue → sync → reconcile ☐; duplicate sync safe ☐; invalid-transition-during-sync handled ☐; dashboard metrics correct ☐; FHIR JSON export ☐; QR + public status (no PHI) ☐; mock SMS outbox ☐; synthetic-data banner ☐; demo reset script ☐; full E2E journey green ☐; `typecheck/lint/test` green in CI ☐.

### Final Product DoD (grouped)
Core workflow: multi-handoff episodes, redirect chains, expiry handling. Clinical: maternal/child/NCD protocols verified against approved sources. Offline: destination-side drafts, conflict UX polish. Multilingual: mr/hi/en complete incl. patient texts. Patient layer: instructions, follow-up dates, QR verification. Diagnostics: request lifecycle + result reference. Medicine: freshness-labeled visibility. Teleconsult: reference + packet attach. Appointments: expected-arrival windows. Dashboards: time-metrics, quality metrics, drill-downs. Analytics: longitudinal timeline. Interop: validated FHIR mapping; ABDM only if approved. Security: §B.11-Final complete + audit. Reliability: backups, observability, load targets met. Integrations: each behind feature flag with contract tests.

---

## PART F — MIGRATION PLAN (incremental)

1. **First:** delete dead code + fix `users.facilityId` type + fix `crypto` import (P0) — low risk, immediate.
2. **Temporarily remains:** current `handoffs` create API and origin wizard keep working while schema migrates; `/inbox` + `/supervisor` placeholders remain until P5/P9 replace them.
3. **Refactor:** handoffs service into transitions module; wizard draft context → Dexie-backed draft (P7, after API stabilizes).
4. **Rewrite:** seed (Maharashtra), inbox page, supervisor page.
5. **Delete:** duplicate schema barrel, env alias, `@orion/config`, auth test routes (after real guards tested), landing-page fake-live claims.
6. **Add:** sync module, offline lib, dashboard module, fhir mapper, outbox worker.
7. **DB sequence:** single additive migration 0001 (new tables + columns + FK fix) → data backfill (existing handoffs get episodes synthesized, packetJson copied into assessments) → old-column drop only after P4 verified (if any).
8. **API sequence:** add new endpoints alongside old → point frontend → remove nothing public until P10 (old endpoints are all still valid; only semantics extend).
9. **Frontend sequence:** origin wizard re-point (P3) → destination app (P5) → continuity screens (P6) → offline (P7) → supervisor (P9).
10. **Offline introduction point:** P7 — deliberately after the mutation API surface is frozen; introducing it earlier would force rework.
11. **Old-code removal point:** P10 freeze — placeholders and legacy paths deleted only after replacements are E2E-tested.

## PART G — TEAM PLAN (3–5 devs)

| Stream | Phases | Parallelizable with |
|---|---|---|
| Backend A (domain/handoffs/sync) | P1, P3, P4, P7-api | Frontend B after P4 contracts frozen |
| Backend B (auth/RBAC/dashboard/fhir) | P2, P8-api, P9-api | Backend A throughout |
| Frontend A (origin + offline) | P3-ui, P6-ui, P7-ui | Backend A |
| Frontend B (destination + supervisor) | P5, P9-ui | needs P4 API contract only |
| DB/seed + Testing/DevEx | P0, P1, P10, CI throughout | all |

Hard gates: P1 schema → everything; P2 authz → P3+; P4 state machine → P5/P6/P7; demo freeze after P10.

## PART H — SIH DEMO PLAN

**Scenario:** Savitri Jadhav (synthetic), 26, 34 weeks pregnant, presents at AAM Wadgaon (Pune district) with severe headache + blurred vision.
1. **Login** as CHO → judge sees role-based entry. *Screen:* login. *Backend:* better-auth session.
2. **Assessment** (ANC protocol): toggle severe headache; submit blocked — BP missing → complete it → Orange urgency computed live. *Judge learns:* protocol-assisted completeness, no AI diagnosis.
3. **Destination selection:** CHC Rajgurunagar (ObGyn available — verified yesterday; OT unavailable) vs DH Pune (all verified today). Choose CHC. *Judge learns:* capability + freshness, human confirms.
4. **Airplane mode ON → Dispatch.** "Saved offline." *Judge learns:* offline-first. *(DB: localHandoffs + queue only.)*
5. **Network ON → sync.** Handoff appears in CHC inbox; origin timeline gains `handoff_sent`. *(Events: sent + outbox mock SMS.)*
6. **CHC desk (second browser):** acknowledge → Cannot Accept — reason "specialist unavailable" → Redirect to DH Pune (same episode).
7. **DH desk:** Accept with expected arrival window → Mark Arrived → Start Care → Record Outcome (disposition: treated & returned; BP monitoring; follow-up 14 days).
8. **Origin:** sees outcome + follow-up task; mark completed later / show overdue on another synthetic case → Close Episode.
9. **Supervisor dashboard:** ageing, redirect reason breakdown, outcome-return rate, capability staleness.
10. **FHIR export JSON** on handoff detail + closing line: "We complement Maharashtra's existing systems — we don't replace them."
**Fallback:** `pnpm demo:reset` seeds a pre-baked mid-journey state + recorded video; if API dies, slides show the same screens from screenshots; offline demo needs no network by design (lowest-risk segment to show live).

## PART I — DO NOT BUILD BEFORE MVP (strict)
Full/partial EHR · HMIS · LIS/sample logistics · video telemedicine · ambulance dispatch/fleet · live bed board · autonomous/AI diagnosis or LLM triage · patient super-app · procurement/inventory · OPD queue management · auto-routing without human confirmation · push/SMS gateways (mock only) · maps/geospatial routing · microservices · Kubernetes · any live government API integration · voice input · analytics beyond operational dashboard.

## PART J — RISK REGISTER

| Risk | Impact | Mitigation | Fallback |
|---|---|---|---|
| Offline sync conflicts corrupt handoff state | High | server-authoritative transitions, idempotency keys, clientEventId uniq, conflict surfacing | offline = create-only; other actions online-only (documented) |
| State machine scope creep breaks demo | High | freeze 12 states at P4; matrix tests | feature-flag advanced states |
| Clinical protocol content inaccurate | High | use approved published protocols only; clinician review; disclaimer | ship ANC+adult only |
| Facility isolation bug leaks patient data | High | service-layer scope asserts + isolation tests | restrict patient endpoint to episode participants only |
| Stale capability mistaken as live | Medium | 4-state badges, timestamps everywhere, copy review | hide capability entirely for UNKNOWN |
| Time overrun on offline layer | High | P7 scoped to create+sync; Dexie not custom IDB | demo offline via seeded queue replay |
| Judge asks about live govt APIs | Medium | explicit fixture/attestation labeling + integration roadmap slide | never claim |
| Demo network failure | Medium | offline-first demo, demo:reset, video | screenshots |
| Better Auth session quirks across ports | Low | existing rewrite proxy works; test early in P2 | token fallback |
| Test DB fragility (current tests need seeded DB) | Medium | per-suite reset in P1/P2 | transactional rollback per test |

---

# FINAL MASTER ROADMAP

# STAGE 1 — MVP

**Phase 0** — Repository audit cleanup + decisions
**Phase 1** — Target database schema + Maharashtra seed
**Phase 2** — Auth + RBAC + facility scoping hardening
**Phase 3** — Patient + Care Episode + Assessment
**Phase 4** — Full Handoff state machine + transition APIs (core)
**Phase 5** — Destination inbox + accept/cannot-accept/redirect
**Phase 6** — Arrival + outcome + counter-referral + follow-up + close
**Phase 7** — Offline-first (IndexedDB + queue + sync)
**Phase 8** — Capability freshness + destination selection + attestation
**Phase 9** — Audit timeline + supervisor dashboard + FHIR export + QR/status + mock SMS
**Phase 10** — Testing + security + demo hardening
**MVP Definition of Done** — §E checklist, 100%

# STAGE 2 — FINAL PRODUCT

**Phase 1** — Maternal/child/NCD workflow breadth
**Phase 2** — Multilingual (mr/hi/en) + health-literacy + patient layer
**Phase 3** — Notifications + expected arrival + teleconsult reference
**Phase 4** — Diagnostics coordination + medicine visibility
**Phase 5** — Supervisor analytics + longitudinal care-transition timeline
**Phase 6** — Production security + observability + reliability
**Phase 7** — Approved external integrations (gated, [FUTURE/EXTERNAL])
**Final Product Definition of Done** — §E grouped checklist

## EXACT FIRST TASK
Phase 0 cleanup + Phase 1 schema migration: implement the target Drizzle schema (care_episodes, assessments, outcomes, follow_ups, capability_snapshots, users.facilityId FK fix, handoffs episode/assessment links) with migration `0001`, and rewrite the seed to the Maharashtra synthetic corridor. Everything else depends on this.

## FIRST VERTICAL SLICE
Origin login → select/create synthetic ANC patient → protocol assessment (incomplete blocked) → destination select with capability freshness → create handoff (idempotent) → destination inbox → acknowledge → cannot-accept (reason) → redirect → DH accepts → arrived → outcome → follow-up auto-created → origin sees outcome → close episode. (Online first; offline creation added in P7 against the frozen mutation contract.)

## CURRENT → TARGET MIGRATION (first changes)
1. Delete duplicate/dead code (`packages/database/schema/index.ts`, `apps/api/src/env.ts`, `@orion/config` — DECISION REQUIRED), fix `crypto` import bug. 2. Fix `users.facilityId` to uuid FK. 3. Additive schema migration + episode backfill. 4. Extend domain state machine. 5. Split handoffs service into transitions module. 6. Rewrite seed to Maharashtra. Placeholder pages (`/inbox`, `/supervisor`) stay until P5/P9 replace them; landing page de-hyped in P10.

## BIGGEST TECHNICAL RISK
Offline sync correctness under concurrent destination-side actions — mitigated by server-authoritative state machine, idempotency, and scoping MVP offline to *creation* only.

## BIGGEST SCOPE RISK
Trying to demo breadth (protocols, i18n, diagnostics, notifications) before the closed loop + offline works flawlessly. The loop IS the product; everything else is Stage 2.

## WHAT MUST WORK FOR SIH
Login/RBAC/facility scoping · 2 protocols with completeness blocking · full handoff lifecycle incl. cannot-accept/redirect/no-show · outcome→follow-up→close · offline create + sync with duplicate safety · capability freshness labels · audit timeline · supervisor dashboard · demo reset.

## WHAT CAN BE MOCKED
SMS (outbox log) · QR scanning · capability data (attested fixtures, labeled) · ABHA (synthetic field, labeled) · teleconsult (reference field) · push notifications (in-app) · maps/distance.

## WHAT MUST WAIT UNTIL STAGE 2
Child/NCD protocols · mr/hi i18n · diagnostics lifecycle · medicine visibility · notification orchestration · appointments · analytics depth · production hardening · and all [FUTURE/EXTERNAL] government integrations (ABDM/HMIS/live feeds) pending authorization.

---

