# Application Flow

How the product fits together, from sign-up to serving a client request.

## Actors
- **Admin** — seeded ROLE_ADMIN account; monitors all accounts, workspaces, and AI-token
  consumption via `/api/admin/**` (see `admin-monitoring.md`). No plan/allotment of its own.
- **Normal user** (REGULAR / PRO) — registers upstream APIs and publishes uniform endpoints;
  consumes a per-plan AI-token allotment.
- **Client** — an external consumer that calls a published uniform URL.

## Journey: from account to a live uniform endpoint
```
1. Sign up / log in            → users row (role=USER, plan=REGULAR), JWT issued
2. Register an upstream API     → validate it live first (test-before-security wizard,
                                   see below), then api_details row (base_url, format,
                                   auth_type, ...)
3. Define a transformer         → transformers row (source→target format, mapping config)
4. Publish a uniform endpoint   → unified_endpoints row (url_path, links api + transformer)
5. Client calls the uniform URL → APIConnector fetches upstream, transforms, returns JSON
6. Observe & analyze            → tracing + AI insights (planned tables)
```

## How the six product capabilities map to the model
| Capability                     | Where it lives                                              |
|--------------------------------|-------------------------------------------------------------|
| 1. One uniform API URL         | `unified_endpoints.url_path` (stable, per-client path)      |
| 2. Format normalization        | `transformers.source_format → target_format` + `config`     |
| 3. Security translation        | `api_details.auth_type` + `auth_config` → client's scheme   |
| 3a. Live validation             | `api/ApiTestService` — real test call before/after saving (see `data-flow.md`) |
| 4. Observability & tracing     | request pipeline (see `data-flow.md`); log table planned    |
| 5. Error handling              | `GlobalExceptionHandler` + endpoint `status` = ERROR; no auto-recovery yet when an upstream is down |
| 6. AI insights                 | analysis over synced payloads/logs (planned)                |
| 7. AI-token usage & monitoring | `token_usage` + `/api/usage`; admin rollups `/api/admin/**` (see `admin-monitoring.md`) |

## Frontend surface
- Public: `/` landing, `/login`, `/register`.
- Authenticated app (`/dashboard/*`) — shell with a **sidebar** (workspace switcher + add +
  **delete workspace**, Account link) and topbar (**free-token meter**).
- **Workspace-level** pages (operate on the active workspace; show a create-workspace empty
  state when there are none — there is **no default workspace**):
  - `/dashboard` — overview (KPIs, recent connections, AI insights)
  - `/dashboard/apis` + `/apis/new` — list third-party APIs; adding one is a **3-step wizard**:
    (1) endpoint + a real "Test connection" call that must succeed before continuing,
    (2) **security scheme** + credentials with an optional authenticated retest,
    (3) **response mode** (Direct / Webhook / AI) + save
  - `/dashboard/explorer` — Swagger-style view of generated uniform URLs; "Try it" makes a
    **real** backend test call and records **real** token usage
  - `/dashboard/analytics` — operational charts: pull/sync times, sync frequency, data volume,
    downtime, uptime gauge (no add-API here)
- **User-level** page:
  - `/dashboard/account` — profile and free-token overview (from `/api/usage/me`); plan is
    **read-only** — only an admin can change it
- **Admin-only** page (ROLE_ADMIN):
  - `/dashboard/admin` — every account, with a control to change its plan
    (`PATCH /api/admin/accounts/{id}/plan`)
- State: `AuthContext` (session), `AccountContext` (**user-level**: plan + tokens, backed by
  `/api/usage/me`), `WorkspaceContext` (**workspace-level**: workspaces + APIs). Routes gated
  by `ProtectedRoute`.

> **Status:** **Workspaces and third-party APIs now persist to the backend** (Postgres) via
> `WorkspaceContext` → `/api/workspaces` + `/api/apis` — the backend must be running.
> **AI-token usage and plan are now backend-backed end-to-end**: `AccountContext` reads
> `/api/usage/me`; the Explorer's "Try it" and the Add-API wizard's test steps hit the real
> `/api/apis/test` and `/api/apis/{id}/test`; plan changes are admin-only via
> `/dashboard/admin` → `/api/admin/accounts/{id}/plan`. Still mock/local: analytics charts.
> Still planned: the runtime resolve/cache pipeline behind a published uniform URL (see
> `data-flow.md`) and automatic recovery when an upstream is down.
