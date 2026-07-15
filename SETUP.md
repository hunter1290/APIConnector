# Local Setup Guide

Step-by-step instructions to run **APIConnector** (backend + frontend) on your machine.

---

## 1. Prerequisites

| Tool           | Version         | Notes                                                            |
|----------------|-----------------|------------------------------------------------------------------|
| **JDK**        | 17+ (Java 17 target) | Any JDK 17–25 works. See [JDK note](#jdk-note) below.        |
| **Node.js**    | 18+ (20+ recommended) | Ships with npm.                                             |
| **Docker**     | any recent      | For the local PostgreSQL container.                              |
| **Joveo VPN**  | —               | **Required** — Maven pulls dependencies from the Joveo Artifactory (`artifactory.mgmt.joveo.com`). Off-VPN the first build fails. |

> Maven and PostgreSQL do **not** need separate installs: the backend ships the Maven
> Wrapper (`./mvnw`), and Postgres runs in Docker.

### JDK note

The project targets **Java 17**. The build has been verified on **JDK 17 and JDK 25**.
Lombok is pinned to `1.18.46` (via `<lombok.version>` in `pom.xml`) so it works on newer
JDKs — the Spring Boot default (1.18.36) crashes on JDK 25 with
`com.sun.tools.javac.code.TypeTag :: UNKNOWN`. If you ever downgrade Lombok and use JDK 25,
you'll hit that error; either restore `1.18.46` or build with a JDK 17/21.

Check your Java version:

```bash
java -version
```

---

## 2. Start PostgreSQL

From the `backend/` directory:

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL 16 on `localhost:5432` with database/user/password all set to
`apiconnector` (see `docker-compose.yml`). Verify it's healthy:

```bash
docker compose ps
```

To stop it later: `docker compose down` (add `-v` to also wipe the data volume).

---

## 3. Run the backend (API → http://localhost:8080)

**Ensure you are on the Joveo VPN for the first build** (it downloads dependencies).

```bash
cd backend
./mvnw spring-boot:run
```

First run downloads Maven and all dependencies — subsequent runs are fast.

**Verify it's up:**

```bash
curl http://localhost:8080/actuator/health
# -> {"status":"UP"}
```

**Smoke-test auth:**

```bash
# Register
curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@joveo.com","password":"password123","fullName":"Dev User"}'

# Login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@joveo.com","password":"password123"}'

# Call a protected endpoint (paste the token from above)
curl -s http://localhost:8080/api/users/me -H "Authorization: Bearer <TOKEN>"
```

### Backend configuration

All settings live in `backend/src/main/resources/application.properties` and are
overridable via environment variables:

| Variable                | Default                                          | Purpose                    |
|-------------------------|--------------------------------------------------|----------------------------|
| `SERVER_PORT`           | `8080`                                           | HTTP port.                 |
| `DB_URL`                | `jdbc:postgresql://localhost:5432/apiconnector`  | Datasource URL.            |
| `DB_USERNAME`           | `apiconnector`                                   | DB user.                   |
| `DB_PASSWORD`           | `apiconnector`                                   | DB password.               |
| `JWT_SECRET`            | dev-only Base64 secret                           | **Override in production.**|
| `JWT_EXPIRATION_MS`     | `3600000` (1 h)                                  | Access-token lifetime.     |
| `CORS_ALLOWED_ORIGINS`  | `http://localhost:3000`                          | Allowed frontend origins.  |

---

## 4. Run the AI_analysis service (optional → http://localhost:4000)

`AI_analysis/` is a stateless Node.js microservice the backend calls to run real AI analysis
(Anthropic/OpenAI). **APIConnector supplies the credentials — not the user** — so they live
only in this service's own `.env` file, and using AI analysis is a **Pro-plan-only** feature
in the app. AI_analysis has no database. The backend degrades gracefully without it (analysis
is just unavailable — nothing else breaks), but if you start it, the shared secret **must
match** on both sides.

```bash
cd AI_analysis
npm install
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY and/or OPENAI_API_KEY to get real insights (optional —
# without a key, that provider's /analyze calls just return a clear "not configured" error).
npm run dev
```

**Verify it's up:**

```bash
curl http://localhost:4000/health
# -> {"status":"UP"}
```

`.env`'s `INTERNAL_SHARED_SECRET` default matches the backend's own default
(`app.ai.analysis.shared-secret` / `AI_ANALYSIS_SHARED_SECRET`) — override both consistently
in every real environment. Never commit the real `.env` (already gitignored) or a real key.

### AI_analysis configuration (`AI_analysis/.env`, see `.env.example`)

| Variable                  | Default                              | Purpose                                |
|----------------------------|--------------------------------------|-----------------------------------------|
| `PORT`                    | `4000`                                | HTTP port.                              |
| `INTERNAL_SHARED_SECRET`  | `dev-only-shared-secret-change-me`   | Must match the backend's `app.ai.analysis.shared-secret`. **Override in production.** |
| `REQUEST_TIMEOUT_MS`      | `20000`                               | Timeout for the outbound Anthropic/OpenAI call. |
| `ANTHROPIC_API_KEY`       | *(none)*                              | Real Anthropic key. Only Pro accounts can trigger calls that use it. |
| `OPENAI_API_KEY`          | *(none)*                              | Real OpenAI key. Only Pro accounts can trigger calls that use it.    |

---

## 5. Run the frontend (UI → http://localhost:3000)

In another terminal:

```bash
cd frontend
npm install     # first time only
npm run dev
```

Open http://localhost:3000, then register an account and land on the dashboard.

The frontend reads `NEXT_PUBLIC_API_BASE_URL` from `frontend/.env.local`
(defaults to `http://localhost:8080`). Change it if the backend runs elsewhere.

---

## 6. Useful commands

| Command (run in the project folder)      | What it does                              |
|------------------------------------------|-------------------------------------------|
| `./mvnw -DskipTests clean compile`       | Compile the backend.                      |
| `./mvnw spring-boot:run`                 | Run the backend.                          |
| `./mvnw clean package`                   | Build an executable jar (`target/*.jar`). |
| `./mvnw test`                            | Run backend unit + smoke tests.           |
| `npm run dev` (frontend or AI_analysis)  | Run in dev mode.                          |
| `npm run build && npm start`             | Production build + serve the frontend.    |
| `npm run lint`                           | Lint the frontend.                        |
| `npm run typecheck` (AI_analysis)        | Type-check the AI_analysis service.       |

---

## 7. Troubleshooting

| Symptom                                                        | Cause / Fix                                                                 |
|----------------------------------------------------------------|-----------------------------------------------------------------------------|
| `package io.jsonwebtoken does not exist`                       | Dependencies not downloaded. Connect to the VPN and run `./mvnw -U clean compile`. In an IDE, reimport/reload the Maven project afterward. |
| `com.sun.tools.javac.code.TypeTag :: UNKNOWN`                  | Lombok vs JDK mismatch. Keep `lombok.version` = `1.18.46`, or build with JDK 17/21. |
| `Could not resolve ... artifactory.mgmt.joveo.com`             | You're off the Joveo VPN. Connect and retry.                                |
| Backend fails to start with a DB connection error              | Postgres isn't running. `cd backend && docker compose up -d`.               |
| Login returns 401                                              | Wrong credentials, or the user isn't registered yet.                        |
| CORS error in the browser console                              | Frontend origin not in `CORS_ALLOWED_ORIGINS`. Add it and restart backend.  |
| `Mockito cannot mock this class` / `Could not modify all classes` | Pre-JDK-25-fix symptom. Already fixed via `pom.xml`'s pinned `mockito.version` (5.20.0) + Surefire `argLine=-Dnet.bytebuddy.experimental=true`. If you still see it, confirm both are present. |
| AI analysis always returns `insights: null`                    | Either `AI_analysis` isn't running, the shared secret doesn't match (`app.ai.analysis.shared-secret` vs. `INTERNAL_SHARED_SECRET`), or `AI_analysis/.env` has no `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` set — check the AI_analysis process logs for the real provider error. |
| `400 AI analysis is available on the Pro plan only`            | Expected — using an AI provider (attaching one, or `/api/ai-providers/{provider}/analyze`) is Pro-gated server-side. Upgrade the account's plan (admin: `PATCH /api/admin/accounts/{id}/plan`) to test it. |
| Live-test call fails with "Refusing to call a private/internal network address" | `SsrfGuard` blocking a loopback/private host by design. Set `ALLOW_PRIVATE_NETWORK_HOSTS=true` only in trusted local/dev setups that need it. |

### IDE (IntelliJ / VS Code)

- After the first successful `./mvnw` build, **reload the Maven project** so the IDE
  picks up downloaded dependencies (IntelliJ: Maven panel → Reload; VS Code: "Java: Clean
  Java Language Server Workspace").
- Set the **project SDK to JDK 17** (or ensure Lombok support is current if using JDK 25).
- Install the **Lombok plugin** if your IDE doesn't support it out of the box.
