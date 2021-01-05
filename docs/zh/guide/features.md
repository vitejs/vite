# 功能

对非常基础的使用来说，使用 Vite 开发和使用一个静态文件服务器并没有太大区别。然而，Vite 还通过原生 ESM 导入提供了许多增强功能。

## 模块热重载

Vite 提供了一套原生 ESM 的 [HMR API](./api-hmr)。 具有 HMR 功能的框架可以利用该 API 提供即时、准确的更新，而无需重新加载页面或删除应用程序状态。Vite 提供了第一优先级的 HMR 集成给 [Vue 单文件组件（SFC）](https://github.com/vitejs/vite/tree/main/packages/plugin-vue) 和 [React Fast Refresh](https://github.com/vitejs/vite/tree/main/packages/plugin-react-refresh)。也有对 Preact 的集成 [@prefresh/vite](https://github.com/JoviDeCroock/prefresh/tree/main/packages/vite).

注意，你不需要手动设置这些 —— 当你 [create an app via `@vitejs/create-app`](./) 创建应用程序时，所选模板已经为你预先配置了这些。

## NPM 依赖解析

原生 ES 引入不支持下面这样的裸模块导入：

```js
import { someMethod } from 'my-dep'
```

这在浏览器中将抛出一个错误。而 Vite 却可以侦测到这些模块导入的 `.js` 文件并改写他们的路径，例如 `/node_modules/my-dep/dist/my-dep.js?v=1.0.0`，使得浏览器可以正确处理它们。

**依赖缓存**

解析后的依赖请求会通过设置 `max-age=31536000,immutable` 进行强缓存，以提高在开发期间的页面重载性能。一旦被缓存，这些请求将永远不会再发到开发服务器。如果安装了该依赖的不同的版本，则附加的版本 query 将使它们自动失效。如果您对依赖项进行了手动本地编辑，您可以通过浏览器 devtools 暂时禁用缓存并重新加载页面。

## TypeScript

Vite 支持开箱即用地引入 `.ts` 文件。

Vite 仅执行 `.ts` 文件的翻译工作，并**不**执行任何类型检查。并假设类型检查已经被你的 IDE 或构建过程接管了。（你可以在构建脚本中运行 `tsc --noEmit`）。

Vite 使用 [esbuild](https://github.com/evanw/esbuild) 将 TypeScript 翻译到 JavaScript，约是 `tsc` 速度的 20~30 倍，同时 HMR 更新反映到浏览器的时间小于 50ms。

注意因为 `esbuild` 只执行转译工作而不含类型信息，所以它无需支持 TypeScript 的特定功能例如常量枚举和隐式 “type-only” 导入。你必须在你的 `tsconfig.json` 中的 `compilerOptions` 里设置 `"isolatedModules": true`，这样 TS 才会警告你哪些功能无法与独立编译模式一同工作。

## JSX

`.jsx` 和 `.tsx` 文件同样开箱即用。JSX 的翻译同样是通过 `esbuild`，默认为 React 16 形式，React 17 形式的 JSX 在 esbuild 中的支持请看 [这里](https://github.com/evanw/esbuild/issues/334).

如果不是在 React 中使用 JSX，自定义的 `jsxFactory` 和 `jsxFragment` 可以使用 [`esbuild` 选项](/zh/config/#esbuild) 进行配置。例如对 Preact：

```js
// vite.config.js
export default {
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  }
}
```

更多细节详见 [esbuild 文档](https://esbuild.github.io/content-types/#jsx).

自定义插件还可以自动将 `import React from 'react'` 这类代码注入到每个文件中，以避免手工导入它们。请参阅 [插件 API](./api-plugin) 了解如何编写这样的插件。

## CSS

导入 `.css` 文件将会把内容插入到 `<style>` 标签中，同时也带有 HMR 支持。也能够以字符串的形式检索处理后的、作为其模块默认导出的 CSS。

### PostCSS

如果项目包含有效的 PostCSS 配置 (任何受 [postcss-load-config](https://github.com/postcss/postcss-load-config) 支持的格式，例如 `postcss.config.js`)，它将会自动应用于所有已导入的 CSS。

### CSS Modules

任何以 `.module.css` 为后缀名的 CSS 文件都被认为是一个 [CSS modules 文件](https://github.com/css-modules/css-modules)。导入这样的文件会返回一个相应的模块对象：

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

CSS modules 行为可通过 [`css.modules` 选项](/zh/config/#css-modules) 配置。

### CSS 预处理器

因为 Vite 只针对现代浏览器，所以建议使用原生 CSS 变量和实现 CSSWG 草案的 PostCSS 插件（例如 [postcss-nesting](https://github.com/jonathantneal/postcss-nesting)），并编写简单的、未来标准兼容的 CSS。

话虽如此，但 Vite 也同时提供了对 `.scss`, `.sass`, `.less`, `.styl` 和 `.stylus` 文件的内置支持。没有必要为他们安装特定的 vite 插件，但相应的预处理器依赖本身必须安装：

- `.scss` 和 `.sass`: [sass](https://www.npmjs.com/package/sass)
- `.less`: [less](https://www.npmjs.com/package/less)
- `.styl` 和 `.stylus`: [stylus](https://www.npmjs.com/package/stylus)

您还可以通过在文件扩展名前加上 `.module` 来结合使用 CSS modules 和预处理器，例如 `style.module.scss`。

## 静态资源处理

- 相关文档：[public base 路径](./build#public-base-路径)
- 相关文档：[`assetsInclude` 配置项](/zh/config/#assetsinclude)

### URL 导入

导入一个静态资源会返回解析后的 URL：

```js
import imgUrl from './img.png'
document.getElementById('hero-img').src = imgUrl
```

该行为类似于 webpack 的 `file-loader`。区别在于这个导入可以使用公共路径（基于开发时项目的根目录），也可以使用相对路径。

- `url()` 在 CSS 中的引用也以同样方式处理

- 如果使用 Vue 插件，Vue 单文件组件模板中的资源引用会自动转换其导入。

- 常见的图片，媒体和字体文件格式将会自动被识别为静态资源。你可以使用 [`assetsInclude` 选项](/zh/config/#assetsinclude) 来扩展这个列表。

- 引用的资源作为构建资产图的一部分包括在内，将得到散列文件名，并可以由插件处理以进行优化。

- 较小的资源体积小于 [`assetsInlineLimit` 选项值](/zh/config/#assetsinlinelimit) 则会被内联为 base64 data URL。

### `public` 目录

如果你有下列这些资源：

- 不会被源代码引用（例如 `robots.txt`）
- 必须保持原有文件名（没有经过 hash）
- ...或者您只是不想为了获取 URL 而首先导入该资源

那么你可以将该资源放在一个特别的 `public` 目录中，它应位于你的项目根目录。该目录中的资源应该在开发时能直接通过 `/` 根路径访问到，并且打包时会被完整复制到目标目录的根目录下。

请注意：

- 引入 `public` 中的资源永远应该使用根绝对路径 - 举个例子，`public/icon.png` 应该在源代码中被引用为 `/icon.png`。
- `public` 中的资源不应该被 JavaScript 文件引用。

## JSON

JSON 可以被直接导入 - 同样支持具名导入：

```js
// 导入整个对象
import json from './example.json'
// 对一个根字段使用具名导入 - 有效运用 tree-shaking！
import { field } from './example.json'
```

## Web Assembly

预编译的 `.wasm` 文件可以直接被导入 —— 默认导出将会是一个函数，返回值为所导出 wasm 实例对象的 Promise：

```js
import init from './example.wasm'

init().then((exports) => {
  exports.test()
})
```

The init function can also take the `imports` object which is passed along to `WebAssembly.instantiate` as its second argument:

这个 `init` 函数也可以使用将传递给 `WebAssembly.instantiate` ，作为其第二个参数的 `imports` 对象：

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

在生产构建当中，体积小于 `assetInlineLimit` 的 `.wasm` 文件将会被内联为 base64 字符串。否则，它们将作为资源复制到 `dist` 目录中，并按需获取。

## Web Worker

一个 web worker 脚本可以直接通过添加一个 `?worker` query 来导入。默认导出蒋氏一个自定义的 worker 构造器：

```js
import MyWorker from './worker?worker'

const worker = new MyWorker()
```

worker 脚本也可以使用 `import` 语句来替代 `importScripts()` - 注意，在开发过程中，这依赖于浏览器原生支持，目前只在 Chrome 中工作，但在生产版本中，它已经被编译掉了。

默认情况下，worker 脚本将在生产构建中作为单独的块发出。如果你想将 worker 内联为 base64 字符串，添加 `inline` query：

```js
import MyWorker from './worker?worker&inline'
```
