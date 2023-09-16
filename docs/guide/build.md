# Building for Production

When it is time to deploy your app for production, simply run the `vite build` command. By default, it uses `<root>/index.html` as the build entry point, and produces an application bundle that is suitable to be served over a static hosting service. Check out the [Deploying a Static Site](./static-deploy) for guides about popular services.

## Browser Compatibility

The production bundle assumes support for modern JavaScript. By default, Vite targets browsers which support the [native ES Modules](https://caniuse.com/es6-module), [native ESM dynamic import](https://caniuse.com/es6-module-dynamic-import), and [`import.meta`](https://caniuse.com/mdn-javascript_operators_import_meta):

- Chrome >=87
- Firefox >=78
- Safari >=14
- Edge >=88

You can specify custom targets via the [`build.target` config option](/config/build-options.md#build-target), where the lowest target is `es2015`.

Note that by default, Vite only handles syntax transforms and **does not cover polyfills**. You can check out [Polyfill.io](https://polyfill.io/v3/) which is a service that automatically generates polyfill bundles based on the user's browser UserAgent string.

Legacy browsers can be supported via [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy), which will automatically generate legacy chunks and corresponding ES language feature polyfills. The legacy chunks are conditionally loaded only in browsers that do not have native ESM support.

## Public Base Path

- Related: [Asset Handling](./assets)

If you are deploying your project under a nested public path, simply specify the [`base` config option](/config/shared-options.md#base) and all asset paths will be rewritten accordingly. This option can also be specified as a command line flag, e.g. `vite build --base=/my/public/path/`.

JS-imported asset URLs, CSS `url()` references, and asset references in your `.html` files are all automatically adjusted to respect this option during build.

The exception is when you need to dynamically concatenate URLs on the fly. In this case, you can use the globally injected `import.meta.env.BASE_URL` variable which will be the public base path. Note this variable is statically replaced during build so it must appear exactly as-is (i.e. `import.meta.env['BASE_URL']` won't work).

For advanced base path control, check out [Advanced Base Options](#advanced-base-options).

## Customizing the Build

The build can be customized via various [build config options](/config/build-options.md). Specifically, you can directly adjust the underlying [Rollup options](https://rollupjs.org/configuration-options/) via `build.rollupOptions`:

```js
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      // https://rollupjs.org/configuration-options/
    },
  },
})
```

For example, you can specify multiple Rollup outputs with plugins that are only applied during build.

## Chunking Strategy

You can configure how chunks are split using `build.rollupOptions.output.manualChunks` (see [Rollup docs](https://rollupjs.org/configuration-options/#output-manualchunks)). Until Vite 2.8, the default chunking strategy divided the chunks into `index` and `vendor`. It is a good strategy for some SPAs, but it is hard to provide a general solution for every Vite target use case. From Vite 2.9, `manualChunks` is no longer modified by default. You can continue to use the Split Vendor Chunk strategy by adding the `splitVendorChunkPlugin` in your config file:

```js
// vite.config.js
import { splitVendorChunkPlugin } from 'vite'
export default defineConfig({
  plugins: [splitVendorChunkPlugin()],
})
```

This strategy is also provided as a `splitVendorChunk({ cache: SplitVendorChunkCache })` factory, in case composition with custom logic is needed. `cache.reset()` needs to be called at `buildStart` for build watch mode to work correctly in this case.

::: warning
You should use `build.rollupOptions.output.manualChunks` function form when using this plugin. If the object form is used, the plugin won't have any effect.
:::

## Rebuild on files changes

You can enable rollup watcher with `vite build --watch`. Or, you can directly adjust the underlying [`WatcherOptions`](https://rollupjs.org/configuration-options/#watch) via `build.watch`:

```js
// vite.config.js
export default defineConfig({
  build: {
    watch: {
      // https://rollupjs.org/configuration-options/#watch
    },
  },
})
```

With the `--watch` flag enabled, changes to the `vite.config.js`, as well as any files to be bundled, will trigger a rebuild.

## Multi-Page App

Suppose you have the following source code structure:

```
├── package.json
├── vite.config.js
├── index.html
├── main.js
└── nested
    ├── index.html
    └── nested.js
```

During dev, simply navigate or link to `/nested/` - it works as expected, just like for a normal static file server.

During build, all you need to do is to specify multiple `.html` files as entry points:

```js
// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'nested/index.html'),
      },
    },
  },
})
```

If you specify a different root, remember that `__dirname` will still be the folder of your vite.config.js file when resolving the input paths. Therefore, you will need to add your `root` entry to the arguments for `resolve`.

Note that for HTML files, Vite ignores the name given to the entry in the `rollupOptions.input` object and instead respects the resolved id of the file when generating the HTML asset in the dist folder. This ensures a consistent structure with the way the dev server works.

## Library Mode

When you are developing a browser-oriented library, you are likely spending most of the time on a test/demo page that imports your actual library. With Vite, you can use your `index.html` for that purpose to get the smooth development experience.

When it is time to bundle your library for distribution, use the [`build.lib` config option](/config/build-options.md#build-lib). Make sure to also externalize any dependencies that you do not want to bundle into your library, e.g. `vue` or `react`:

```js
// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'MyLib',
      // the proper extensions will be added
      fileName: 'my-lib',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
```

The entry file would contain exports that can be imported by users of your package:

```js
// lib/main.js
import Foo from './Foo.vue'
import Bar from './Bar.vue'
export { Foo, Bar }
```

Running `vite build` with this config uses a Rollup preset that is oriented towards shipping libraries and produces two bundle formats: `es` and `umd` (configurable via `build.lib`):

```
$ vite build
building for production...
dist/my-lib.js      0.08 kB / gzip: 0.07 kB
dist/my-lib.umd.cjs 0.30 kB / gzip: 0.16 kB
```

Recommended `package.json` for your lib:

```json
{
  "name": "my-lib",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-lib.umd.cjs",
  "module": "./dist/my-lib.js",
  "exports": {
    ".": {
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.umd.cjs"
    }
  }
}
```

Or, if exposing multiple entry points:

```json
{
  "name": "my-lib",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-lib.cjs",
  "module": "./dist/my-lib.js",
  "exports": {
    ".": {
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.cjs"
    },
    "./secondary": {
      "import": "./dist/secondary.js",
      "require": "./dist/secondary.cjs"
    }
  }
}
```

::: tip File Extensions
If the `package.json` does not contain `"type": "module"`, Vite will generate different file extensions for Node.js compatibility. `.js` will become `.mjs` and `.cjs` will become `.js`.
:::

::: tip Environment Variables
In library mode, all `import.meta.env.*` usage are statically replaced when building for production. However, `process.env.*` usage are not, so that consumers of your library can dynamically change it. If this is undesirable, you can use `define: { 'process.env.NODE_ENV': '"production"' }` for example to statically replace them.
:::

::: warning Advanced Usage
Library mode includes a simple and opinionated configuration for browser-oriented and JS framework libraries. If you are building non-browser libraries, or require advanced build flows, you can use [Rollup](https://rollupjs.org) or [esbuild](https://esbuild.github.io) directly.
:::

## Advanced Base Options

::: warning
This feature is experimental. [Give Feedback](https://github.com/vitejs/vite/discussions/13834).
:::

For advanced use cases, the deployed assets and public files may be in different paths, for example to use different cache strategies.
A user may choose to deploy in three different paths:

- The generated entry HTML files (which may be processed during SSR)
- The generated hashed assets (JS, CSS, and other file types like images)
- The copied [public files](assets.md#the-public-directory)

A single static [base](#public-base-path) isn't enough in these scenarios. Vite provides experimental support for advanced base options during build, using `experimental.renderBuiltUrl`.

```ts
experimental: {
  renderBuiltUrl(filename: string, { hostType }: { hostType: 'js' | 'css' | 'html' }) {
    if (hostType === 'js') {
      return { runtime: `window.__toCdnUrl(${JSON.stringify(filename)})` }
    } else {
      return { relative: true }
    }
  }
}
```

If the hashed assets and public files aren't deployed together, options for each group can be defined independently using asset `type` included in the second `context` param given to the function.

```ts
experimental: {
  renderBuiltUrl(filename: string, { hostId, hostType, type }: { hostId: string, hostType: 'js' | 'css' | 'html', type: 'public' | 'asset' }) {
    if (type === 'public') {
      return 'https://www.domain.com/' + filename
    }
    else if (path.extname(hostId) === '.js') {
      return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
    }
    else {
      return 'https://cdn.domain.com/assets/' + filename
    }
  }
}
```
