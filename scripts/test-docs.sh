#!/bin/bash
# Run docs build and fail if there are SSR errors in the output.
# Vue SSR silently swallows component render errors via handleError (console.warn),
# so vitepress build exits 0 even when pages are broken. This script catches that.
set -e

LOG_FILE=$(mktemp)
trap 'rm -f "$LOG_FILE"' EXIT

pnpm run docs-build 2>&1 | tee "$LOG_FILE"

if grep -qE '^(TypeError|Error|ReferenceError|SyntaxError):' "$LOG_FILE"; then
  echo ""
  echo "ERROR: SSR errors detected during docs build. See output above."
  echo "       Vue SSR silently swallows component errors, so the build exits 0"
  echo "       even when pages render incorrectly."
  exit 1
fi
