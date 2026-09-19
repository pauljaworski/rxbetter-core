# Edge functions (rxbetter-core only)

Deploy from repo root after `npx supabase login`:

```powershell
npx supabase functions deploy parse-complex-wod
npx supabase functions deploy athlete-insights
npx supabase functions deploy metcon-strategy
```

Or all at once:

```powershell
npx supabase functions deploy
```

## Secrets (Dashboard → Project Settings → Edge Functions)

| Secret | Required |
|--------|----------|
| `OPENROUTER_API_KEY` | Yes (exact name; not `openroute_api_key`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected on deploy |
| `WOD_PARSE_DAILY_LIMIT` | Optional (default 30) — coach WOD parse |
| `ATHLETE_AI_DAILY_LIMIT` | Optional (default 20) — per kind (insights / metcon_strategy) |
| `OPENROUTER_SITE_URL` | Optional referrer |

Apply the `ai_request_log` migration before relying on athlete rate limits:

```powershell
npx supabase db push
```

## parse-complex-wod

WOD intake AI parse (OpenRouter). Called only from staff programming intake — user JWT required.

## athlete-insights

Streams a weekly coach brief (SSE). Body: `{ contact_id, gym_id }`. Gym-scoped upcoming programming. JWT must match `contact_id`.

## metcon-strategy

JSON strategy for a metcon on Today. Body: `{ programming_id, gym_id, contact_id? }`. Returns scale, pacing, breakdown, targets, risk.
