# Deploy parse-complex-wod to linked Supabase project (uztjncbmuyoqzqqqnohv).
# Prereqs: npx supabase login, Dashboard secret OPENROUTER_API_KEY (not openroute_api_key).

param(
  [string] $ProjectRef = "uztjncbmuyoqzqqqnohv"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $Root
try {
  if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "Run: npx supabase login"
    Write-Host "Or set SUPABASE_ACCESS_TOKEN for non-interactive deploy."
  }
  Write-Host "Deploying parse-complex-wod to project $ProjectRef ..."
  npx supabase functions deploy parse-complex-wod --project-ref $ProjectRef --use-api
  Write-Host "Done. Confirm secret OPENROUTER_API_KEY in Dashboard -> Edge Functions -> Secrets."
} finally {
  Pop-Location
}
