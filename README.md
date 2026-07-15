# APIConnector

**APIConnector** is an **API integration hub** — a service that connects to, orchestrates,
transforms, and routes calls across multiple third-party APIs. It exposes its own
JWT-secured REST API and ships a web UI for managing connections and viewing activity.

This repository holds two independent projects:

| Project    | Stack                                                             | Folder      |
|------------|-------------------------------------------------------------------|-------------|
| Backend    | Java 17 · Spring Boot 3.4.1 (Web, Security, Data JPA, Validation) | `backend/`  |
| Frontend   | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4     | `frontend/` |
| Database   | PostgreSQL 16 (Spring Data JPA / Hibernate)                       | —           |
| Auth       | JWT bearer tokens (stateless) · BCrypt password hashing           | —           |

## Quick start

See **[SETUP.md](SETUP.md)** for full, step-by-step local setup instructions.

```bash
# 1. Database (from backend/)
cd backend && docker compose up -d

# 2. Backend API  -> http://localhost:8080   (requires Joveo VPN for the first build)
./mvnw spring-boot:run

# 3. Frontend UI  -> http://localhost:3000
cd ../frontend && npm install && npm run dev
```

## API surface (current)

| Method | Path                         | Auth   | Purpose                                         |
|--------|------------------------------|--------|-------------------------------------------------|
| POST   | `/api/auth/register`         | Public | Create account, returns JWT.                    |
| POST   | `/api/auth/login`            | Public | Authenticate, returns JWT.                      |
| GET    | `/api/users/me`              | Bearer | Current user's profile.                         |
| CRUD   | `/api/workspaces`            | Bearer | Manage the caller's workspaces.                 |
| CRUD   | `/api/apis`                  | Bearer | Manage the caller's upstream APIs.              |
| POST   | `/api/apis/test`             | Bearer | Live test of an ad-hoc (not-yet-saved) upstream config. |
| POST   | `/api/apis/{id}/test`        | Bearer | Live test of a saved API using its persisted config (credentials stay server-side). |
| CRUD   | `/api/transformers`          | Bearer | Manage transformers.                            |
| GET    | `/api/usage/me`              | Bearer | Caller's AI-token position (allotment/used/remaining + per-workspace). |
| POST   | `/api/usage`                 | Bearer | Record an AI-token consumption event.           |
| GET    | `/api/admin/usage/summary`   | Admin  | Platform-wide token & resource rollup.          |
| GET    | `/api/admin/accounts`        | Admin  | All accounts with their token positions.        |
| PATCH  | `/api/admin/accounts/{id}/plan` | Admin | Change a normal account's plan — the only way to change one (no frontend self-service). |
| GET    | `/api/admin/accounts/{id}`   | Admin  | One account's detail + per-workspace breakdown. |
| GET    | `/api/admin/workspaces`      | Admin  | All workspaces (owner + token consumption).     |
| GET    | `/actuator/health`           | Public | Health check.                                   |
| —      | `/swagger-ui.html`           | Public | Generated OpenAPI/Swagger UI for this API (springdoc). |

### Admin account (monitoring)

An **ADMIN** account is seeded on startup to monitor all accounts and AI-token consumption
(see [`backend/.../admin/AdminBootstrap.java`](backend/src/main/java/com/joveo/apiconnector/admin/AdminBootstrap.java)).
Local defaults (override in every real environment):

| Setting            | Env var             | Default                    |
|--------------------|---------------------|----------------------------|
| Email              | `ADMIN_EMAIL`       | `admin@apiconnector.local` |
| Password           | `ADMIN_PASSWORD`    | `Admin@12345`              |
| Seed on startup    | `ADMIN_SEED_ENABLED`| `true`                     |

Log in via `/api/auth/login` with those creds to receive an admin JWT, then call the
`/api/admin/**` endpoints (or use the `/dashboard/admin` page). Admin accounts have no
plan/token allotment of their own. **Only an admin can change a normal account's plan** —
there is no frontend self-service upgrade.

## Documentation

| Document                                     | What it covers                                        |
|----------------------------------------------|-------------------------------------------------------|
| [SETUP.md](SETUP.md)                         | Step-by-step local environment setup.                 |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Purpose of every directory and file (kept in sync).   |

## Repository layout

```
APIConnector/
├── backend/               Spring Boot REST API
│   └── src/main/java/com/joveo/apiconnector/
│       ├── auth/          Register / login endpoints + service + DTOs
│       ├── user/          User entity, repository, /me endpoint
│       ├── api/           Upstream API registrations (CRUD)
│       ├── workspace/     Workspaces (CRUD)
│       ├── transformer/   Response transformers (CRUD)
│       ├── endpoint/      Uniform endpoint model
│       ├── usage/         AI-token usage tracking (record + per-account/workspace)
│       ├── admin/         Admin monitoring API + seeded admin account
│       ├── security/      Spring Security + JWT filter/service/config
│       └── common/        Cross-cutting concerns (error handling)
├── frontend/              Next.js web application
│   └── src/
│       ├── app/           Routes (App Router): /, /login, /register, /dashboard
│       ├── context/       Auth state (AuthContext)
│       ├── components/    Shared UI (ProtectedRoute)
│       ├── lib/           API client + auth calls
│       └── types/         Shared TypeScript types
├── README.md              This file
├── SETUP.md               Local setup guide
└── PROJECT_STRUCTURE.md   Living structure map
```
