echo "prev commit: $CACHED_COMMIT_REF"
echo "current commit: $COMMIT_REF"
if [ "$CACHED_COMMIT_REF" = "$COMMIT_REF" ]; then
  # builds runs without cache
  exit 1
fi
git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF docs package.json pnpm-lock.yaml netlify.toml packages/vite/package.json scripts/docs-check.sh
status=$?
echo "diff exit code: $status"
exit $status
