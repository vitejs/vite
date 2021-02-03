# 功能

对非常基础的使用来说，使用 Vite 开发和使用一个静态文件服务器并没有太大区别。然而，Vite 还通过原生 ESM 导入提供了许多主要用于打包场景的增强功能。

## NPM 依赖解析和预构建

原生 ES 引入不支持下面这样的裸模块导入：

```js
import { someMethod } from 'my-dep'
```

上面的操作将在浏览器中抛出一个错误。Vite 将在服务的所有源文件中检测此类裸模块导入，并执行以下操作:

1. [预构建](./dep-rep-bundling) 他们以提升页面重载速度，并将 CommonJS / UMD 转换为 ESM 格式。预构建这一步由 [esbuild](http://esbuild.github.io/) 执行，这使得 Vite 的冷启动时间比任何基于 javascript 的打包程序都要快得多。

2. 重写导入为合法的 URL，例如 `/node_modules/.vite/my-dep.js?v=f3sf2ebd` 以便浏览器能够正确导入它们。

**依赖是强缓存的**

Vite 通过 HTTP 头来缓存请求得到的依赖，所以如果你想要 编辑/调试 一个依赖，晴跟随 [这里](./dep-pre-bundling#浏览器缓存) 的步骤。

## 模块热重载

Vite 提供了一套原生 ESM 的 [HMR API](./api-hmr)。 具有 HMR 功能的框架可以利用该 API 提供即时、准确的更新，而无需重新加载页面或删除应用程序状态。Vite 提供了第一优先级的 HMR 集成给 [Vue 单文件组件（SFC）](https://github.com/vitejs/vite/tree/main/packages/plugin-vue) 和 [React Fast Refresh](https://github.com/vitejs/vite/tree/main/packages/plugin-react-refresh)。也有对 Preact 的集成 [@prefresh/vite](https://github.com/JoviDeCroock/prefresh/tree/main/packages/vite).

注意，你不需要手动设置这些 —— 当你 [create an app via `@vitejs/create-app`](./) 创建应用程序时，所选模板已经为你预先配置了这些。

## TypeScript

Vite 支持开箱即用地引入 `.ts` 文件。

Vite 仅执行 `.ts` 文件的翻译工作，并**不**执行任何类型检查。并假设类型检查已经被你的 IDE 或构建过程接管了。（你可以在构建脚本中运行 `tsc --noEmit`）。

Vite 使用 [esbuild](https://github.com/evanw/esbuild) 将 TypeScript 翻译到 JavaScript，约是 `tsc` 速度的 20~30 倍，同时 HMR 更新反映到浏览器的时间小于 50ms。

注意因为 `esbuild` 只执行转译工作而不含类型信息，所以它无需支持 TypeScript 的特定功能例如常量枚举和隐式 “type-only” 导入。你必须在你的 `tsconfig.json` 中的 `compilerOptions` 里设置 `"isolatedModules": true`，这样 TS 才会警告你哪些功能无法与独立编译模式一同工作。

### Client Types

Vite 默认的类型定义是写给它的 Node.js API 的。要将其补充到一个 Vite 应用的客户端代码环境中，请将 `vite/client` 添加到 `tsconfig` 中的 `compilerOptions.types` 下：

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

这将会提供一下类型定义补充：

- 资源导入 (例如：导入一个 `.svg` 文件)
- `import.meta.env` 上 Vite 注入的在 的环境变量的类型定义
- `import.meta.hot` 上的 [HMR API](./api-hmr) 类型定义

## Vue

Vite 为 Vue 提供第一优先级支持：

- Vue 3 单文件组件支持：[@vitejs/plugin-vue](https://github.com/vitejs/vite/tree/main/packages/plugin-vue)
- Vue 3 JSX 支持：[@vitejs/plugin-vue-jsx](https://github.com/vitejs/vite/tree/main/packages/plugin-vue)
- Vue 2 支持：[underfin/vite-plugin-vue2](https://github.com/underfin/vite-plugin-vue2)

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

### `@import` 内联和变基

Vite 通过 `postcss-import` 预配置支持了 CSS `@import` 内联，Vite 的路径别名也遵从 CSS `@import`。换句话说，所有 CSS `url()` 引用，即使导入的文件在不同的目录中，也总是自动变基，以确保正确性。

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

请注意 CSS modules `localsConvention` 默认是 `cameCaseOnly` - 例如一个名为 `.foo-bar` 的类会被暴露为 `classes.fooBar`。CSS modules 行为可以通过 [`css.modules` option](/config/#css-modules) 选项配置。

### CSS 预处理器

因为 Vite 只针对现代浏览器，所以建议使用原生 CSS 变量和实现 CSSWG 草案的 PostCSS 插件（例如 [postcss-nesting](https://github.com/jonathantneal/postcss-nesting)），并编写简单的、未来标准兼容的 CSS。

话虽如此，但 Vite 也同时提供了对 `.scss`, `.sass`, `.less`, `.styl` 和 `.stylus` 文件的内置支持。没有必要为他们安装特定的 vite 插件，但相应的预处理器依赖本身必须安装：

也就是说，Vite 的确为 `.scss`, `.sass`，`.less`，`.styl` 和 `.stylus` 文件提供了内建支持。不需要为他们安装特定的插件，但相应的预处理器本身必须安装：

```bash
# .scss and .sass
npm install -D sass

# .less
npm install -D less

# .styl and .stylus
npm install -D stylus
```

如果是用的是单文件组件，可以通过 `<style lang="sass">`（或其他与处理器）自动开启。

Vite 为 Sass 和 Less 改进了 `@import` 解析，因而 Vite 别名也同样受用，另外，`url()` 中的相对路径引用的，与根文件不同目录中的 Sass/Less 文件会自动变基以保证正确性。

由于与其 API 冲突，`@import` 别名和 URL 变基不支持 Stylus。

您还可以通过在文件扩展名前加上 `.module` 来结合使用 CSS modules 和预处理器，例如 `style.module.scss`。

## 静态资源处理

- 相关文档：[公共基础路径](./build#public-base-路径)
- 相关文档：[`assetsInclude` 配置项](/zh/config/#assetsinclude)

### URL 导入

导入一个静态资源会返回解析后的 URL：

```js
import imgUrl from './img.png'
document.getElementById('hero-img').src = imgUrl
```

更多细节请见 [静态资源处理](./assets)。

## JSON

JSON 可以被直接导入 - 同样支持具名导入：

```js
// 导入整个对象
import json from './example.json'
// 对一个根字段使用具名导入 - 有效运用 tree-shaking！
import { field } from './example.json'
```

## Glob 导入

Vite 支持使用特殊的 `import.meta.glob` 函数从文件系统导入多个模块：

```js
const modules = import.meta.globEager('./dir/*.js')
```

以上将会被转译为下面的样子：

```js
// vite 生成的代码
const modules = {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js')
} }
```

你可以遍历 `modules` 对象的 key 值来访问相应的模块：

```js
for (const path in modules) {
  modules[path]().then((mod) => {
    console.log(path, mod)
  })
}
```

匹配到的文件将通过动态导入默认懒加载，并会在构建时分离为独立的 chunk。如果你倾向于直接引入所有的模块（例如依赖于这些模块中的副作用首先被应用），你可以使用 `import.meta.globEager` 代替：

```js
const modules = import.meta.glob('./dir/*.js')
```

以上会被转译为下面的样子：

```js
// vite 生成的代码
const modules = {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js')
}
```

请注意：

- 这只是一个 Vite 独有的功能而不是一个 Web 或 ES 标准
- Glob 必须是相对路径且以 `.` 开头
- Glob 导入只能使用默认导入（无法使用动态导入，也无法使用 `import * as ...`）。

## Web Assembly

预编译的 `.wasm` 文件可以直接被导入 —— 默认导出将会是一个函数，返回值为所导出 wasm 实例对象的 Promise：

```js
import init from './example.wasm'

init().then((exports) => {
  exports.test()
})
```

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

## 构建优化

> 下面所罗列的功能会自动应用为构建过程的一部分，没有必要在配置中显式地声明，除非你想禁用它们。

### 动态导入 Polyfill

Vite 使用 ES 动态导入作为代码分割的断点。生成的代码也会使用动态导入来加载异步 chunk。然而浏览器对原生 ESM 动态导入的功能落地比对 `type="module"` script 块支持要晚，它们两个功能之间存在着浏览器兼容性差异。Vite 自动会生成一个轻量级的 [动态导入 polyfill](https://github.com/GoogleChromeLabs/dynamic-import-polyfill) 来抹平二者差异。

如果你确定你的构建目标只有支持原生动态导入的浏览器，你可以通过 [`build.polyfillDynamicImport`](/zh/config/#build-polyfilldynamicimport) 显式地禁用这个功能。

### CSS 代码分割

Vite 会自动地将一个异步 chunk 模块中使用到的 CSS 代码抽取出来并为其生成一个单独的文件。这个 CSS 文件将在该异步 chunk 加载完成时自动通过一个 `<link>` 标签载入，该异步 chunk 会保证只在 CSS 加载完毕后再执行，避免发生 [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content#:~:text=A%20flash%20of%20unstyled%20content,before%20all%20information%20is%20retrieved.) 。

### 预加载指令生成

Vite 会为入口 chunk 和它们在打包出的 HTML 中的直接引入自动生成 `<link rel="modulepreload">` 指令。

如果你更倾向于将所有的 CSS 抽取到一个文件中，你可以通过设置 [`build.cssCodeSplit`](/zh/config/#build-csscodesplit) 为 `false` 来禁用 CSS 代码分割。

### 异步 Chunk 加载优化

在实际项目中，Rollup 通常会生成 “共用” chunk —— 被两个或以上的其他 chunk 共享的 chunk。与动态导入相结合，会很容易出现下面这种场景：

![graph](/graph.png)

在无优化的情境下，当异步 chunk `A` 被导入时，浏览器将必须请求和解析 `A`，然后它才能弄清楚它首先需要那个共用 chunk `C`。这会导致额外的网络往返：

```
Entry ---> A ---> C
```

Vite 将使用一个预加载步骤自动重写代码，来分割动态导入调用，因而当 `A` 被请求时，`C` 也将 **同时** 被获取到：

```
Entry ---> (A + C)
```

`C` 也可能有更深的导入，在未优化的场景中，这甚至会导致额外网络往返。Vite 的优化将跟踪所有的直接导入，无论导入深度如何，都完全消除不必要的往返。
