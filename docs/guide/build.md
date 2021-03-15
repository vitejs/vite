# Building for Production

When it is time to deploy your app for production, simply run the `vite build` command. By default, it uses `<root>/index.html` as the build entry point, and produces an application bundle that is suitable to be served over a static hosting service. Check out the [Deploying a Static Site](./static-deploy) for guides about popular services.

## Browser Compatibility

The production bundle assumes a baseline support for modern JavaScript. By default, all code is transpiled targeting [browsers with native ESM script tag support](https://caniuse.com/es6-module):

- Chrome >=61
- Firefox >=60
- Safari >=11
- Edge >=16

A lightweight [dynamic import polyfill](https://github.com/GoogleChromeLabs/dynamic-import-polyfill) is also automatically injected.

You can specify custom targets via the [`build.target` config option](/config/#build-target), where the lowest target is `es2015`.

Note that by default, Vite only handles syntax transforms and **does not cover polyfills by default**. You can check out [Polyfill.io](https://polyfill.io/v3/) which is a service that automatically generates polyfill bundles based on the user's browser UserAgent string.

Legacy browsers can be supported via [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy), which will automatically generate legacy chunks and corresponding ES language feature polyfills. The legacy chunks are conditionally loaded only in browsers that do not have native ESM support.

## Public Base Path

- Related: [Asset Handling](./assets)

If you are deploying your project under a nested public path, simply specify the [`base` config option](/config/#base) and all asset paths will be rewritten accordingly. This option can also be specified as a command line flag, e.g. `vite build --base=/my/public/path/`.

JS-imported asset URLs, CSS `url()` references, and asset references in your `.html` files are all automatically adjusted to respect this option during build.

The exception is when you need to dynamically concatenate URLs on the fly. In this case, you can use the globally injected `import.meta.env.BASE_URL` variable which will be the public base path. Note this variable is statically replaced during build so it must appear exactly as-is (i.e. `import.meta.env['BASE_URL']` won't work).

## Customizing the Build

The build can be customized via various [build config options](/config/#build-options). Specifically, you can directly adjust the underlying [Rollup options](https://rollupjs.org/guide/en/#big-list-of-options) via `build.rollupOptions`:

```js
// vite.config.js
module.exports = {
  build: {
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
    }
  }
}
```

For example, you can specify multiple Rollup outputs with plugins that are only applied during build.

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
const { resolve } = require('path')

module.exports = {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'nested/index.html')
      }
    }
  }
}
```

## Library Mode

When you are developing a browser-oriented library, you are likely spending most of the time on a test/demo page that imports your actual library. With Vite, you can use your `index.html` for that purpose to get the smooth development experience.

When it is time to bundle your library for distribution, use the [`build.lib` config option](/config/#build-lib). Make sure to also externalize any dependencies that you do not want to bundle into your library, e.g. `vue` or `react`:

```js
// vite.config.js
const path = require('path')

module.exports = {
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'MyLib'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
}
```

Running `vite build` with this config uses a Rollup preset that is oriented towards shipping libraries and produces two bundle formats: `es` and `umd` (configurable via `build.lib`):

```
$ vite build
building for production...
[write] my-lib.es.js 0.08kb, brotli: 0.07kb
[write] my-lib.umd.js 0.30kb, brotli: 0.16kb
```

Recommended `package.json` for your lib:

```json
{
  "name": "my-lib",
  "files": ["dist"],
  "main": "./dist/my-lib.umd.js",
  "module": "./dist/my-lib.es.js",
  "exports": {
    ".": {
      "import": "./dist/my-lib.es.js",
      "require": "./dist/my-lib.umd.js"
    }
  }
}
```
