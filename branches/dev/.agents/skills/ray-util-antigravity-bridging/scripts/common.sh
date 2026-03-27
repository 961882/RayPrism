#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bridge_dir="$skill_dir/scripts/node/bridge"
runner="$bridge_dir/src/runner.ts"

export OPENCLI_CDP_ENDPOINT="${OPENCLI_CDP_ENDPOINT:-http://127.0.0.1:9224}"

if [[ ! -f "$runner" ]]; then
  echo "Missing bridge runner: $runner" >&2
  exit 1
fi

if ! (cd "$bridge_dir" && npx --no tsx --version &>/dev/null); then
  echo "tsx not found. Run: cd $bridge_dir && npm install" >&2
  exit 1
fi
