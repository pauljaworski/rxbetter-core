# RxBetter

RxBetter helps coaches manage gym programming and athlete performance from one dashboard.

## Repository Structure

- [`RXBETTER_SYSTEM_INSTRUCTIONS.md`](RXBETTER_SYSTEM_INSTRUCTIONS.md) canonical AI persona, guardrails, and response protocol (copied from Google Drive project)
- `docs/` product strategy, roadmap, PRD notes, and data-model docs ([`docs/SUPABASE_DATA_MODEL.md`](docs/SUPABASE_DATA_MODEL.md), [`docs/RXBETTER_ARCHITECTURE.md`](docs/RXBETTER_ARCHITECTURE.md))
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
