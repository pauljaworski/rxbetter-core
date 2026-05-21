# Edge functions (rxbetter-core only)

Deploy from repo root after `npx supabase login`:

```powershell
npx supabase functions deploy parse-complex-wod
```

## Secrets (Dashboard → Project Settings → Edge Functions)

| Secret | Required |
|--------|----------|
| `OPENROUTER_API_KEY` | Yes (exact name; not `openroute_api_key`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected on deploy |
| `WOD_PARSE_DAILY_LIMIT` | Optional (default 30) |
| `OPENROUTER_SITE_URL` | Optional referrer |

## parse-complex-wod

WOD intake AI parse (OpenRouter). Called only from staff programming intake — user JWT required.
