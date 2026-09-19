# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui (Radix UI) · PWA (Service Worker + IndexedDB) · TypeScript · pnpm monorepo (Turborepo)

## Users

**Origin-side** (primary, mobile-first): Community Health Officers (CHO), Auxiliary Nurse Midwives (ANM), and Medical Officers at AAM, Sub-Centre, or PHC level. They assess patients at the point of care — often in low-connectivity rural environments — using a shared or personal Android device. Their job is to create and track referrals.

**Destination-side** (primary, tablet/desktop): Referral desk, registration, or emergency nodal staff at PHC, CHC, or District Hospital. They review incoming referral requests and act on them (Accept / Cannot Accept / Redirect). Typically in a higher-connectivity setting with a fixed terminal or tablet.

**Supervisor** (secondary, read-oriented): Facility supervisors who monitor the referral pipeline — open referrals, unactioned ones, redirections, no-shows, pending return notes. No write actions required for the MVP.

## Product Purpose

Orion is a lightweight, offline-friendly digital care-transition platform for rural and underserved healthcare settings. It turns the patient referral from a paper slip or phone call into a shared, trackable **Handoff** — a single digital object that both the originating and receiving facility work on together. Its purpose is to make the transition between care levels visible, accountable, and complete: confirming a referral was received, acted on, and closed with a return outcome, so the origin health worker knows what happened to their patient.

## Positioning

Orion is not an EHR, a hospital-management system, or a telemedicine platform. Its only claim is coordination ownership of the care transition moment. It wraps around existing systems (eSanjeevani, ABHA, DVDMS) rather than replacing them. The differentiating mechanism is a single shared Handoff ID and an event log that both sides update — turning a unidirectional paper slip into a bilateral, auditable workflow.

## Operating Context

- Point-of-care in rural India: sporadic 2G/3G/4G, shared Android devices, limited digital literacy among some users.
- Healthcare facility types in the referral chain: AAM / Sub-Centre → PHC → CHC → District Hospital (FRU).
- SIH (Smart India Hackathon) prototype context: synthetic patient data only; no real clinical use; demo-ready with two browser windows or devices playing different roles.
- Offline creation is a first-class workflow: referrals must be creatable and locally stored without internet, with automatic sync on reconnection.
- The system is protocol-driven: referral forms are short, role-specific checklists (ANC danger-sign, Adult general) — not open-ended medical records.
- Urgency levels (Red / Yellow / Green) and a simple state machine (draft → sent → accepted/cannot_accept/redirected → arrived/no_show → return_noted → closed) govern every Handoff.
- Teleconsultation references (eSanjeevani ticket numbers) are stored, not conducted, inside Orion.

## Capabilities and Constraints

- **Offline-first origin side:** IndexedDB local storage, service-worker sync queue, QR code generation and a short SMS/reference message with the Handoff ID — all functional without internet.
- **Capability information is time-stamped, not live:** facility capability snapshots show verification age ("Last verified: 26 hours ago"); real-time stock or staff availability is explicitly out of scope.
- **No diagnosis, no AI triage:** the protocol checklist is rule-based completeness validation, not clinical decision support.
- **Not in MVP:** citizen-facing app, ASHA app, pharmacy management, national admin dashboard, live ambulance dispatch API, OPD queue management, full lab-information system, or real government API integration.
- **FHIR-aligned data model:** Handoff JSON maps to Patient, ServiceRequest, Task, and optional Encounter resources — enabling future interoperability without requiring live FHIR endpoints now.
- **Authentication:** Better Auth with role-based, facility-scoped access (origin / desk / supervisor).
- **Conflict strategy:** event-sourced state — Handoff state is derived from a valid event sequence, not last-write-wins.

## Brand Commitments

No logo, wordmark, or visual identity exists. "Orion" is the project name only. No brand constraints on visual direction.

## Evidence on Hand

- `orion-plan.md` (repo root) — comprehensive product specification including user flows, failure paths, data model, referral packet format, and technology architecture decisions.
- `README.md` — workspace setup, demo credentials (CHO, Desk, Supervisor roles), and app URLs.
- `apps/web/` — Next.js 16 codebase with routing for `/app`, `/inbox`, `/supervisor`, and `/login`; shadcn/ui component library integrated; Tailwind CSS v4 configured.
- `apps/api/` — Express.js REST API with Drizzle ORM and PostgreSQL.
- Synthetic patient and facility seed data (post `pnpm db:migrate` + `pnpm --filter=@orion/api seed`).
- No real patient data, no live government API credentials, no real facility data.

## Product Principles

1. **Coordination, not replacement.** Orion strengthens the handoff between existing systems and people; it does not try to absorb EHR, teleconsultation, or inventory functions.
2. **Offline is the baseline.** The origin-side flow must work without internet. Connectivity is a bonus, not a requirement.
3. **Information age is always visible.** Capability data is shown with its verification timestamp; Orion never presents stale information as live fact.
4. **Accountability through events.** Every state change is an immutable event with an actor, timestamp, and reason — making the referral auditable end-to-end.
5. **Build for the constraint, not the ideal.** Low-end devices, low literacy, short sessions, and intermittent connectivity are design inputs, not edge cases.

## Accessibility & Inclusion

WCAG 2.1 AA compliance required. Additional constraint: low-bandwidth and low-end device optimisation (minimal JS bundle, fast initial render, offline shell). Some users have limited digital literacy — UI must be task-obvious without training material.
