# Breaking Changes

List of breaking changes in Vite including API deprecations, removals, and changes. Most of the changes below can be opt-in using the [`future` option](/config/shared-options.html#future) in your Vite config.

## Planned

These changes are planned for the next major version of Vite. The deprecation or usage warnings will guide you where possible, and we're reaching out to framework, plugin authors, and users to apply these changes.

- [`this.environment` in Hooks](/changes/this-environment-in-hooks)
- [HMR `hotUpdate` Plugin Hook](/changes/hotupdate-hook)
- [SSR Using `ModuleRunner` API](/changes/ssr-using-modulerunner)

## Considering

These changes are being considered and are often experimental APIs that intend to improve upon current usage patterns. As not all changes are listed here, please check out the [Experimental Label in Vite GitHub Discussions](https://github.com/vitejs/vite/discussions/categories/feedback?discussions_q=label%3Aexperimental+category%3AFeedback) for the full list.

We don't recommend switching to these APIs yet. They are included in Vite to help us gather feedback. Please check these proposals and let us know how they work in your use case in each's linked GitHub Discussions.

- [Move to Per-environment APIs](/changes/per-environment-apis)
- [Shared Plugins During Build](/changes/shared-plugins-during-build)

## Past

The changes below have been done or reverted. They are no longer relevant in the current major version.

- _No past changes yet_
