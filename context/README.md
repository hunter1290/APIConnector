# context/

**Purpose:** compact, high-signal reference for AI models (and humans) working on
APIConnector. These files are deliberately terse so an assistant can load the whole
directory and get accurate project grounding **without spending tokens reading source
files**. When code changes, update the relevant file here so the context stays true.

| File              | What it gives you                                              |
|-------------------|----------------------------------------------------------------|
| `tech-stack.md`   | Languages, frameworks, versions, key conventions, gotchas.     |
| `domain-model.md` | Entities, fields, enums, and relationships (the DB schema).    |
| `glossary.md`     | Product terms used across the codebase.                        |

> Rule: keep entries dense and current. Prefer tables and one-liners over prose.
> For deeper "how it works" narratives, see [`../flow/`](../flow/).
