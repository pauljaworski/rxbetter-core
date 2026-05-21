# Pull Lovable UI edits into rxbetter-core (frontend files only).
# Usage:
#   .\scripts\pull-from-lovable.ps1 -LovablePath "..\rxbetter-train-smarter-0dddcf23"

param(
  [string] $LovablePath = $env:LOVABLE_REPO
)

$ErrorActionPreference = "Stop"
$CoreRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $LovablePath) {
  Write-Error "Set -LovablePath or env LOVABLE_REPO to your Lovable clone."
}

$LovableRoot = Resolve-Path $LovablePath

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
  "eslint.config.js"
)

Write-Host "Lovable → Core"
Write-Host "  From: $LovableRoot"
Write-Host "  To:   $CoreRoot"
Write-Host ""

foreach ($item in $CopyItems) {
  $src = Join-Path $LovableRoot $item
  if (-not (Test-Path $src)) {
    Write-Warning "Skip missing in Lovable: $item"
    continue
  }
  $dest = Join-Path $CoreRoot $item
  if (Test-Path $dest -PathType Container) {
    Remove-Item $dest -Recurse -Force
  } elseif (Test-Path $dest -PathType Leaf) {
    Remove-Item $dest -Force
  }
  Copy-Item $src $dest -Recurse -Force
  Write-Host "Copied $item"
}

Write-Host ""
Write-Host "Done. In rxbetter-core run: npm run check"
Write-Host "Then: git add -A && git commit -m 'chore(ui): pull edits from Lovable'"
