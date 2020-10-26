# vite ⚡

[![npm][npm-img]][npm-url]
[![node][node-img]][node-url]
[![unix CI status][unix-ci-img]][unix-ci-url]
[![windows CI status][windows-ci-img]][windows-ci-url]

Vite is an opinionated web dev build tool that serves your code via native ES Module imports during dev and bundles it with [Rollup](https://rollupjs.org/) for production.

- Lightning-fast cold server start
- Instant hot module replacement (HMR)
- True on-demand compilation
- More details in [How and Why](#how-and-why)

## Status

In beta and will likely release 1.0 soon.

## Getting Started

> Note to Vue users: Vite currently only works with Vue 3.x. This also means you can't use libraries that are not yet compatible with Vue 3.

```bash
$ npm init vite-app <project-name>
$ cd <project-name>
$ npm install
$ npm run dev
```

If using Yarn:

```bash
$ yarn create vite-app <project-name>
$ cd <project-name>
$ yarn
$ yarn dev
```

> Although Vite is primarily designed to work with Vue 3, it can support other frameworks as well. For example, try `npm init vite-app --template react` or `--template preact`.

### Using master branch

If you can't wait for a new release to test the latest features, clone the `vite` to your local machine and execute the following commands:

```
yarn
yarn build
yarn link
```

Then go to your vite based project and run `yarn link vite`. Now restart the development server (`yarn dev`) to ride on the bleeding edge!

## Browser Support

Vite requires [native ES module imports](https://caniuse.com/#feat=es6-module) during development. The production build also relies on dynamic imports for code-splitting (which can be [polyfilled](https://github.com/GoogleChromeLabs/dynamic-import-polyfill)).

Vite assumes you are targeting modern browsers and by default only transpiles your code to `es2019` during build (so that optional chaining can work with terser minification). You can specify the target range via the `esbuildTarget` config option, where the lowest target available is `es2015`.

## Features

- [Bare Module Resolving](#bare-module-resolving)
- [Hot Module Replacement](#hot-module-replacement)
- [TypeScript](#typescript)
- [CSS / JSON Importing](#css--json-importing)
- [Asset URL Handling](#asset-url-handling)
- [PostCSS](#postcss)
- [CSS Modules](#css-modules)
- [CSS Pre-processors](#css-pre-processors)
- [JSX](#jsx)
- [Web Assembly](#web-assembly)
- [Inline Web Workers](#inline-web-workers)
- [Custom Blocks](#custom-blocks)
- [Config File](#config-file)
- [HTTPS/2](#https2)
- [Dev Server Proxy](#dev-server-proxy)
- [Production Build](#production-build)
- [Modes and Environment Variables](#modes-and-environment-variables)
- [Using Vite with Traditional Backend](#using-vite-with-traditional-backend)

Vite tries to mirror the default configuration in [vue-cli](http://cli.vuejs.org/) as much as possible. If you've used `vue-cli` or other webpack-based boilerplates before, you should feel right at home. That said, do expect things to be different here and there.

### Bare Module Resolving

Native ES imports don't support bare module imports like

```js
import { createApp } from 'vue'
```

The above will throw an error by default. Vite detects such bare module imports in all served `.js` files and rewrites them with special paths like `/@modules/vue`. Under these special paths, Vite performs module resolution to locate the correct files from your installed dependencies.

Note that `vue` has special treatment - if it isn't installed in the project locally, Vite will fallback to the version from its own dependencies. If you have Vite installed globally, this makes it possible to quickly prototype with Vue without installing anything locally.

### Hot Module Replacement

- The `vue`, `react` and `preact` templates of `create-vite-app` all come with HMR out of the box.

- For manual HMR, an API is provided via `import.meta.hot`.

  For a module to self-accept, use `import.meta.hot.accept`:

  ```js
  export const count = 1

  // the conditional check is required so that HMR related code can be
  // dropped in production
  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      console.log('updated: count is now ', newModule.count)
    })
  }
  ```

  A module can also accept updates from direct dependencies without reloading itself, using `import.meta.hot.acceptDeps`:

  ```js
  import { foo } from './foo.js'

  foo()

  if (import.meta.hot) {
    import.meta.hot.acceptDeps('./foo.js', (newFoo) => {
      // the callback receives the updated './foo.js' module
      newFoo.foo()
    })

    // Can also accept an array of dep modules:
    import.meta.hot.acceptDeps(['./foo.js', './bar.js'], ([newFooModule, newBarModule]) => {
      // the callback receives the updated modules in an Array
    })
  }
  ```

  A self-accepting module or a module that expects to be accepted by others can use `hot.dispose` to clean-up any persistent side effects created by its updated copy:

  ```js
  function setupSideEffect() {}

  setupSideEffect()

  if (import.meta.hot) {
    import.meta.hot.dispose((data) => {
      // cleanup side effect
    })
  }
  ```

  For the full API, consult [importMeta.d.ts](https://github.com/vitejs/vite/blob/master/importMeta.d.ts).

  Note that Vite's HMR does not actually swap the originally imported module: if an accepting module re-exports imports from a dep, then it is responsible for updating those re-exports (and these exports must be using `let`). In addition, importers up the chain from the accepting module will not be notified of the change.

  This simplified HMR implementation is sufficient for most dev use cases, while allowing us to skip the expensive work of generating proxy modules.

### TypeScript

Vite supports importing `.ts` files and `<script lang="ts">` in Vue SFCs out of the box.

Vite only performs transpilation on `.ts` files and does **NOT** perform type checking. It assumes type checking is taken care of by your IDE and build process (you can run `tsc --noEmit` in the build script).

Vite uses [esbuild](https://github.com/evanw/esbuild) to transpile TypeScript into JavaScript which is about 20~30x faster than vanilla `tsc`, and HMR updates can reflect in the browser in under 50ms.

Note that because `esbuild` only performs transpilation without type information, it doesn't support certain features like const enum and implicit type-only imports. You must set `"isolatedModules": true` in your `tsconfig.json` under `compilerOptions` so that TS will warn you against the features that do not work with isolated transpilation.

### CSS / JSON Importing

You can directly import `.css` and `.json` files from JavaScript (including `<script>` tags of `*.vue` files, of course).

- `.json` files export their content as an object that is the default export.

- `.css` files do not export anything unless it ends with `.module.css` (See [CSS Modules](#css-modules) below). Importing them leads to the side effect of them being injected to the page during dev, and being included in the final `style.css` of the production build.

Both CSS and JSON imports also support Hot Module Replacement.

### Asset URL Handling

You can reference static assets in your `*.vue` templates, styles and plain `.css` files either using absolute public paths (based on project root) or relative paths (based on your file system). The latter is similar to the behavior you are used to if you have used `vue-cli` or webpack's `file-loader`.

Common image, media, and font filetypes are detected and included as assets automatically. You can override this using the `assetsInclude` configuration option.

All referenced assets, including those using absolute paths, will be copied to the dist folder with a hashed file name in the production build. Never-referenced assets will not be copied. Similar to `vue-cli`, image assets smaller than 4kb will be base64 inlined.

All **static** path references, including absolute paths, should be based on your working directory structure.

#### The `public` Directory

The `public` directory under project root can be used as an escape hatch to provide static assets that either are never referenced in source code (e.g. `robots.txt`), or must retain the exact same file name (without hashing).

Assets placed in `public` will be copied to the root of the dist directory as-is.

Note that you should reference files placed in `public` using root absolute path - for example, `public/icon.png` should always be referenced in source code as `/icon.png`.

#### Public Base Path

If you are deploying your project under a nested public path, simply specify `--base=/your/public/path/` and all asset paths will be rewritten accordingly.

For dynamic path references, there are two options:

- You can get the resolved public path of a static asset file by importing it from JavaScript. e.g. `import path from './foo.png'` will give you its resolved public path as a string.

- If you need to concatenate paths on the fly, you can use the globally injected `import.meta.env.BASE_URL` variable which will be the public base path. Note this variable is statically replaced during build so it must appear exactly as-is (i.e. `import.meta.env['BASE_URL']` won't work).

### PostCSS

Vite automatically applies your PostCSS config to all styles in `*.vue` files and imported plain `.css` files. Just install necessary plugins and add a `postcss.config.js` in your project root.

### CSS Modules

Note that you do **not** need to configure PostCSS if you want to use CSS Modules: it works out of the box. Inside `*.vue` components you can use `<style module>`, and for plain `.css` files, you need to name CSS modules files as `*.module.css` which allows you to import the naming hash from it.

### CSS Pre-Processors

Because Vite targets modern browsers only, it is recommended to use native CSS variables with PostCSS plugins that implement CSSWG drafts (e.g. [postcss-nesting](https://github.com/jonathantneal/postcss-nesting)) and author plain, future-standards-compliant CSS. That said, if you insist on using a CSS pre-processor, you can install the corresponding pre-processor and just use it:

```bash
yarn add -D sass
```

```vue
<style lang="scss">
/* use scss */
</style>
```

Or import them from JavaScript:

```js
import './style.scss'
```

#### Passing Options to Pre-Processor

> 1.0.0-beta.9+
> And if you want to pass options to the pre-processor, you can do that using the `cssPreprocessOptions` option in the config (see [Config File](#config-file) below).
> For example, to pass some shared global variables to all your Less styles:

```js
// vite.config.js
export default {
  cssPreprocessOptions: {
    less: {
      modifyVars: {
        'preprocess-custom-color': 'green'
      }
    }
  }
}
```

### JSX

`.jsx` and `.tsx` files are also supported. JSX transpilation is also handled via `esbuild`.

The default JSX configuration works out of the box with Vue 3 (note there is currently no JSX-based HMR for Vue):

```jsx
import { createApp } from 'vue'

function App() {
  return <Child>{() => 'bar'}</Child>
}

function Child(_, { slots }) {
  return <div onClick={() => console.log('hello')}>{slots.default()}</div>
}

createApp(App).mount('#app')
```

Currently, this is auto-importing a `jsx` compatible function that converts esbuild-produced JSX calls into Vue 3 compatible vnode calls, which is sub-optimal. Vue 3 will eventually provide a custom JSX transform that can take advantage of Vue 3's runtime fast paths.

#### JSX with React/Preact

There are two other presets provided: `react` and `preact`. You can specify the preset by running Vite with `--jsx react` or `--jsx preact`.

If you need a custom JSX pragma, JSX can also be customized via `--jsx-factory` and `--jsx-fragment` flags from the CLI or `jsx: { factory, fragment }` from the API. For example, you can run `vite --jsx-factory=h` to use `h` for JSX element creation calls. In the config (see [Config File](#config-file) below), it can be specified as:

```js
// vite.config.js
export default {
  jsx: {
    factory: 'h',
    fragment: 'Fragment'
  }
}
```

Note that for the Preact preset, `h` is also auto injected so you don't need to manually import it. However, this may cause issues if you are using `.tsx` with Preact since TS expects `h` to be explicitly imported for type inference. In that case, you can use the explicit factory config shown above which disables the auto `h` injection.

### Web Assembly

> 1.0.0-beta.3+

Pre-compiled `.wasm` files can be directly imported - the default export will be an initialization function that returns a Promise of the exports object of the wasm instance:

``` js
import init from './example.wasm'

init().then(exports => {
  exports.test()
})
```

The init function can also take the `imports` object which is passed along to `WebAssembly.instantiate` as its second argument:

``` js
init({
  imports: {
    someFunc: () => { /* ... */ }
  }
}).then(() => { /* ... */ })
```

In the production build, `.wasm` files smaller than `assetInlineLimit` will be inlined as base64 strings. Otherwise, they will be copied to the dist directory as an asset and fetched on-demand.

### Inline Web Workers

> 1.0.0-beta.3+

A web worker script can be directly imported by appending `?worker` to the import request. The default export will be a custom worker constructor:

``` js
import MyWorker from './worker?worker'

const worker = new MyWorker()
```

In the production build, workers imported this way are inlined into the bundle as base64 strings.

The worker script can also use `import` statements instead of `importScripts()` - note during dev this relies on browser native support and currently only works in Chrome, but for the production build it is compiled away.

If you do not wish to inline the worker, you should place your worker scripts in `public` and initialize the worker via `new Worker('/worker.js')`.

### Config File

You can create a `vite.config.js` or `vite.config.ts` file in your project. Vite will automatically use it if one is found in the current working directory. You can also explicitly specify a config file via `vite --config my-config.js`.

In addition to options mapped from CLI flags, it also supports `alias`, `transforms`, and `plugins` (which is a subset of the config interface). For now, see [config.ts](https://github.com/vuejs/vite/blob/master/src/node/config.ts) for full details before more thorough documentation is available.

### Custom Blocks

[Custom blocks](https://vue-loader.vuejs.org/guide/custom-blocks.html) in Vue SFCs are also supported. To use custom blocks, specify transform functions for custom blocks using the `vueCustomBlockTransforms` option in the [config file](#config-file):

``` js
// vite.config.js
export default {
  vueCustomBlockTransforms: {
    i18n: ({ code }) => {
      // return transformed code
    }
  }
}
```

### HTTPS/2

Starting the server with `--https` will automatically generate a self-signed cert and start the server with TLS and HTTP/2 enabled.

Custom certs can also be provided by using the `httpsOptions` option in the config file, which accepts `key`, `cert`, `ca` and `pfx` as in Node `https.ServerOptions`.

### Dev Server Proxy

You can use the `proxy` option in the config file to configure custom proxies for the dev server. Vite uses [`koa-proxies`](https://github.com/vagusX/koa-proxies) which in turn uses [`http-proxy`](https://github.com/http-party/node-http-proxy). Each key can be a path Full options [here](https://github.com/http-party/node-http-proxy#options).

Example:

``` js
// vite.config.js
export default {
  proxy: {
    // string shorthand
    '/foo': 'http://localhost:4567/foo',
    // with options
    '/api': {
      target: 'http://jsonplaceholder.typicode.com',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api/, '')
    }
  }
}
```

### Production Build

Vite does utilize bundling for production builds because native ES module imports result in waterfall network requests that are simply too punishing for page load time in production.

You can run `vite build` to bundle the app.

Internally, we use a highly opinionated Rollup config to generate the build. The build is configurable by passing on most options to Rollup - and most non-rollup string/boolean options have mapping flags in the CLI (see [build/index.ts](https://github.com/vuejs/vite/blob/master/src/node/build/index.ts) for full details).

### Modes and Environment Variables

The mode option is used to specify the value of `import.meta.env.MODE` and the corresponding environment variables files that needs to be loaded.

By default, there are two modes:
  - `development` is used by `vite` and `vite serve`
  - `production` is used by `vite build`

You can overwrite the default mode used for a command by passing the `--mode` option flag. For example, if you want to use development variables in the build command:

```bash
vite build --mode development
```

When running `vite`, environment variables are loaded from the following files in your project root:

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified env mode
.env.[mode].local   # only loaded in specified env mode, ignored by git
```

**Note:** only variables prefixed with `VITE_` are exposed to your code. e.g. `VITE_SOME_KEY=123` will be exposed as `import.meta.env.VITE_SOME_KEY`, but `SOME_KEY=123` will not. This is because the `.env` files may be used by some users for server-side or build scripts and may contain sensitive information that should not be exposed in code shipped to browsers.

### Using Vite with Traditional Backend

If you want to serve the HTML using a traditional backend (e.g. Rails, Laravel) but use Vite for serving assets, here's what you can do:

1. In your Vite config, enable `cors` and `emitManifest`:

    ```js
    // vite.config.js
    export default {
      cors: true,
      emitManifest: true
    }
    ```

2. For development, inject the following in your server's HTML template (substitute `http://localhost:3000` with the local URL Vite is running at):

    ```html
    <!-- if development -->
    <script type="module" src="http://localhost:3000/vite/client"></script>
    <script type="module" src="http://localhost:3000/main.js"></script>
    ```

    Also make sure the server is configured to serve static assets in the Viter working directory, otherwise assets such as images won't be loaded properly.

3. For production: after running `vite build`, a `manifest.json` file will be generated alongside other asset files. You can use this file to render links with hashed filenames (syntax here for explnatation only, substitute with your server templating language):

    ```html
    <!-- if production -->
    <link rel="stylesheet" href="/_assets/{{ maniest['style.css'] }}">
    <script type="module" src="/_assets/{{ maniest['index.js] }}"></script>
    ```

## API

### Dev Server

You can customize the server using the API. The server can accept plugins which have access to the internal Koa app instance:

```js
const { createServer } = require('vite')

const myPlugin = ({
  root, // project root directory, absolute path
  app, // Koa app instance
  server, // raw http server instance
  watcher // chokidar file watcher instance
}) => {
  app.use(async (ctx, next) => {
    // You can do pre-processing here - this will be the raw incoming requests
    // before vite touches it.
    if (ctx.path.endsWith('.scss')) {
      // Note vue <style lang="xxx"> are supported by
      // default as long as the corresponding pre-processor is installed, so this
      // only applies to <link ref="stylesheet" href="*.scss"> or js imports like
      // `import '*.scss'`.
      console.log('pre processing: ', ctx.url)
      ctx.type = 'css'
      ctx.body = 'body { border: 1px solid red }'
    }

    // ...wait for vite to do built-in transforms
    await next()

    // Post processing before the content is served. Note this includes parts
    // compiled from `*.vue` files, where <template> and <script> are served as
    // `application/javascript` and <style> are served as `text/css`.
    if (ctx.response.is('js')) {
      console.log('post processing: ', ctx.url)
      console.log(ctx.body) // can be string or Readable stream
    }
  })
}

createServer({
  configureServer: [myPlugin]
}).listen(3000)
```

### Build

Check out the full options interface in [build/index.ts](https://github.com/vuejs/vite/blob/master/src/node/build/index.ts).

```js
const { build } = require('vite')

;(async () => {
  // All options are optional.
  // check out `src/node/build/index.ts` for full options interface.
  const result = await build({
    rollupInputOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
    },
    rollupOutputOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
    },
    rollupPluginVueOptions: {
      // https://github.com/vuejs/rollup-plugin-vue/tree/next#options
    }
    // ...
  })
})()
```

## How and Why

### How is This Different from `vue-cli` or Other Bundler-based Solutions?

The primary difference is that for Vite there is no bundling during development. The ES Import syntax in your source code is served directly to the browser, and the browser parses them via native `<script module>` support, making HTTP requests for each import. The dev server intercepts the requests and performs code transforms if necessary. For example, an import to a `*.vue` file is compiled on the fly right before it's sent back to the browser.

There are a few advantages to this approach:

- Since there is no bundling work to be done, the server cold start is extremely fast.

- The code is compiled on-demand, so only code actually imported on the current screen is compiled. You don't have to wait until your entire app to be bundled to start developing. This can be a huge difference in apps with dozens of screens.

- Hot module replacement (HMR) performance is decoupled from the total number of modules. This makes HMR consistently fast no matter how big your app is.

Full page reload could be slightly slower than a bundler-based setup, since native ES imports result in network waterfalls with deep import chains. However, since this is local development, the difference should be trivial compared to actual compilation time. (There is no compile cost on page reload since already compiled files are cached in memory.)

Finally, because compilation is still done in Node, it can technically support any code transforms a bundler can, and nothing prevents you from eventually bundling the code for production. In fact, Vite provides a `vite build` command to do exactly that so the app doesn't suffer from network waterfall in production.

### How is This Different from [es-dev-server](https://open-wc.org/developing/es-dev-server.html)?

`es-dev-server` is a great project and we did take some inspiration from it when refactoring Vite in the early stages. That said, here is why Vite is different from `es-dev-server` and why we didn't just implement Vite as a middleware for `es-dev-server`:

- One of Vite's primary goal was to support Hot Module Replacement, but `es-dev-server` internals is a bit too opaque to get this working nicely via a middleware.

- Vite aims to be a single tool that integrates both the dev and the build process. You can use Vite to both serve and bundle the same source code, with zero configuration.

- Vite is more opinionated on how certain types of imports are handled, e.g. `.css` and static assets. The handling is similar to `vue-cli` for obvious reasons.

### How is This Different from [Snowpack](https://www.snowpack.dev/)?

Both Snowpack v2 and Vite offer native ES module import based dev servers. Vite's dependency pre-optimization is also heavily inspired by Snowpack v1. Both projects share similar performance characteristics when it comes to development feedback speed. Some notable differences are:

- Vite was created to tackle native ESM-based HMR. When Vite was first released with working ESM-based HMR, there was no other project actively trying to bring native ESM based HMR to production.

  Snowpack v2 initially did not offer HMR support but added it in a later release, making the scope of two projects much closer. Vite and Snowpack have collaborated on a common API spec for ESM HMR, but due to the constraints of different implementation strategies, the two projects still ship slightly different APIs.

- Both solutions can also bundle the app for production, but Vite uses Rollup with built-in config while Snowpack delegates it to Parcel/webpack via additional plugins. Vite will in most cases build faster and produce smaller bundles. In addition, tighter integration with the bundler makes it easier to author Vite transforms and plugins that modify dev/build configs at the same.

- Vue support is a first-class feature in Vite. For example, Vite provides a much more fine-grained HMR integration with Vue, and the build config is fine tuned to produce the most efficient bundle.

## Contribution

See [Contributing Guide](https://github.com/vitejs/vite/tree/master/.github/contributing.md).


## Trivia

[vite](https://en.wiktionary.org/wiki/vite) is the french word for "fast" and is pronounced `/vit/`.

## License

MIT

[npm-img]: https://img.shields.io/npm/v/vite.svg
[npm-url]: https://npmjs.com/package/vite
[node-img]: https://img.shields.io/node/v/vite.svg
[node-url]: https://nodejs.org/en/about/releases/
[unix-ci-img]: https://circleci.com/gh/vitejs/vite.svg?style=shield
[unix-ci-url]: https://app.circleci.com/pipelines/github/vitejs/vite
[windows-ci-img]: https://ci.appveyor.com/api/projects/status/0q4j8062olbcs71l/branch/master?svg=true
[windows-ci-url]: https://ci.appveyor.com/project/yyx990803/vite/branch/master
