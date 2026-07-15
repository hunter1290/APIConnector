# APIConnector — Submission

## What it is

**APIConnector** is an API integration hub: register a third-party (upstream) API once,
and APIConnector gives you back a single uniform, secured endpoint for it — normalizing
formats, translating security schemes, and (for Pro accounts) layering real AI analysis on
top. It's three independent, separately-deployable projects:

| Project       | Stack                                                      | Role                                             |
|---------------|-------------------------------------------------------------|---------------------------------------------------|
| `backend/`    | Java 17, Spring Boot 3.4.1 (Web, Security, Data JPA)        | Owns all data and auth; orchestrates everything.   |
| `frontend/`   | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4  | The web app (marketing site + authenticated dashboard). |
| `AI_analysis/`| Node.js, TypeScript, Express                                | Stateless microservice: calls the real Anthropic/OpenAI API on the backend's behalf. |

The database (PostgreSQL 16) is owned entirely by the backend; `AI_analysis` has none.

---

## Features implemented

### Accounts, workspaces, and upstream APIs
- JWT-based registration/login (stateless, BCrypt-hashed passwords).
- Per-user **workspaces** grouping registered upstream APIs; full CRUD, cascading deletes.
- Registering an upstream API captures its URL, HTTP method, payload format
  (JSON/XML/CSV/SOAP/form-urlencoded), auth scheme (API key/Basic/Bearer/OAuth2/HMAC/JWT/none),
  and response mode (Direct / Webhook / AI-processed) — plus a generated, stable uniform path.

### A real, Postman-style test-before-you-trust-it flow
- Adding an API is a 3-step wizard, not a form:
  1. **Endpoint** — base URL, method, format, a headers key-value editor, and a request-body
     editor (key-value builder for JSON/form-urlencoded, or raw text) for non-GET methods.
     A **"Paste a curl command"** import parses method/URL/headers/body/basic-auth from a
     real curl command (e.g. copied from browser devtools) and prefills the whole step.
     A **live "Test connection"** call — hitting the real upstream, no credentials yet — must
     return a real HTTP response (any status, not just 2xx) before continuing.
  2. **Security** — pick the auth scheme and enter credentials, with an optional authenticated
     retest against the real upstream.
  3. **Response mode** — Direct / Webhook / AI-processed, then save.
- The same live-test engine (`ApiTestService`) backs the Explorer page's "Try it" against
  already-saved APIs — credentials are resolved server-side and never reach the browser.
- A dedicated `SsrfGuard` blocks live tests from reaching loopback/link-local/private-network
  hosts by default, so "test this URL" can't be used to probe APIConnector's own network.

### Real AI analysis — Pro plan only
- APIConnector — not the user — supplies the AI provider credentials. They live only in the
  `AI_analysis` microservice's own `.env` (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`); no API key
  is ever stored in the database or transits through the browser.
- A fixed, in-code catalog (`GET /api/ai-providers`: Claude / GPT) is visible to everyone;
  *using* one — attaching it to an API, or the standalone analyze endpoint — is gated to Pro
  accounts, **enforced server-side** (400 for non-Pro, not just hidden in the UI).
- When a Pro user tests an API with a provider attached, the real response body is sent to
  `AI_analysis`, which prompts the real Anthropic/OpenAI API and returns structured insights:
  anomaly count, a quality read (good/fair/poor), a summary, and concrete recommendations.
  A missing key or provider outage degrades gracefully to "no insights" — it never fails the
  underlying connectivity test.

### Admin governance
- A seeded ROLE_ADMIN account monitors every account, workspace, and AI-token position
  platform-wide.
- Admins can directly change any account's plan, and **enable/disable** an account's login
  access (a disabled account gets a clear 403 on login; note that an already-issued JWT stays
  valid until it naturally expires — this blocks future logins, not a live session).
