# RxBetter — Supabase in this repo

## Workflow

1. **Edit SQL** in `supabase/migrations/` — add new files with a timestamp prefix (e.g. `20260412120000_add_movements.sql`). Do not rename migrations that already ran on the hosted project.
2. **Apply to hosted DB:** from repo root, `npm run db:push` (requires [link](https://supabase.com/docs/guides/cli/local-development#link-your-project) first via `npm run db:setup`).
3. **Optional local stack:** Docker + `npm run db:start` for local Postgres/Studio.

## First-time data bootstrap (after core migration)

1. Sign up a user (Auth → Users, or your app).
2. Insert a row into `public.gym` (Table Editor or client with that user logged in).
3. Insert `public.profiles` with `id` = that user’s UUID and `gym_id` pointing at the gym.
4. Add `public.athlete` rows and programming data; RLS uses `profiles.gym_id`.

## Salesforce ↔ SQL map

See migration `20260412000001_rxbetter_core_schema.sql` and metadata under `force-app/main/default/objects/` (`Programming__c`, `Programming_Line_Item__c`, `Athlete_Performance__c`, `Athlete_Benchmark_Summary__c`).
