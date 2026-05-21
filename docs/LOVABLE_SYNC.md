# Lovable ↔ rxbetter-core sync

## Repositories

| Repo | Role |
|------|------|
| [pauljaworski/rxbetter-core](https://github.com/pauljaworski/rxbetter-core) | **Source of truth** — Cursor, Supabase migrations, hooks, staff fixes |
| [pauljaworski/rxbetter-train-smarter-0dddcf23](https://github.com/pauljaworski/rxbetter-train-smarter-0dddcf23) | **Lovable mirror** — preview + optional Lovable AI edits |
| [pauljaworski/rxbetter-train-smarter](https://github.com/pauljaworski/rxbetter-train-smarter) | **Archived** — earlier Lovable project; UI history lives here if you need to diff |

Lovable **cannot** connect to an existing `rxbetter-core` repo. It only syncs with a repo **it created** (`rxbetter-train-smarter-0dddcf23`).

**Supabase:** Same project in both places (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Changing Git repos does not change the database.

## Daily workflow (Cursor → Lovable preview)

```text
Edit UI in Cursor (rxbetter-core)
  → git push origin main
  → scripts/sync-to-lovable.ps1 -Push
  → Lovable rebuilds from rxbetter-train-smarter-0dddcf23
```

### 1. Work in rxbetter-core

```powershell
cd rxbetter-core
# edit src/ …
git add .
git commit -m "feat(ui): …"
git push origin main
```

### 2. Publish to Lovable

One-time clone:

```powershell
cd ..
git clone https://github.com/pauljaworski/rxbetter-train-smarter-0dddcf23.git
```

Each publish (from `rxbetter-core`):

```powershell
.\scripts\sync-to-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23" -Push
```

Or set an environment variable:

```powershell
$env:LOVABLE_REPO = "C:\path\to\rxbetter-train-smarter-0dddcf23"
.\scripts\sync-to-lovable.ps1 -Push
```

## What gets copied

The script copies **frontend app files only** from `rxbetter-core` into the Lovable repo:

- `src/`, `public/`, `index.html`
- `package.json`, `package-lock.json`
- Vite/TS/Tailwind/ESLint config (`vite.config.ts`, `tsconfig*.json`, `tailwind.config.ts`, etc.)

**Not copied** (stay only in core):

- `supabase/migrations/` — schema SSOT in core
- `supabase/functions/` — edge functions (e.g. Phase 2 `parse-complex-wod`); deploy from core via Supabase CLI, not Lovable sync
- `docs/`, `scripts/` (data generators), `.cursor/`

**Never overwritten** in the Lovable clone:

- `.git/`, `.lovable/`, `.env`, `node_modules/`, `bun.lock`, `bun.lockb`

## After editing in Lovable

Lovable pushes to **its** repo. Pull those changes back into core so Cursor stays current:

```powershell
.\scripts\pull-from-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23"
# review diff, commit in rxbetter-core
git push origin main
```

## Legacy UI (rxbetter-train-smarter)

Yesterday’s menu/layout tweaks may exist only on the **old** Lovable repo. To compare:

```powershell
git clone https://github.com/pauljaworski/rxbetter-train-smarter.git _compare-legacy
# diff src/ against rxbetter-core, cherry-pick anything missing into core first,
# then run sync-to-lovable.ps1
```

Going forward, treat **core** as canonical; avoid editing the archived repo.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Lovable preview stale | Run `sync-to-lovable.ps1 -Push`; confirm Lovable Git settings show the new repo |
| `/staff` reload loop | Pull latest `rxbetter-core` / re-sync (fixed in core `e28cb7c+`) |
| Merge conflicts on first sync | Prefer `src/` from core; keep Lovable `.lovable/` and `.env` |
| Lovable broke sync | Do not rename/delete the Lovable GitHub repo |

## Rules

1. Do **not** rename or delete `rxbetter-train-smarter-0dddcf23` on GitHub.
2. Run `npm run check` in **rxbetter-core** before publishing to Lovable.
3. Publish UI with the script; do not hand-merge entire monorepo into Lovable.
