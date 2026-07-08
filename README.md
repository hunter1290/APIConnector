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

| Method | Path                 | Auth   | Purpose                      |
|--------|----------------------|--------|------------------------------|
| POST   | `/api/auth/register` | Public | Create account, returns JWT. |
| POST   | `/api/auth/login`    | Public | Authenticate, returns JWT.   |
| GET    | `/api/users/me`      | Bearer | Current user's profile.      |
| GET    | `/actuator/health`   | Public | Health check.                |

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
