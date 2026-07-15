# APIConnector — Project Structure

> **Living document.** This file is kept in sync on **every change** to the codebase.
> When a file or directory is added, removed, or its purpose changes, update the
> matching row here in the same change. See [Maintenance rules](#maintenance-rules).

**Last updated:** 2026-07-15 (added a live upstream API-test capability + SSRF guard, a
test-before-security 3-step Add-API wizard, an admin-gated plan-change endpoint + `/dashboard/admin`
page, and a real generated Swagger UI via springdoc-openapi; `AccountContext` now reads the real
`/api/usage/me` instead of a localStorage mock)

---

## 1. What this project is

**APIConnector** is an **API integration hub**: a service that connects to, orchestrates,
transforms, and routes calls across multiple third-party APIs. It exposes its own REST API
(secured with JWT) and ships a Next.js web UI for managing connections and viewing activity.

| Layer     | Technology                                                        | Root folder |
|-----------|-------------------------------------------------------------------|-------------|
| Backend   | Java 17, Spring Boot 3.4.1 (Web, Security, Data JPA, Validation)  | `backend/`  |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4    | `frontend/` |
| Database  | PostgreSQL 16 (via Spring Data JPA / Hibernate)                   | —           |
| Auth      | JWT bearer tokens (stateless), BCrypt password hashing            | —           |

The two roots are **independent projects** (separate build tooling, separate deploy units).

---

## 2. Repository layout (top level)

| Path                   | Purpose                                                            |
|------------------------|-------------------------------------------------------------------|
| `backend/`             | Spring Boot REST API. See [§3](#3-backend-backend).                |
| `frontend/`            | Next.js web application. See [§4](#4-frontend-frontend).           |
| `.github/workflows/`   | GitHub Actions CI. `backend-ci.yml` builds + runs backend tests (JDK 17, Postgres 16 service) on pushes/PRs touching `backend/`. |
| `context/`             | Terse, token-efficient reference for AI models (tech stack, domain model, glossary). |
| `flow/`                | How the system works — application, data, and auth flows.         |
| `README.md`            | Project overview and quick start (frontend + backend).            |
| `SETUP.md`             | Step-by-step local setup instructions.                            |
| `PROJECT_STRUCTURE.md` | This living document.                                             |

---

## 3. Backend (`backend/`)

Maven project. Base Java package: `com.joveo.apiconnector`.
Organized **package-by-feature** (`auth`, `user`) with cross-cutting concerns in
`security` and `common`.

### Top-level files

| Path                    | Purpose                                                                 |
|-------------------------|-------------------------------------------------------------------------|
| `pom.xml`               | Maven build: dependencies, Spring Boot parent (3.4.1), plugins. Lombok pinned to 1.18.46 for JDK 25 support. Includes `springdoc-openapi-starter-webmvc-ui` for a real, generated Swagger UI. |
| `mvnw`, `mvnw.cmd`      | Maven Wrapper — runs Maven without a system install.                    |
| `docker-compose.yml`    | Local PostgreSQL 16 container (db/user/pass = `apiconnector`).          |
| `HELP.md`               | Spring Initializr-generated reference links.                            |
| `.gitignore`, `.gitattributes` | Git hygiene for a Maven/Java project.                            |

### `src/main/resources/`

| Path                       | Purpose                                                                        |
|----------------------------|--------------------------------------------------------------------------------|
| `application.properties`   | App config: server port, Postgres datasource, JPA, JWT, CORS, actuator, and seed admin (`app.admin.*`). All values overridable via env vars. |

### `src/main/java/com/joveo/apiconnector/`

| Path                          | Purpose                                                                     |
|-------------------------------|-----------------------------------------------------------------------------|
| `ApiconnectorApplication.java`| Spring Boot entry point. `@ConfigurationPropertiesScan` binds `*Properties`. |

#### `auth/` — authentication feature (register / login)

| Path                        | Purpose                                                                       |
|-----------------------------|-------------------------------------------------------------------------------|
| `AuthController.java`        | REST endpoints: `POST /api/auth/register`, `POST /api/auth/login` (public).   |
| `AuthService.java`           | Business logic: create users, verify credentials, issue JWTs.                 |
| `dto/RegisterRequest.java`   | Validated request body for registration (email, password, fullName).         |
| `dto/LoginRequest.java`      | Validated request body for login (email, password).                          |
| `dto/AuthResponse.java`      | Response: token, token type, expiry, and a `UserSummary`.                     |

#### `user/` — user domain

| Path                     | Purpose                                                                           |
|--------------------------|-----------------------------------------------------------------------------------|
| `User.java`              | JPA entity for `users` table; also implements Spring `UserDetails` (principal). Has `role` + `plan`. |
| `Role.java`              | Enum of authorization roles: `USER`, `ADMIN`.                                     |
| `UserPlan.java`          | Enum of normal-user tiers: `REGULAR`, `PRO` (null for admins).                    |
| `UserRepository.java`    | Spring Data JPA repo: `findByEmail`, `existsByEmail`.                             |
| `UserController.java`    | `GET /api/users/me` — returns the authenticated caller's profile (protected).     |

#### `api/` — registered upstream APIs

| Path                     | Purpose                                                                           |
|--------------------------|-----------------------------------------------------------------------------------|
| `ApiDetail.java`         | JPA entity `api_details`: upstream API (URL, format, auth, `responseMode`, generated `uniformPath`). FK → user, workspace. |
| `AuthType.java`          | Enum: NONE, API_KEY, BASIC, BEARER_TOKEN, OAUTH2, HMAC, JWT (security schemes).    |
| `DataFormat.java`        | Enum: JSON, XML, CSV, SOAP, FORM_URLENCODED (payload formats).                     |
| `HttpMethod.java`        | Enum of HTTP methods used to call the upstream.                                   |
| `ResponseMode.java`      | Enum: DIRECT, WEBHOOK, AI_INSIGHT.                                                |
| `ConnectionStatus.java`  | Enum: DRAFT, ACTIVE, INACTIVE, ERROR.                                             |
| `ApiDetailRepository.java` | Repo: by user / workspace, `findByIdAndUserId`, `countByWorkspaceId`.           |
| `ApiDetailService.java`  | CRUD scoped to user; resolves workspace, generates `uniformPath`, cascades transformer deletes. |
| `ApiDetailController.java` | REST `/api/apis` (list/create/get/update/delete).                              |
| `dto/ApiDetailRequest.java`, `dto/ApiDetailResponse.java` | Request/response DTOs (response omits `authConfig`). |
| `ApiTestService.java`    | Executes a live, synchronous test call (ad-hoc or against a saved `ApiDetail`) to validate an upstream — separate from the planned runtime pipeline in `flow/data-flow.md`. |
| `ApiTestController.java`| REST: `POST /api/apis/test` (ad-hoc config) and `POST /api/apis/{id}/test` (saved API; credentials never leave the server). |
| `AuthConfigHeaderBuilder.java` | Builds upstream request headers from `AuthType` + `authConfig` JSON (NONE/API_KEY/BEARER_TOKEN/BASIC live; OAUTH2/HMAC/JWT raise `UnsupportedAuthTypeException`). |
| `SsrfGuard.java`         | Blocks live test calls to loopback/link-local/private-network hosts unless `app.connector.allow-private-network-hosts=true`. |
| `ConnectorTestProperties.java` | Binds `app.connector.*` (`allowPrivateNetworkHosts`).                     |
| `UnsupportedAuthTypeException.java` | Thrown for auth schemes not yet supported for live testing.           |
| `dto/ApiTestRequest.java`, `dto/ApiTestResponse.java` | Request/response DTOs for the live test endpoints. |

#### `workspace/` — API groupings

| Path                        | Purpose                                                                       |
|-----------------------------|-------------------------------------------------------------------------------|
| `Workspace.java`            | JPA entity `workspaces`: per-user grouping of APIs. FK → user.                |
| `WorkspaceRepository.java`  | Repo: `findByUserId...`, `findByIdAndUserId`.                                 |
| `WorkspaceService.java`     | CRUD scoped to user; delete cascades to APIs + their transformers.           |
| `WorkspaceController.java`  | REST `/api/workspaces` (list/create/get/update/delete).                      |
| `dto/WorkspaceRequest.java`, `dto/WorkspaceResponse.java` | Request/response DTOs (response includes `apiCount`). |

#### `transformer/` — data normalization config

| Path                        | Purpose                                                                       |
|-----------------------------|-------------------------------------------------------------------------------|
| `Transformer.java`          | JPA entity `transformers`: source→target format + JSON mapping `config` that normalizes an upstream into the uniform schema. FK → api_detail (nullable = global). |
| `TransformerRepository.java`| Repo: by api_detail / owning user, `deleteByApiDetailId`.                      |
| `TransformerService.java`   | CRUD scoped to user (via their APIs).                                          |
| `TransformerController.java`| REST `/api/transformers` (list/create/get/update/delete).                     |
| `dto/TransformerRequest.java`, `dto/TransformerResponse.java` | Request/response DTOs.                     |

#### `endpoint/` — published uniform URLs

| Path                            | Purpose                                                                    |
|---------------------------------|----------------------------------------------------------------------------|
| `UnifiedEndpoint.java`          | JPA entity `unified_endpoints`: the stable client-facing `url_path`, its links (user, api_detail, transformer), and the last-synced `cached_payload`. |
| `EndpointStatus.java`           | Enum: DRAFT, ACTIVE, INACTIVE, ERROR.                                      |
| `UnifiedEndpointRepository.java`| Repo: `findByUserId`, `findByUrlPath`.                                     |

#### `usage/` — AI-token usage tracking

| Path                            | Purpose                                                                    |
|---------------------------------|----------------------------------------------------------------------------|
| `TokenUsage.java`               | JPA entity `token_usage`: append-only consumption event (user, optional workspace/api, `tokens`, `source`). |
| `UsageSource.java`              | Enum: AI_INSIGHT, TRANSFORM, OTHER.                                        |
| `TokenUsageRepository.java`     | Repo: `sumTokensByUserId`, `sumTokensByWorkspaceId`, `sumAllTokens`.       |
| `UsageService.java`             | Records events (with ownership checks) and aggregates per-account/workspace usage. |
| `UsageController.java`          | `GET /api/usage/me`, `POST /api/usage` (protected).                        |
| `dto/RecordUsageRequest.java`   | Validated body for recording usage (positive `tokens`, optional attribution). |
| `dto/AccountUsageResponse.java` | Account token position: allotment / used / remaining + per-workspace list. |
| `dto/WorkspaceUsageResponse.java` | Per-workspace usage row (id, name, apiCount, tokensUsed).                |

#### `admin/` — admin monitoring + seeded admin account

| Path                            | Purpose                                                                    |
|---------------------------------|----------------------------------------------------------------------------|
| `AdminController.java`          | ROLE_ADMIN endpoints under `/api/admin`: `usage/summary`, `accounts`, `accounts/{id}`, `workspaces`, and `PATCH accounts/{id}/plan`. |
| `AdminService.java`             | Platform-wide views (delegates token aggregation to `UsageService`) plus the one admin-only mutation: `changePlan`. |
| `AdminProperties.java`          | Binds `app.admin.*` (enabled, email, password, fullName).                  |
| `AdminBootstrap.java`           | `ApplicationRunner` that seeds the ADMIN account on startup if missing (idempotent). |
| `dto/AccountSummaryResponse.java` | Per-account row for the admin list (plan, counts, token position).       |
| `dto/AdminWorkspaceResponse.java` | Workspace + owner + tokens used.                                         |
| `dto/PlatformUsageResponse.java` | Platform rollup (accounts, workspaces, apis, token totals).               |
| `dto/ChangePlanRequest.java`    | Admin-only request body to change a normal account's `UserPlan`.          |

#### `security/` — Spring Security + JWT wiring

| Path                            | Purpose                                                                    |
|---------------------------------|----------------------------------------------------------------------------|
| `SecurityConfig.java`           | Filter chain: stateless sessions, CORS, public vs. protected routes (incl. `/swagger-ui/**`, `/v3/api-docs/**`), beans (`PasswordEncoder`, `AuthenticationManager`, `AuthenticationProvider`). |
| `JwtService.java`               | Generates and validates signed JWTs (HMAC-SHA).                            |
| `JwtAuthenticationFilter.java`  | Per-request filter: reads `Authorization: Bearer`, validates, sets security context. |
| `CustomUserDetailsService.java` | Loads a `User` by email for authentication.                                |
| `JwtProperties.java`            | Binds `app.security.jwt.*` (secret, expiration).                           |
| `CorsProperties.java`           | Binds `app.security.cors.*` (allowed origins).                             |

#### `common/exception/` — cross-cutting error handling

| Path                            | Purpose                                                                    |
|---------------------------------|----------------------------------------------------------------------------|
| `GlobalExceptionHandler.java`   | `@RestControllerAdvice` mapping exceptions → consistent JSON + HTTP status, incl. `IllegalArgumentException` → 400. |
| `ApiError.java`                 | Uniform error response body (timestamp, status, message, fieldErrors).     |
| `EmailAlreadyExistsException.java` | Thrown on duplicate-email registration → HTTP 409.                      |
| `ResourceNotFoundException.java` | Thrown when a resource is missing or not owned → HTTP 404.                |
| `common/SlugUtil.java`          | Slugifies names for generated uniform paths.                              |
| `common/config/OpenApiConfig.java` | Generated OpenAPI/Swagger UI metadata (title, JWT bearer auth) for `/swagger-ui.html`. |

### `src/test/java/com/joveo/apiconnector/`

| Path                              | Purpose                                                                  |
|-----------------------------------|--------------------------------------------------------------------------|
| `ApiconnectorApplicationTests.java` | Default context-load smoke test. **Note:** needs a running Postgres (provided by the CI Postgres service, or local docker-compose) to pass. |
| `auth/AuthServiceTest.java`       | Unit tests for `AuthService` (register/login) with all collaborators mocked (Mockito). No Spring context, no DB. |
| `security/JwtServiceTest.java`    | Unit tests for `JwtService`: token generation, username extraction, validity, expiry, signature checks. No Spring context, no DB. |
| `common/SlugUtilTest.java`        | Parameterized unit tests for `SlugUtil.slugify`. No Spring context, no DB. |
| `user/UserPlanTest.java`          | Unit tests for per-plan AI-token allotments (`UserPlan.freeTokens*`). No Spring context, no DB. |
| `usage/UsageServiceTest.java`     | Unit tests for `UsageService`: record (ownership checks) + usage aggregation (Mockito). No DB. |
| `admin/AdminServiceTest.java`     | Unit tests for `AdminService`: account summaries, platform rollup, and `changePlan` (Mockito). No DB. |
| `api/SsrfGuardTest.java`          | Unit tests for `SsrfGuard`: rejects loopback/link-local/private/any-local hosts by default, using literal IPs (no DNS). No Spring context, no DB. |
| `api/AuthConfigHeaderBuilderTest.java` | Unit tests for `AuthConfigHeaderBuilder`: header building per `AuthType`, unsupported schemes, malformed JSON. No Spring context, no DB. |

---

## 4. Frontend (`frontend/`)

Next.js **App Router** project with a `src/` directory and the `@/*` import alias
(maps to `src/*`). The JWT is stored client-side (localStorage) and attached to API calls.

### Top-level files

| Path                   | Purpose                                                                    |
|------------------------|----------------------------------------------------------------------------|
| `package.json`         | Scripts (`dev`, `build`, `start`, `lint`) and dependencies.                |
| `.env.local`           | `NEXT_PUBLIC_API_BASE_URL` — backend base URL exposed to the browser.      |
| `next.config.ts`       | Next.js configuration.                                                     |
| `tsconfig.json`        | TypeScript config incl. the `@/*` path alias.                              |
| `eslint.config.mjs`    | ESLint (flat config) using `eslint-config-next`.                           |
| `postcss.config.mjs`   | PostCSS wiring for Tailwind CSS v4.                                        |
| `next-env.d.ts`        | Next.js ambient TypeScript types (generated; do not edit).                 |
| `AGENTS.md`, `CLAUDE.md` | Repo-specific AI guidance (this Next.js version has breaking changes).   |
| `public/`              | Static assets served at the site root (SVG logos, etc.).                   |

### `src/app/` — routes (App Router)

| Path                     | Purpose                                                                    |
|--------------------------|----------------------------------------------------------------------------|
| `layout.tsx`             | Root layout; fonts, metadata, wraps the tree in `<AuthProvider>`. `<body>` has `suppressHydrationWarning`. |
| `globals.css`            | Global styles / Tailwind entry; defines `brand` color tokens + smooth scroll. |
| `favicon.ico`            | Site favicon.                                                              |
| `page.tsx`               | Landing page `/` — marketing site: hero, 6-feature grid, how-it-works, AI-insights, CTA, footer. Auth-aware CTAs. |
| `login/page.tsx`         | `/login` — sign-in form.                                                   |
| `register/page.tsx`      | `/register` — account-creation form.                                       |

#### `src/app/dashboard/` — authenticated app (frontend-only, mock data)

| Path                     | Purpose                                                                    |
|--------------------------|----------------------------------------------------------------------------|
| `dashboard/layout.tsx`   | App shell: `ProtectedRoute` + `AccountProvider` + `WorkspaceProvider` + Sidebar + Topbar. |
| `dashboard/page.tsx`     | Overview (workspace-level): KPI tiles, token meter, recent connections, AI insights. Shows `NoWorkspace` if none. |
| `dashboard/apis/page.tsx`| Third-party APIs in the active workspace (cards, remove, link to explorer). |
| `dashboard/apis/new/page.tsx` | **3-step Add-API wizard**: (1) endpoint + a real "Test connection" call that must return a real HTTP response before continuing, (2) security scheme + credentials with an optional "Retest with credentials" call, (3) response mode + save. |
| `dashboard/explorer/page.tsx` | Swagger-style view of generated uniform URLs; "Try it" makes a **real** backend test call (`POST /api/apis/{id}/test`) and records real token usage (`POST /api/usage`). |
| `dashboard/analytics/page.tsx` | Analytics (workspace-level): pull/sync times, sync frequency, volume & downtime **charts**, uptime gauge. No add-API here. |
| `dashboard/account/page.tsx`  | Account (user-level): profile, **free-token** overview (from `/api/usage/me`), and a **read-only** plan display — only an admin can change it (see `/dashboard/admin`). |
| `dashboard/admin/page.tsx`    | **Admin-only** (ROLE_ADMIN): lists every account and lets an admin change its plan (`PATCH /api/admin/accounts/{id}/plan`). Renders "Not authorized" for non-admins. |

### `src/context/`

| Path                   | Purpose                                                                      |
|------------------------|------------------------------------------------------------------------------|
| `AuthContext.tsx`      | Client auth state: current user, `login`/`register`/`logout`, hydrates session from stored token. |
| `AccountContext.tsx`   | **User-level** store, **backed by the backend** (`GET /api/usage/me`): subscription `plan` (Regular/Pro, read-only) + **free-token** balance. Exposes `refresh()`; no client-side plan mutation (admin-only, see `dashboard/admin`). |
| `WorkspaceContext.tsx` | **Workspace-level** store, **backed by the backend REST API** (persists to Postgres). Loads on mount; `addSet`/`deleteSet`/`addApi`/`removeApi` call `/api/workspaces` + `/api/apis`. Exposes `loading`/`error`. Only the active-workspace selection is in localStorage. |

### `src/components/`

| Path                          | Purpose                                                               |
|-------------------------------|-----------------------------------------------------------------------|
| `ProtectedRoute.tsx`          | Client guard; redirects to `/login` when unauthenticated.             |
| `SiteHeader.tsx`              | Sticky marketing header with nav + auth-aware Login / Sign Up / Dashboard buttons. |
| `dashboard/Sidebar.tsx`       | App nav + workspace switcher with **add** + **delete workspace** + Account link; shows an **Admin** link when the caller is ROLE_ADMIN. |
| `dashboard/Topbar.tsx`        | Active workspace name, compact token meter, user + sign out.          |
| `dashboard/TokenMeter.tsx`    | Free-token usage bar (full + compact); reads `AccountContext`.        |
| `dashboard/NoWorkspace.tsx`   | Empty-state + create-workspace form shown on workspace-level pages when none exist. |
| `dashboard/DashboardLoading.tsx` | Shared "Loading…" shown while workspace data is fetched.           |
| `dashboard/Charts.tsx`        | Dependency-free BarChart / AreaChart / UptimeGauge (inline SVG/CSS).  |

### `src/lib/`

| Path            | Purpose                                                                             |
|-----------------|-------------------------------------------------------------------------------------|
| `api.ts`        | `fetch` wrapper: base URL, JSON handling, bearer-token attach, `ApiError`; token localStorage helpers. |
| `authApi.ts`    | Auth API calls (`register`, `login`, `getCurrentUser`) built on `api.ts`.           |
| `format.ts`     | Locale-independent `formatNumber` (avoids SSR hydration mismatches from `toLocaleString`). |
| `connectorApi.ts` | Typed calls to `/api/workspaces`, `/api/apis` (incl. `/test` and `/{id}/test`), `/api/usage` (`getMyUsage`/`recordUsage`), and `/api/admin/accounts` (list + `changeAccountPlan`). |

### `src/types/`

| Path            | Purpose                                                                             |
|-----------------|-------------------------------------------------------------------------------------|
| `auth.ts`       | TypeScript interfaces mirroring the backend auth DTOs.                               |
| `connector.ts`  | Connector UI types (ThirdPartyApi, ApiSet, SecurityScheme, ResponseMode, UsageTokens) + labels. |

---

## 4a. Docs directories (`context/`, `flow/`)

`context/` — dense reference optimized so AI assistants can load it instead of reading source (saves tokens):

| Path                       | Purpose                                                          |
|----------------------------|------------------------------------------------------------------|
| `context/README.md`        | What the folder is and how to maintain it.                       |
| `context/tech-stack.md`    | Stack, versions, package layout, conventions, gotchas.           |
| `context/domain-model.md`  | The DB schema: tables, columns, enums, relationships.            |
| `context/glossary.md`      | Product terms.                                                   |

`flow/` — narrative of how the system works:

| Path                        | Purpose                                                         |
|-----------------------------|-----------------------------------------------------------------|
| `flow/README.md`            | What the folder is.                                             |
| `flow/application-flow.md`  | User journeys; how features map to the model.                  |
| `flow/data-flow.md`         | The core request pipeline (client → uniform URL → upstream).   |
| `flow/auth-flow.md`         | Register / login / protected-request JWT flow.                 |

---

## 4b. Database schema

Six tables, created by Hibernate from the JPA entities (`ddl-auto=update`).
Full detail in [context/domain-model.md](context/domain-model.md).

| Table               | Entity            | Purpose                                             |
|---------------------|-------------------|-----------------------------------------------------|
| `users`             | `user/User`       | Accounts. `role` (USER/ADMIN) + `plan` (REGULAR/PRO).|
| `workspaces`        | `workspace/Workspace` | Per-user grouping of APIs (FK → users).         |
| `api_details`       | `api/ApiDetail`   | Registered upstream APIs (FK → users, workspaces). Has `response_mode` + generated `uniform_path`. |
| `transformers`      | `transformer/Transformer` | Normalization config → uniform schema.      |
| `unified_endpoints` | `endpoint/UnifiedEndpoint` | Uniform client-facing URL + cached data.   |
| `token_usage`       | `usage/TokenUsage` | Append-only AI-token consumption events (FK → users; optional workspace/api). |

---

## 5. API surface (current)

| Method | Path                     | Auth   | Purpose                                    |
|--------|--------------------------|--------|--------------------------------------------|
| POST   | `/api/auth/register`     | Public | Create account, returns JWT.               |
| POST   | `/api/auth/login`        | Public | Authenticate, returns JWT.                 |
| GET    | `/api/users/me`          | Bearer | Current user's profile.                    |
| GET/POST | `/api/workspaces`      | Bearer | List / create workspaces.                  |
| GET/PUT/DELETE | `/api/workspaces/{id}` | Bearer | Get / update / delete a workspace (cascades to its APIs). |
| GET/POST | `/api/apis`            | Bearer | List (optionally `?workspaceId=`) / create third-party APIs. |
| GET/PUT/DELETE | `/api/apis/{id}` | Bearer | Get / update / delete an API.              |
| POST   | `/api/apis/test`         | Bearer | Live test of an ad-hoc (not-yet-saved) upstream config. Credentials are transient. |
| POST   | `/api/apis/{id}/test`    | Bearer | Live test of a saved API using its persisted config; credentials never leave the server. |
| GET/POST | `/api/transformers`   | Bearer | List / create transformer objects.         |
| GET/PUT/DELETE | `/api/transformers/{id}` | Bearer | Get / update / delete a transformer. |
| GET    | `/api/usage/me`          | Bearer | Caller's AI-token position (allotment/used/remaining + per-workspace). |
| POST   | `/api/usage`             | Bearer | Record an AI-token consumption event.       |
| GET    | `/api/admin/usage/summary` | Admin | Platform-wide token & resource rollup.      |
| GET    | `/api/admin/accounts`    | Admin  | All accounts with their token positions.    |
| GET    | `/api/admin/accounts/{id}` | Admin | One account's detail + per-workspace breakdown. |
| PATCH  | `/api/admin/accounts/{id}/plan` | Admin | Change a normal account's plan (REGULAR/PRO). Admins have no plan and can't be targeted. |
| GET    | `/api/admin/workspaces`  | Admin  | All workspaces (owner + token consumption). |
| GET    | `/actuator/health`       | Public | Liveness/readiness.                        |
| —      | `/swagger-ui.html`       | Public | Generated OpenAPI/Swagger UI for this backend's own REST API (springdoc). |

All `Bearer` endpoints are scoped to the authenticated user; accessing another user's
resource returns 404. `authConfig` (credentials) is stored but never returned in responses —
the live-test endpoints never expose it either (`/{id}/test` resolves it server-side).

---

## 6. Running locally

See **[SETUP.md](SETUP.md)** for full details.

**Prerequisites:** JDK 17+ (verified on 17 and 25), Node 18+, Docker (for Postgres). The
backend build downloads dependencies from the Joveo Artifactory — **connect to the Joveo
VPN** for the first build.

```bash
# 1. Database
cd backend && docker compose up -d

# 2. Backend (http://localhost:8080)
./mvnw spring-boot:run

# 3. Frontend (http://localhost:3000)
cd ../frontend && npm run dev
```

---

## 7. Maintenance rules

This document is only useful if it stays accurate. On **every** change:

1. **Add a file/dir** → add a row in the matching table (§3 or §4).
2. **Remove a file/dir** → delete its row.
3. **Change a file's purpose** → update its description.
4. **Add/change an endpoint** → update §5.
5. **Change how to run the app** → update §6.
6. Bump **Last updated** at the top.

Keep descriptions to one line — this is a map, not full documentation.
