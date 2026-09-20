# WOD plain-text intake (Parse & Confirm)

Programmers paste workout text on **Programming** (`/staff/programming`) under **AI / text intake**.

## Modes

### This day
1. Paste one block (strength or metcon)
2. **Parse with AI** (default) or **Parse (fast)** regex
3. Verify/edit draft chips
4. **Save to calendar** → `programming_intake_stage` → `programming` + line items

### Week / bulk
1. Paste multiple days labeled `Monday`, `Tue`, or `2026-09-15`
2. Separate segments with `Strength` / `Metcon` headers or `---`
3. **Split & parse (AI)** → review grid → uncheck skips → **Save N selected**

## Parser grammar (fast / regex)

| Pattern | Example |
|---------|---------|
| Sets × reps @ % | `Back Squat 5x3 @ 80%` → **5 line items**, each 3 reps @ 80% |
| Percent ladder | `Back Squat 5x3 65,70,75,80,85%` |
| Reps @ weight | `Deadlift 3 @ 225` |
| Metcon | Prefer **Parse with AI** for movements |

## AI parse (OpenRouter)

Edge function: `supabase/functions/parse-complex-wod` (deploy from **rxbetter-core**).

| Guard | Limit |
|-------|--------|
| Input | Workout text only, max 2,500 chars **per block** |
| Auth | Programmer JWT + library scope |
| Rate | 30 LLM parses / coach / day (`WOD_PARSE_DAILY_LIMIT`) |
| Save | Never calls LLM |

AI is **on by default**. Set `VITE_ENABLE_WOD_AI_PARSE=false` to hide AI buttons.

**Secrets:** `OPENROUTER_API_KEY`, optional `WOD_PARSE_DAILY_LIMIT`, `OPENROUTER_SITE_URL`.

```powershell
npx supabase functions deploy parse-complex-wod
```

## Schema

Table: `programming_intake_stage`

- `raw_text`, `parsed_payload`, `parser_mode` (`regex` \| `llm` \| `manual`)
- `status`: `staged` \| `committed` \| `rejected`

## Publish to Lovable

```powershell
.\scripts\sync-to-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23" -Push
```
