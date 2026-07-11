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

## Current vs. planned
- **Built:** entities/tables, auth, **CRUD APIs** for workspaces / api_details / transformers
  (user-scoped, JWT-protected — `/api/workspaces`, `/api/apis`, `/api/transformers`),
  uniform-endpoint model, cached payload fields. `uniform_path` is generated on API create.
- **Planned:** the executor that performs steps 2–6 (resolve → translate → call → normalize →
  cache → observe), wiring the frontend to these CRUD APIs, plus observability + AI insight tables.
