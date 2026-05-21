# WOD plain-text intake (Parse & Confirm)

Programmers paste workout text on **Programming** (`/staff/programming`). The client parses locally, shows editable chips, then commits structured rows — **no AI at save time**.

## Flow

1. Paste text (e.g. `Back Squat 5x3 @ 80%`)
2. **Parse** — regex + fuzzy `benchmark_type` match (`src/lib/wod-parser/`)
3. **Parse with AI** (optional) — OpenRouter via edge function for complex metcons
4. Verify/edit draft (`WodIntakeDraft`)
5. **Save to calendar** — insert `programming_intake_stage` → `programming` + `programming_line_item` → mark intake `committed`

## Parser grammar (Phase 1 — regex)

| Pattern | Example |
|---------|---------|
| Sets × reps @ % | `Back Squat 5x3 @ 80%` |
| Reps @ weight | `Deadlift 3 @ 225` |
| Metcon (fallback) | `AMRAP 12…` → draft metcon + **Parse with AI** for line items |

Unmatched movements stay editable; pick from catalog dropdown before save.

## Phase 2 — AI parse (OpenRouter)

Edge function: `supabase/functions/parse-complex-wod` (deploy from **rxbetter-core** only).

| Guard | Limit |
|-------|--------|
| Input | Workout text only, max 2,500 chars |
| Auth | Programmer JWT + library scope |
| Rate | 30 LLM parses / coach / day (configurable `WOD_PARSE_DAILY_LIMIT`) |
| Tokens | ~900–1200 max per request |
| Save | Never calls LLM |

**Secrets (Supabase → Edge Functions):** `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (auto-injected), optional `WOD_PARSE_DAILY_LIMIT`, `OPENROUTER_SITE_URL`.

**Model routing:** fast / standard / complex tiers → Gemini Flash, GPT-4o-mini, Claude Haiku (fallback chain).

**CrossFit grounding:** few-shot examples in `supabase/functions/_shared/cf-parse-examples.json` + system prompt (not fine-tuning).

Deploy:

```powershell
cd rxbetter-core
npx supabase functions deploy parse-complex-wod --no-verify-jwt
# Prefer verify JWT: default when linked; pass user session Bearer token from client
```

Client invokes with `supabase.functions.invoke('parse-complex-wod', { body: { gym_id, program_library_id, raw_text, ... } })`.

## Schema

Table: `programming_intake_stage` (migration `20260521120000_programming_intake_stage.sql`)

- `raw_text`, `parsed_payload` (JSON), `parser_mode` (`regex` \| `llm` \| `manual`)
- `token_count`, `latency_ms` — populated for LLM parses
- `parsed_payload._meta` — optional `{ model, token_count, parser_tier }`
- `status`: `staged` \| `committed` \| `rejected`

## Publish to Lovable

After UI changes in **rxbetter-core**:

```powershell
.\scripts\sync-to-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23" -Push
```

Edge functions are **not** copied to the Lovable mirror.
