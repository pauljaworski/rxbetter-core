# RxBetter

RxBetter helps coaches manage gym programming and athlete performance from one dashboard.

## Repositories (two-repo layout)

| Repo | Purpose |
|------|---------|
| **This repo (`rxbetter-core`)** | Supabase schema, migrations, RLS, seed/test data, import scripts, shared `src/lib/` + `src/types/` |
| **[rxbetter-train-smarter](https://github.com/pauljaworski/rxbetter-train-smarter)** | Lovable UI app (Vite/React) — Git sync from Lovable |

Both connect to the **same Supabase project**. See **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** for workflows, boundaries, and diagrams.

## Primary documentation

- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — Two-repo + Supabase layout (start here for Lovable vs Cursor)
- **[`RXBETTER_SYSTEM_INSTRUCTIONS.md`](RXBETTER_SYSTEM_INSTRUCTIONS.md)** — Persona, guardrails, and how the AI (Cursor) should operate as lead architect
- **[`docs/SUPABASE_DATA_MODEL.md`](docs/SUPABASE_DATA_MODEL.md)** — What each database table (and key views) is for. **`supabase/migrations/`** is the SQL source of truth for exact shape

## Repository structure

- `docs/` product notes plus [`docs/README.md`](docs/README.md)
- `.cursor/rules/` Cursor rules (`rxbetter-core`, Supabase, Salesforce, migration workflow)
- `supabase/migrations/` database schema source of truth
- `supabase/remote/` SQL applied to linked remote (e.g. Triad fixtures, Paul imports)
- `scripts/` generators for spreadsheet → SQL
- `supabase/seed.sql`, `supabase/test_data.sql` demo seed data
- `src/lib/` shared clients and utilities (**`auth.ts`**, **`identity-router.ts`**, **`track-links.ts`**, **`supabase.ts`**)
- `src/types/` generated TypeScript database types
- `src/components/`, `src/hooks/` placeholders / shared patterns (full UI lives in **rxbetter-train-smarter**)

## Database workflow

1. Add schema changes as a new file under `supabase/migrations/` using `[TIMESTAMP]_[description].sql`
2. Apply migrations: `npx supabase db push --linked` (remote) or `supabase db reset` (local Docker)
3. Regenerate types into `src/types/database.ts` and copy to the Lovable repo when the UI needs them

Remote test data (Triad / Paul): see command order in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Auth (sign-up / sign-in)

New **`auth.users`** rows automatically get a **`contact`** and **`profiles`** row via migration **`20260510120000_auth_signup_contact_profile.sql`**. Use **`src/lib/auth.ts`** with env vars from **`.env.example`**. Details: [`docs/SUPABASE_DATA_MODEL.md`](docs/SUPABASE_DATA_MODEL.md) (section “Sign-up / sign-in”).

## Next focus

Coach dashboard and athlete flows in **rxbetter-train-smarter**; schema and entitlements stay in **this repo**.
