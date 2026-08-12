# Production Rollback Runbook

**Audience:** release engineering and operations  
**Status:** `NEEDS_REVIEW` until a rollback drill is executed  
**Target:** Vercel-hosted Vite SPA

## Preconditions

1. Confirm the production project and the current deployment ID.
2. Identify the previous known-good deployment in Vercel.
3. Record the current SHA, previous deployment ID, operator, time, and reason.
4. Confirm access to Vercel with deployment permissions and to the release incident record.
5. Do not promote an unknown deployment. Escalate to the release owner if the previous good deployment cannot be identified.

## Vercel Blue/Green Rollback

1. Open the Vercel project and its Deployments list.
2. Select the previous known-good deployment.
3. Use **Promote to Production** and confirm the target project and domain.
4. Verify `/`, `/dashboard`, `/analysis`, `/forecast`, and `/settings` from the production URL.
5. Record the deployment IDs, timestamps, operator, reason, and verification results in the incident or release record.
6. Notify the operations channel before and after the change.

**Objective:** complete promotion and smoke verification within 5 minutes of the rollback decision. This is a target, not evidence that a drill has been completed.

## Git Fallback

Use this only when no valid previous Vercel deployment exists:

```powershell
git switch -c rollback/<release>
git revert <sha-to-revert>
npm ci
npm test -- --run
npm run build
npm run lint
```

Open the required pull request and allow the normal Vercel deployment flow to create a new candidate. Do not force-push or edit production manually.

## Incident And Follow-Up

Every production rollback is recorded as an incident and receives an RCA when applicable. Attach deployment IDs, URLs, command output, smoke-test results, and the triggering SLO or symptom. A drill must be completed in a non-production environment before this runbook can be marked `PASS`.
