#!/usr/bin/env bash
# lint → typecheck → unit → integration → openapi drift → build → branding
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n== %s ==\n' "$1"; }

step lint
npm run lint

step typecheck
npm run typecheck

step unit
npm run test:unit

step integration
integration_files="$(
  find apps packages -type f \
    \( -name '*.integration.test.ts' -o -path '*/test/*' \) \
    ! -path '*/node_modules/*' ! -name '.gitkeep' 2>/dev/null || true
)"
if [[ -n "$integration_files" ]]; then
  npm run test:integration
else
  echo "integration: no-op (no integration tests yet)"
fi

step "openapi drift"
if [[ -f openapi/openapi.json ]]; then
  echo "openapi drift: openapi/openapi.json exists but no drift check is wired yet" >&2
  exit 1
fi
echo "openapi drift: no-op (openapi/openapi.json is not generated yet)"

step build
npm run build

step "branding check"
node scripts/check-branding.mjs
