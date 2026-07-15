# Admin Monitoring & AI-Token Usage Flow

How the platform tracks AI-token consumption per account/workspace, and how an
ADMIN observes it across everyone.

## Actors
- **Normal user** — consumes AI tokens; sees only their own usage.
- **Admin** — a seeded ROLE_ADMIN account; sees every account and workspace.

## Seeding the admin (startup)
```
app.admin.enabled=true  → AdminBootstrap (ApplicationRunner)
   • if no user with app.admin.email exists:
       create users row (role=ADMIN, plan=null, BCrypt password)
   • idempotent: skips if it already exists
Defaults (override via env): ADMIN_EMAIL=admin@apiconnector.local, ADMIN_PASSWORD=Admin@12345
```

## Recording consumption (normal user / the app)
```
POST /api/usage  Bearer <user JWT>
  { workspaceId?, apiDetailId?, tokens, source?, description? }
  → UsageService.record
      • validate workspace/api ownership if referenced (else 404)
      • insert token_usage row (append-only; source defaults AI_INSIGHT)
  → 201 AccountUsageResponse (allotment / used / remaining + per-workspace breakdown)

GET /api/usage/me  Bearer <user JWT>
  → same AccountUsageResponse for the caller
```
- **Allotment** comes from the account's plan (`UserPlan.freeTokens()`): REGULAR 10k, PRO 100k.
- **Used** = `sum(token_usage.tokens)` for the account; **remaining** = `max(0, allotment − used)`.

## Admin monitoring (ROLE_ADMIN only)
```
GET /api/admin/usage/summary   → platform rollup:
                                  totalAccounts, totalWorkspaces, totalApis,
                                  totalTokenAllotment, totalTokensUsed, totalTokensRemaining
GET /api/admin/accounts        → every USER account: plan, workspace/api counts,
                                  allotment / used / remaining
GET /api/admin/accounts/{id}   → one account + per-workspace token breakdown
GET /api/admin/workspaces      → every workspace: owner + tokens used
```
- Guarded twice: `SecurityConfig` (`/api/admin/** → hasRole('ADMIN')`) and
  `@PreAuthorize("hasRole('ADMIN')")` on the controller. Non-admin → **403**.
- All aggregation is delegated to `UsageService`, so admin totals match the per-account API.

## Changing a plan directly (ROLE_ADMIN only — no self-service)
```
PATCH /api/admin/accounts/{id}/plan  { plan: "REGULAR" | "PRO" }
  → AdminService.changePlan
      • load the account (404 if missing)
      • reject if the target isn't a USER (admins carry no plan) → 400
      • set plan, save, return the updated AccountSummaryResponse
```

## Requesting a plan upgrade (Request-Pro workflow)
Normal users can't self-upgrade, but they can *ask* — with a full, auditable history of
every request, not just the latest:
```
POST /api/plan-requests  Bearer <user JWT>
  → PlanUpgradeRequestService.request
      • 400 if the caller is already PRO
      • 400 if the caller already has a PENDING request
      • else insert a PENDING plan_upgrade_requests row
  → 201 PlanUpgradeRequestResponse

GET /api/plan-requests/me  Bearer <user JWT>
  → the caller's latest request (any status), or 204 if they've never requested
```
```
GET  /api/admin/plan-requests               → every PENDING request, oldest first
POST /api/admin/plan-requests/{id}/approve  → PlanUpgradeRequestService.approve
                                                • delegates to AdminService.changePlan(user, PRO)
                                                • marks APPROVED, sets resolvedAt/resolvedByEmail
POST /api/admin/plan-requests/{id}/reject   → marks REJECTED, sets resolvedAt/resolvedByEmail
                                                (no plan change)
```
Both approve/reject 400 if the request isn't still PENDING (already resolved).

## Enabling/disabling an account (ROLE_ADMIN only)
```
PATCH /api/admin/accounts/{id}/enabled  { enabled: true | false }
  → AdminService.setEnabled
      • load the account (404 if missing)
      • reject if the target isn't a USER (admins can't be disabled) → 400
      • set enabled, save, return the updated AccountSummaryResponse
```
- Enforced at login: `User.isEnabled()` now reads this flag (was hardcoded `true`); Spring
  Security's `DaoAuthenticationProvider` throws `DisabledException` for a disabled account,
  mapped by `GlobalExceptionHandler` to **403** "This account has been disabled."
- **Not** enforced per-request: `JwtAuthenticationFilter` only checks signature/expiry, so an
  already-issued JWT for a disabled account keeps working until it naturally expires (≤ 1h
  by default). Disabling stops *future* logins, not an active session immediately.

## Frontend
`/dashboard/admin` (ROLE_ADMIN only, linked from the sidebar) shows: a pending-plan-requests
queue with Approve/Reject, and an accounts table with a plan selector + an Enable/Disable
toggle. A normal user's `/dashboard/account` page shows their plan **read-only** plus a
"Request Pro upgrade" button (hidden while a request is pending) — `AccountContext` has no
self-service plan mutation; it only reads `GET /api/usage/me`.

## Where it lives
| Concern                | Code                                                        |
|------------------------|-------------------------------------------------------------|
| Consumption events     | `usage/TokenUsage` (`token_usage`), `usage/UsageSource`      |
| Record + aggregate     | `usage/UsageService`, `usage/UsageController` (`/api/usage`) |
| Per-plan allotment     | `user/UserPlan.freeTokens()`                                |
| Admin views            | `admin/AdminService`, `admin/AdminController` (`/api/admin`) |
| Plan changes (direct)  | `AdminService.changePlan`, `PATCH /api/admin/accounts/{id}/plan` |
| Plan changes (requested) | `planrequest/PlanUpgradeRequestService`, `planrequest/PlanRequestController` |
| Account enable/disable | `AdminService.setEnabled`, `PATCH /api/admin/accounts/{id}/enabled`, `user/User.enabled` |
| Seed admin             | `admin/AdminBootstrap`, `admin/AdminProperties`             |

## Current vs. planned
- **Built:** token_usage model, record + `/me` API, admin monitoring API, seeded admin,
  authorization, admin-gated plan changes (direct + requested, with full request history),
  account enable/disable, and the frontend free-token meter/plan (`AccountContext`) wired to
  `/api/usage/me`. The Explorer's "Try it" records real usage via `POST /api/usage`.
- **Planned:** the runtime executor emitting usage automatically during AI_INSIGHT calls on
  the (still-planned) resolve/cache pipeline, rather than only on explicit test/try-it calls.
  Real-time JWT revocation on disable (would need a deny-list or much shorter token lifetimes).
