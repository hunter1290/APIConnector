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

## 4. Run the frontend (UI → http://localhost:3000)

In a second terminal:

```bash
cd frontend
npm install     # first time only
npm run dev
```

Open http://localhost:3000, then register an account and land on the dashboard.

The frontend reads `NEXT_PUBLIC_API_BASE_URL` from `frontend/.env.local`
(defaults to `http://localhost:8080`). Change it if the backend runs elsewhere.

---

## 5. Useful commands

| Command (run in the project folder)      | What it does                              |
|------------------------------------------|-------------------------------------------|
| `./mvnw -DskipTests clean compile`       | Compile the backend.                      |
| `./mvnw spring-boot:run`                 | Run the backend.                          |
| `./mvnw clean package`                   | Build an executable jar (`target/*.jar`). |
| `npm run dev`                            | Run the frontend in dev mode.             |
| `npm run build && npm start`             | Production build + serve the frontend.    |
| `npm run lint`                           | Lint the frontend.                        |

---

## 6. Troubleshooting

| Symptom                                                        | Cause / Fix                                                                 |
|----------------------------------------------------------------|-----------------------------------------------------------------------------|
| `package io.jsonwebtoken does not exist`                       | Dependencies not downloaded. Connect to the VPN and run `./mvnw -U clean compile`. In an IDE, reimport/reload the Maven project afterward. |
| `com.sun.tools.javac.code.TypeTag :: UNKNOWN`                  | Lombok vs JDK mismatch. Keep `lombok.version` = `1.18.46`, or build with JDK 17/21. |
| `Could not resolve ... artifactory.mgmt.joveo.com`             | You're off the Joveo VPN. Connect and retry.                                |
| Backend fails to start with a DB connection error              | Postgres isn't running. `cd backend && docker compose up -d`.               |
| Login returns 401                                              | Wrong credentials, or the user isn't registered yet.                        |
| CORS error in the browser console                              | Frontend origin not in `CORS_ALLOWED_ORIGINS`. Add it and restart backend.  |

### IDE (IntelliJ / VS Code)

- After the first successful `./mvnw` build, **reload the Maven project** so the IDE
  picks up downloaded dependencies (IntelliJ: Maven panel → Reload; VS Code: "Java: Clean
  Java Language Server Workspace").
- Set the **project SDK to JDK 17** (or ensure Lombok support is current if using JDK 25).
- Install the **Lombok plugin** if your IDE doesn't support it out of the box.
