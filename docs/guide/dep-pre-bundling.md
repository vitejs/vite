# Dependency Pre-Bundling

When you run `vite` for the first time, you may notice this message:

```
Optimizable dependencies detected:
react, react-dom
Pre-bundling them to speed up dev server page load...
(this will be run only when your dependencies have changed)
```

## The Why

This is Vite performing what we call "dependency pre-bundling". This process serves two purposes:

1. It converts non-ESM dependencies (e.g. CommonJS) into ESM format so that it can be imported as native ES modules by the browser.

    In addition, Vite performs smart import analysis so that named imports to CommonJS modules will work as expected even if the exports are dynamically assigned (e.g. React):

    ```js
    // works as expected
    import React, { useState } from 'react'
    ```

2. It converts ESM dependencies with many internal modules into a single module to improve subsequent page load performance.

    Some packages ship their ES modules builds as many separate files importing one another. For example, [`lodash-es` has over 600 internal modules](https://unpkg.com/browse/lodash-es/)! When we do `import { debounce } from 'lodash-es`, the browser fires off 600+ HTTP requests at the same time! Even though the server has no problem handling them, the large amount of requests create a network congestion on the browser side, causing the page the load quite a bit slower.

    By pre-bundling `lodash-es` into a single module, we now only need one HTTP request instead!

## Pre-Bundle Criteria

Dependencies are only checked for pre-bundling if it is listed in `dependencies` of your `package.json`. It will be eligible for pre-bundling if one of the following is true:

- The dependency's entry contains no valid ES module export (treated as CommonJS);
- The dependency's entry contains ES imports to other modules or dependencies (multiple internal modules).

This also means you should avoid placing dependencies that are not meant to be imported in your source code under `dependencies` (move them to `devDependencies` instead).

## Monorepos and Linked Dependencies

In a monorepo setup, a dependency may be a linked package from the same repo. Vite automatically detects dependencies that are not resolved from `node_modules` and treats the linked dep as source code. It will not attempt to bundle the linked dep, and instead will analyze the linked dep's dependency list instead.

## Customizing the Behavior

The default pre-bundling heuristics may not always be desirable. In cases where you want to explicitly include/exclude dependencies from the list, use the [`optimizeDeps` config options](/config/#dep-optimization-options).

## Caching

Vite caches the pre-bundled dependencies in `node_modules/.vite`. It determins whether it needs to re-run the pre-bundling step based on a few sources:

- The `dependencies` list in your `package.json`
- Package manager lockfiles, e.g. `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`.
- Your `vite.config.js`, if present.

The pre-bundling step will only need to be re-run when one of the above has changed.

If for some reason you want to force Vite to re-bundle deps, you can either start the dev server with the `--force` command line option, or manually delete the `node_modules/.vite` cache directory.
