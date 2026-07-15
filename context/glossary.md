# Glossary

| Term                | Meaning                                                                 |
|---------------------|-------------------------------------------------------------------------|
| **Upstream API**    | A third-party API a user registers (`api_details`) for APIConnector to call. |
| **Uniform URL**     | The single stable, client-facing endpoint APIConnector exposes (`unified_endpoints.url_path`). |
| **Transformer**     | Config that normalizes an upstream response into the uniform schema/format for all clients. |
| **Format normalization** | Converting XML/CSV/SOAP/etc. into one target format (usually JSON). |
| **Security translation** | Converting one auth scheme (e.g. OAuth2) into what the client expects (e.g. API key). |
| **Connection**      | A configured upstream API + its transform + published uniform endpoint.  |
| **Live test**       | A real, synchronous call to an upstream to validate reachability/format/auth before (or after) saving it, via `POST /api/apis/test` or `/api/apis/{id}/test`. Distinct from the (still-planned) runtime resolve/cache pipeline. |
| **Plan / tier**     | Normal-user subscription level: REGULAR or PRO. Admins have no plan. Only an admin can change a normal account's plan (directly, or by approving a plan-upgrade request). |
| **Sync**            | Refreshing a unified endpoint's `cached_payload` from its upstream.      |
| **AI token**        | Unit of AI consumption. Each account gets a free allotment per plan (REGULAR 10k, PRO 100k). |
| **Token allotment** | The free AI-token budget for an account, derived from its plan (`UserPlan.freeTokens()`). |
| **Token usage**     | A recorded consumption event (`token_usage`), attributed to an account and optionally a workspace/API. |
| **Admin monitoring**| ADMIN-only views (`/api/admin/**`) over all accounts, workspaces, and token consumption. |
| **AI provider**     | Anthropic or OpenAI, from a fixed platform catalog attachable to an API's AI_INSIGHT response mode. APIConnector supplies the credentials (`AI_analysis/.env`) — not the user. Using one is **Pro plan only**. |
| **AI insights**     | The structured result (`anomalies`, `quality`, `summary`, `recommendations`) of analyzing a response with an attached AI provider, produced by the `AI_analysis` microservice. |
| **AI_analysis**     | The stateless Node.js microservice (`AI_analysis/`) that calls the real Anthropic/OpenAI API on the backend's behalf. No database; internal-only (shared secret), never called directly by the frontend. |
| **Plan-upgrade request** | A normal user's request to move REGULAR → PRO (`plan_upgrade_requests`), with full history of every request and how an admin resolved it. |
| **Account enable/disable** | Admin-only login gate per account (`users.enabled`). Blocks future logins immediately; doesn't revoke an already-issued JWT. |
