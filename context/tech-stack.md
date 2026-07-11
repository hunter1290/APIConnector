# Tech Stack & Conventions

## Stack
| Area      | Choice                                                             |
|-----------|-------------------------------------------------------------------|
| Backend   | Java 17, Spring Boot 3.4.1 (Web, Security, Data JPA, Validation, Actuator) |
| Build     | Maven (wrapper `./mvnw`). Deps resolve via Joveo Artifactory (**VPN required**). |
| DB        | PostgreSQL 16 (Docker: `backend/docker-compose.yml`). Schema via Hibernate `ddl-auto=update`. |
| Auth      | JWT bearer (stateless), BCrypt hashing. Secret + expiry in `app.security.jwt.*`. |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Token in localStorage. Dashboard `/dashboard/*` is **frontend-only/mock**: `AccountContext` (user-level: plan + free tokens) + `WorkspaceContext` (workspace-level: workspaces + APIs), pending backend. |
| Lombok    | Pinned `1.18.46` (JDK 25 compatibility).                          |

## Backend package layout (`com.joveo.apiconnector`)
Package-by-feature:
- `auth` — register/login controller, service, DTOs
- `user` — User entity (also Spring `UserDetails`), Role, UserPlan, repo, `/me`
- `api` — ApiDetail entity + enums (AuthType, DataFormat, HttpMethod, ConnectionStatus) + repo
- `transformer` — Transformer entity + repo
- `endpoint` — UnifiedEndpoint entity + EndpointStatus + repo
- `security` — SecurityConfig, JwtService, JwtAuthenticationFilter, CustomUserDetailsService, *Properties
- `common.exception` — GlobalExceptionHandler, ApiError, custom exceptions

## Conventions
- Entities: Lombok `@Getter/@Setter/@Builder/@NoArgsConstructor/@AllArgsConstructor`; timestamps via `@PrePersist/@PreUpdate` (`createdAt`, `updatedAt` as `Instant`).
- Enums persisted as `@Enumerated(EnumType.STRING)`.
- JSON-ish config columns stored as `text` (e.g. `auth_config`, `headers`, `config`, `cached_payload`).
- DTOs are Java `record`s; request DTOs use Jakarta Validation.
- Errors return a uniform `ApiError` JSON body.

## Gotchas
- Backend build/run needs the **Joveo VPN** (Artifactory) for first-time deps.
- JDK 25 default works only because Lombok is pinned to 1.18.46.
- `ddl-auto=update` is dev-only; switch to Flyway/Liquibase + `validate` before prod.
