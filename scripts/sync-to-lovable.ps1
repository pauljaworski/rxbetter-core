# Sync Vite UI (+ athlete AI edge functions) from rxbetter-core → Lovable GitHub repo.
# Usage:
#   .\scripts\sync-to-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23"
#   .\scripts\sync-to-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23" -Push -Message "sync: staff UI from core"

param(
  [string] $LovablePath = $env:LOVABLE_REPO,
  [switch] $Push,
  [string] $Message = "sync(ui): publish from rxbetter-core"
)

$ErrorActionPreference = "Stop"
$CoreRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $LovablePath) {
  Write-Error "Set -LovablePath or env LOVABLE_REPO to your Lovable clone (rxbetter-train-smarter-0dddcf23)."
}

$LovableRoot = Resolve-Path $LovablePath
if (-not (Test-Path (Join-Path $LovableRoot ".git"))) {
  Write-Error "Lovable path is not a git repo: $LovableRoot"
}

$CopyItems = @(
  "src",
  "public",
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "vitest.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "tailwind.config.ts",
  "postcss.config.js",
  "components.json",
  "eslint.config.js",
  ".env.example"
)

Write-Host "Core:    $CoreRoot"
Write-Host "Lovable: $LovableRoot"
Write-Host ""

foreach ($item in $CopyItems) {
  $src = Join-Path $CoreRoot $item
  if (-not (Test-Path $src)) {
    Write-Warning "Skip missing: $item"
    continue
  }
  $dest = Join-Path $LovableRoot $item
  if (Test-Path $dest -PathType Container) {
    Remove-Item $dest -Recurse -Force
  } elseif (Test-Path $dest -PathType Leaf) {
    Remove-Item $dest -Force
  }
  Copy-Item $src $dest -Recurse -Force
  Write-Host "Copied $item"
}

# Keep Lovable edge functions aligned with core OpenRouter athlete AI (do not sync all of supabase/).
$FnFiles = @(
  "supabase/functions/_shared/auth.ts",
  "supabase/functions/_shared/openrouter.ts",
  "supabase/functions/_shared/rate-limit.ts",
  "supabase/functions/athlete-insights/index.ts",
  "supabase/functions/metcon-strategy/index.ts"
)
foreach ($rel in $FnFiles) {
  $src = Join-Path $CoreRoot $rel
  if (-not (Test-Path $src)) {
    Write-Warning "Skip missing: $rel"
    continue
  }
  $dest = Join-Path $LovableRoot $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  }
  Copy-Item $src $dest -Force
  Write-Host "Copied $rel"
}

Push-Location $LovableRoot
try {
  git add -A
  # Never stage local secrets or supabase CLI temp
  git reset HEAD -- .env .env.local "supabase/.temp" 2>$null
  $status = git status --porcelain
  if (-not $status) {
    Write-Host "Lovable repo already up to date."
    return
  }
  git commit -m $Message
  Write-Host "Committed in Lovable repo."

  if ($Push) {
    git push origin HEAD
    Write-Host "Pushed to origin. Lovable should rebuild shortly."
  } else {
    Write-Host "Dry run complete. Re-run with -Push to push to GitHub."
  }
} finally {
  Pop-Location
}
