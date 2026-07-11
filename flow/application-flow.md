# Application Flow

How the product fits together, from sign-up to serving a client request.

## Actors
- **Admin** — manages users and platform-wide config.
- **Normal user** (REGULAR / PRO) — registers upstream APIs and publishes uniform endpoints.
- **Client** — an external consumer that calls a published uniform URL.

## Journey: from account to a live uniform endpoint
```
1. Sign up / log in            → users row (role=USER, plan=REGULAR), JWT issued
2. Register an upstream API     → api_details row (base_url, format, auth_type, ...)
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
| 4. Observability & tracing     | request pipeline (see `data-flow.md`); log table planned    |
| 5. Error handling              | `GlobalExceptionHandler` + endpoint `status` = ERROR        |
| 6. AI insights                 | analysis over synced payloads/logs (planned)                |

## Frontend surface
- Public: `/` landing, `/login`, `/register`.
- Authenticated app (`/dashboard/*`) — shell with a **sidebar** (workspace switcher + add +
  **delete workspace**, Account link) and topbar (**free-token meter**).
- **Workspace-level** pages (operate on the active workspace; show a create-workspace empty
  state when there are none — there is **no default workspace**):
  - `/dashboard` — overview (KPIs, recent connections, AI insights)
  - `/dashboard/apis` + `/apis/new` — list and add third-party APIs (**security scheme** +
    credentials, **response mode**: Direct / Webhook / AI)
  - `/dashboard/explorer` — Swagger-style view of generated uniform URLs; "Try it" consumes tokens
  - `/dashboard/analytics` — operational charts: pull/sync times, sync frequency, data volume,
    downtime, uptime gauge (no add-API here)
- **User-level** page:
  - `/dashboard/account` — profile, free-token overview, and **plan upgrade** (Regular ↔ Pro)
- State: `AuthContext` (session), `AccountContext` (**user-level**: plan + tokens),
  `WorkspaceContext` (**workspace-level**: workspaces + APIs). Routes gated by `ProtectedRoute`.

> **Status:** **Workspaces and third-party APIs now persist to the backend** (Postgres) via
> `WorkspaceContext` → `/api/workspaces` + `/api/apis` — the backend must be running. Still
> mock/local: the free-token meter + plan (`AccountContext`), "Try it", and analytics charts.
> Next: wire transformers, usage/tokens, and plan to the backend too.
