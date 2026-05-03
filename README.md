# RxBetter

RxBetter helps coaches manage gym programming and athlete performance from one dashboard.

## Primary documentation

- **[`RXBETTER_SYSTEM_INSTRUCTIONS.md`](RXBETTER_SYSTEM_INSTRUCTIONS.md)** — Persona, guardrails, and how the AI (Cursor) should operate as lead architect.
- **[`docs/SUPABASE_DATA_MODEL.md`](docs/SUPABASE_DATA_MODEL.md)** — What each database table (and key views) is for. **`supabase/migrations/`** is the SQL source of truth for exact shape.

## Repository structure

- `docs/` product notes plus [`docs/SUPABASE_DATA_MODEL.md`](docs/SUPABASE_DATA_MODEL.md) (see [`docs/README.md`](docs/README.md))
- `.cursor/rules/` Cursor rules (`rxbetter-core`, Supabase, Salesforce, migration workflow)
- `supabase/migrations/` database schema source of truth
- `supabase/seed.sql` demo seed data
- `src/components/` reusable UI components
- `src/hooks/` Supabase data hooks and state logic
- `src/lib/` shared clients and utilities
- `src/types/` generated TypeScript database types

## Database Workflow

1. Add schema changes as a new file under `supabase/migrations/` using `[TIMESTAMP]_[description].sql`.
2. Apply migrations with `supabase db push`.
3. Regenerate frontend database types into `src/types/database.ts`.

## Next Focus

Coach Dashboard implementation.
