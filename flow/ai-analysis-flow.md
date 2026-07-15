# AI Analysis Flow

How AI analysis works — APIConnector supplies the AI provider credentials (not the user),
using one is **Pro plan only**, and the Java backend orchestrates while the `AI_analysis`
Node microservice does one thing: call the real AI API.

## Actors
- **Pro user** — can attach a platform AI provider (Anthropic or OpenAI) to an API's
  AI_INSIGHT response mode, and sees real insights when testing/trying that API.
- **Regular user** — can see the provider catalog (it's just names), but every action that
  actually *uses* a provider is rejected server-side with a clear 400.
- **Backend (Java)** — owns the fixed provider catalog and the Pro-plan gate
  (`AiAccessGuard`); calls `AI_analysis` over an internal, shared-secret-authenticated
  connection. Never sends an API key — it doesn't have one.
- **AI_analysis (Node)** — stateless; no database. Holds the *actual* provider credentials in
  its own `.env`. Only reachable by the backend. Its only job: build a prompt, call the real
  Anthropic/OpenAI API, parse the result into a structured shape.

## The provider catalog (not user data)
```
GET /api/ai-providers  Bearer <any authenticated user>
  → a fixed, in-code list: [{provider: "ANTHROPIC", label: "Claude (Anthropic)"},
                            {provider: "OPENAI", label: "GPT (OpenAI)"}]
```
There is no create/delete/API-key entry anywhere — viewing the catalog is open to everyone
(it's harmless, and useful for a Regular user to see what Pro unlocks); *using* one is gated.
Frontend: `/dashboard/ai-providers` shows the catalog read-only, with a "Request Pro" upsell
for non-Pro accounts.

## Attaching a provider to an API (Pro plan only)
`ApiDetail.aiProvider` (a plain enum column — `ANTHROPIC`/`OPENAI`/null, not a relation) is
set when saving via the Add-API wizard's Step 3 provider picker (only rendered for Pro
accounts; Regular accounts see an upgrade prompt instead), or passed ad-hoc on a not-yet-saved
test via `ApiTestRequest.aiProvider`. Both `ApiDetailService` (create/update) and
`ApiTestService` (test) call `AiAccessGuard.requirePro(user)` before honoring a non-null
`aiProvider` — **enforced server-side**, not just hidden in the UI:
```
POST /api/apis            { ..., responseMode: "AI_INSIGHT", aiProvider: "ANTHROPIC" }
  → ApiDetailService.create/update
      • if aiProvider != null: AiAccessGuard.requirePro(user)  — 400 if not PRO
      • else save normally
```

## Getting insights during a live test
This reuses the exact test-call plumbing from `data-flow.md`'s live-test section — it does
not add a parallel path:
```
POST /api/apis/test        { ..., aiProvider? }   (ad-hoc, wizard) — 400 if aiProvider is set
                                                    and the caller isn't PRO
POST /api/apis/{id}/test                          (saved API, Explorer "Try it") — silently
                                                    skips analysis if the account is no longer
                                                    PRO (e.g. downgraded after attaching one);
                                                    the test itself still succeeds either way
  → ApiTestService.execute
      1. run the live HTTP call as usual
      2. if it succeeded AND an aiProvider is present (and the caller is PRO):
           AiAnalysisClient.analyze(aiProvider, model, responseBody)
      3. merge the result into ApiTestResponse.insights (nullable)
```

## Inside AI_analysis
```
POST /analyze  X-Internal-Secret: <shared secret>
  { provider, model?, data }        <-- no apiKey field; the backend never has one to send
  → resolveProvider(provider)                     — ANTHROPIC | OPENAI
  → provider.analyze({ model, data })
      • reads its OWN credential from config (ANTHROPIC_API_KEY / OPENAI_API_KEY,
        set in AI_analysis/.env) — 502 "not configured" if missing
      • builds a prompt asking for ONLY a JSON object:
        {anomalies, quality: good|fair|poor, summary, recommendations[]}
      • calls the real Anthropic Messages API / OpenAI Chat Completions API
      • parses the model's response; degrades to a best-effort summary if it
        isn't clean JSON (never fails the request just for that)
  → 200 { insights }  or  502 { error }  (bad/missing key, timeout, provider outage)
```
`AiAnalysisClient` on the Java side never throws — any AI_analysis failure (unreachable,
502, timeout) degrades to `insights: null` rather than failing the whole test call. This
mirrors `ApiTestService`'s own "real call, real failure surfaced, never crash the caller"
philosophy.

## Standalone analysis (no upstream call involved)
```
POST /api/ai-providers/{provider}/analyze  Bearer <user JWT>  { data: <any JSON> }
  → AiAccessGuard.requirePro(user)   — 400 if not PRO
  → same AiAnalysisClient.analyze path, just without a live HTTP test first
  → { success, insights }
```
Useful for exercising a provider directly, independent of any registered API.

## Where it lives
| Concern                     | Code                                                              |
|------------------------------|--------------------------------------------------------------------|
| Provider catalog + endpoint  | `ai/AiProviderController` (`GET /api/ai-providers`, `POST /{provider}/analyze`) |
| Pro-plan gate                | `ai/AiAccessGuard.requirePro(user)` — reused by `ApiDetailService`, `ApiTestService` |
| Calling AI_analysis          | `ai/AiAnalysisClient`, `ai/AiAnalysisProperties` (`app.ai.analysis.*`) |
| Merge into live-test flow    | `api/ApiTestService`, `api/dto/ApiTestRequest`/`ApiTestResponse`   |
| Saved API's provider choice  | `api/ApiDetail.aiProvider` (enum column)                           |
| The microservice itself      | `AI_analysis/src/providers/*`, `src/routes/analyze.ts`, `src/config.ts` |
| Actual credentials           | `AI_analysis/.env` (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) — nowhere else |

## Current vs. planned
- **Built:** the fixed provider catalog, the Node microservice with real Anthropic/OpenAI
  calls sourced from its own `.env`, Pro-plan gating enforced server-side on every path that
  uses a provider, merge into both the ad-hoc and saved live-test endpoints, a standalone
  analyze endpoint, and full frontend wiring (catalog page, wizard picker, Explorer insights
  display).
- **Planned:** persisting insights (today each call is analyzed fresh, nothing is stored for
  later review); automatic analysis on the runtime resolve/cache pipeline once that's built
  (see `data-flow.md`) rather than only on explicit test/try-it calls; additional providers.
