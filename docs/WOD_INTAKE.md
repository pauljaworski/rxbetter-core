# WOD plain-text intake (Parse & Confirm)

Programmers paste workout text on **Programming** (`/staff/programming`). The client parses locally, shows editable chips, then commits structured rows — **no AI at save time**.

## Flow

1. Paste text (e.g. `Back Squat 5x3 @ 80%`)
2. **Parse** — regex + fuzzy `benchmark_type` match (`src/lib/wod-parser/`)
3. Verify/edit draft (`WodIntakeDraft`)
4. **Save to calendar** — insert `programming_intake_stage` → `programming` + `programming_line_item` → mark intake `committed`

## Parser grammar (Phase 1)

| Pattern | Example |
|---------|---------|
| Sets × reps @ % | `Back Squat 5x3 @ 80%` |
| Reps @ weight | `Deadlift 3 @ 225` |
| Metcon (fallback) | `AMRAP 12…` → draft metcon + Phase 2 LLM flag |

Unmatched movements stay editable; pick from catalog dropdown before save.

## Schema

Table: `programming_intake_stage` (migration `20260521120000_programming_intake_stage.sql`)

- `raw_text`, `parsed_payload` (JSON), `parser_mode` (`regex` \| `llm` \| `manual`)
- `status`: `staged` \| `committed` \| `rejected`
- `committed_programming_id` → `programming.id`

## Phase 2 (deferred)

Edge function `parse-complex-wod` + Gemini Flash when regex sets `needsLlmFallback`.

## Publish to Lovable

After changes in **rxbetter-core**:

```powershell
.\scripts\sync-to-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23" -Push
```

Apply migration on Supabase before using intake in production.
