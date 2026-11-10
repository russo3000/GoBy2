#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]]; then
  echo "Goby cloud checks require Node 24 (see .nvmrc)." >&2
  exit 1
fi
npm ci --no-audit --no-fund
npm run typecheck
npm test
npm run review:build
echo "Cloud source checks and web export passed. Browser and phone checks are separate."

