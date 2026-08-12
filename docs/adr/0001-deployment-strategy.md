# ADR 0001: Vercel Blue/Green Deployment Strategy

- **Status:** Accepted for implementation; production validation pending
- **Date:** 2026-08-11
- **Decision owners:** Release engineering and operations

## Context

FinFlow is a static Vite SPA hosted on Vercel. The repository has no backend artifact or database migration. Production changes still require a versioned artifact, pre-promotion checks, manual approval, and a rollback path that does not require editing the live application.

## Decision

Use Vercel Deployments as the blue/green mechanism:

- Every candidate is built from a versioned Git revision with `npm ci` and `npm run build`.
- Vercel creates the candidate deployment without changing production traffic.
- After CI and required manual approval, the candidate is promoted to production.
- If the candidate violates an SLO or smoke check, the previous known-good deployment is promoted using `docs/runbooks/rollback.md`.
- Rollbacks are documented as incidents and followed by RCA when applicable.

This strategy targets rollback within five minutes from the decision. The target has not been rehearsed in this repository.

## Alternatives Considered

- **Canary routing:** not selected because this SPA has no current traffic-splitting requirement or observability evidence for percentage-based routing.
- **Git revert as the primary rollback:** not selected because it requires a new build and deployment, increasing recovery time. It remains the fallback when no previous Vercel deployment is usable.

## Consequences

Vercel deployment history becomes the source of truth for the previous known-good artifact. Release promotion still requires CI evidence, a manual approver, a defined deployment window, and notification through the operations channel. Domain ownership, Vercel project controls, and the rollback drill remain `NEEDS_INFO`/`NEEDS_REVIEW` until verified.
