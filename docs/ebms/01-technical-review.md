# EBMS Technical Review (TDD v1.0)

## Critical Findings
1. Status model conflict: `BenefitStatus` and request lifecycle overlap (`ACTIVE` appears in both concepts).
- Fix: split into `eligibility_status` and `enrollment_status`.

2. Probation modeling is contradictory.
- Current text mixes probation as status and condition.
- Fix: keep `employment_status` and add `is_probation`/`probation_end_date`.

3. Core benefit bypass rules are policy-only, not schema-enforced.
- Fix: add `is_core` and engine precedence rules.

4. Mutable computed eligibility table weakens audit guarantees.
- Fix: append-only event tables for decisions/overrides.

5. Dual-approval requirement lacks implementation model.
- Fix: add rule-change request workflow tables and states.

## High-Risk Gaps
1. Rolling 30-day attendance window/timezone semantics undefined.
2. Idempotency incomplete across all ingest paths.
3. Contract acceptance record should include user-agent/session snapshot.
4. HR permissions need finer granularity than single `hr_admin` role.
5. `<500ms` target needs benchmark + stale-while-revalidate strategy.

## MVP Corrections
1. Normalize domain states.
2. Separate probation from employment lifecycle.
3. Add immutable event logs.
4. Implement rule-change approval workflow.
5. Define strict runtime spec for time/idempotency behavior.
