#!/usr/bin/env bash
# Sync Vite UI from rxbetter-core → Lovable repo. See docs/LOVABLE_SYNC.md
set -euo pipefail

CORE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOVABLE_PATH="${1:-${LOVABLE_REPO:-}}"
PUSH="${PUSH:-false}"
MESSAGE="${MESSAGE:-sync(ui): publish from rxbetter-core}"

if [[ -z "$LOVABLE_PATH" ]]; then
  echo "Usage: LOVABLE_REPO=../rxbetter-train-smarter-0dddcf23 $0"
  echo "   or: $0 /path/to/lovable-clone"
  exit 1
fi

LOVABLE_ROOT="$(cd "$LOVABLE_PATH" && pwd)"
ITEMS=(src public index.html package.json package-lock.json vite.config.ts vitest.config.ts
  tsconfig.json tsconfig.app.json tsconfig.node.json tailwind.config.ts postcss.config.js
  components.json eslint.config.js .env.example)

echo "Core:    $CORE_ROOT"
echo "Lovable: $LOVABLE_ROOT"

for item in "${ITEMS[@]}"; do
  [[ -e "$CORE_ROOT/$item" ]] || continue
  rm -rf "$LOVABLE_ROOT/$item"
  cp -R "$CORE_ROOT/$item" "$LOVABLE_ROOT/$item"
  echo "Copied $item"
done

cd "$LOVABLE_ROOT"
git add -A
if git diff --cached --quiet; then
  echo "Lovable repo already up to date."
  exit 0
fi
git commit -m "$MESSAGE"
if [[ "$PUSH" == "true" ]]; then
  git push origin HEAD
  echo "Pushed to origin."
fi
