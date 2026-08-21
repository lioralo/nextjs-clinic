#!/usr/bin/env bash
# Thin wrapper so `bash scripts/local-run.sh` still works. Logic lives in Node
# so Windows cmd.exe does not need Git Bash.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$ROOT/scripts/local-run.mjs" "$@"
