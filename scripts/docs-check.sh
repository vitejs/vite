echo "prev commit: $CACHED_COMMIT_REF"
echo "current commit: $COMMIT_REF"
git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF docs package.json pnpm-lock.yaml netlify.toml scripts/docs-check.sh
status=$?
echo "diff exit code: $status"
exit $status
