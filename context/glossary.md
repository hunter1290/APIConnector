# Glossary

| Term                | Meaning                                                                 |
|---------------------|-------------------------------------------------------------------------|
| **Upstream API**    | A third-party API a user registers (`api_details`) for APIConnector to call. |
| **Uniform URL**     | The single stable, client-facing endpoint APIConnector exposes (`unified_endpoints.url_path`). |
| **Transformer**     | Config that normalizes an upstream response into the uniform schema/format for all clients. |
| **Format normalization** | Converting XML/CSV/SOAP/etc. into one target format (usually JSON). |
| **Security translation** | Converting one auth scheme (e.g. OAuth2) into what the client expects (e.g. API key). |
| **Connection**      | A configured upstream API + its transform + published uniform endpoint.  |
| **Plan / tier**     | Normal-user subscription level: REGULAR or PRO. Admins have no plan.     |
| **Sync**            | Refreshing a unified endpoint's `cached_payload` from its upstream.      |
