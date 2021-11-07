# Migration from v1

## Config Options Change

- The following options have been removed and should be implemented via [plugins](./api-plugin):

  - `resolvers`
  - `transforms`
  - `indexHtmlTransforms`

- `jsx` and `enableEsbuild` have been removed; Use the new [`esbuild`](/config/#esbuild) option instead.

- [CSS related options](/config/#css-modules) are now nested under `css`.

- All [build-specific options](/config/#build-options) are now nested under `build`.

  - `rollupInputOptions` and `rollupOutputOptions` are replaced by [`build.rollupOptions`](/config/#build-rollupoptions).
  - `esbuildTarget` is now [`build.target`](/config/#build-target).
  - `emitManifest` is now [`build.manifest`](/config/#build-manifest).
  - The following build options have been removed since they can be achieved via plugin hooks or other options:
    - `entry`
    - `rollupDedupe`
    - `emitAssets`
    - `emitIndex`
    - `shouldPreload`
    - `configureBuild`

- All [server-specific options](/config/#server-options) are now nested under
  `server`.

  - `hostname` is now [`server.host`](/config/#server-host).
  - `httpsOptions` has been removed. [`server.https`](/config/#server-https) can directly accept the options object.
  - `chokidarWatchOptions` is now [`server.watch`](/config/#server-watch).

- [`assetsInclude`](/config/#assetsinclude) now expects `string | RegExp | (string | RegExp)[]` instead of a function.

- All Vue specific options are removed; Pass options to the Vue plugin instead.

## Alias Behavior Change

[`alias`](/config/#resolve-alias) is now being passed to `@rollup/plugin-alias` and no longer require start/ending slashes. The behavior is now a direct replacement, so 1.0-style directory alias key should remove the ending slash:

```diff
- alias: { '/@foo/': path.resolve(__dirname, 'some-special-dir') }
+ alias: { '/@foo': path.resolve(__dirname, 'some-special-dir') }
```

Alternatively, you can use the `[{ find: RegExp, replacement: string }]` option format for more precise control.

## Vue Support

Vite 2.0 core is now framework agnostic. Vue support is now provided via [`@vitejs/plugin-vue`](https://github.com/vitejs/vite/tree/main/packages/plugin-vue). Simply install it and add it in the Vite config:

```js
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()]
})
```

### Custom Blocks Transforms

A custom plugin can be used to transform Vue custom blocks like the one below:

```ts
// vite.config.js
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const vueI18nPlugin = {
  name: 'vue-i18n',
  transform(code, id) {
    if (!/vue&type=i18n/.test(id)) {
      return
    }
    if (/\.ya?ml$/.test(id)) {
      code = JSON.stringify(require('js-yaml').load(code.trim()))
    }
    return `export default Comp => {
      Comp.i18n = ${code}
    }`
  }
}

export default defineConfig({
  plugins: [vue(), vueI18nPlugin]
})
```

## React Support

React Fast Refresh support is now provided via [`@vitejs/plugin-react-refresh`](https://github.com/vitejs/vite/tree/main/packages/plugin-react-refresh).

## HMR API Change

`import.meta.hot.acceptDeps()` have been deprecated. [`import.meta.hot.accept()`](./api-hmr#hot-accept-deps-cb) can now accept single or multiple deps.

## Manifest Format Change

The build manifest now uses the following format:

```json
{
  "index.js": {
    "file": "assets/index.acaf2b48.js",
    "imports": [...]
  },
  "index.css": {
    "file": "assets/index.7b7dbd85.css"
  }
  "asset.png": {
    "file": "assets/asset.0ab0f9cd.png"
  }
}
```

For entry JS chunks, it also lists its imported chunks which can be used to render preload directives.

## For Plugin Authors

Vite 2 uses a completely redesigned plugin interface which extends Rollup plugins. Please read the new [Plugin Development Guide](./api-plugin).

Some general pointers on migrating a v1 plugin to v2:

- `resolvers` -> use the [`resolveId`](https://rollupjs.org/guide/en/#resolveid) hook
- `transforms` -> use the [`transform`](https://rollupjs.org/guide/en/#transform) hook
- `indexHtmlTransforms` -> use the [`transformIndexHtml`](./api-plugin#transformindexhtml) hook
- Serving virtual files -> use [`resolveId`](https://rollupjs.org/guide/en/#resolveid) + [`load`](https://rollupjs.org/guide/en/#load) hooks
- Adding `alias`, `define` or other config options -> use the [`config`](./api-plugin#config) hook

Since most of the logic should be done via plugin hooks instead of middlewares, the need for middlewares is greatly reduced. The internal server app is now a good old [connect](https://github.com/senchalabs/connect) instance instead of Koa.
