# Sahay — Care Access & Referral Coordination

> A lightweight, **offline-friendly** digital care-transition platform that makes patient referrals between healthcare facilities visible, trackable, and accountable.
>
> ⚠️ **Prototype** — Uses realistic synthetic healthcare demonstration data only. Not for real clinical use.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Workspace Structure](#workspace-structure)
- [Architecture](#architecture)
- [Handoff State Machine](#handoff-state-machine)
- [User Roles & Permissions](#user-roles--permissions)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [Packages](#packages)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Scripts Reference](#scripts-reference)
- [Demo Credentials](#demo-credentials)

---

## Overview

Sahay (project codename: **Orion**) is a pnpm + Turborepo monorepo built for SIH. It digitises the referral/handoff process across India's public health hierarchy — from sub-centres and PHCs all the way to district hospitals — without requiring constant internet connectivity.

Core capabilities:
- Multi-step referral creation with clinical triage (urgency: 🔴 red / 🟠 orange / 🟢 green)
- Full handoff lifecycle tracking across 12 states (draft → closed)
- Role-based dashboards for origin (CHO), destination (desk), and supervisor views
- Capability attestation — facilities declare what services/equipment they have
- Offline-first origin workflow via IndexedDB (Dexie) with write-behind sync
- FHIR R4-aligned export per handoff
- Outbox worker for async notification delivery (SMS stub, production-ready seam)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TanStack Query v5 |
| PWA / Offline | Serwist (Workbox), Dexie (IndexedDB), Service Worker |
| UI Components | Radix UI (dialog, select, switch, label, slot), Lucide Icons, Sonner toasts |
| Backend | Express 5 (Node.js ≥ 18) |
| Auth | Better Auth (email+password, httpOnly cookie session) |
| Database | PostgreSQL 16, Drizzle ORM |
| Validation | Zod |
| Build | Turborepo, tsup (API), Webpack (web) |
| Testing | Vitest, Playwright (E2E) |
| Tooling | pnpm v9, TypeScript 5.9, ESLint 9, Prettier |

---

## Workspace Structure

```
sahay/                          ← monorepo root (pnpm workspace)
├── apps/
│   ├── api/                    ← @orion/api — Express 5 REST API
│   │   └── src/
│   │       ├── app.ts          ← Express app factory (all middleware + routers)
│   │       ├── server.ts       ← HTTP server entry point
│   │       ├── lib/            ← config, auth, db, logger
│   │       ├── middleware/     ← error, 404, request-id
│   │       ├── modules/        ← feature modules (see API Routes below)
│   │       └── workers/
│   │           └── outbox.worker.ts   ← async outbox job processor (5s poll)
│   └── web/                    ← @orion/web — Next.js 16 PWA
│       └── app/
│           ├── (dashboard)/
│           │   ├── app/        ← Origin CHO views
│           │   │   ├── page.tsx          ← Origin dashboard
│           │   │   ├── follow-ups/       ← Follow-up task list
│           │   │   ├── handoff/[id]/     ← Handoff detail view
│           │   │   └── new/              ← Multi-step referral wizard
│           │   │       ├── patient/      ← Step 1: Patient details
│           │   │       ├── protocol/     ← Step 2: Clinical protocol select
│           │   │       ├── clinical/     ← Step 3: Triage assessment form
│           │   │       ├── destination/  ← Step 4: Destination facility
│           │   │       └── confirm/      ← Step 5: Review & send
│           │   ├── destination/          ← Destination desk views
│           │   │   ├── page.tsx          ← Incoming referral queue
│           │   │   ├── capabilities/     ← Capability attestation
│           │   │   └── handoff/[id]/     ← Accept / redirect / cannot-accept
│           │   └── supervisor/
│           │       └── page.tsx          ← Supervisor overview dashboard
│           ├── login/          ← Auth page
│           ├── status/[code]/  ← Generic status/error page
│           └── api/health/     ← Next.js health probe route
├── packages/
│   ├── database/               ← @orion/db — Drizzle schema + migrations
│   ├── domain/                 ← @orion/domain — state machine + types
│   ├── protocols/              ← @orion/protocols — triage engine + protocol definitions
│   ├── fhir/                   ← @orion/fhir — FHIR R4 bundle mapper
│   ├── shared/                 ← @orion/shared — roles, permissions, DTOs
│   ├── logger/                 ← @orion/logger — structured winston/pino logger
│   ├── eslint-config/          ← shared ESLint configs (base, next, react-internal)
│   └── typescript-config/      ← shared tsconfig bases (base, nextjs, node)
├── docker-compose.yml          ← PostgreSQL 16 local dev container
├── turbo.json                  ← Turborepo pipeline config
├── pnpm-workspace.yaml
└── .env.example                ← canonical env var reference
```

---

## Architecture

Sahay follows a **modular monolith** pattern — no microservices. Module boundaries (`modules/<domain>/{routes,service}`) preserve a future split path.

```
┌──────────────────────────────────────────────────────────────────┐
│                      apps/web  (Next.js PWA)                     │
│   Origin (mobile-first) │ Destination desk │ Supervisor          │
│   Offline: Dexie (IndexedDB) + mutation queue + sync engine      │
│            + connectivity monitor + TanStack Query cache         │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTPS / JSON  (Better Auth cookie)
┌─────────────────────────▼────────────────────────────────────────┐
│                  apps/api  (Express 5 modular monolith)          │
│  modules: auth │ patients │ facilities │ episodes │ handoffs     │
│           follow-ups │ dashboard │ sync │ public                 │
│  middleware: requireAuth → requireRole → facilityScope           │
│             → zod validation → service → @orion/domain rules     │
├──────────────────────────────────────────────────────────────────┤
│  @orion/domain   (state machine, guards, types)                  │
│  @orion/protocols (triage engine + clinical protocol defs)       │
│  @orion/shared   (roles, permissions, DTOs)                      │
│  @orion/fhir     (Orion → FHIR R4 mapper, export only)           │
├──────────────────────────────────────────────────────────────────┤
│  @orion/db  (Drizzle ORM)  →  PostgreSQL 16                      │
└──────────────────────────────────────────────────────────────────┘
   outbox worker (5s poll) → mock SMS/notification sink
   [FUTURE] adapter seam → ABDM / state HMIS / eSanjeevani
```

**Key architectural decisions:**

1. **Domain rules live in `@orion/domain`, not in routes or React** — state transitions and triage are enforced identically on the server (authority) and client (UX preview).
2. **Event-sourced history + state-machine current state** — `handoffs.state` is the current pointer; `handoff_events` is the immutable, append-only truth. Every transition is one DB transaction: update state + insert event + enqueue outbox job.
3. **Server is the only authority on transitions** — clients propose transitions (carrying `clientEventId`); server validates against current state + role + facility scope. This makes offline sync safe.
4. **Offline = client-side write-behind queue** (not CRDTs) — a handoff is acted on by one facility at a time, so server-validation + explicit conflict surfacing is sufficient.
5. **Capability snapshots, never live availability** — `capability_snapshots` stores attested data with freshness windows; no "live availability" is claimed without an approved source.

---

## Handoff State Machine

12 states, backend-enforced in `@orion/domain`:

```
draft → sent → acknowledged → accepted → arrived → in_care
                    │    │        │                     ↓
                    │    │        └→ no_show        outcome_recorded
                    │    │              ↓                   ↓
                    │    │           closed         follow_up_pending → closed
                    │    └→ cannot_accept ──→ redirected → sent (new leg)
                    │              └→ closed
                    └→ (same three actions apply from acknowledged)
```

| Transition | Trigger | Event emitted |
|---|---|---|
| `draft → sent` | CHO sends referral | `handoff_sent` |
| `sent → acknowledged` | Destination opens it | `handoff_acknowledged` |
| `acknowledged → accepted` | Desk accepts | `handoff_accepted` |
| `acknowledged → cannot_accept` | Desk rejects (with reason) | `handoff_cannot_accept` |
| `acknowledged → redirected` | Desk redirects | `handoff_redirected` |
| `cannot_accept → redirected` | After rejection | `handoff_redirected` |
| `accepted → arrived` | Patient reaches facility | `patient_arrived` |
| `accepted → no_show` | Patient didn't arrive | `patient_no_show` |
| `arrived → in_care` | Care started | `care_started` |
| `in_care → outcome_recorded` | Outcome documented | `outcome_recorded` |
| `outcome_recorded → follow_up_pending` | Follow-up required | `follow_up_created` |
| `*pending/no_show/cannot_accept → closed` | Terminal | `handoff_closed` / `episode_closed` |

- `cannot_accept` **requires** a reason enum: `specialist_unavailable`, `equipment_unavailable`, `no_appropriate_bed`, `blood_service_unavailable`, `wrong_level`, `operational`.
- `redirectCount` is capped at 3.
- Invalid transition → `409 INVALID_TRANSITION` with `{ currentState, validNextStates }`.

---

## User Roles & Permissions

Defined in `@orion/shared`:

| Role | Description | Key permissions |
|---|---|---|
| `origin` | CHO / sub-centre worker — creates referrals | `patient:create`, `assessment:create`, `handoff:create` |
| `destination` | Receiving facility desk — acts on incoming referrals | `handoff:transition`, `capability:attest` |
| `supervisor` | Block/district supervisor — cross-facility oversight | `dashboard:read`, `capability:attest` |
| `admin` | Full access — bypasses all facility scope checks | `user:manage`, `facility:manage` |

Facility scope is **always derived from the session**, never from the request body.

---

## API Routes

Base URL: `http://localhost:4000`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Service info |
| `GET` | `/health` | Health probe |
| `ALL` | `/api/auth/*` | Better Auth (login, logout, session) |
| `*` | `/api/v1/auth/*` | Orion auth meta routes |
| `*` | `/api/v1/patients` | Patient CRUD |
| `*` | `/api/v1/facilities` | Facility lookup + management |
| `*` | `/api/v1/capabilities` | Capability snapshot CRUD + attestation |
| `*` | `/api/v1/handoffs` | Handoff lifecycle (create, transition, FHIR export) |
| `*` | `/api/v1/episodes` | Care episode management |
| `*` | `/api/v1/follow-ups` | Follow-up task tracking |
| `*` | `/api/v1/sync` | Offline sync batch push (`POST /batch`) + pull (`GET /pull?since=`) |
| `*` | `/api/v1/dashboard` | Aggregated stats for supervisor |
| `*` | `/api/v1/public` | Public handoff status by `publicCode` (non-clinical) |

---

## Database Schema

Tables managed by Drizzle ORM (`@orion/db`) in PostgreSQL 16:

| Table | Description |
|---|---|
| `users`, `sessions`, `accounts`, `verifications` | Better Auth identity tables |
| `organizations` | Org/health block grouping |
| `facilities` | Health facilities (sub-centre → district hospital); tiers: `AAM`, `sub_centre`, `phc`, `chc`, `rh`, `sdh`, `dh`, `medical_college` |
| `patients` | Synthetic patient records (displayName, age, sex) |
| `protocols` | Triage protocol registry |
| `care_episodes` | Wraps the full patient care journey |
| `assessments` | Clinical assessment snapshots per episode |
| `handoffs` | Central referral object (12-state lifecycle + urgency + packetJson snapshot) |
| `handoff_events` | Immutable append-only event log per handoff |
| `capability_snapshots` | Attested facility capabilities with freshness timestamps |
| `outcomes` | Clinical outcome recorded at destination |
| `follow_ups` | Follow-up task created post-outcome |
| `outbox_jobs` | Async job queue for notifications (SMS stub) |

Current migrations: `0000` → `0004` (in `packages/database/migrations/`).

---

## Packages

### `@orion/domain`

Core business logic — **framework-free**, shared by API and web.

- `handoff.types.ts` — `HandoffState`, `UrgencyLevel`, `EventType`, `CannotAcceptReason` enums
- `handoff-state-machine.ts` — `canTransition()`, `getValidNextStates()`, `assertTransition()`, `getEventForTransition()`
- `capability-freshness.ts` — staleness window logic for capability snapshots

### `@orion/protocols`

Rule-based triage engine, pluggable per clinical domain.

- `triage-engine.ts` — `evaluateProtocol(protocol, formData)` → `{ urgency, matched_rules, completeness, can_submit }`
- `protocols/adult-general.ts` — Adult General Medical (chest pain → 🔴, breathlessness → 🟠, baseline → 🟢)
- `protocols/anc-danger.ts` — ANC danger signs protocol

### `@orion/fhir`

FHIR R4 export mapper (non-canonical, interoperability seam only).

- `mapper.ts` — `toFhirBundle({ handoff, patient, originFacility, destinationFacility, events })` → FHIR Bundle with `Patient`, `Organization` ×2, `ServiceRequest` resources
- Urgency mapping: `red → stat`, `orange → urgent`, `green → routine`

### `@orion/shared`

Shared types across API and web: `UserRole`, `USER_ROLES`, `Permission`.

### `@orion/logger`

Structured logger wrapping winston/pino. Reads `LOG_LEVEL` from environment.

### `@orion/db`

Drizzle ORM client + full schema exports + migration runner config.

---

## Environment Variables

Copy `.env.example` to `.env` (root) and to `apps/api/.env`:

```env
# Server
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://orion:orion_dev_pass@localhost:5432/orion_dev

# Auth (Better Auth)
BETTER_AUTH_SECRET=<random-string-min-32-chars>
BETTER_AUTH_URL=http://localhost:4000

# CORS
CORS_ORIGIN=http://localhost:3000

# Frontend (Next.js public)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Production bootstrap (optional — used by bootstrap:prod script)
ADMIN_EMAIL=admin@sahay.local
ADMIN_PASSWORD=SahayAdmin123!
```

Turborepo reads: `SKIP_ENV_VALIDATION`, `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_API_URL`.

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- pnpm v9 — `npm i -g pnpm`
- Docker (for local PostgreSQL)

### Steps

```bash
# 1. Start local database
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Copy env files
cp .env.example .env

# 4. Run migrations + seed demo data
pnpm db:migrate
pnpm --filter=@orion/api seed

# 5. Start everything (API + Web in parallel via Turborepo)
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| DB Studio | `pnpm db:studio` |

---

## Scripts Reference

Run from the monorepo root:

| Script | Description |
|---|---|
| `pnpm dev` | Start all apps in dev mode (hot-reload, Turborepo TUI) |
| `pnpm build` | Production build for all apps and packages |
| `pnpm test` | Run all Vitest test suites |
| `pnpm lint` | ESLint across all workspaces (zero warnings policy) |
| `pnpm typecheck` | TypeScript type-check all packages |
| `pnpm format` | Prettier format all `.ts`, `.tsx`, `.md` files |
| `pnpm db:generate` | Generate Drizzle migration files from schema changes |
| `pnpm db:migrate` | Apply pending migrations to the database |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |
| `pnpm --filter=@orion/api seed` | Seed demo facilities, patients, and users |
| `pnpm --filter=@orion/api bootstrap:prod` | Bootstrap first admin user in production |

---

## Demo Credentials

> Available after running the seed script.

| Role | Email | Password |
|---|---|---|
| Origin (CHO) | `cho.wadgaon@sahay.demo` | `SahayDemoPass123!` |
| Destination (Desk) | `desk.rajgurunagar@sahay.demo` | `SahayDemoPass123!` |
| Supervisor | `supervisor.pune@sahay.demo` | `SahayDemoPass123!` |

---

## Security Notes

- Helmet middleware on all responses
- Strict CORS origin (configured via `CORS_ORIGIN` env var)
- Zod validation on every API input
- Facility isolation enforced in the service layer (never from request body)
- All secrets via env only — `.env*` is gitignored
- Outbox/SMS payloads contain **no clinical detail**
- Public status endpoint (`/api/v1/public`) exposes non-clinical fields only
- Synthetic patient data only — no real PHI in this repository
