# Rolldown Integration

Vite is planning to integrate [Rolldown](https://rolldown.rs), a Rust-powered JavaScript bundler, to improve build performance and capabilities.

## What is Rolldown?

Rolldown is a modern, high-performance JavaScript bundler written in Rust. It's designed as a drop-in replacement for Rollup, aiming to provide significant performance improvements while maintaining compatibility with the existing ecosystem.

Rolldown focuses on three key principles:

- **Speed**: Built with Rust for maximum performance
- **Compatibility**: Works with existing Rollup plugins
- **Developer Experience**: Familiar API for Rollup users

## Why Vite is Migrating to Rolldown

1. **Unification**: Vite currently uses esbuild for dependency pre-bundling and Rollup for production builds. Rolldown aims to unify these into a single, high-performance bundler that can be used for both purposes, reducing complexity.

2. **Performance**: Rolldown's Rust-based implementation offers significant performance improvements over JavaScript-based bundlers. While specific benchmarks may vary by project size and complexity, early tests show promising speed increases compared to Rollup.

For additional insights on the motivations behind Rolldown, see the [reasons why Rolldown is being built](https://rolldown.rs/guide/#why-rolldown).

## Benefits of Trying `rolldown-vite`

- Experience significantly faster build times, especially for larger projects
- Provide valuable feedback to help shape the future of Vite's bundling experience
- Prepare your projects for the eventual official Rolldown integration

## How to Try Rolldown

The rolldown-powered version of Vite is currently available as a separate package called `rolldown-vite`. You can try it by adding package overrides to your `package.json`:

:::code-group

```json [npm]
{
  "overrides": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

```json [Yarn]
{
  "resolutions": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

```json [pnpm]
{
  "pnpm": {
    "overrides": {
      "vite": "npm:rolldown-vite@latest"
    }
  }
}
```

```json [Bun]
{
  "overrides": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

:::

After adding these overrides, reinstall your dependencies and start your development server or build your project as usual. No further configuration changes are required.

## Known Limitations

While Rolldown aims to be a drop-in replacement for Rollup, there are features that are still being implemented and minor intentional behavior differences. For a comprehensive list, please refer to [this GitHub PR](https://github.com/vitejs/rolldown-vite/pull/84#issue-2903144667) which is regularly updated.

## Reporting Issues

Since this is an experimental integration, you may encounter issues. If you do, please report them in the [`vitejs/rolldown-vite`](https://github.com/vitejs/rolldown-vite) repository, **not the main Vite repository**.

When [reporting issues](https://github.com/vitejs/rolldown-vite/issues/new), please follow the issue template and provide:

- A minimal reproduction of the issue
- Your environment details (OS, Node version, package manager)
- Any relevant error messages or logs

For real-time discussions and troubleshooting, make sure to join the [Rolldown Discord](https://chat.rolldown.rs/).

## Future Plans

The `rolldown-vite` package is a temporary solution to gather feedback and stabilize the Rolldown integration. In the future, this functionality will be merged back into the main Vite repository.

We encourage you to try out `rolldown-vite` and contribute to its development through feedback and issue reports.

## Plugin / Framework authors guide

### The list of big changes

- Rolldown is used for build (Rollup was used before)
- Rolldown is used for the optimizer (esbuild was used before)
- CommonJS support is handled by Rolldown (@rollup/plugin-commonjs was used before)
- Oxc is used for syntax lowering (esbuild was used before)
- Lightning CSS is used for CSS minification by default (esbuild was used before)
- Oxc minifier is used for JS minification by default (esbuild was used before)
- Rolldown is used for bundling the config (esbuild was used before)

### Detecting rolldown-vite

You can detect by either

- checking the `this.meta.rolldownVersion` existence

```js
const plugin = {
  resolveId() {
    if (this.meta.rolldownVersion) {
      // logic for rolldown-vite
    } else {
      // logic for rollup-vite
    }
  },
}
```

- checking the `rolldownVersion` export existence

```js
import * as vite from 'vite'

if (vite.rolldownVersion) {
  // logic for rolldown-vite
} else {
  // logic for rollup-vite
}
```

If you have `vite` as a dependency (not a peer dependency), the `rolldownVersion` export is useful as it can be used from anywhere in your code.

### Ignoring option validation in Rolldown

Rolldown throws an error when unknown or invalid options are passed. Because some options available in Rollup are not supported by Rolldown, you may encounter errors. Below, you can find an an example of such an error message:

> Error: Failed validate input options.
>
> - For the "preserveEntrySignatures". Invalid key: Expected never but received "preserveEntrySignatures".

This can be fixed by conditionally passing the option by checking whether it's running with `rolldown-vite` as shown above.

If you would like to suppress this error for now, you can set the `ROLLDOWN_OPTIONS_VALIDATION=loose` environment variable. However, keep in mind that you will eventually need to stop passing the options not supported by Rolldown.

### `transformWithEsbuild` requires `esbuild` to be installed separately

A similar function called `transformWithOxc`, which uses Oxc instead of `esbuild`, is exported from `rolldown-vite`.

### Compatibility layer for `esbuild` options

Rolldown-Vite has a compatibility layer to convert options for `esbuild` to the respective Oxc or `rolldown` ones. As tested in [the ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci/blob/rolldown-vite/README-temp.md), this works in many cases, including simple `esbuild` plugins.
That said, **we'll be removing the `esbuild` options support in the future** and encourage you to try the corresponding Oxc or `rolldown` options.
You can get the options set by the compatibility layer from the `configResolved` hook.

```js
const plugin = {
  name: 'log-config',
  configResolved(config) {
    console.log('options', config.optimizeDeps, config.oxc)
  },
},
```

### Hook filter feature

Rolldown introduced a [hook filter feature](https://rolldown.rs/guide/plugin-development#plugin-hook-filters) to reduce the communication overhead the between Rust and JavaScript runtimes. By using this feature you can make your plugin more performant.
This is also supported by Rollup 4.38.0+ and Vite 6.3.0+. To make your plugin backward compatible with the older versions, make sure to also run the filter inside the hook handlers.

### Converting content to JavaScript in `load` or `transform` hooks

If you are converting the content to JavaScript from other types in `load` or `transform` hooks, you may need to add `moduleType: 'js'` to the returned value.

```js
const plugin = {
  name: 'txt-loader',
  load(id) {
    if (id.endsWith('.txt')) {
      const content = fs.readFile(id, 'utf-8')
      return {
        code: `export default ${JSON.stringify(content)}`,
        moduleType: 'js', // [!code ++]
      }
    }
  },
}
```

This is because [Rolldown supports non-JavaScript modules](https://rolldown.rs/guide/in-depth/module-types) and infers the module type from extensions unless specified. Note that `rolldown-vite` does not support ModuleTypes in dev.
