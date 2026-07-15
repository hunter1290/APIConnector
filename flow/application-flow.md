# Application Flow

How the product fits together, from sign-up to serving a client request.

## Actors
- **Admin** — seeded ROLE_ADMIN account; monitors all accounts, workspaces, and AI-token
  consumption, and governs accounts (plan changes, Request-Pro approvals, enable/disable) via
  `/api/admin/**` (see `admin-monitoring.md`). No plan/allotment of its own.
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
6. Observe & analyze            → tracing (planned); AI insights are real today, on demand,
                                   for Pro accounts (platform-supplied credentials), not yet persisted
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
| 6. AI insights                 | `ai/AiProviderController` (fixed catalog) + `AI_analysis` microservice — real, on-demand analysis, **Pro plan only** (see `ai-analysis-flow.md`); automatic analysis over the (planned) runtime pipeline is still ahead |
| 7. AI-token usage & monitoring | `token_usage` + `/api/usage`; admin rollups `/api/admin/**` (see `admin-monitoring.md`) |
| 8. Admin governance            | account enable/disable + Request-Pro approve/reject (see `admin-monitoring.md`) |

## Frontend surface
- Public: `/` landing, `/login`, `/register`.
- Authenticated app (`/dashboard/*`) — shell with a **sidebar** (workspace switcher + add +
  **delete workspace**, Account link) and topbar (**free-token meter**).
- **Workspace-level** pages (operate on the active workspace; show a create-workspace empty
  state when there are none — there is **no default workspace**):
  - `/dashboard` — overview (KPIs, recent connections, AI insights)
  - `/dashboard/apis` + `/apis/new` — list third-party APIs; adding one is a **3-step wizard**:
    (1) endpoint — with a **"Paste a curl command"** import, a **headers** key-value editor,
    and a **request body** editor (key-value builder or raw; non-GET, JSON-validated) — + a
    real "Test connection" call that must succeed before continuing, (2) **security scheme** +
    credentials with an optional authenticated retest, (3) **response mode** (Direct / Webhook
    / AI) — if AI, pick a platform provider (**Pro plan only** — upsell shown otherwise) — + save
  - `/dashboard/explorer` — Swagger-style view of generated uniform URLs; "Try it" makes a
    **real** backend test call, records **real** token usage, and shows AI insights when a
    provider is attached
  - `/dashboard/ai-providers` — read-only view of the platform's fixed AI-provider catalog
    (APIConnector supplies the credentials); shows a Request-Pro upsell for non-Pro accounts
  - `/dashboard/analytics` — operational charts: pull/sync times, sync frequency, data volume,
    downtime, uptime gauge (no add-API here)
- **User-level** page:
  - `/dashboard/account` — profile, free-token overview (from `/api/usage/me`), a **read-only**
    plan display, and a **Request Pro** button (hidden while a request is pending) — only an
    admin can actually change the plan
- **Admin-only** page (ROLE_ADMIN):
  - `/dashboard/admin` — a pending-plan-requests queue (approve/reject) and every account with
    controls to change its plan and **enable/disable** its login access
- State: `AuthContext` (session), `AccountContext` (**user-level**: plan + tokens, backed by
  `/api/usage/me`), `WorkspaceContext` (**workspace-level**: workspaces + APIs). Routes gated
  by `ProtectedRoute`.

> **Status:** **Workspaces and third-party APIs now persist to the backend** (Postgres) via
> `WorkspaceContext` → `/api/workspaces` + `/api/apis` — the backend must be running.
> **AI-token usage and plan are now backend-backed end-to-end**: `AccountContext` reads
> `/api/usage/me`; the Explorer's "Try it" and the Add-API wizard's test steps hit the real
> `/api/apis/test` and `/api/apis/{id}/test` (now with real AI insights when a provider is
> attached); plan changes are admin-only, either directly or via Request-Pro approval; account
> enable/disable is admin-only. Still mock/local: analytics charts. Still planned: the runtime
> resolve/cache pipeline behind a published uniform URL (see `data-flow.md`), automatic recovery
> when an upstream is down, and persisting AI insights for later review.
