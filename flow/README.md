# flow/

**Purpose:** describe how APIConnector **works** — the movement of data and control
through the system, feature by feature. Where [`../context/`](../context/) is a terse
reference (what things *are*), this folder explains *how they function and are used*.

| File                  | What it covers                                                    |
|-----------------------|-------------------------------------------------------------------|
| `application-flow.md` | End-to-end user journeys and how the pieces fit together.         |
| `data-flow.md`        | The core request pipeline: client → uniform URL → upstreams → client. |
| `auth-flow.md`        | Registration, login, and JWT-protected request handling.          |
| `admin-monitoring.md` | AI-token usage tracking + the ADMIN monitoring API.               |

> Keep these updated when behavior changes. Diagrams are ASCII so they diff cleanly.
