#!/usr/bin/env bash

echo "Previous commit: ${CACHED_COMMIT_REF:-None}"
echo "Current commit:  ${COMMIT_REF:-None}"

# 1. Fallback if commit refs are identical or missing
if [ -z "$CACHED_COMMIT_REF" ] || [ "$CACHED_COMMIT_REF" = "$COMMIT_REF" ]; then
  echo "No cached commit reference found or refs match. Forcing build."
  exit 1
fi

# 2. Check for changes in specific files/directories
# Added --quiet to suppress output, keeping logs clean.
git diff --quiet "$CACHED_COMMIT_REF" "$COMMIT_REF" -- \
  docs \
  package.json \
  pnpm-lock.yaml \
  netlify.toml \
  packages/vite/package.json \
  scripts/docs-check.sh

STATUS=$?
echo "Diff exit code: $STATUS"

# 3. Exit with the status of the git diff
# Exit code 0 = No changes (skip/cancel build if Netlify/CI allows)
# Exit code 1 = Changes detected (proceed with build)
exit $STATUS