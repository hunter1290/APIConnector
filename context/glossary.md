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
| **Plan / tier**     | Normal-user subscription level: REGULAR or PRO. Admins have no plan. Only an admin can change a normal account's plan. |
| **Sync**            | Refreshing a unified endpoint's `cached_payload` from its upstream.      |
| **AI token**        | Unit of AI consumption. Each account gets a free allotment per plan (REGULAR 10k, PRO 100k). |
| **Token allotment** | The free AI-token budget for an account, derived from its plan (`UserPlan.freeTokens()`). |
| **Token usage**     | A recorded consumption event (`token_usage`), attributed to an account and optionally a workspace/API. |
| **Admin monitoring**| ADMIN-only views (`/api/admin/**`) over all accounts, workspaces, and token consumption. |
