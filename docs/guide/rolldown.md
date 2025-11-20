# Rolldown Integration

Vite is planning to integrate [Rolldown](https://rolldown.rs), a Rust-powered JavaScript bundler, to improve build performance and capabilities.

<YouTubeVideo videoId="RRjfm8cMveQ" />

## What is Rolldown?

Rolldown is a modern, high-performance JavaScript bundler written in Rust. It's designed as a drop-in replacement for Rollup, aiming to provide significant performance improvements while maintaining compatibility with the existing ecosystem.

Rolldown focuses on three key principles:

- **Speed**: Built with Rust for maximum performance
- **Compatibility**: Works with existing Rollup plugins
- **Optimization**: Comes with features that go beyond what esbuild and Rollup implement

## Why Vite is Migrating to Rolldown

1. **Unification**: Vite currently uses esbuild for dependency pre-bundling and Rollup for production builds. Rolldown aims to unify these into a single, high-performance bundler that can be used for both purposes, reducing complexity.

2. **Performance**: Rolldown's Rust-based implementation offers significant performance improvements over JavaScript-based bundlers. While specific benchmarks may vary by project size and complexity, early tests show promising speed increases compared to Rollup.

3. **Additional Features**: Rolldown introduces features that are not available in Rollup or esbuild, such as advanced chunk splitting control, built-in HMR, and Module Federation.

For additional insights on the motivations behind Rolldown, see the [reasons why Rolldown is being built](https://rolldown.rs/guide/introduction#why-rolldown).

## Benefits of Trying `rolldown-vite`

- Experience significantly faster build times, especially for larger projects
- Provide valuable feedback to help shape the future of Vite's bundling experience
- Prepare your projects for the eventual official Rolldown integration

## How to Try Rolldown

The rolldown-powered version of Vite is currently available as a separate package called `rolldown-vite`. If you have `vite` as a direct dependency, you can alias the `vite` package to `rolldown-vite` in your project's `package.json`, which should result in a drop-in replacement.

```json
{
  "devDependencies": {
    "vite": "^7.0.0" // [!code --]
    "vite": "npm:rolldown-vite@latest" // [!code ++]
  }
}
```

::: tip Please pin the version!

While these examples use `@latest`, we recommend using a specific version number to avoid unexpected breaking changes as [`rolldown-vite` is considered experimental](#versioning-policy).

:::

If you use a Vitepress or a meta framework that has Vite as peer dependency, you have to override the `vite` dependency in your `package.json`, which works slightly different depending on your package manager:

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

If you are starting a new project, you can use `create-vite` as normal for rolldown-vite, too. The latest version will ask you whether to use `rolldown-vite` or not.

## Known Limitations

While Rolldown aims to be a drop-in replacement for Rollup, there are features that are still being implemented and minor intentional behavior differences. For a comprehensive list, please refer to [this GitHub PR](https://github.com/vitejs/rolldown-vite/pull/84#issue-2903144667) which is regularly updated.

### Option Validation Warnings

Rolldown outputs an warning when unknown or invalid options are passed. Because some options available in Rollup are not supported by Rolldown, you may encounter warnings based on the options you or the meta framework you use set. Below, you can find an example of such an warning message:

> Warning validate output options.
>
> - For the "generatedCode". Invalid key: Expected never but received "generatedCode".

If you don't pass the option in yourself, this must be fixed by the utilized framework.

### API Differences

#### `manualChunks` to `advancedChunks`

While Rolldown has support for the `manualChunks` option that is also exposed by Rollup, it is marked deprecated. Instead of it, Rolldown offers a more fine-grained setting via the [`advancedChunks` option](https://rolldown.rs/in-depth/advanced-chunks), which is more similar to webpack's `splitChunk`:

```js
// Old configuration (Rollup)
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/\/react(?:-dom)?/.test(id)) {
            return 'vendor'
          }
        }
      }
    }
  }
}

// New configuration (Rolldown)
export default {
  build: {
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [{ name: 'vendor', test: /\/react(?:-dom)?/ }]
        }
      }
    }
  }
}
```

## Performance

`rolldown-vite` is focused on ensuring compatibility with the existing ecosystem, so defaults are geared towards a smooth transition. You can get further performance gains by switching over to faster Rust-based internal plugins and other customizations.

### Enabling Native Plugins

Thanks to Rolldown and Oxc, various internal Vite plugins, such as the alias or resolve plugin, have been converted to Rust. Native plugins are now enabled by default, with the default value set to `'v1'`.

If you encounter any issues, you can change the `experimental.enableNativePlugin` option in your Vite config to `'resolver'` or `false` as a workaround. Note that this option will be removed in the future.

### Utilizing Oxc's React refresh transform

`@vitejs/plugin-react` v5.0.0+ uses Oxc's React refresh transform. If you are not using any Babel plugins (including the React compiler), the full transform would now be done by Oxc and will improve the build performance without any changes other than updating `@vitejs/plugin-react`.

If you are using `@vitejs/plugin-react-swc` without SWC plugins and custom SWC options, you can switch to the `@vitejs/plugin-react` plugin to utilize Oxc.

::: details `@vitejs/plugin-react-oxc` plugin is deprecated

Previously, we recommended using `@vitejs/plugin-react-oxc` to utilize Oxc's React refresh transform. However, we have merged the implementation into `@vitejs/plugin-react` so that it is easier to switch to `rolldown-vite`. `@vitejs/plugin-react-oxc` is now deprecated and will no longer be updated.

:::

### `withFilter` Wrapper

Plugin authors have the option to use the [hook filter feature](#hook-filter-feature) to reduce the communication overhead between the Rust and JavaScript runtimes.
But in case some of the used plugins are not using this feature (yet) but you still want to benefit from it, you can use the `withFilter` wrapper to wrap the plugin with a filter yourself.

```js
// In your vite.config.ts
import { withFilter, defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    // Load the `svgr` plugin only for files which end in `.svg?react`
    withFilter(
      svgr({
        /*...*/
      }),
      { load: { id: /\.svg\?react$/ } },
    ),
  ],
})
```

## Reporting Issues

Since this is an experimental integration, you may encounter issues. If you do, please report them in the [`vitejs/rolldown-vite`](https://github.com/vitejs/rolldown-vite) repository, **not the main Vite repository**.

When [reporting issues](https://github.com/vitejs/rolldown-vite/issues/new), please follow the appropriate issue template and provide what is requested there, commonly including:

- A minimal reproduction of the issue
- Your environment details (OS, Node version, package manager)
- Any relevant error messages or logs

For real-time discussions and troubleshooting, make sure to join the [Rolldown Discord](https://chat.rolldown.rs/).

## Versioning Policy

The versioning policy for `rolldown-vite` aligns its major and minor versions with those of the normal Vite package. This synchronization ensures that features present in a specific normal Vite minor release are also included in the corresponding `rolldown-vite` minor release. However, it's important to note that patch versions are not synchronized between the two projects. If you're wondering whether a specific change from normal Vite has been included in `rolldown-vite`, you can always check [`rolldown-vite`'s separate changelog](https://github.com/vitejs/rolldown-vite/blob/rolldown-vite/packages/vite/CHANGELOG.md) for confirmation.

Furthermore, please be aware that `rolldown-vite` itself is considered experimental. Due to its experimental nature, breaking changes might be introduced even within its patch versions. Additionally, please note that `rolldown-vite` only receives updates for its most recent minor version. Even for important security or bug fixes, patches are not created for older major or minor versions.

## Future Plans

The `rolldown-vite` package is a temporary solution to gather feedback and stabilize the Rolldown integration. In the future, this functionality will be merged back into the main Vite repository.

We encourage you to try out `rolldown-vite` and contribute to its development through feedback and issue reports.

In the future, we will also introduce a "Full Bundle Mode" for Vite, which will serve bundled files in production _and development mode_.

### Why introducing a Full Bundle Mode?

Vite is known for its unbundled dev server approach, which is a main reason for Vite's speed and popularity when it was first introduced. This approach was initially an experiment to see just how far we could push the boundaries of development server performance without traditional bundling.

However, as projects scale in size and complexity, two main challenges have emerged:

1. **Development/Production inconsistency**: The unbundled JavaScript served in development versus the bundled production build creates different runtime behaviors. This can lead to issues that only manifest in production, making debugging more difficult.

2. **Performance degradation during development**: The unbundled approach results in each module being fetched separately, which creates a large number of network requests. While this has _no impact in production_, it causes significant overhead during dev server startup and when refreshing the page in development. The impact is especially noticeable in large applications where hundreds or even thousands of separate requests must be processed. These bottlenecks become even more severe when developers use network proxy, resulting in slower refresh times and degraded developer experience.

With the Rolldown integration, we have an opportunity to unify the development and production experiences while maintaining Vite's signature performance. A Full Bundle Mode would allow serving bundled files not only in production but also during development, combining the best of both worlds:

- Fast startup times even for large applications
- Consistent behavior between development and production
- Reduced network overhead on page refreshes
- Maintained efficient HMR on top of ESM output

When the Full Bundle Mode is introduced, it will be an opt-in feature at first. Similar to the Rolldown integration, we are aiming to make it the default after gathering feedback and ensuring stability.

## Plugin / Framework Authors Guide

::: tip
This section is mostly relevant for plugin and framework authors. If you are a user, you can skip this section.
:::

### Overview of Major Changes

- Rolldown is used for build (Rollup was used before)
- Rolldown is used for the optimizer (esbuild was used before)
- CommonJS support is handled by Rolldown (@rollup/plugin-commonjs was used before)
- Oxc is used for syntax lowering (esbuild was used before)
- Lightning CSS is used for CSS minification by default (esbuild was used before)
- Oxc minifier is used for JS minification by default (esbuild was used before)
- Rolldown is used for bundling the config (esbuild was used before)

### Detecting `rolldown-vite`

::: warning
In most cases, you don't need to detect whether your plugin runs with `rolldown-vite` or `vite` and you should aim for consistent behavior across both, without conditional branching.
:::

In case you need different behavior with `rolldown-vite`, you have two ways to detect if `rolldown-vite` is used:

Checking the existence of `this.meta.rolldownVersion`:

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

::: tip

Since Vite 7.0.0, `this.meta` is available in all hooks. In previous versions, `this.meta` was not available in Vite-specific hooks, such as the `config` hook.

:::

<br>

Checking the existence of the `rolldownVersion` export:

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

As [mentioned above](#option-validation-errors), Rolldown outputs a warning when unknown or invalid options are passed.

This can be fixed by conditionally passing the option by checking whether it's running with `rolldown-vite` as [shown above](#detecting-rolldown-vite).

### `transformWithEsbuild` requires `esbuild` to be installed separately

Since Vite itself does not use `esbuild` any more, `esbuild` is now an optional peer dependency. If your plugin uses `transformWithEsbuild`, the plugin needs to add `esbuild` to its dependencies or the user needs to install it manually.

The recommended migration is to use the newly exported `transformWithOxc` function, which utilizes Oxc instead of `esbuild`.

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

Rolldown introduced a [hook filter feature](https://rolldown.rs/apis/plugin-hook-filters) to reduce the communication overhead between the Rust and JavaScript runtimes. This feature allows plugins to specify patterns that determine when hooks should be called, improving performance by avoiding unnecessary hook invocations.

See the [Hook Filters guide](/guide/api-plugin#hook-filters) for more information.

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

This is because [Rolldown supports non-JavaScript modules](https://rolldown.rs/in-depth/module-types) and infers the module type from extensions unless specified.
