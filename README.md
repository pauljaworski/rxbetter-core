# RxBetter

RxBetter helps coaches manage gym programming and athlete performance from one dashboard.

## Canonical repository

**All product code lives in this repo** ([github.com/pauljaworski/rxbetter-core](https://github.com/pauljaworski/rxbetter-core)). Clone and open this directory directly in your editor — do not use a separate wrapper repo.

## Monorepo (schema + UI)

This repository is the **single local dev root**: Supabase migrations, scripts, and the **Vite/React app** (`npm run dev`). The former Lovable repo [rxbetter-train-smarter](https://github.com/pauljaworski/rxbetter-train-smarter) was merged here for Cursor-first development (no Lovable API required).

## Quick start (local UI)

```bash
cd rxbetter-core
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (linked project)

npm install
npm run dev      # http://localhost:8080
npm run build    # production bundle → dist/
npm run check    # tsc + eslint + build
```

## Primary documentation

- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — Monorepo layout, Supabase workflows
- **[`RXBETTER_SYSTEM_INSTRUCTIONS.md`](RXBETTER_SYSTEM_INSTRUCTIONS.md)** — Product / AI guardrails
- **[`docs/SUPABASE_DATA_MODEL.md`](docs/SUPABASE_DATA_MODEL.md)** — Table purposes; **`supabase/migrations/`** is SQL SSOT

## Repository structure

| Path | Role |
|------|------|
| `supabase/migrations/` | Database schema source of truth |
| `supabase/remote/` | Linked-remote SQL (Triad, Paul imports) |
| `scripts/` | Spreadsheet → SQL generators |
| `src/lib/` | `supabase.ts`, `auth.ts`, `identity-router.ts`, `track-links.ts`, `format.ts` |
| `src/types/database.ts` | Generated Postgres types |
| `src/hooks/` | Data hooks (`useWorkoutDay`, `useSavePerformance`, …) |
| `src/components/` | `ui/` (shadcn), `layout/`, `workout/`, `rx/` (shell) |
| `src/pages/` | Route pages (thin wrappers) |
| `src/contexts/` | `AuthContext` (session, gym switcher, personas) |

## Data contract (athlete logging)

- **Prescription:** `programming` + shared `programming_line_item` (`contact_id` null)
- **Results:** `athlete_performance` with `programming_line_item_id` (never update shared PLIs for class scores)
- **Scale:** `workout_scale` on performances; strength `status` = `completed` | `failed`

## Database workflow

1. New migration: `supabase/migrations/[TIMESTAMP]_[description].sql`
2. Apply: `npx supabase db push --linked` (remote) or `supabase db reset` (local)
3. Regenerate `src/types/database.ts` after schema changes

Remote Triad/Paul SQL order: see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Auth

Sign-up creates `contact` + `profiles` via DB trigger. Use **`src/lib/auth.ts`** and **`src/contexts/AuthContext.tsx`**.
