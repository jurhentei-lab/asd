# EBMS Implementation Backlog

## Epic 1: Platform
1. EBMS-001 Monorepo scaffold
2. EBMS-002 Cloudflare bindings (D1/R2/KV)
3. EBMS-003 JWT auth + role guards

## Epic 2: Data Layer
1. EBMS-010 Drizzle schema + migrations
2. EBMS-011 Immutable event tables
3. EBMS-012 Seed 11 benefits + rules

## Epic 3: Eligibility Engine
1. EBMS-020 Rule evaluator core
2. EBMS-021 Trigger-based recompute + KV invalidation
3. EBMS-022 Unit tests for all rule families

## Epic 4: GraphQL API
1. EBMS-030 Queries: `me`, `myBenefits`, `benefits`, `employee`, `auditLog`
2. EBMS-031 Mutations: request/confirm/cancel benefit
3. EBMS-032 HR mutations: override/review/upload contract

## Epic 5: Employee UI
1. EBMS-040 Dashboard cards + statuses
2. EBMS-041 Rule breakdown modal
3. EBMS-042 Contract-gated request flow

## Epic 6: HR UI
1. EBMS-050 Employee eligibility inspector
2. EBMS-051 Override flow with reason + expiry
3. EBMS-052 Rule config editor (MVP partial dual approval)

## Epic 7: Contracts & Notifications
1. EBMS-060 Contract versioning in R2
2. EBMS-061 Signed URL generation (7-day TTL)
3. EBMS-062 Request/expiry notifications

## Epic 8: Integrations
1. EBMS-070 OKR webhook + cron reconcile
2. EBMS-071 Attendance CSV/API adapter

## Hackathon MVP Cutline
1. Ship Epics 1-5, 6 (050/051), 7 (060/061).
2. Defer full dual-approval and integration hardening.
