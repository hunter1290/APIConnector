# Data Flow — the core request pipeline

What happens when a **client calls a published uniform URL**. (The runtime pipeline is
being built; this is the intended flow the schema is designed around.)

```
        ┌──────────┐   GET /v1/clients/acme/orders
Client ─┤ uniform  │──────────────────────────────►  APIConnector
        │  URL     │
        └──────────┘
                          1. Resolve endpoint
                             unified_endpoints.find_by_url_path(path)
                             → api_detail + transformer

                          2. Translate security
                             build upstream auth from api_details.auth_type + auth_config
                             (e.g. client sends API key → we call upstream with OAuth2)

                          3. Call upstream(s)
                             HTTP request to api_details.base_url (http_method, headers)
                             → raw response in api_details.request_format (JSON/XML/CSV/SOAP)

                          4. Normalize format
                             parse source_format → apply transformer.config
                             → uniform target_format (JSON)

                          5. Cache + timestamp
                             unified_endpoints.cached_payload = result
                             unified_endpoints.last_synced_at = now

                          6. Observe
                             record latency, status, trace id (log table planned)

        ┌──────────┐   200 { normalized, uniform JSON }
Client ◄┤ response │◄──────────────────────────────  APIConnector
        └──────────┘
```

## Notes per stage
- **Resolve** — `url_path` is unique; a miss → 404. Endpoint `status` must be `ACTIVE`.
- **Security translation** — `auth_config` holds the upstream credentials; the client
  authenticates to APIConnector with its own scheme (JWT today).
- **Multiple upstreams** — a uniform endpoint can fan out to several `api_details`
  (future: join/merge in the transformer) and return one combined payload.
- **Error handling** — any stage failure → normalized `ApiError`; endpoint marked `ERROR`.
- **Efficiency / AI** — synced payloads + logs feed anomaly detection and efficiency scoring.

## Live upstream testing (validation, not the runtime pipeline)
Separate from the flow above, `ApiTestService` (`api/` package) performs a **synchronous,
one-off slice of steps 2–4** — translate security, call the upstream, return the raw
response — purely to let a user validate a connection, either before saving it or against
an already-saved one:
```
POST /api/apis/test        ad-hoc config (baseUrl/method/format/authType/authConfig/headers/
                            body/aiProvider) — used by the Add-API wizard's Step 1 (no-auth
                            probe, with an optional request body for non-GET methods, built
                            via a key-value editor or pasted from a curl command) and Step 2
                            (optional authenticated retest). Credentials are transient/
                            resolved server-side. `aiProvider` is Pro-plan only (400 for a
                            non-Pro caller).
POST /api/apis/{id}/test   tests a saved ApiDetail using its persisted config (incl. its
                            attached AI provider, if any — silently skipped if the account is
                            no longer Pro), resolved server-side — credentials never reach
                            the client. Used by the Explorer's "Try it".
```
`success` means *a real HTTP response was received* (any status, including 4xx) — not `2xx`.
Only connection-level failures (DNS, timeout, refused, or blocked by `SsrfGuard`) are
`success:false`. There is **no caching or `unified_endpoints` update** from a test call — it
never touches `cached_payload`/`last_synced_at`, and it is not the resolve-by-`url_path`
runtime described above, which remains planned.

If a successful test carries an `aiProvider` (and the caller is Pro), `ApiTestService` also
calls `AiAnalysisClient` and folds a real, structured analysis into the response's `insights`
field — see `ai-analysis-flow.md` for the full platform-AI-provider flow.

## Format normalization (step 4) — now real, scoped to a single-call slice
`POST /api/apis/{id}/test` also performs a real slice of **step 4** above: if the ApiDetail
has a `transformer` attached (`TransformerRepository.findByApiDetailId`) and its
`request_format` is `JSON`, the raw response body is parsed and run through the transformer's
`config` — a **JSONata expression** (https://jsonata.org) — via `JsonataTransformService`
(`com.dashjoin:jsonata`). The result comes back as `transformedBody` on the response; if a
transformer is attached but the expression fails against this particular response (bad path,
malformed expression), `transformError` is set instead and the underlying connectivity result
is untouched — a transform failure never fails the test itself. Non-JSON sources aren't
auto-transformed yet (surfaced as a note in the Transformers page, not silently skipped).

Authoring/testing an expression against pasted sample data (independent of any live call) goes
through `POST /api/transformers/test` (ad-hoc) and `POST /api/transformers/{id}/test` (a saved
transformer's own config) — both delegate to the same `JsonataTransformService`, returning
`{success, result, errorMessage}` rather than ever 500ing on a bad expression.

## Current vs. planned
- **Built:** entities/tables, auth, **CRUD APIs** for workspaces / api_details / transformers
  (user-scoped, JWT-protected — `/api/workspaces`, `/api/apis`, `/api/transformers`),
  uniform-endpoint model, cached payload fields. `uniform_path` is generated on API create.
  Also built: the live-test capability above (validation + optional real AI analysis), and
  **real JSONata-based format normalization** (previous section) — both as single-call slices,
  not the cached runtime pipeline.
- **Planned:** the executor that performs steps 1–6 as a real, cached, client-facing pipeline
  (resolve by `url_path` → translate → call → normalize → cache → observe), retry/recovery
  when an upstream is down, multi-upstream join/merge in a transformer, plus observability
  tables and persisting AI insights for later review.
