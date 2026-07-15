# Domain Model (DB Schema)

Postgres schema, created by Hibernate from the JPA entities. All tables have
`id bigint identity PK`, `created_at`, `updated_at` (timestamptz).

## Relationships
```
users (1) ─────< (N) workspaces
users (1) ─────< (N) api_details
workspaces (1) ─< (N) api_details            (api_details.workspace_id nullable)
users (1) ─────< (N) unified_endpoints
users (1) ─────< (N) token_usage
workspaces (1) ─< (N) token_usage            (token_usage.workspace_id nullable)
api_details (1) ─< (N) token_usage           (token_usage.api_detail_id nullable)
api_details (1) ─< (N) transformers          (transformer.api_detail_id nullable → global transformer)
api_details (1) ─< (N) unified_endpoints
transformers (1) ─< (N) unified_endpoints    (nullable)
```

## users  — accounts
| Column      | Type          | Notes                                            |
|-------------|---------------|--------------------------------------------------|
| email       | varchar unique| login id                                         |
| password    | varchar       | BCrypt hash                                       |
| full_name   | varchar       |                                                  |
| role        | enum          | `USER` \| `ADMIN`                                |
| plan        | enum, nullable| `REGULAR` \| `PRO` (normal users; null for admin)|

Entity: `user/User.java` (implements `UserDetails`). Enums: `Role`, `UserPlan`.
`UserPlan` carries the free AI-token allotment: `REGULAR`=10 000, `PRO`=100 000
(`UserPlan.freeTokens()`; mirrors frontend `PLAN_TOKENS`). A seeded `ADMIN` account
(`admin/AdminBootstrap`, config `app.admin.*`) monitors all accounts; admins have no plan.
Plan changes are admin-only (`PATCH /api/admin/accounts/{id}/plan`, `AdminService.changePlan`) —
there is no self-service upgrade; normal users see their plan read-only.

## workspaces  — per-user grouping of APIs
| Column      | Type       | Notes                    |
|-------------|------------|--------------------------|
| user_id     | FK → users | owner (many per user)    |
| name        | varchar    |                          |
| description | text       |                          |

Entity: `workspace/Workspace.java`. API: `/api/workspaces`.

## api_details  — registered upstream APIs (owned by a user)
| Column         | Type           | Notes                                  |
|----------------|----------------|----------------------------------------|
| user_id        | FK → users     | owner (many per user)                  |
| workspace_id   | FK → workspaces, nullable | grouping                    |
| name           | varchar        |                                        |
| description    | text           |                                        |
| base_url       | varchar(2048)  | upstream URL                           |
| http_method    | enum           | GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS |
| request_format | enum           | JSON/XML/CSV/SOAP/FORM_URLENCODED      |
| auth_type      | enum           | NONE/API_KEY/BASIC/BEARER_TOKEN/OAUTH2/HMAC/JWT |
| auth_config    | text (JSON)    | credentials/config (encrypt in prod; never returned in API responses). Also used transiently by `ApiTestService` to build live-test headers server-side — never sent to the client. |
| headers        | text (JSON)    | default headers/query params           |
| response_mode  | enum           | DIRECT/WEBHOOK/AI_INSIGHT              |
| uniform_path   | varchar(512)   | generated `/v1/{workspace}/{api}`      |
| status         | enum           | DRAFT/ACTIVE/INACTIVE/ERROR            |

Entity: `api/ApiDetail.java`. Enums: `HttpMethod`, `DataFormat`, `AuthType`, `ResponseMode`, `ConnectionStatus`. API: `/api/apis`.

## transformers  — normalization config → uniform schema for all users
| Column         | Type              | Notes                                       |
|----------------|-------------------|---------------------------------------------|
| api_detail_id  | FK → api_details, nullable | null = reusable/global transformer |
| name           | varchar           |                                             |
| description    | text              |                                             |
| source_format  | enum (DataFormat) | upstream format in                          |
| target_format  | enum (DataFormat) | uniform format out (default JSON)           |
| config         | text (JSON)       | mapping/transform rules                     |

Entity: `transformer/Transformer.java`.

## unified_endpoints  — the uniform client-facing URL + its data ("update url data")
| Column         | Type              | Notes                                       |
|----------------|-------------------|---------------------------------------------|
| user_id        | FK → users        | owner                                       |
| api_detail_id  | FK → api_details  | backing upstream                            |
| transformer_id | FK → transformers, nullable | applied transform                 |
| url_path       | varchar(512) unique | stable client-facing path                 |
| description    | text              |                                             |
| status         | enum              | DRAFT/ACTIVE/INACTIVE/ERROR                 |
| last_synced_at | timestamptz, null | when served data last refreshed             |
| cached_payload | text (JSON)       | latest transformed uniform payload served   |

Entity: `endpoint/UnifiedEndpoint.java`. Enum: `EndpointStatus`.

## token_usage  — AI-token consumption events (append-only)
| Column         | Type              | Notes                                       |
|----------------|-------------------|---------------------------------------------|
| user_id        | FK → users        | account charged (many events per user)      |
| workspace_id   | FK → workspaces, nullable | attribution                         |
| api_detail_id  | FK → api_details, nullable | attribution                        |
| tokens         | bigint            | tokens consumed by this event (> 0)         |
| source         | enum              | AI_INSIGHT / TRANSFORM / OTHER              |
| description    | text, nullable    | free-text note                              |
| created_at     | timestamptz       | event time (no `updated_at`; rows immutable)|

Entity: `usage/TokenUsage.java`. Enum: `UsageSource`. API: `/api/usage` (record + `/me`).
Account "used" = `sum(tokens)` by user; per-workspace used = sum by workspace. Aggregated
for admins by `AdminService` (`/api/admin/**`).

## Not yet modeled (candidates)
Observability/request logs (feature: tracing), AI insight records (feature: AI analysis).
Token usage is now modeled (`token_usage`); the executor that *emits* usage during
AI_INSIGHT calls is still planned (usage is recorded via the API today).
