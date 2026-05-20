# Docs

Product strategy, roadmap, and PRD notes live here.

## Primary references (use these)

| Doc | Role |
|-----|------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | **Two-repo layout** (core + Lovable UI), single Supabase project, sync workflows |
| **[`../RXBETTER_SYSTEM_INSTRUCTIONS.md`](../RXBETTER_SYSTEM_INSTRUCTIONS.md)** (repo root) | What the AI / Cursor agent does as system architect: persona, guardrails, response protocol |
| **[SUPABASE_DATA_MODEL.md](SUPABASE_DATA_MODEL.md)** | Primary explanation of **each Postgres table** (and views): purpose and SF lineage when relevant |
| **[MEMBERSHIP_OFFERINGS_VERIFICATION.md](MEMBERSHIP_OFFERINGS_VERIFICATION.md)** | Smoke-test checklist for signup, identity routing, Triad offering links, and entitlement fan-out |

## Related repository

- **Lovable UI:** https://github.com/pauljaworski/rxbetter-train-smarter

Schema columns and constraints always defer to **`supabase/migrations/`** in **rxbetter-core**.