- **Request-Pro workflow**: a normal user requests an upgrade; admins see a pending-requests
  queue and approve or reject, with a full history of every request (not just the latest) —
  approval delegates to the same `changePlan` logic an admin uses directly, so there's one
  source of truth for how a plan actually changes.

### AI-token usage tracking
- Every account gets a free monthly token allotment by plan (Regular/Pro); usage events are
  recorded (append-only) and aggregated per account and per workspace, with admin rollups.

### Real, generated API docs
- `springdoc-openapi` generates a genuine Swagger UI (`/swagger-ui.html`) for the backend's
  own REST API, with a JWT "Authorize" button — not a hand-maintained description.

---

## Notable engineering details
- **Security-first credential handling**: upstream `authConfig` and (now) AI provider keys are
  never returned by any API response; the AI-provider redesign specifically removes even the
  *possibility* of a key round-tripping through the browser or database.
- **Two independent test endpoints** (`/api/apis/test` for ad-hoc/not-yet-saved configs,
  `/api/apis/{id}/test` for saved ones) so credentials for a saved connection never have to
  leave the server to be re-tested.
- **Graceful degradation everywhere an external call happens**: a down/misconfigured
  `AI_analysis` service, an unreachable upstream, or a missing provider key all degrade to a
  clear, structured result rather than a 500 or a hung request.
- Found and fixed two real bugs during end-to-end testing rather than just code review: a
  missing `Content-Type` header was silently dropping POST bodies in live tests, and a
  pre-existing JDK 25 / Mockito ByteBuddy incompatibility was silently failing several backend
  tests (`mockito.version` pinned to `5.20.0` + a Surefire `argLine` fixed it — full suite green).

---

## Future aspects / roadmap

**The runtime pipeline (biggest gap).** Everything above validates a connection; nothing yet
*serves* a published uniform URL to an external client. The schema (`unified_endpoints`,
`cached_payload`, `last_synced_at`) is designed for it, but the executor that resolves a
`url_path`, translates security, calls the upstream, normalizes the format, caches the result,
and serves it back doesn't exist yet. This is the natural next milestone.

**Resilience when an upstream is down.** No retry policy, circuit breaker, or automatic
recovery exists today — a failing upstream just returns a failed test result. The `ERROR`
`ConnectionStatus`/`EndpointStatus` values exist in the schema but nothing sets them
automatically yet.

**Persisted AI insights.** Every analysis today is computed fresh and shown once; nothing is
stored for later review, trending, or comparison across syncs. A natural next step is an
`ai_insights` table keyed to a connection (or a sync event), so a workspace can show "insight
history" rather than only the last test's result.

**Automatic analysis on the runtime pipeline.** Right now AI analysis only runs when a user
explicitly tests or "tries" a connection. Once the runtime pipeline exists, AI_INSIGHT-mode
endpoints should analyze automatically on each real sync, not just on manual test calls.

**More AI providers and model choice.** The catalog is fixed to Anthropic and OpenAI today;
adding a provider means a code change (a new `AiProvider` implementation in `AI_analysis` plus
a catalog entry), not configuration. A future version could let an admin manage the catalog
(still without exposing per-user keys) or add more providers (e.g. local/self-hosted models).

**Observability.** No request/trace logging exists yet — every flow doc calls this out as
planned. A log table plus latency/error tracking per connection would close the loop on the
"deep observability" capability the product promises.

**JWT revocation.** Disabling an account blocks new logins immediately but not an
already-issued token. A deny-list (or moving to much shorter-lived access tokens with refresh
tokens) would close this gap for genuinely time-sensitive account suspension.

**Transformer execution.** `transformers` (source→target format mapping config) are fully
modeled and CRUD-able, but nothing actually *applies* a transformer's mapping rules yet — that
logic is part of the runtime pipeline above.

**Production hardening.** `ddl-auto=update` is explicitly dev-only (the project already flags
this); a real deployment needs Flyway/Liquibase migrations, encryption at rest for
`auth_config`, and a proper secrets manager in place of `.env`/environment variables for the
AI provider keys and JWT secret.
