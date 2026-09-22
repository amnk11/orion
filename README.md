# Sahay — Care Access & Referral Coordination

A lightweight, offline-friendly digital care-transition platform that makes patient referrals between healthcare facilities visible, trackable, and accountable.

## Quick start

```bash
# 1. Start local database
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Run migrations + seed demo data
pnpm db:migrate
pnpm --filter=@orion/api seed

# 5. Start everything
pnpm dev
```

- **Frontend** → http://localhost:3000
- **API** → http://localhost:4000
- **DB Studio** → `pnpm db:studio`

## Workspace structure

```
sahay/
├── apps/
│   ├── api/          Express.js backend (REST API)
│   └── web/          Next.js 15 frontend (PWA)
├── packages/
│   ├── database/     Drizzle ORM schema + migrations
│   ├── logger/       Structured logging (winston/pino)
│   ├── eslint-config/    Shared ESLint config
│   └── typescript-config/ Shared TypeScript config
└── docker-compose.yml
```

## Demo credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Origin (CHO) | `cho.wadgaon@sahay.demo` | `SahayDemoPass123!` |
| Destination (Desk) | `desk.rajgurunagar@sahay.demo` | `SahayDemoPass123!` |
| Supervisor | `supervisor.pune@sahay.demo` | `SahayDemoPass123!` |

> ⚠️ **Prototype** — Realistic synthetic healthcare demonstration data only. Not for real clinical use.
