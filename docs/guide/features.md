# Features

At the very basic level, developing using Vite is not that much different from using a static file server. However, Vite provides many enhancements over native ESM imports to support

## Hot Module Replacement

Vite provides an [HMR API](./api-hmr) over native ESM. Frameworks with HMR capabilities can leverage the API to provide instant, precise updates without reloading the page or blowing away application state. Vite provides first-party HMR integrations for [Vue Single File Components](https://github.com/vitejs/vite/tree/main/packages/plugin-vue) and [React Fast Refresh](https://github.com/vitejs/vite/tree/main/packages/plugin-react-refresh). There are also official integrations for Preact via [@prefresh/vite](https://github.com/JoviDeCroock/prefresh/tree/main/packages/vite).

Note you don't need to manually set these up - when you [create an app via `@vitejs/create-app`](./), the selected templates would have these pre-configured for you already.

## NPM Dependency Resolving

Native ES imports do not support bare module imports like the following:

```js
import { someMethod } from 'my-dep'
```

The above will throw an error in the browser. Vite detects such bare module imports in all served `.js` files and rewrites them to resolved paths like `/node_modules/my-dep/dist/my-dep.js?v=1.0.0` so that the browser can handle them properly.

**Dependency Caching**

Resolved dependency requests are strongly cached with headers `max-age=31536000,immutable` to improve page reload performance during dev. Once cached, these requests will never hit the dev server again. They are auto invalidated by the appended version query if a different version is installed. If you made manual local edits to your dependencies, you can temporarily disable cache via your browser devtools and reload the page.

## TypeScript

Vite supports importing `.ts` files out of the box.

Vite only performs transpilation on `.ts` files and does **NOT** perform type checking. It assumes type checking is taken care of by your IDE and build process (you can run `tsc --noEmit` in the build script).

Vite uses [esbuild](https://github.com/evanw/esbuild) to transpile TypeScript into JavaScript which is about 20~30x faster than vanilla `tsc`, and HMR updates can reflect in the browser in under 50ms.

Note that because `esbuild` only performs transpilation without type information, it doesn't support certain features like const enum and implicit type-only imports. You must set `"isolatedModules": true` in your `tsconfig.json` under `compilerOptions` so that TS will warn you against the features that do not work with isolated transpilation.

### Client Types

Vite's default types are for its Node.js API. To shim the environment of client side code in a Vite application, add `vite/client` to `compilerOptions.types` of your `tsconfig`:

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

This will provide the following type shims:

- Asset imports (e.g. importing an `.svg` file)
- Types for the Vite-injected [env variables](./env-and-mode#env-variables) on `import.meta.env`
- Types for the [HMR API](./api-hmr) on `import.meta.hot`

## Vue

Vite provides first-class Vue support:

- Vue 3 SFC support via [@vitejs/plugin-vue](https://github.com/vitejs/vite/tree/main/packages/plugin-vue)
- Vue 3 JSX support via [@vitejs/plugin-vue-jsx](https://github.com/vitejs/vite/tree/main/packages/plugin-vue-jsx)
- Vue 2 support via [underfin/vite-plugin-vue2](https://github.com/underfin/vite-plugin-vue2)

## JSX

`.jsx` and `.tsx` files are also supported out of the box. JSX transpilation is also handled via [ESBuild](https://esbuild.github.io), and defaults to the React 16 flavor. React 17 style JSX support in ESBuild is tracked [here](https://github.com/evanw/esbuild/issues/334).

Vue users should use the official [@vitejs/plugin-vue-jsx](https://github.com/vitejs/vite/tree/main/packages/plugin-vue-jsx) plugin, which provides Vue 3 specific features including HMR, global component resolving, directives and slots.

If not using JSX with React or Vue, custom `jsxFactory` and `jsxFragment` can be configured using the [`esbuild` option](/config/#esbuild). For example for Preact:

```js
// vite.config.js
export default {
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  }
}
```

More details in [ESBuild docs](https://esbuild.github.io/content-types/#jsx).

You can inject the JSX helpers using `jsxInject` (which is a Vite-only option) to avoid manual imports:

```js
// vite.config.js
export default {
  esbuild: {
    jsxInject: `import React from 'react'`
  }
}
```

## CSS

Importing `.css` files will inject its content to the page via a `<style>` tag with HMR support. You can also retrieve the processed CSS as a string as the module's default export.

### `@import` Inlining and Rebasing

Vite is pre-configured to support CSS `@import` inlining via `postcss-import`. Vite aliases are also respected for CSS `@import`. In addition, all CSS `url()` references, even if the imported files are in different directories, are always automatically rebased to ensure correctness.

`@import` aliases and URL rebasing are also supported for Sass and Less files (see [CSS Pre-processors](#css-pre-processors)).

### PostCSS

If the project contains valid PostCSS config (any format supported by [postcss-load-config](https://github.com/postcss/postcss-load-config), e.g. `postcss.config.js`), it will be automatically applied to all imported CSS.

### CSS Modules

Any CSS file ending with `.module.css` is considered a [CSS modules file](https://github.com/css-modules/css-modules). Importing such a file will return the corresponding module object:

```css
/* example.module.css */
.red {
  color: red;
}
```

```js
import classes from './example.module.css'
document.getElementById('foo').className = classes.red
```

Note that the CSS modules `localsConvention` defaults to `cameCaesOnly` - i.e. a class named `.foo-bar` will be exposed as `classes.fooBar`. CSS modules behavior can be configured via the [`css.modules` option](/config/#css-modules).

### CSS Pre-processors

Because Vite targets modern browsers only, it is recommended to use native CSS variables with PostCSS plugins that implement CSSWG drafts (e.g. [postcss-nesting](https://github.com/jonathantneal/postcss-nesting)) and author plain, future-standards-compliant CSS.

That said, Vite does provide built-in support for `.scss`, `.sass`, `.less`, `.styl` and `.stylus` files. There is no need to install Vite-specific plugins for them, but the corresponding pre-processor itself must be installed:

```bash
# .scss and .sass
npm install -D sass

# .less
npm install -D less

# .styl and .stylus
npm install -D stylus
```

If using Vue single file components, this also automatically enables `<style lang="sass">` et al.

Vite improves `@import` resolving for Sass and Less so that Vite aliases are also respected. In addition, relative `url()` references inside imported Sass/Less files that are in different directories from the root file are also automatically rebased to ensure correctness.

`@import` alias and url rebasing are not supported for Stylus due to its API constraints.

You can also use CSS modules combined with pre-processors by prepending `.module` to the file extension, for example `style.module.scss`.

## Asset Handling

- Related: [Public Base Path](./build#public-base-path)
- Related: [`assetsInclude` config option](/config/#assetsinclude)

### URL Imports

Importing a static asset will return the resolved public URL when it is served:

```js
import imgUrl from './img.png'
document.getElementById('hero-img').src = imgUrl
```

The behavior is similar to webpack's `file-loader`. The difference is that the import can be either using absolute public paths (based on project root during dev) or relative paths.

- `url()` references in CSS are handled the same way.

- If using the Vue plugin, asset references in Vue SFC templates are automatically converted into imports.

- Common image, media, and font filetypes are detected as assets automatically. You can extend the internal list using the [`assetsInclude` option](/config/#assetsinclude).

- Referenced assets are included as part of the build assets graph, will get hashed file names, and can be processed by plugins for optimization.

- Assets smaller in bytes than the [`assetsInlineLimit` option](/config/#assetsinlinelimit) will be inlined as base64 data URLs.

### The `public` Directory

If you have assets that are:

- Never referenced in source code (e.g. `robots.txt`)
- Must retain the exact same file name (without hashing)
- ...or you simply don't want to have to import an asset first just to get its URL

Then you can place the asset in a special `public` directory under your project root. Assets in this directory will be served at root path `/` during dev, and copied to the root of the dist directory as-is.

Note that:

- You should always reference `public` assets using root absolute path - for example, `public/icon.png` should be referenced in source code as `/icon.png`.
- Assets in `public` cannot be imported from JavaScript.

## JSON

JSON files can be directly imported - named imports are also supported:

```js
// import the entire object
import json from './example.json'
// import a root field as named exports - helps with treeshaking!
import { field } from './example.json'
```

## Glob Import

> Requires ^2.0.0-beta.17

Vite supports importing multiple modules from the file system via the special `import.meta.glob` function:

```js
const modules = import.meta.glob('./dir/*.js')
```

The above will be transformed into the following:

```js
// code produced by vite
const modules = {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js')
}
```

You can then iterate over the keys of the `modules` object to access the corresponding modules:

```js
for (const path in modules) {
  modules[path]().then((mod) => {
    console.log(path, mod)
  })
}
```

Matched files are by default lazy loaded via dynamic import and will be split into separate chunks during build. If you'd rather import all the modules directly (e.g. relying on side-effects in these modules to be applied first), you can use `import.meta.globEager` instead:

```js
const modules = import.meta.globEager('./dir/*.js')
```

The above will be transformed into the following:

```js
// code produced by vite
import * as __glob__0_0 from './dir/foo.js'
import * as __glob__0_1 from './dir/bar.js'
const modules = {
  './dir/foo.js': __glob__0_0,
  './dir/bar.js': __glob__0_1
}
```

Note that:

- This is a Vite-only feature and is not a web or ES standard.
- The glob patterns must be relative and start with `.`.
- The glob matching is done via `fast-glob` - check out its documentation for [supported glob patterns](https://github.com/mrmlnc/fast-glob#pattern-syntax).

## Web Assembly

Pre-compiled `.wasm` files can be directly imported - the default export will be an initialization function that returns a Promise of the exports object of the wasm instance:

```js
import init from './example.wasm'

init().then((exports) => {
  exports.test()
})
```

The init function can also take the `imports` object which is passed along to `WebAssembly.instantiate` as its second argument:

```js
init({
  imports: {
    someFunc: () => {
      /* ... */
    }
  }
}).then(() => {
  /* ... */
})
```

In the production build, `.wasm` files smaller than `assetInlineLimit` will be inlined as base64 strings. Otherwise, they will be copied to the dist directory as an asset and fetched on-demand.

## Web Workers

A web worker script can be directly imported by appending `?worker` to the import request. The default export will be a custom worker constructor:

```js
import MyWorker from './worker?worker'

const worker = new MyWorker()
```

The worker script can also use `import` statements instead of `importScripts()` - note during dev this relies on browser native support and currently only works in Chrome, but for the production build it is compiled away.

By default, the worker script will be emitted as a separate chunk in the production build. If you wish to inline the worker as base64 strings, add the `inline` query:

```js
import MyWorker from './worker?worker&inline'
```

## Build Optimizations

> Features listed below are automatically applied as part of the build process and there is no need for explicit configuration unless you want to disable them.

### Dynamic Import Polyfill

Vite uses ES dynamic import as code-splitting points. The generated code will also use dynamic imports to load the async chunks. However, native ESM dynamic imports support landed later than ESM via script tags and there is a browser support discrepancy between the two features. Vite automatically injects a light-weight [dynamic import polyfill](https://github.com/GoogleChromeLabs/dynamic-import-polyfill) to ease out that difference.

If you know you are only targeting browsers with native dynamic import support, you can explicitly disable this feature via [`build.polyfillDynamicImport`](/config/#build-polyfilldynamicimport).

### CSS Code Splitting

Vite automatically extracts the CSS used by modules in an async chunk and generate a separate file for it. The CSS file is automatically loaded via a `<link>` tag when the associated async chunk is loaded, and the async chunk is guaranteed to only be evaluated after the CSS is loaded to avoid [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content#:~:text=A%20flash%20of%20unstyled%20content,before%20all%20information%20is%20retrieved.).

If you'd rather have all the CSS extracted into a single file, you can disable CSS code splitting by setting [`build.cssCodeSplit`](/config/#build-csscodesplit) to `false`.

### Preload Directives Generation

Vite automatically generates `<link rel="modulepreload">` directives for entry chunks and their direct imports in the built HTML.

### Async Chunk Loading Optimization

In real world applications, Rollup often generates "common" chunks - code that is shared between two or more other chunks. Combined with dynamic imports, it is quite common to have the following scenario:

![graph](/graph.png)

In the non-optimized scenarios, when async chunk `A` is imported, the browser will have to request and parse `A` before it can figure out that it also needs the common chunk `C`. This results in an extra network roundtrip:

```
Entry ---> A ---> C
```

Vite automatically rewrites code-split dynamic import calls with a preload step so that when `A` is requested, `C` is fetched **in parallel**:

```
Entry ---> (A + C)
```

It is possible for `C` to have further imports, which will result in even more roundtrips in the un-optimized scenario. Vite's optimization will trace all the direct imports to completely eliminate the roundtrips regardless of import depth.
