# 配置 Vite

## 配置文件

### 配置文件解析

当以命令行方式运行 `vite` 时，Vite 会自动解析 [项目根目录](/zh/guide/#project-root) 下名为 `vite.config.js` 的文件。

最基础的配置文件是这样的：

```js
// vite.config.js
export default {
  // 配置选项
}
```

注意，即使项目没有在 `package.json` 中开启 `type: "module"` ，Vite 也支持在配置文件中使用 ESM 语法。在这种情况下，配置文件是在加载之前自动预处理的。

你可以显式地通过 `--config` 命令行选项指定一个配置文件（解析会相对于 `cwd` 路径）

```bash
vite --config my-config.js
```

### 配置智能提示

因为 Vite 本身附带 Typescript 类型，所以你可以通过 IDE 和 jsdoc 的配合来进行智能提示：

```js
/**
 * type {import('vite').UserConfig}
 */
export default {
  // ...
}
```

Vite 同样支持 TS 配置文件。你可以直接使用 `vite.config.ts`：

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  // ...
})
```

### 场景配置

如果配置文件需要基于命令（`serve` 或 `build`）或者不同场景与 [模式](/zh/guide/env-and-mode) 来决定选项，可以选择导出这样一个函数：

```js
export default ({ command, mode }) => {
  if (command === 'serve') {
    return {
      // serve 独有配置
    }
  } else {
    return {
      // build 独有配置
    }
  }
}
```

## 共享配置

### alias

- **类型：**
  `Record<string, string> | Array<{ find: string | RegExp, replacement: string }>`

  将会被传递到 `@rollup/plugin-alias` 作为它的 [entries](https://github.com/rollup/plugins/tree/master/packages/alias#entries)。也可以是一个对象，或一个 `{ find, replacement }` 的数组.

  更高级的自定义解析方法可以通过 [插件](/zh/guide/api-plugin) 实现。

### define

- **类型：** `Record<string, string>`

  定义全局变量替换。在开发期间，entries 将被定义为全局变量，在构建期间被静态替换。

### root

- **类型：** `string`
- **默认：** `process.cwd()`

  项目根目录。可以是一个绝对路径，或者一个相对于该配置文件本身的路径。

  更多细节请见 [项目根目录](/zh/guide/#项目根目录)。

### mode

- **Type:** `string`
- **Default:** `'development'` for serve, `'production'` for build

  在配置中特别指定将会替换掉 serve 和 build 时的默认模式。还可以通过命令行选项 `--mode` 覆写该值。

  更多细节请见 [环境变量与模式](/zh/guide/env-and-mode)。

### plugins

- **类型：** ` (Plugin | Plugin[])[]`

  要使用的插件数组。

  获取关于 Vite 插件的更多细节请见 [插件 API](/zh/guide/api-plugin) 。

### css.modules

- **类型：**

  ```ts
  interface CSSModulesOptions {
    scopeBehaviour?: 'global' | 'local'
    globalModulePaths?: string[]
    generateScopedName?:
      | string
      | ((name: string, filename: string, css: string) => string)
    hashPrefix?: string
    /**
     * 默认：'camelCaseOnly'
     */
    localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly'
  }
  ```

  配置 CSS modules 的行为。选项将被传递给 [postcss-modules](https://github.com/css-modules/postcss-modules)。

### css.preprocessorOptions

- **类型：** `Record<string, object>`

  指定传递给 CSS 预处理器的选项。例如:

  ```js
  export default {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `$injectedColor: orange;`
        }
      }
    }
  }
  ```

### esbuild

- **类型：** `ESBuildOptions | false`

  `ESBuildOptions` 继承自 [esbuild 转换选项](https://esbuild.github.io/api/#transform-api)。最常见的用例是自定义 JSX：

  ```js
  export default {
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment'
    }
  }
  ```

  默认情况下，ESbuild 应用在 `ts`、`jsx`、`tsx` 文件。你可以通过 `esbuild.include` 和 `esbuild.exclude` 对其进行配置，它们两个配置的类型是`string | RegExp | (string | RegExp)[]`。

  设置成 `false` 可以禁用 ESbuild 转换（默认应用于 `.ts`. `.tsx` 和 `.jsx` 文件）。

  此外，你还可以通过`esbuild.jsxInject`来自动为每一个被 ESbuild 转换的文件注入 JSX helper。

  ```js
  export default {
    esbuild: {
      jsxInject: `import React from 'react'`
    }
  }
  ```

### assetsInclude

- **类型：** `string | RegExp | (string | RegExp)[]`
- **相关内容：** [Asset Handling](/zh/guide/features#asset-handling)

  指定其他文件类型作为静态资源处理（这样导入它们就会返回解析后的 URL）

### transformInclude

- **类型：** `string | RegExp | (string | RegExp)[]`

  默认情况下，代码中所有静态可分析的 `import` 请求都会被静态地视为转换管道的一部分。当然，如果你使用动态导入来导入非 js 类型的文件，例如:

  ```js
  // dynamicPath 是一个非 JS 文件类型，例如 "./foo.gql"
  import(dynamicPath).then(/* ... */)
  ```

  Vite 无法知道文件需要被转换为 JavaScript（还是直接被视为静态文件提供服务）。`transfromInclude` 配置项允许你显式地声明文件类型，让它始终被转换或者当成 JavaScript 进行服务。

### dedupe

- **类型：** `string[]`

  如果你在你的应用程序中有相同依赖的副本（比如 monorepos），使用这个选项来强制 Vite 总是将列出的依赖关系解析到相同的副本（从项目根目录)。

### logLevel

- **类型：** `'info' | 'warn' | 'error' | 'silent'`

  调整控制台输出的级别，默认为 `'info'`.

## Server Options

### server.host

- **类型：** `string`

  指定服务器主机名

### server.port

- **类型：** `number`

  指定服务器端口。注意：如果端口已经被使用，Vite 会自动尝试下一个可用的端口，所以这可能不是服务器最终监听的实际端口。

### server.https

- **类型：** `boolean | https.ServerOptions`

  启用 TLS + HTTP/2。注意当 [`server.proxy` option](#server-proxy) 也被使用时，将会仅使用 TLS。

  这个值也可以是一个传递给 `https.createServer()` 的 [选项对象](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener)。

### server.open

- **类型：** `boolean`

  在服务器启动时自动在浏览器中打开应用程序。

### server.proxy

- **类型：** `Record<string, string | ProxyOptions>`

  为开发服务器配置自定义代理规则。期望接收一个 `{ key: options }` 对象。使用 [`http-proxy`](https://github.com/http-party/node-http-proxy)。完整选项详见 [此处](https://github.com/http-party/node-http-proxy#options).

  **示例：**

  ```js
  export default {
    server: {
      proxy: {
        // 字符串简写写法
        '/foo': 'http://localhost:4567/foo',
        // 选项写法
        '/api': {
          target: 'http://jsonplaceholder.typicode.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
  ```

### server.cors

- **类型：** `boolean | CorsOptions`

  为开发服务器配置 CORS。默认启用并允许任何源，传递一个 [选项对象](https://github.com/expressjs/cors) 来调整行为或设为 `false` 表示禁用。

### server.force

- **类型：** `boolean`
- **相关内容：** [Dependency Pre-Bundling](/zh/guide/dep-pre-bundling)

  设置为 `true` 强制使依赖预构建。

### server.hmr

- **类型：** `boolean | { protocol?: string, host?: string, port?: number, path?: string, timeout?: number, overlay?: boolean }`

  禁用或配置 HMR 连接（用于 HMR websocket 必须使用不同的 http 服务器地址的情况）。

  设置 `server.hmr.overlay` 为 `false` 可以禁用服务器错误遮罩层。

### server.watch

- **类型：** `object`

  传递给 [chokidar](https://github.com/paulmillr/chokidar#api) 的文件系统监视器选项。

## Build Options

### build.base

- **类型：** `string`
- **默认：** `/`

  在生产环境中的 public base 路径。注意，路径应该以 `/` 开头和结尾。查看 [public base 路径](/zh/guide/build#public-base-path) 来获取更多细节。

### build.target

- **类型：** `string`
- **默认：** `es2020`
- **相关内容：:** [浏览器兼容性](/zh/guide/build#browser-compatibility)

  设置构建后浏览器兼容的 ES 版本。转换过程将会由 esbuild 执行，最低目标支持 `es2015`。目标也可以是带有浏览器的版本，例如 `chrome58` 或 `safari11`，或由多个目标组成的一个数组。

  注意，如果代码包含不能被 `esbuild` 安全地编译的特性，那么构建将会失败。查看 [esbuild 文档](https://esbuild.github.io/api/#target) 获取更多细节。

### build.outDir

- **类型：** `string`
- **默认：** `dist`

  指定输出路径（相对于 [项目根目录](/zh/guide/#项目根目录)).

### build.assetsDir

- **类型：** `string`
- **默认：** `assets`

  指定生成静态资源的存放路径（相对于 `build.outDir`）。

### build.assetsInlineLimit

- **类型：** `number`
- **默认：** `4096` (4kb)

  小于此阈值的导入或引用资源将内联为 base64 编码，以避免额外的 http 请求。设置为 `0` 可以完全禁用此项。

### build.cssCodeSplit

- **类型：** `boolean`
- **默认：** `true`

  启用/禁用 CSS 代码拆分。当启用时，在异步 chunk 中导入的 CSS 将内联到异步 chunk 本身，并在块加载时插入。

  如果禁用，整个项目中的所有 CSS 将被提取到一个 CSS 文件中。

### build.sourcemap

- **类型：** `boolean`
- **默认：** `false`

  构建后是否生成 source map 文件。

### build.rollupOptions

- **类型：** [`RollupOptions`](https://rollupjs.org/guide/en/#big-list-of-options)

  自定义底层的 Rollup 打包配置。这与从 Rollup 配置文件导出的选项相同，并将与 Vite 的内部 Rollup 选项合并。查看 [Rollup 选项文档](https://rollupjs.org/guide/en/#big-list-of-options) 获取更多细节。

### build.lib

- **类型：** `{ entry: string, name?: string, formats?: ('es' | 'cjs' | 'umd' | 'iife')[] }`
- **相关内容：** [Library Mode](/zh/guide/build#库模式)

  构建为库。`entry` 是必须的因为库不可以使用 HTML 作为入口。`name` 则是暴露的全局变量，并且在 `formats` 包含 `'umd'` 或 `'iife'` 时是必须的。默认 `formats` 是 `['es', 'umd']`。

### build.manifest

- **类型：** `boolean`
- **默认：** `false`
- **相关内容：** [后端集成](/zh/guide/backend-integration)

  当设置为 `true`，构建后将会生成 `manifest.json` 文件，映射没有被 hash 的资源文件名和它们的 hash 版本。可以为一些服务器框架渲染时提供正确的资源引入链接。

### build.minify

- **类型：** `boolean | 'terser' | 'esbuild'`
- **默认：** `'terser'`

  设置为 `false` 可以禁用最小化混淆，或是用来指定使用哪种混淆器。默认为 [Terser](https://github.com/terser/terser)，虽然 Terser 相对较慢，但大多数情况下构建后的文件体积更小。ESbuild 最小化混淆更快但构建后的文件相对更大。

### build.terserOptions

- **类型：** `TerserOptions`

  传递给 Terser 的更多 [minify 选项](https://terser.org/docs/api-reference#minify-options)。

### build.write

- **类型：** `boolean`
- **默认：** `true`

  设置为 `false` 来禁用将构建后的文件写入磁盘。这常用于 [编程式地调用 `build()`](/zh/guide/api-javascript#build) 在写入磁盘之前，需要对构建后的文件进行进一步处理。

## 依赖优化选项

- **相关内容：** [Dependency Pre-Bundling](/zh/guide/dep-pre-bundling)

### optimizeDeps.include

- **类型：** `string[]`

  在预构建中强制包含的依赖项。

### optimizeDeps.exclude

- **类型：** `string[]`

  在预构建中强制排除的依赖项。

### optimizeDeps.link

- **类型：** `string[]`

  在预构建中显式地将依赖项视为链接源。注意 Vite 2.0 会自动检测 “链接包”（解析后路径不在 `node_modules` 内依赖的)，所以只有在极少数情况下才需要这样做。

### optimizeDeps.allowNodeBuiltins

- **类型：** `string[]`

  一个导入节点内置组件的依赖项列表，但在浏览器中并不实际使用它们。会抑制相关的警告。

  A list of dependencies that imports Node built-ins, but do not actually use them in browsers. Suppresses related warnings.

### optimizeDeps.auto

- **类型：** `boolean`
- **默认：** `true`

  服务器启动时自动运行依赖预构建。若设置为 `false` 则禁用。
