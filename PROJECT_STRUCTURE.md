# APIConnector — Project Structure

> **Living document.** This file is kept in sync on **every change** to the codebase.
> When a file or directory is added, removed, or its purpose changes, update the
> matching row here in the same change. See [Maintenance rules](#maintenance-rules).

**Last updated:** 2026-07-10 (built marketing landing page + product dashboard; added SiteHeader)

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
| `pom.xml`               | Maven build: dependencies, Spring Boot parent (3.4.1), plugins. Lombok pinned to 1.18.46 for JDK 25 support. |
| `mvnw`, `mvnw.cmd`      | Maven Wrapper — runs Maven without a system install.                    |
| `docker-compose.yml`    | Local PostgreSQL 16 container (db/user/pass = `apiconnector`).          |
| `HELP.md`               | Spring Initializr-generated reference links.                            |
| `.gitignore`, `.gitattributes` | Git hygiene for a Maven/Java project.                            |

### `src/main/resources/`

| Path                       | Purpose                                                                        |
|----------------------------|--------------------------------------------------------------------------------|
| `application.properties`   | App config: server port, Postgres datasource, JPA, JWT, CORS, actuator. All values overridable via env vars. |

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
| `User.java`              | JPA entity for `users` table; also implements Spring `UserDetails` (principal).   |
| `Role.java`              | Enum of authorization roles: `USER`, `ADMIN`.                                     |
| `UserRepository.java`    | Spring Data JPA repo: `findByEmail`, `existsByEmail`.                             |
| `UserController.java`    | `GET /api/users/me` — returns the authenticated caller's profile (protected).     |

#### `security/` — Spring Security + JWT wiring

| Path                            | Purpose                                                                    |
|---------------------------------|----------------------------------------------------------------------------|
| `SecurityConfig.java`           | Filter chain: stateless sessions, CORS, public vs. protected routes, beans (`PasswordEncoder`, `AuthenticationManager`, `AuthenticationProvider`). |
| `JwtService.java`               | Generates and validates signed JWTs (HMAC-SHA).                            |
| `JwtAuthenticationFilter.java`  | Per-request filter: reads `Authorization: Bearer`, validates, sets security context. |
| `CustomUserDetailsService.java` | Loads a `User` by email for authentication.                                |
| `JwtProperties.java`            | Binds `app.security.jwt.*` (secret, expiration).                           |
| `CorsProperties.java`           | Binds `app.security.cors.*` (allowed origins).                             |

#### `common/exception/` — cross-cutting error handling

| Path                            | Purpose                                                                    |
|---------------------------------|----------------------------------------------------------------------------|
| `GlobalExceptionHandler.java`   | `@RestControllerAdvice` mapping exceptions → consistent JSON + HTTP status.|
| `ApiError.java`                 | Uniform error response body (timestamp, status, message, fieldErrors).     |
| `EmailAlreadyExistsException.java` | Thrown on duplicate-email registration → HTTP 409.                      |

### `src/test/java/com/joveo/apiconnector/`

| Path                              | Purpose                                                                  |
|-----------------------------------|--------------------------------------------------------------------------|
| `ApiconnectorApplicationTests.java` | Default context-load smoke test. **Note:** needs a running Postgres (or a test profile) to pass. |

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
| `layout.tsx`             | Root layout; fonts, metadata, wraps the tree in `<AuthProvider>`.          |
| `globals.css`            | Global styles / Tailwind entry; defines `brand` color tokens + smooth scroll. |
| `favicon.ico`            | Site favicon.                                                              |
| `page.tsx`               | Landing page `/` — marketing site: hero, 6-feature grid, how-it-works, AI-insights, CTA, footer. Auth-aware CTAs. |
| `login/page.tsx`         | `/login` — sign-in form.                                                   |
| `register/page.tsx`      | `/register` — account-creation form.                                       |
| `dashboard/page.tsx`     | `/dashboard` — protected product dashboard: KPI tiles, connections table, AI-insights panel (sample data). |

### `src/context/`

| Path                | Purpose                                                                         |
|---------------------|---------------------------------------------------------------------------------|
| `AuthContext.tsx`   | Client auth state: current user, `login`/`register`/`logout`, hydrates session from stored token. |

### `src/components/`

| Path                    | Purpose                                                                     |
|-------------------------|-----------------------------------------------------------------------------|
| `ProtectedRoute.tsx`    | Client guard; redirects to `/login` when unauthenticated.                   |
| `SiteHeader.tsx`        | Sticky marketing header with nav + auth-aware Login / Sign Up / Dashboard buttons. |

### `src/lib/`

| Path            | Purpose                                                                             |
|-----------------|-------------------------------------------------------------------------------------|
| `api.ts`        | `fetch` wrapper: base URL, JSON handling, bearer-token attach, `ApiError`; token localStorage helpers. |
| `authApi.ts`    | Auth API calls (`register`, `login`, `getCurrentUser`) built on `api.ts`.           |

### `src/types/`

| Path         | Purpose                                                                                |
|--------------|----------------------------------------------------------------------------------------|
| `auth.ts`    | TypeScript interfaces mirroring the backend auth DTOs.                                  |

---

## 5. API surface (current)

| Method | Path                  | Auth      | Purpose                          |
|--------|-----------------------|-----------|----------------------------------|
| POST   | `/api/auth/register`  | Public    | Create account, returns JWT.     |
| POST   | `/api/auth/login`     | Public    | Authenticate, returns JWT.       |
| GET    | `/api/users/me`       | Bearer    | Current user's profile.          |
| GET    | `/actuator/health`    | Public    | Liveness/readiness.              |

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
