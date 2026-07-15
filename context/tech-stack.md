# Tech Stack & Conventions

## Stack
| Area      | Choice                                                             |
|-----------|-------------------------------------------------------------------|
| Backend   | Java 17, Spring Boot 3.4.1 (Web, Security, Data JPA, Validation, Actuator) |
| Build     | Maven (wrapper `./mvnw`). Deps resolve via Joveo Artifactory (**VPN required**). |
| DB        | PostgreSQL 16 (Docker: `backend/docker-compose.yml`). Schema via Hibernate `ddl-auto=update`. |
| Auth      | JWT bearer (stateless), BCrypt hashing. Secret + expiry in `app.security.jwt.*`. |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Token in localStorage. `AccountContext` and `WorkspaceContext` are both backend-backed (Postgres via the REST API); only the active-workspace selection is local. |
| AI_analysis | Node.js + TypeScript + Express (`AI_analysis/`). Stateless — no DB. Calls the real Anthropic Messages API / OpenAI Chat Completions API. Internal-only: the backend calls it with a shared secret (`X-Internal-Secret`); never called by the frontend. |
| Lombok    | Pinned `1.18.46` (JDK 25 compatibility).                          |
| Mockito   | Pinned `5.20.0` + Surefire `argLine=-Dnet.bytebuddy.experimental=true` (JDK 25 compatibility — see Gotchas). |
| JSONata   | `com.dashjoin:jsonata` `0.9.8` — executes `transformers.config` expressions server-side (`transformer/JsonataTransformService`). |

## Backend package layout (`com.joveo.apiconnector`)
Package-by-feature:
- `auth` — register/login controller, service, DTOs
- `user` — User entity (also Spring `UserDetails`), Role, UserPlan, repo, `/me`
- `api` — ApiDetail entity + enums (AuthType, DataFormat, HttpMethod, ConnectionStatus) + repo; also the live-test capability (`ApiTestService`/`ApiTestController`, `AuthConfigHeaderBuilder`, `SsrfGuard`)
- `transformer` — Transformer entity + repo; `JsonataTransformService` compiles/evaluates its `config` (a JSONata expression) against parsed JSON via `com.dashjoin:jsonata`; `TransformerService`/`TransformerController` expose ad-hoc + saved test endpoints, wrapping failures in `TransformExecutionException` (never a 500)
- `endpoint` — UnifiedEndpoint entity + EndpointStatus + repo
- `usage` — TokenUsage entity + UsageSource + repo, UsageService, `/api/usage` (record + `/me`)
- `ai` — fixed AI-provider catalog + `AiAccessGuard` (Pro-plan gate) + controller (`/api/ai-providers`: catalog + `/analyze`); `AiAnalysisClient` calls the `AI_analysis` microservice with no API key (AI_analysis holds its own credentials via `.env`)
- `admin` — AdminController/Service (`/api/admin/**`, ROLE_ADMIN: monitoring + `changePlan` + `setEnabled`), AdminProperties + AdminBootstrap (seed admin)
- `planrequest` — PlanUpgradeRequest entity + repo/service/controller: `/api/plan-requests` (user) + `/api/admin/plan-requests` (admin queue/approve/reject)
- `security` — SecurityConfig, JwtService, JwtAuthenticationFilter, CustomUserDetailsService, *Properties
- `common.exception` — GlobalExceptionHandler, ApiError, custom exceptions
- `common.config` — OpenApiConfig (springdoc Swagger UI metadata)

## Conventions
- Entities: Lombok `@Getter/@Setter/@Builder/@NoArgsConstructor/@AllArgsConstructor`; timestamps via `@PrePersist/@PreUpdate` (`createdAt`, `updatedAt` as `Instant`).
- Enums persisted as `@Enumerated(EnumType.STRING)`.
- JSON-ish config columns stored as `text` (e.g. `auth_config`, `headers`, `config`, `cached_payload`).
- DTOs are Java `record`s; request DTOs use Jakarta Validation.
- Errors return a uniform `ApiError` JSON body.

## Gotchas
- Backend build/run needs the **Joveo VPN** (Artifactory) for first-time deps.
- A seed **ADMIN** account is created on startup from `app.admin.*` (default `admin@apiconnector.local` / `Admin@12345`). Override `ADMIN_PASSWORD` everywhere real; disable with `ADMIN_SEED_ENABLED=false`.
- JDK 25 default works only because Lombok is pinned to 1.18.46.
- JDK 25 also needed a Mockito fix: Spring Boot's managed Mockito's ByteBuddy officially
  supports only up to Java 24 (`Could not modify all classes` / `Java 25 (69) is not
  supported`). Fixed by pinning `mockito.version` to `5.20.0` **and** setting Surefire's
  `argLine=-Dnet.bytebuddy.experimental=true` (ByteBuddy's documented escape hatch) — both are
  required together; either alone still fails. If a future JDK bump reintroduces this, bump
  `mockito.version` again first.
- `ddl-auto=update` is dev-only; switch to Flyway/Liquibase + `validate` before prod.
- Adding a new **non-nullable** column via `ddl-auto=update` fails against a non-empty table
  unless you give it a DB-level default (`columnDefinition = "... not null default ..."` on
  the `@Column`) — Hibernate's generated `ALTER TABLE ADD COLUMN ... NOT NULL` has no default
  otherwise. Bit us once with `users.enabled`; fixed with `columnDefinition`.
- Live upstream tests (`POST /api/apis/test`, `/api/apis/{id}/test`) refuse loopback/link-local/private-network hosts by default (`SsrfGuard`); flip `app.connector.allow-private-network-hosts=true` only for trusted local/dev setups that need a private upstream.
- `springdoc-openapi-starter-webmvc-ui` (added for `/swagger-ui.html`) also resolves via the Joveo Artifactory.
- `app.ai.analysis.shared-secret` (backend) and `AI_analysis`'s `INTERNAL_SHARED_SECRET` must
  match exactly, or every analysis call 401s from `AI_analysis` (surfaced as `insights: null`,
  not a hard error, on the backend side).
- Disabling an account (`users.enabled = false`) blocks future logins immediately but does
  **not** revoke an already-issued JWT — `JwtAuthenticationFilter` only checks signature/expiry.
  A disabled user's existing token stays valid until it naturally expires (≤ 1h by default).
