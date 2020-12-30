# vite ⚡

[![npm][npm-img]][npm-url]
[![node][node-img]][node-url]
[![unix CI status][unix-ci-img]][unix-ci-url]
[![windows CI status][windows-ci-img]][windows-ci-url]

Vite is an opinionated web dev build tool that serves your code via native ES Module imports during dev and bundles it with [Rollup](https://rollupjs.org/) for production.

Vite 是一个“有主见”的 web 开发与构建工具，它可以在开发过程中令你的代码通过原生的 ES Module imports 方式运行在服务器上，而在生产环境则会使用 Roolup 进行打包。

- Lightning-fast cold server start
- 光速般的服务器冷启动速度
- Instant hot module replacement (HMR)
- 立刻进行模块的热更新
- True on-demand compilation
- 真正意义上的按需编译
- More details in [How and Why](#how-and-why)
- [这里](#how-and-why)可以查看更多细节

## Status 状态

In beta and will likely release 1.0 soon.

现在处于 Beta 状态，即将发布 1.0 的发行版。

## Getting Started 快速开始

> Note to Vue users: Vite currently only works with Vue 3.x. This also means you can't use libraries that are not yet compatible with Vue 3.
>
> 给 Vue 用户的提醒：Vite 现在只能在 Vue 3.x 下工作。如果要使用 Vite 的话，这也就意味着你不可以使用与 Vue 3.x 不兼容的库了。

Make sure you have [node.js](https://nodejs.org/en/) installed on your machine before proceeding.

在进行下一步之前，请保证你已经安装好 [node.js](https://nodejs.org/en/) 了。

```bash
$ npm init vite-app <project-name>
$ cd <project-name>
$ npm install
$ npm run dev
```

If using Yarn:

如果你使用 Yarn 的话：

```bash
$ yarn create vite-app <project-name>
$ cd <project-name>
$ yarn
$ yarn dev
```

> Although Vite is primarily designed to work with Vue 3, it can support other frameworks as well. For example, try `npm init vite-app --template react` or `--template preact`.
>
> 即使 Vite 主要是为了与 Vue 3 配合而设计的，但它一样支持其他的框架。例如，尝试使用 `npm init vite-app --template react` 或者 `--template preact`。

### Using master branch 使用主分支

If you can't wait for a new release to test the latest features, clone the `vite` to your local machine and execute the following commands:

如果你迫不及待想要使用新的发行版去测试最新的功能，你可以 clone `vite` 的仓库代码并自行构建使用：

```
yarn
yarn build
yarn link
```

Then go to your vite based project and run `yarn link vite`. Now restart the development server (`yarn dev`) to ride on the bleeding edge!

然后去你的vite基于项目和运行`yarn link vite`。现在重新启动开发服务器(`yarn dev`)来走在最前沿！

## Browser Support 浏览器支持

Vite requires [native ES module imports](https://caniuse.com/#feat=es6-module) during development. The production build also relies on dynamic imports for code-splitting (which can be [polyfilled](https://github.com/GoogleChromeLabs/dynamic-import-polyfill)).

Vite 在开发过程中需要[原生的 ES module imports 功能](https://caniuse.com/#feat=es6-module)。生产环境中的构建也依赖于动态的 imports 去实现代码切割(这个可以被 [polyfilled](https://github.com/GoogleChromeLabs/dynamic-import-polyfill))。

Vite assumes you are targeting modern browsers and by default only transpiles your code to `es2020` during build (so that optional chaining can work with terser minification). You can specify the target range via the `esbuildTarget` config option, where the lowest target available is `es2015`.

Vite 假设你使用的浏览器是大多数现代浏览器，默认情况下只会在构建期间将代码编译为`es2020`(这样可选的链接就可以在更简洁的缩减中工作)。您可以通过`esbuildTarget`配置选项指定目标范围，其中最低的可用目标是`es2015`。

## Features 功能

- [Bare Module Resolving](#bare-module-resolving)
- 暴露的模块解决方案
- [Hot Module Replacement](#hot-module-replacement)
- 模块热更新
- [TypeScript](#typescript)
- [CSS / JSON Importing](#css--json-importing)
- 引入 CSS / JSON
- [Asset URL Handling](#asset-url-handling)
- 静态 URL 处理器
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
- 本地开发服务器的 Proxy
- [Production Build](#production-build)
- 生产环境构建
- [Modes and Environment Variables](#modes-and-environment-variables)
- 拥有不同的模式与环境变量
- [Using Vite with Traditional Backend](#using-vite-with-traditional-backend)
- 使用 Vite 与传统的后端进行配合

Vite tries to mirror the default configuration in [vue-cli](http://cli.vuejs.org/) as much as possible. If you've used `vue-cli` or other webpack-based boilerplates before, you should feel right at home. That said, do expect things to be different here and there.

Vite 尝试尽可能地与 [vue-cli](http://cli.vuejs.org/) 的默认配置保持相同。如果你曾经使用过 `vue-cli` 或者其他基于 webpack 的脚手架，你应该可以很快就上手。也就是说，你可以期待在这里也表现得十分良好。

### Bare Module Resolving 暴露的模块解决方案

Native ES imports don't support bare module imports like

原生 ES 的 import 是不支持下面的那种 import 的：

```js
import { createApp } from 'vue'
```

The above will throw an error by default. Vite detects such bare module imports in all served `.js` files and rewrites them with special paths like `/@modules/vue`. Under these special paths, Vite performs module resolution to locate the correct files from your installed dependencies.

上面的代码在默认情况下会抛出一个错误。Vite 会拦截到所有 `.js` 文件中的这些 { } 模块 imports，并对他们进行重写，重写成类似 /@modules/vue 的形式。用这种特殊的路径，Vite 可以正确的找到安装好的依赖并指向正确的文件。

Note that `vue` has special treatment - if it isn't installed in the project locally, Vite will fallback to the version from its own dependencies. If you have Vite installed globally, this makes it possible to quickly prototype with Vue without installing anything locally.

要注意的是 vue 有特殊的优化——如果你没有将这个项目安装在本地，Vite 将从它自己的依赖回退到该版本。如果你已经全局安装了 Vite，则不需要安装其他东西，它可以让你快速地进行 Vue 的开发。

### Hot Module Replacement 模块热更新

- The `vue`, `react` and `preact` templates of `create-vite-app` all come with HMR out of the box.

- 通过 `crate-vite-app` 模板建立的 `vue`，`react` 和 `preact` 项目都可以享受到开箱即用的模块热更新功能。

- For manual HMR, an API is provided via `import.meta.hot`.

  For a module to self-accept, use `import.meta.hot.accept`:

  对于手动的 HMR，提供了一个 API import.meta.hot。

  对于自接受的模块，可以使用 import.meta.hot.acceopt：

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

  一个模块可以接受直接引用模块的更新，而不用重新加载。使用 import.meta.hot.acceptDeps 即可：

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

  （不会翻了……）

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

  （机翻）请注意，Vite的HMR实际上并不交换最初导入的模块:如果接受模块从dep重新导出导入，则它负责更新这些重新导出(这些导出必须使用`let`)。此外，来自接受模块的链上导入器将不会收到更改通知。

  This simplified HMR implementation is sufficient for most dev use cases, while allowing us to skip the expensive work of generating proxy modules.

  （机翻）这种简化的HMR实现对于大多数开发用例来说已经足够了，同时允许我们跳过生成代理模块的昂贵工作。

### TypeScript

Vite supports importing `.ts` files and `<script lang="ts">` in Vue SFCs out of the box.

Vite 支持引用 `.ts` 文件，同时也支持通过 `<script lang="ts">` 的方式在单文件组件中使用。

Vite only performs transpilation on `.ts` files and does **NOT** perform type checking. It assumes type checking is taken care of by your IDE and build process (you can run `tsc --noEmit` in the build script).

Vite 仅仅对 `.ts` 文件实现了转换功能，但是并不会去做类型校验。这意味着类型校验还是需要你的 IDE 或者在 build 的过程中进行一些处理。（你可以在运行 build 指令时附带上这一条 `tsc --noEmit` ）

Vite uses [esbuild](https://github.com/evanw/esbuild) to transpile TypeScript into JavaScript which is about 20~30x faster than vanilla `tsc`, and HMR updates can reflect in the browser in under 50ms.

Vite 使用 [esbuild](https://github.com/evanw/esbuild) 对 TypeScript 转换为 JavaScript 代码，这将会比使用 `tsc` 命令快了大概 20~30倍，同时表现在浏览器中的热更新将会限制在 50ms 以内。

Note that because `esbuild` only performs transpilation without type information, it doesn't support certain features like const enum and implicit type-only imports. You must set `"isolatedModules": true` in your `tsconfig.json` under `compilerOptions` so that TS will warn you against the features that do not work with isolated transpilation.

需要注意的是，`esbuild` 仅仅会将代码进行转换而不会进行类型校验，这将导致不支持一些特性，例如 const enum 和 绝对 type-only imports。你需要在你的 `tsconfig.json` 配置文件中设置 `"isolatedModules": true`才可以保证你可以正常的使用这些功能。

### CSS / JSON Importing

You can directly import `.css` and `.json` files from JavaScript (including `<script>` tags of `*.vue` files, of course).

你可以直接在 JS 代码中引入 `.css` 和 `.json` 文件。（当然在 `*.vue` 文件中 `<script>`标签中也是可以的）

- `.json` files export their content as an object that is the default export.
- json 文件像一个对象一样，default export 出去自身的内容。
- `.css` files do not export anything unless it ends with `.module.css` (See [CSS Modules](#css-modules) below). Importing them leads to the side effect of them being injected to the page during dev, and being included in the final `style.css` of the production build.
- 除非 `.css` 文件是 CSS Modules，否则它将无法导出。导入它们会导致它们在开发过程中被注入到页面，并在生产构建过程中包含在最终的 `style.css` 样式里。

Both CSS and JSON imports also support Hot Module Replacement.

CSS 和 JSON 的 imports 一样支持模块热更新。

### Asset URL Handling 资源 URL 的处理

You can reference static assets in your `*.vue` templates, styles and plain `.css` files either using absolute public paths (based on project root) or relative paths (based on your file system). The latter is similar to the behavior you are used to if you have used `vue-cli` or webpack's `file-loader`.

你可以在你的 *.vue 模板和 .css 文件中通过绝对或者相对路径引用静态资源。后者的表现行为就像你使用 vue-cli 和 webpack 的 file-loader 一样。

Common image, media, and font filetypes are detected and included as assets automatically. You can override this using the `assetsInclude` configuration option.

常规的图片，视频和字体文件会被自动找到并引入。你可以通过重写 `assetsInclude` 选项来更改其行为。

All referenced assets, including those using absolute paths, will be copied to the dist folder with a hashed file name in the production build. Never-referenced assets will not be copied. Similar to `vue-cli`, image assets smaller than 4kb will be base64 inlined.

所有被引用到的静态资源，包括使用绝对路径引入的，在打包构建时都会被统一格式成 hash 文件名，然后复制到 dist 文件夹中。从来没有被引用的静态资源不会被赋值。与 `vue-cli` 相似的是，小于 4kb 的图片静态资源会使用 base64 的格式进行编码并使用。

All **static** path references, including absolute paths, should be based on your working directory structure.

所有**静态**连接的引用（包括使用绝对路径）都需要基于你的工作文件夹架构来使用。

#### The `public` Directory

The `public` directory under project root can be used as an escape hatch to provide static assets that either are never referenced in source code (e.g. `robots.txt`), or must retain the exact same file name (without hashing).

存在于项目根目录下的 `public` 文件夹会被用于提供一些永远不会在源代码中引用但依然需要的静态资源（例如 `robots.txt`）。

Assets placed in `public` will be copied to the root of the dist directory as-is.

放在 public 文件夹中的资源将会被复制到 dist 根目录中，来的时候怎么样复制过去就是什么样。

Note that you should reference files placed in `public` using root absolute path - for example, `public/icon.png` should always be referenced in source code as `/icon.png`.

需要注意的是，如果你需要引入在 `public` 文件夹中的公共资源，你应该使用绝对路径。举个例子：如果你想引入 `public/icon.png` 这个文件，你应该在你的代码中这样写 `/icon.png`。（因为它在 dist 的根目录下。）

#### Public Base Path

If you are deploying your project under a nested public path, simply specify `--base=/your/public/path/` and all asset paths will be rewritten accordingly.

如果你正在一个非根目录部署你的项目，例如 `--base=/your/public/path`，这样会令你所有的静态路径被重写。

For dynamic path references, there are two options:

对于这些动态路径的引用，这里有两个选项：

- You can get the resolved public path of a static asset file by importing it from JavaScript. e.g. `import path from './foo.png'` will give you its resolved public path as a string.
- 你可以通过从 JavaScript 导入静态资源文件来获取解析后的公共路径。例如：`import path from './foo.png'` 将通过字符串的格式给出它的公共路径。
- If you need to concatenate paths on the fly, you can use the globally injected `import.meta.env.BASE_URL` variable which will be the public base path. Note this variable is statically replaced during build so it must appear exactly as-is (i.e. `import.meta.env['BASE_URL']` won't work).
- 如果你需要

### PostCSS

Vite automatically applies your PostCSS config to all styles in `*.vue` files and imported plain `.css` files. Just install necessary plugins and add a `postcss.config.js` in your project root.

Vite 会自动应用你的 PostCSS 配置文件到所有 *.vue 和被引用的 .css 文件中。你仅仅需要安装所需的插件并添加一个 `postcss.config.js`到你项目的根目录里。

### CSS Modules

Note that you do **not** need to configure PostCSS if you want to use CSS Modules: it works out of the box. Inside `*.vue` components you can use `<style module>`, and for plain `.css` files, you need to name CSS modules files as `*.module.css` which allows you to import the naming hash from it.

需要注意的是：如果你想使用 CSS Modules 的话，就不需要去配置 PostCSS了（因为它已经开箱即用啦）。在 *.vue 组件中你通过 `<style module>`的方式使用，如果在单纯的 .css 文件中，你需要去通过一个 *.module.css 文件命名 CSS Modules，这保证你可以正常的引用它来使用。 

### CSS Pre-Processors CSS 预处理器

Because Vite targets modern browsers only, it is recommended to use native CSS variables with PostCSS plugins that implement CSSWG drafts (e.g. [postcss-nesting](https://github.com/jonathantneal/postcss-nesting)) and author plain, future-standards-compliant CSS. That said, if you insist on using a CSS pre-processor, you can install the corresponding pre-processor and just use it:

因为 Vite 的目标只是兼容更多的现代浏览器，我们更推荐去使用原生的 CSS 参数和 PostCSS 插件来实现，写一些现代化标准的 CSS。但如果你想坚持使用一个 CSS 预处理器，你可以安装相对应的预处理器并使用它：

```bash
yarn add -D sass
```

```vue
<style lang="scss">
/* use scss */
</style>
```

Or import them from JavaScript:

或者在 JavaScript 中引入它：

```js
import './style.scss'
```

#### Passing Options to Pre-Processor 传递配置项到预处理器中

> 1.0.0-beta.9+
> And if you want to pass options to the pre-processor, you can do that using the `cssPreprocessOptions` option in the config (see [Config File](#config-file) below).
>
> 如果你想传递一些配置项到预处理器中，你可以在配置文件中使用 `cssPreprocessOptions`这个选项。
>
> For example, to pass some shared global variables to all your Less styles:
>
> 例如，你可以在 less 中设定一个共享的全局变量：

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

.jsx 和 .tsx 文件也是被支持的。JSX 的转换工作依然通过 esbuild 实现。

The default JSX configuration works out of the box with Vue 3 (note there is currently no JSX-based HMR for Vue):

在 Vue 3 中你可以享受到开箱即用的默认 JSX 配置（注意当前 Vue 没有基于 JSX 的热更新）：

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

（机翻）目前，这是自动导入一个兼容“jsx”的函数，该函数将esbuild生成的jsx调用转换为兼容Vue 3的vnode调用，这是次优的。Vue 3最终将提供一个自定义的JSX转换，它可以利用Vue 3的运行时快速路径。

#### JSX with React/Preact React/Preact 中的 JSX

There are two other presets provided: `react` and `preact`. You can specify the preset by running Vite with `--jsx react` or `--jsx preact`.

还有两个预设：react 和 preact。你可以通过 `--jsx react` 或者 `--jsx preact`来运行这两个预设。

If you need a custom JSX pragma, JSX can also be customized via `--jsx-factory` and `--jsx-fragment` flags from the CLI or `jsx: { factory, fragment }` from the API. For example, you can run `vite --jsx-factory=h` to use `h` for JSX element creation calls. In the config (see [Config File](#config-file) below), it can be specified as:

如果你需要一个自定义的 JSX 注解，在命令行中可以通过 `--jsx-factory`和 `--jsx-fragment`来标识，而在 jsx 文件中可以使用 `jsx: { factory, fragment }`来自定义。例如：你可以通过加上 `--jsx-factory=h`来运行 vite，以使用 `h`来调用 JSX 元素的创建。在配置文件中，你可以这样来进行配置：

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

注意，对于Preact预设，`h` 也是自动注入的，所以你不需要手动导入它。然而，这可能会导致问题，如果你使用 `.tsx` 与Preact，因为TypeScript 期望 `h` 被显式导入以进行类型推断。在这种情况下，您可以使用如上所示的显式工厂配置，它禁用自动 `h` 注入。

### Web Assembly

> 1.0.0-beta.3+

Pre-compiled `.wasm` files can be directly imported - the default export will be an initialization function that returns a Promise of the exports object of the wasm instance:

被预编译的 `.wasm` 文件会被直接引入——然后默认导出的会是一个初始化方法，这个方法将返回一个含有 wasm 实例导出对象的 Promise： 

``` js
import init from './example.wasm'

init().then(exports => {
  exports.test()
})
```

The init function can also take the `imports` object which is passed along to `WebAssembly.instantiate` as its second argument:

初始化的方法一样可以传递 `imports`对象到 `WebAssembly.instantiate`来作为它的第二个参数：

``` js
init({
  imports: {
    someFunc: () => { /* ... */ }
  }
}).then(() => { /* ... */ })
```

In the production build, `.wasm` files smaller than `assetInlineLimit` will be inlined as base64 strings. Otherwise, they will be copied to the dist directory as an asset and fetched on-demand.

在生产环境的构建中，小于 `assetInlineLimit` 的 `.wasm`文件会被转换成一个行内的 base64 字符串。其他的将会作为一个静态资源被复制到 dist 文件夹中，在需要时就会被拉取。

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

### Config File 配置文件

You can create a `vite.config.js` or `vite.config.ts` file in your project. Vite will automatically use it if one is found in the current working directory. You can also explicitly specify a config file via `vite --config my-config.js`.

你可以在你的项目根目录中创建一个 `vite.config.js`或者 `vite.config.ts` 文件来作为配置文件，Vite 会自动的找到并使用他们。同样的你也可以自定义一个配置文件的名称，然后通过 `vite --config my-config.js` 来调用。

In addition to options mapped from CLI flags, it also supports `alias`, `transforms`, and `plugins` (which is a subset of the config interface). For now, see [config.ts](https://github.com/vuejs/vite/blob/master/src/node/config.ts) for full details before more thorough documentation is available.

除此之外，Vite 也支持一些 CLI 的特性，例如 `alias`，`transforms` 和 `plugins`等（这些都可以在配置文件中进行配置）。现在你可以查看 [config.ts](https://github.com/vuejs/vite/blob/master/src/node/config.ts) 来了解详情。随后我们也会提供更详尽的文档。

### Custom Blocks

[Custom blocks](https://vue-loader.vuejs.org/guide/custom-blocks.html) in Vue SFCs are also supported. To use custom blocks, specify transform functions for custom blocks using the `vueCustomBlockTransforms` option in the [config file](#config-file):

在 Vue 的单文件组件中的 [自定义块](https://vue-loader.vuejs.org/guide/custom-blocks.html) 也是被支持的。如果你要使用自定义块，请在[config file](#config-file)中 `vueCustomBlockTransforms` 选项定义一个用于自定义块转换的方法：

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

使用 `--https` 命令开启服务器将会自动生成一个自加密的证书，并且使用 TLS 和 HTTP/2 来启动本地开发服务器。

Custom certs can also be provided by using the `httpsOptions` option in the config file, which accepts `key`, `cert`, `ca` and `pfx` as in Node `https.ServerOptions`.

你也可以通过配置文件中 `httpsOptions` 这个选项来使用自定义的证书文件，它接受 `key`, `cert`, `ca` and `pfx` 参数，就像配置 Nodejs的 `https.ServerOptions` 选项一样。

### Dev Server Proxy 本地开发服务器代理

You can use the `proxy` option in the config file to configure custom proxies for the dev server. Vite uses [`koa-proxies`](https://github.com/vagusX/koa-proxies) which in turn uses [`http-proxy`](https://github.com/http-party/node-http-proxy). Each key can be a path Full options [here](https://github.com/http-party/node-http-proxy#options).

你可以在配置文件中使用 `proxy`选项来自定义本地开发服务器的代理。Vite 使用了  [`koa-proxies`](https://github.com/vagusX/koa-proxies)来实现代理。更多的配置可以参考[这里](https://github.com/http-party/node-http-proxy#options)。

Example:

这里是一个例子：

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

### Production Build 生产环境构建

Vite does utilize bundling for production builds because native ES module imports result in waterfall network requests that are simply too punishing for page load time in production.

Vite确实将捆绑用于生产构建，因为原生的ES Modules import 会导致瀑布网络请求，而这些请求对于生产中的页面加载时间来说影响太大了。

You can run `vite build` to bundle the app.

你可以运行 `vite build` 来打包你的 web 应用。

Internally, we use a highly opinionated Rollup config to generate the build. The build is configurable by passing on most options to Rollup - and most non-rollup string/boolean options have mapping flags in the CLI (see [build/index.ts](https://github.com/vuejs/vite/blob/master/src/node/build/index.ts) for full details).

在内部实现里，我们使用了功能强大的 Roolup 配置来进行构建。可以通过将大多数选项传递给 Roolup 来配置构建，同时绝大多数非 Roolup 的字符串和布尔选项在CLI中都具有相对应的映射（请参阅 [build/index.ts](https://github.com/vuejs/vite/blob/master/src/node/build/index.ts) 以获取完整详细信息）。

### Modes and Environment Variables 不同的模式和环境变量

The mode option is used to specify the value of `import.meta.env.MODE` and the corresponding environment variables files that needs to be loaded.

模式选项经常被定义在 `import.meta.env.MODE`，在使用时根据不同的模式我们需要加载不同的环境变量配置。

By default, there are two modes:

默认情况下，我们有两种模式：

  - `development` is used by `vite` and `vite serve`
  - 在 `vite`和 `vite serve` 中是 `development` 模式
  - `production` is used by `vite build`
  - 通过 `vite build` 构建的则是 `production` 模式

You can overwrite the default mode used for a command by passing the `--mode` option flag. For example, if you want to use development variables in the build command:

你可以通过使用 `--mode` 选项来重新定义默认的模式。例如，假设你想要在 build 命令中使用 development 的环境，可以这样：

```bash
vite build --mode development
```

When running `vite`, environment variables are loaded from the following files in your project root:

当你运行 `vite`的时候，程序会自动在你的根目录下加载对应的环境变量配置：

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified env mode
.env.[mode].local   # only loaded in specified env mode, ignored by git
```

**Note:** only variables prefixed with `VITE_` are exposed to your code (e.g. `VITE_SOME_KEY=123`) and `SOME_KEY=123` will not.  you can access `VITE_SOME_KEY` using `import.meta.env.VITE_SOME_KEY`. This is because the `.env` files may be used by some users for server-side or build scripts and may contain sensitive information that should not be exposed in code shipped to browsers.

**注意：**只有以 `VITE_` 开头的变量会对外暴露给你的代码使用。你可以通过使用 `import.meta.env.VITE_SOME_KEY` 来访问到 `VITE_SOME_KEY`。这是因为有些用户可能会将 `.env`文件用于服务器端或者构建脚本中，并可能在其中包含不应该交付给浏览器公开的敏感信息。（译者注：因为运行的代码在浏览器上是可以一览无遗的）

### Using Vite with Traditional Backend 使用传统后端配合 Vite

If you want to serve the HTML using a traditional backend (e.g. Rails, Laravel) but use Vite for serving assets, here's what you can do:

如果你想将 HTML 文件托管在传统的后端（例如 Rails，Laravel）上，使用 Vite 托管其余资源的话，这里有一些你可以做的事情：

1. In your Vite config, enable `cors` and `emitManifest`:

   在 Vite 的配置文件中，开启 `cors` 和 `emitManifest`：

   ```js
   // vite.config.js
   export default {
     cors: true,
     emitManifest: true
   }
   ```

2. For development, inject the following in your server's HTML template (substitute `http://localhost:3000` with the local URL Vite is running at):

   在开发过程中，在服务器的 HTML 模板中注入以下代码（使用运行在本地的 Vite URL 替代下方的 `http://localhost:3000`）：

   ```html
   <!-- if development -->
   <script type="module" src="http://localhost:3000/vite/client"></script>
   <script type="module" src="http://localhost:3000/main.js"></script>
   ```

   Also make sure the server is configured to serve static assets in the Vite working directory, otherwise assets such as images won't be loaded properly.

   同时需要保证你的服务器已经配置好去托管 Vite 工作目录下的静态资源，否则其余静态资源（例如图片等）将不能正常加载。

3. For production: after running `vite build`, a `manifest.json` file will be generated alongside other asset files. You can use this file to render links with hashed filenames (note: the syntax here is for explanation only, substitute with your server templating language):

   对于生产环境中：在运行了 `vite build`后，一个 `manifest.json`文件将会生成在其他的静态文件隔壁。你可以使用这个文件去渲染那些带 hash 名称绑定的静态资源（注意：这里的语法仅供解释，请务必使用对应的服务器模板语言代替）：

   ```html
   <!-- if production -->
   <link rel="stylesheet" href="/_assets/{{ manifest['style.css'] }}">
   <script type="module" src="/_assets/{{ manifest['index.js'] }}"></script>
   ```

## API

### Dev Server 开发服务器

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

### How is This Different from [es-dev-server](https://github.com/open-wc/es-dev-server/)?

`es-dev-server` is a great project and we did take some inspiration from it when refactoring Vite in the early stages. That said, here is why Vite is different from `es-dev-server` and why we didn't just implement Vite as a middleware for `es-dev-server`:

- One of Vite's primary goals was to support Hot Module Replacement, but `es-dev-server` internals are a bit too opaque to get this working nicely via a middleware.

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
