# APIConnector

**APIConnector** is an **API integration hub** — a service that connects to, orchestrates,
transforms, and routes calls across multiple third-party APIs. It exposes its own
JWT-secured REST API and ships a web UI for managing connections and viewing activity.

This repository holds three independent projects:

| Project     | Stack                                                             | Folder         |
|-------------|---------------------------------------------------------------------|--------------|
| Backend     | Java 17 · Spring Boot 3.4.1 (Web, Security, Data JPA, Validation) | `backend/`     |
| Frontend    | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4     | `frontend/`    |
| AI_analysis | Node.js · TypeScript · Express (stateless microservice)          | `AI_analysis/` |
| Database    | PostgreSQL 16 (Spring Data JPA / Hibernate)                       | —              |
| Auth        | JWT bearer tokens (stateless) · BCrypt password hashing           | —              |

`AI_analysis` calls a real Anthropic or OpenAI API on the backend's behalf. **APIConnector
supplies the credentials** (via `AI_analysis/.env` — see below), not the user, and using AI
analysis is a **Pro-plan-only** feature. The service has no database of its own and is only
reachable by the backend (internal shared secret), never the browser directly.

## Quick start

See **[SETUP.md](SETUP.md)** for full, step-by-step local setup instructions.

```bash
# 1. Database (from backend/)
cd backend && docker compose up -d

# 2. AI_analysis  -> http://localhost:4000   (optional — backend degrades gracefully without it)
cd ../AI_analysis && npm install && npm run dev

# 3. Backend API  -> http://localhost:8080   (requires Joveo VPN for the first build)
cd ../backend && ./mvnw spring-boot:run

# 4. Frontend UI  -> http://localhost:3000
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
| POST   | `/api/apis/test`             | Bearer | Live test of an ad-hoc (not-yet-saved) upstream config — accepts a request body (non-GET) and an AI provider to analyze the result. |
| POST   | `/api/apis/{id}/test`        | Bearer | Live test of a saved API using its persisted config (credentials stay server-side). |
| CRUD   | `/api/transformers`          | Bearer | Manage transformers.                            |
| GET    | `/api/usage/me`              | Bearer | Caller's AI-token position (allotment/used/remaining + per-workspace). |
| POST   | `/api/usage`                 | Bearer | Record an AI-token consumption event.           |
| GET    | `/api/ai-providers`  | Bearer | The platform's fixed AI-provider catalog (visible to everyone; using one is Pro-only). |
| POST   | `/api/ai-providers/{provider}/analyze` | Bearer, **Pro** | Standalone analysis of arbitrary data. |
| POST   | `/api/plan-requests`         | Bearer | Request a plan upgrade (REGULAR → PRO).         |
| GET    | `/api/plan-requests/me`      | Bearer | Caller's latest plan-upgrade request.           |
| GET    | `/api/admin/usage/summary`   | Admin  | Platform-wide token & resource rollup.          |
| GET    | `/api/admin/accounts`        | Admin  | All accounts with their token positions.        |
| PATCH  | `/api/admin/accounts/{id}/plan` | Admin | Change a normal account's plan — the only way to change one (no frontend self-service). |
| PATCH  | `/api/admin/accounts/{id}/enabled` | Admin | Enable/disable a normal account's login access. |
| GET    | `/api/admin/accounts/{id}`   | Admin  | One account's detail + per-workspace breakdown. |
| GET    | `/api/admin/workspaces`      | Admin  | All workspaces (owner + token consumption).     |
| GET/POST | `/api/admin/plan-requests/**` | Admin | Pending Request-Pro queue + approve/reject.  |
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
plan/token allotment of their own. From `/dashboard/admin` an admin can: change a normal
account's plan directly, **enable/disable** its login access, and approve/reject pending
**Request Pro** upgrades from users' own Account pages. There is no frontend self-service
plan upgrade.

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
│       ├── user/          User entity (role, plan, enabled), repository, /me endpoint
│       ├── api/           Upstream API registrations (CRUD) + live test-call capability
│       ├── ai/            Fixed AI-provider catalog + Pro-plan gate + AI_analysis client
│       ├── workspace/     Workspaces (CRUD)
│       ├── transformer/   Response transformers (CRUD)
│       ├── endpoint/      Uniform endpoint model
│       ├── usage/         AI-token usage tracking (record + per-account/workspace)
│       ├── admin/         Admin monitoring API + account plan/enabled controls + seeded admin
│       ├── planrequest/   Request-Pro workflow (request/approve/reject)
│       ├── security/      Spring Security + JWT filter/service/config
│       └── common/        Cross-cutting concerns (error handling, OpenAPI config)
├── AI_analysis/           Stateless Node.js microservice (calls Anthropic/OpenAI)
│   └── src/
│       ├── providers/     Anthropic + OpenAI implementations, shared prompt/parse helpers
│       ├── routes/        POST /analyze, GET /health
│       └── middleware/     Internal-shared-secret auth
├── frontend/              Next.js web application
│   └── src/
│       ├── app/           Routes (App Router): /, /login, /register, /dashboard/**
│       ├── context/       Auth/account/workspace state
│       ├── components/    Shared UI (ProtectedRoute, Sidebar, etc.)
│       ├── lib/           API client + auth/connector calls
│       └── types/         Shared TypeScript types
├── README.md              This file
├── SETUP.md               Local setup guide
└── PROJECT_STRUCTURE.md   Living structure map
```
