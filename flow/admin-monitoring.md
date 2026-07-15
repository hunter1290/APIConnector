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

## Changing a plan (ROLE_ADMIN only — no self-service)
```
PATCH /api/admin/accounts/{id}/plan  { plan: "REGULAR" | "PRO" }
  → AdminService.changePlan
      • load the account (404 if missing)
      • reject if the target isn't a USER (admins carry no plan) → 400
      • set plan, save, return the updated AccountSummaryResponse
```
- Frontend: `/dashboard/admin` (ROLE_ADMIN only, linked from the sidebar) lists every account
  with a plan selector that calls this endpoint. A normal user's `/dashboard/account` page
  shows their plan **read-only** — `AccountContext` no longer has a self-service `upgradePlan`;
  it only reads `GET /api/usage/me`.

## Where it lives
| Concern                | Code                                                        |
|------------------------|-------------------------------------------------------------|
| Consumption events     | `usage/TokenUsage` (`token_usage`), `usage/UsageSource`      |
| Record + aggregate     | `usage/UsageService`, `usage/UsageController` (`/api/usage`) |
| Per-plan allotment     | `user/UserPlan.freeTokens()`                                |
| Admin views            | `admin/AdminService`, `admin/AdminController` (`/api/admin`) |
| Plan changes           | `AdminService.changePlan`, `PATCH /api/admin/accounts/{id}/plan`, `/dashboard/admin` |
| Seed admin             | `admin/AdminBootstrap`, `admin/AdminProperties`             |

## Current vs. planned
- **Built:** token_usage model, record + `/me` API, admin monitoring API, seeded admin,
  authorization, admin-gated plan changes (backend + `/dashboard/admin` UI), and the
  frontend free-token meter/plan (`AccountContext`) wired to `/api/usage/me`. The
  Explorer's "Try it" records real usage via `POST /api/usage`.
- **Planned:** the runtime executor emitting usage automatically during AI_INSIGHT calls on
  the (still-planned) resolve/cache pipeline, rather than only on explicit test/try-it calls.
