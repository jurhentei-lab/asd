# EBMS Repo Scaffold Plan

## Structure
```text
apps/
  web/        # Next.js
  worker/     # Hono + GraphQL on Workers
packages/
  shared/     # enums/types/zod
  db/         # drizzle schema + queries
  rules-engine/
config/
  eligibility-rules.json
migrations/
scripts/
tests/
wrangler.toml
```

## First Files
1. `apps/worker/src/index.ts`
2. `apps/worker/src/auth.ts`
3. `packages/rules-engine/src/evaluate.ts`
4. `packages/db/src/schema.ts`
5. `packages/shared/src/types.ts`
6. `config/eligibility-rules.json`
7. `migrations/0001_init.sql`

## Boundaries
1. Worker is source of truth for eligibility.
2. Rules engine remains pure/testable.
3. DB writes flow through a single data package.
4. Integrations are adapter modules (OKR/attendance/email).
