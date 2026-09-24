# Sahay CI/CD Documentation

## Architecture
The Sahay monorepo utilizes GitHub Actions for continuous integration and environment gating. The pipeline employs Turborepo caching to minimize build times and ensures the `pnpm` lockfile is strictly respected.

## CI Flow
Triggered on every PR and push to `main`.
1. **Secret Scanning**: Runs Gitleaks to block exposed credentials.
2. **Setup**: Provisions Node.js 20, pnpm 9, and an ephemeral PostgreSQL 15 service container.
3. **Audit**: Evaluates production dependencies against known vulnerabilities via `pnpm audit`.
4. **Validation**: Enforces strict TypeScript checks (`pnpm typecheck`) and ESLint (`pnpm lint`).
5. **Database**: Executes Drizzle migrations (`pnpm turbo db:migrate`) against the ephemeral DB to guarantee schema validity.
6. **Testing**: Runs Vitest unit/integration tests and Playwright E2E offline-sync regression tests.
7. **Build**: Executes the exact Next.js and Express build commands targeting production readiness.

## Staging & Production Flow (CD)
CD relies on the hosting provider's native GitHub integration (e.g., Vercel, AWS Amplify) configured across specific branch rules.

1. **Staging**: Merges to `main` automatically deploy to the Staging environment. 
2. **Smoke Tests**: Validates `/api/health`, authenticates synthetic actors, and verifies offline routing integrity.
3. **Production Promotion**: Requires a manual approval gate configured via GitHub Environments.

### Database Migration Procedure
Database migrations are applied post-build but pre-traffic switch. In environments like Vercel, this is achieved via the `vercel-build` script overriding standard build to sequentially run `db:migrate` followed by the app compilation.

### Rollback Procedure
1. Roll back the deployment via the hosting provider's dashboard (e.g., Vercel "Redeploy previous commit").
2. **Database Rollbacks**: Sahay avoids destructive migrations. We follow the expand/contract pattern. If a destructive rollback is truly required, it must be performed manually by a database administrator via the `drizzle-kit` CLI using explicit down-migrations or point-in-time recovery (PITR) snapshots.

## Required Environment Variables & Secrets
The CI pipeline automatically injects isolated, synthetic variables for E2E testing. 
For actual Staging/Production deployments, the following must be securely configured in the hosting provider:

- `DATABASE_URL` (Mandatory Postgres connection string)
- `BETTER_AUTH_SECRET` (Cryptographic key for session tokens)
- `NEXT_PUBLIC_API_URL` (Publicly resolvable API gateway URL)
- `CORS_ORIGIN` (Frontend origin for API whitelisting)

*Note: Never store these in plaintext files or GitHub standard variables.*
