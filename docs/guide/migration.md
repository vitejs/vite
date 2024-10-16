# Migration from v5

## Environment API

As part of the new experimental [Environment API](/guide/api-environment.md), a big internal refactoring was needed. Vite 6 strives to avoid breaking changes to ensure most projects can quickly upgrade to the new major. We'll wait until a big portion of the ecosystem has moved to stabilize and start recommending the use of the new APIs. There may be some edge cases but these should only affect low level usage by frameworks and tools. We have worked with maintainers in the ecosystem to mitigate these differences before the release. Please [open an issue](https://github.com/vitejs/vite/issues/new?assignees=&labels=pending+triage&projects=&template=bug_report.yml) if you spot a regression.

Some internal APIs have been removed due to changes in Vite's implementation. If you were relying on one of them, please create a [feature request](https://github.com/vitejs/vite/issues/new?assignees=&labels=enhancement%3A+pending+triage&projects=&template=feature_request.yml).

## Vite Runtime API

The experimental Vite Runtime API evolved into the Module Runner API, released in Vite 6 as part of the new experimental [Environment API](/guide/api-environment). Given that the feature was experimental the removal of the previous API introduced in Vite 5.1 isn't a breaking change, but users will need to update their use to the Module Runner equivalent as part of migrating to Vite 6.

## Migration from v4

Check the [Migration from v4 Guide](https://v5.vite.dev/guide/migration.html) in the Vite v5 docs first to see the needed changes to port your app to Vite 5, and then proceed with the changes on this page.
