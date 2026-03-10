# EBMS Executive Summary

EBMS is a centralized benefits platform that automates eligibility decisions, contract acceptance, and HR governance. It replaces manual spreadsheets with a rule-driven engine integrated with OKR and attendance signals.

## Business Value
1. Transparent and explainable employee eligibility.
2. Consistent policy enforcement by HR.
3. Better financial control over subsidized benefits.
4. Strong audit/compliance posture via immutable logs.

## Hackathon Deliverable
1. End-to-end employee dashboard across all 11 benefits.
2. Real-time eligibility updates from policy signals.
3. Contract-gated request submission flow.
4. HR inspection and override capability.

## Immediate Priorities
1. Lock rule/state model consistency.
2. Finalize API contract and seed data.
3. Demo one full employee journey + one HR override journey.

## Dev Notes (Mar 10, 2026)
- `wrangler dev` requires macOS 13.5+ (Cloudflare `workerd` runtime). If you're on macOS 12.x:
  - Use DevContainer (Linux) via `.devcontainer/devcontainer.json`, then run `npm run dev`.
  - Or use `npm run dev:remote` (requires Cloudflare auth; uses remote runtime).
