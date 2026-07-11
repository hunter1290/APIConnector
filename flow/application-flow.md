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
- Authenticated: `/dashboard` (KPIs, connections table, AI insights — sample data today).
- Auth state held in `AuthContext`; protected routes gated by `ProtectedRoute`.
