# vite ⚡

[![vuejs](https://circleci.com/gh/vitejs/vite.svg?style=shield)](https://app.circleci.com/pipelines/github/vuejs/vite) [![Build status](https://ci.appveyor.com/api/projects/status/0q4j8062olbcs71l/branch/master?svg=true)](https://ci.appveyor.com/project/yyx990803/vite/branch/master)

Vite is an opinionated web dev build tool that serves your code via native ES Module imports during dev and bundles it with [Rollup](https://rollupjs.org/) for production.

- Lightning fast cold server start
- Instant hot module replacement (HMR)
- True on-demand compilation
- More details in [How and Why](#how-and-why)

## Status

Still experimental, but we intend to make it suitable for production.

## Getting Started

```bash
$ npx create-vite-app <project-name>
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

> Although Vite is primarily designed to work with Vue 3, it can actually support other frameworks as well. For example, try `npx create-vite-app` with `--template react` or `--template preact`.

## Browser Support

Vite requires [native ES module imports](https://caniuse.com/#feat=es6-module) during development. The production build also relies on dynamic imports for code-splitting (which can be [polyfilled](https://github.com/GoogleChromeLabs/dynamic-import-polyfill)).

Vite assumes you are targeting modern browsers and therefore does not perform any compatibility-oriented code transforms by default. Technically, you _can_ add `autoprefixer` yourself using a PostCSS config file, or add necessary polyfills and post-processing steps to make your code work in legacy browsers - however that is not Vite's concern by design.

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
- [Config File](#config-file)
- [Dev Server Proxy](#dev-server-proxy)
- [Production Build](#production-build)

Vite tries to mirror the default configuration in [vue-cli](http://cli.vuejs.org/) as much as possible. If you've used `vue-cli` or other webpack-based boilerplates before, you should feel right at home. That said, do expect things to be different here and there.

### Bare Module Resolving

Native ES imports doesn't support bare module imports like

```js
import { createApp } from 'vue'
```

The above will throw an error by default. Vite detects such bare module imports in all served `.js` files and rewrites them with special paths like `/@modules/vue`. Under these special paths, Vite performs module resolution to locate the correct files from your installed dependencies.

Note that `vue` has special treatment - if it isn't installed in the project locally, Vite will fallback to the version from its own dependencies. If you have Vite installed globally, this makes it possible to quickly prototype with Vue without installing anything locally.

### Hot Module Replacement

- The `vue`, `react` and `preact` templates of `create-vite-app` all come with HMR out of the box.

- For manual HMR, a dedicated API is provided:

  ```js
  import { foo } from './foo.js'
  import { hot } from 'vite/hmr'

  foo()

  // this code will be stripped out when building
  if (__DEV__) {
    hot.accept('./foo.js', (newFoo) => {
      // the callback receives the updated './foo.js' module
      newFoo.foo()
    })

    // Can also accept an array of dep modules:
    hot.accept(['./foo.js', './bar.js'], ([newFooModule, newBarModule]) => {
      // the callback receives the updated mdoules in an Array
    })
  }
  ```

  Modules can also be self-accepting:

  ```js
  import { hot } from 'vite/hmr'

  export const count = 1

  // this code will be stripped out when building
  if (__DEV__) {
    hot.accept((newModule) => {
      console.log('updated: count is now ', newModule.count)
    })
  }
  ```

  A self-accepting module, or a module that expects to be accepted by others can use `hot.dispose` to cleanup any persistent side effects created by its updated copy:

  ```js
  import { hot } from 'vite/hmr'

  function setupSideEffect() {}
  function cleanupSideEffect() {}

  setupSideEffect()

  if (__DEV__) {
    hot.dispose(cleanupSideEffect)
  }
  ```

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

All referenced assets, including those using absolute paths, will be copied to the dist folder with a hashed file name in the production build. Never-referenced assets will not be copied. Similar to `vue-cli`, image assets smaller than 4kb will be base64 inlined.

The exception is the `public` directory - assets placed in this directory will be copied to the dist directory as-is. It can be used to provide assets that are never referenced in your code - e.g. `robots.txt`.

All **static** path references, including absolute paths and those starting with `/public`, should be based on your working directory structure. If you are deploying your project under a nested public path, simply specify `--base=/your/public/path/` and all asset paths will be rewritten accordingly.

For dynamic path references, there are two options:

- You can get the resolved public path of a static asset file by importing it from JavaScript. e.g. `import path from './foo.png'` will give you its resolved public path as a string.

- If you need to concatenate paths on the fly, you can use the globally injected `__BASE__` variable with will be the public base path.

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

### JSX

`.jsx` and `.tsx` files are also supported. JSX transpilation is also handled via `esbuild`.

The default JSX configuration works out of the box with Vue 3 (note there is currently no JSX-based HMR for Vue):

```jsx
import { createApp } from 'vue'

function App() {
  return <Child>{() => 'bar'}</Child>
}

function Child(_, { slots }) {
  return <div onClick={console.log('hello')}>{slots.default()}</div>
}

createApp(App).mount('#app')
```

Currently this is auto-importing a `jsx` compatible function that converts esbuild-produced JSX calls into Vue 3 compatible vnode calls, which is sub-optimal. Vue 3 will eventually provide a custom JSX transform that can take advantage of Vue 3's runtime fast paths.

#### JSX with React/Preact

There are two other presets provided: `react` and `preact`. You can specify the preset by running Vite with `--jsx react` or `--jsx preact`. For the Preact preset, `h` is also auto injected so you don't need to manually import it.

Because React doesn't ship ES module builds, you either need to use [es-react](https://github.com/lukejacksonn/es-react), or pre-bundle React into a ES module with Snowpack. Easiest way to get it running is:

```js
import { React, ReactDOM } from 'https://unpkg.com/es-react'

ReactDOM.render(<h1>Hello, what!</h1>, document.getElementById('app'))
```

If you need a custom JSX pragma, JSX can also be customized via `--jsx-factory` and `--jsx-fragment` flags from the CLI or `jsx: { factory, fragment }` from the API. For example, you can run `vite --jsx-factory=h` to use `h` for JSX element creation calls.

### Config File

You can create a `vite.config.js` or `vite.config.ts` file in your project. Vite will automatically use it if one is found in the current working directory. You can also explicitly specify a config file via `vite --config my-config.js`.

In addition to options mapped from CLI flags, it also supports `alias`, `transforms`, and plugins (which is a subset of the config interface). For now, see [config.ts](https://github.com/vuejs/vite/blob/master/src/node/config.ts) for full details before more thorough documentation is available.

### Dev Server Proxy

> 0.15.6+

You can use the `proxy` option in the config file to configure custom proxies for the dev server. Vite uses [`koa-proxies`](https://github.com/vagusX/koa-proxies) which in turn uses [`http-proxy`](https://github.com/http-party/node-http-proxy). Each key can be a path Full options [here](https://github.com/http-party/node-http-proxy#options).

Example:

``` js
// vite.config.js
module.exports = {
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

Vite does utilize bundling for production builds, because native ES module imports result in waterfall network requests that are simply too punishing for page load time in production.

You can run `vite build` to bundle the app.

Internally, we use a highly opinionated Rollup config to generate the build. The build is configurable by passing on most options to Rollup - and most non-rollup string/boolean options have mapping flags in the CLI (see [build/index.ts](https://github.com/vuejs/vite/blob/master/src/node/build/index.ts) for full details).

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
  // check out `src/node/build.ts` for full options interface.
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

There are a few advantages of this approach:

- Since there is no bundling work to be done, the server cold start is extremely fast.

- Code is compiled on demand, so only code actually imported on the current screen is compiled. You don't have to wait until your entire app to be bundled to start developing. This can be a huge difference in apps with dozens of screens.

- Hot module replacement (HMR) performance is decoupled from the total number of modules. This makes HMR consistently fast no matter how big your app is.

Full page reload could be slightly slower than a bundler-based setup, since native ES imports result in network waterfalls with deep import chains. However since this is local development, the difference should be trivial compared to actual compilation time. (There is no compile cost on page reload since already compiled files are cached in memory.)

Finally, because compilation is still done in Node, it can technically support any code transforms a bundler can, and nothing prevents you from eventually bundling the code for production. In fact, Vite provides a `vite build` command to do exactly that so the app doesn't suffer from network waterfall in production.

### How is This Different from [es-dev-server](https://open-wc.org/developing/es-dev-server.html)?

`es-dev-server` is a great project and we did take some inspiration from it when refactoring Vite in the early stages. That said, here is why Vite is different from `es-dev-server` and why we didn't just implement Vite as a middleware for `es-dev-server`:

- One of Vite's primary goal was to support Hot Module Replacement, but `es-dev-server` internals is a bit too opaque to get this working nicely via a middleware.

- Vite aims to be a single tool that integrates both the dev and the build process. You can use Vite to both serve and bundle the same source code, with zero configuration.

- Vite is more opinionated on how certain types of imports are handled, e.g. `.css` and static assets. The handling is similar to `vue-cli` for obvious reasons.

### How is This Different from [Snowpack](https://www.snowpack.dev/)?

Both Snowpack v2 and Vite offer native ES module import based dev servers. Vite's dependency pre-optimization is also heavily inspired by Snowpack v1. Some notable differences are:

- Vite was created with HMR as a first-class concern. Vite provides out-of-the-box HMR integration in `create-vite-app` templates for Vue, React and Preact.

  Full page reload speed of native ES import based dev servers suffer from the network waterfall when the project gets big, and HMR allows you to avoid reloading the page for a decent part of your development time.

  Snowpack as of now doesn't support HMR but there is work being done in this area.

- Vite is more opinionated and supports more opt-in features by default - for example, features listed above like TypeScript transpilation, CSS import, CSS modules and PostCSS support all work out of the box without the need for configuration.

- Both solutions can also bundle the app for production, but Vite uses Rollup with custom config while Snowpack delegate it to Parcel. This isn't a significant difference, but worth being aware of if you intend to customize the build.

## Trivia

[vite](https://en.wiktionary.org/wiki/vite) is the french word for "fast" and is pronounced `/vit/`.

## License

MIT
