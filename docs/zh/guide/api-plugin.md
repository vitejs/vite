# Plugin API

Vite 插件扩展了设计出色的 Rollup 接口，带有一些 vite 独有的配置项。因此，你只需要编写一个 Vite 插件，就可以同时为开发环境和生产环境工作。

**推荐在阅读下面的章节之前，首先阅读下 [Rollup's 插件文档](https://rollupjs.org/guide/en/#plugin-development)**

## 约定

如果插件不使用 Vite 特定的钩子，可以实现为[兼容的 Rollup 插件](#rollup-plugin-compatibility)，推荐使用 [Rollup 插件名称约定](https://rollupjs.org/guide/en/#conventions)。

- Rollup 插件应该有一个带 `rollup-plugin-` 前缀、语义清晰的名称。
- 在 package.json 中包含 `rollup-plugin` 和 `vite-plugin` 关键字。

这样，插件也可以用于纯 Rollup 或基于 WMR 的项目。

对于 Vite 专属的插件：

- Vite 插件应该有一个带 `vite-plugin-` 前缀、语义清晰的名称。
- 在 package.json 中包含 `vite-plugin` 关键字。

如果你的插件只适用于特定的框架，它的名字应该遵循以下前缀格式：

- `vite-plugin-vue-` 前缀作为 Vue 插件
- `vite-plugin-react-` 前缀作为 React 插件
- `vite-plugin-svelte-` 前缀作为 Svelte 插件

## 简单示例

:::tip
通常的惯例是创建一个 Vite/Rollup 插件作为一个返回实际插件对象的工厂函数。该函数可以接受允许用户自定义插件行为的选项。
:::

### 引入一个虚拟文件

```js
export default function myPlugin() {
  const vitualFileId = '@my-virtual-file'

  return {
    name: 'my-plugin', // 必须的，将会显示在 warning 和 error 中
    resolveId(id) {
      if (id === vitualFileId) {
        return vitualFileId
      }
    },
    load(id) {
      if ((id = vitualFileId)) {
        return `export const msg = "from virtual file"`
      }
    }
  }
}
```

这使得可以在 JavaScript 中引入这些文件：

```js
import { msg } from '@my-virtual-file'
console.log(msg)
```

### 转换自定义文件类型

```js
export default function myPlugin() {
  return {
    name: 'transform-file',
    transform(src, id) {
      if (!/\.(my-file-ext)$/.test(id)) {
        return {
          code: compileFileToJS(src),
          map: null // provide source map if available
        }
      }
    }
  }
}
```

## 通用钩子

在开发中，Vite 开发服务器会创建一个插件容器来调用 [Rollup 构建钩子](https://rollupjs.org/guide/en/#build-hooks)，与 Rollup 如出一辙。

以下钩子在服务器启动时被调用：

- [`options`](https://rollupjs.org/guide/en/#options)
- [`buildStart`](https://rollupjs.org/guide/en/#buildstart)

以下钩子会在每个传入模块请求时被调用：

- [`resolveId`](https://rollupjs.org/guide/en/#resolveid)
- [`load`](https://rollupjs.org/guide/en/#load)
- [`transform`](https://rollupjs.org/guide/en/#transform)

以下钩子在服务器关闭时被调用：

- [`buildEnd`](https://rollupjs.org/guide/en/#buildend)
- [`closeBundle`](https://rollupjs.org/guide/en/#closebundle)

请注意 [`moduleParsed`](https://rollupjs.org/guide/en/#moduleparsed) 钩子 **不是** 在开发中被调用的，因为 Vite 为了性能会避免完整的 AST 解析。

[Output Generation Hooks](https://rollupjs.org/guide/en/#output-generation-hooks)（除了 `closeBundle`) **不是** 在开发中被调用的。你可以认为 Vite 的开发服务器只调用了 `rollup.rollup()` 而没有调用 `bundle.generate()`.

## Vite 独有钩子

Vite 插件也可以提供钩子来服务于特定的 Vite 目标。这些钩子会被 Rollup 忽略。

### `config`

- **类型：** `(config: UserConfig) => UserConfig | null | void`
- **种类：** `sync`, `sequential`

  在被解析之前修改 Vite 配置。钩子接收原始用户配置（命令行选项会与配置文件合并）。它可以返回一个将被深度合并到现有配置中的部分配置对象，或者直接改变配置（如果默认的合并不能达到预期的结果）。

  **示例**

  ```js
  // 返回部分配置（推荐）
  const partialConfigPlugin = () => ({
    name: 'return-partial',
    config: () => ({
      alias: {
        foo: 'bar'
      }
    })
  })

  // 直接改变配置（应仅在合并不起作用时使用）
  const mutateConfigPlugin = () => ({
    name: 'mutate-config',
    config(config) {
      config.root = __dirname
    }
  })
  ```

  ::: warning 注意
  用户插件在运行这个钩子之前会被解析，因此在 `config` 钩子中注入其他插件不会有任何效果。
  :::

### `configResolved`

- **类型：** `(config: ResolvedConfig) => void`
- **种类：** `sync`, `sequential`

  在解析 Vite 配置后调用。使用这个钩子读取和存储最终解析的配置。当插件需要根据运行的命令做一些不同的事情时，它也很有用。

  **示例：**

  ```js
  const exmaplePlugin = () => {
    let config

    return {
      name: 'read-config',

      configResolved(resolvedConfig) {
        // 存储最终解析的配置
        config = resolvedConfig
      },

      // 使用其他钩子存储的配置
      transform(code, id) {
        if (config.command === 'serve') {
          // serve: 用于启动开发服务器的插件
        } else {
          // build: 调用 Rollup 的插件
        }
      }
    }
  }
  ```

### `configureServer`

- **类型：** `(server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>`
- **种类：** `async`, `sequential`
- **此外请看** [ViteDevServer](./api-javascript#vitedevserver)

  是用于配置开发服务器的钩子。最常见的用例是在内部 [connect](https://github.com/senchalabs/connect) 应用程序中添加自定义中间件:

  ```js
  const myPlugin = () => ({
    name: 'configure-server',
    configureServer(server) {
      server.app.use((req, res, next) => {
        // custom handle request...
      })
    }
  })
  ```

  **注入后置中间件**

  `configureServer` 钩子将在内部中间件被安装前调用，所以自定义的中间件将会默认会比内部中间件早运行。如果你想注入一个在内部中间件 **之后** 运行的中间件，你可以从 `configureServer` 返回一个函数，将会在内部中间件安装后被调用：

  ```js
  const myPlugin = () => ({
    name: 'configure-server',
    configureServer(server) {
      // 返回一个在内部中间件安装后被调用的后置钩子
      return () => {
        server.app.use((req, res, next) => {
          // 自定义请求处理...
        })
      }
    }
  })
  ```

  **存储服务器访问**

  在某些情况下，其他插件钩子可能需要访问开发服务器实例（例如访问 websocket 服务器、文件系统监视程序或模块图）。这个钩子也可以用来存储服务器实例以供其他钩子访问:

  ```js
  const myPlugin = () => {
    let server
    return {
      name: 'configure-server',
      configureServer(_server) {
        server = _server
      },
      transform(code, id) {
        if (server) {
          // use server...
        }
      }
    }
  }
  ```

  注意 `configureServer` 在运行生产版本时不会被调用，所以其他钩子需要注意防止它的缺失。

### `transformIndexHtml`

- **类型：** `IndexHtmlTransformHook | { enforce?: 'pre' | 'post' transform: IndexHtmlTransformHook }`
- **种类：** `async`, `sequential`

  转换 `index.html` 的专用钩子。钩子接收当前的 HTML 字符串和转换上下文。上下文在开发期间暴露[`ViteDevServer`](./api-javascript#ViteDevServer)实例，在构建期间暴露 Rollup 输出的包。

  这个钩子可以是异步的，并且可以返回以下其中之一:

  - 经过转换的 HTML 字符串
  - 注入到现有 HTML 中的标签描述符对象数组（`{ tag, attrs, children }`）。每个标签也可以指定它应该被注入到哪里（默认是在 `<head>` 之前）
  - 一个包含 `{ html, tags }` 的对象

  **Basic Example**

  ```js
  const htmlPlugin = () => {
    return {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          /<title>(.*?)<\/title>/,
          `<title>Title replaced!</title>`
        )
      }
    }
  }
  ```

  **完整钩子签名：**

  ```ts
  type IndexHtmlTransformHook = (
    html: string,
    ctx: {
      path: string
      filename: string
      server?: ViteDevServer
      bundle?: import('rollup').OutputBundle
      chunk?: import('rollup').OutputChunk
    }
  ) =>
    | IndexHtmlTransformResult
    | void
    | Promise<IndexHtmlTransformResult | void>

  type IndexHtmlTransformResult =
    | string
    | HtmlTagDescriptor[]
    | {
        html: string
        tags: HtmlTagDescriptor[]
      }

  interface HtmlTagDescriptor {
    tag: string
    attrs?: Record<string, string>
    children?: string | HtmlTagDescriptor[]
    /**
     * 默认： 'head-prepend'
     */
    injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend'
  }
  ```

### `handleHotUpdate`

- **类型：** `(ctx: HmrContext) => Array<ModuleNode> | void | Promise<Array<ModuleNode> | void>`

  执行自定义 HMR 更新处理。钩子接收一个带有以下签名的上下文对象:

  ```ts
  interface HmrContext {
    file: string
    timestamp: number
    modules: Array<ModuleNode>
    read: () => string | Promise<string>
    server: ViteDevServer
  }
  ```

  - `modules` 是受更改文件影响的模块数组。它是一个数组，因为单个文件可能映射到多个服务模块（例如 Vue 单文件组件）。

  - `read` 这是一个异步读函数，它返回文件的内容。之所以这样做，是因为在某些系统上，文件更改的回调函数可能会在编辑器完成文件更新之前过快地触发，并 `fs.readFile` 直接会返回空内容。传入的 `read` 函数规范了这种行为。

  钩子可以选择:

  - 过滤和缩小受影响的模块列表，使 HMR 更准确。

  - 返回一个空数组，并通过向客户端发送自定义事件来执行完整的自定义 HMR 处理:

    ```js
    handleHotUpdate({ server }) {
      server.ws.send({
        type: 'custom',
        event: 'special-update',
        data: {}
      })
      return []
    }
    ```

    客户端代码应该使用 [HMR API](./api-hmr) 注册相应的处理器（这应该被被相同插件的 `transform` 钩子注入）：

    ```js
    if (import.meta.hot) {
      import.meta.hot.on('special-update', (data) => {
        // 执行自定义更新
      })
    }
    ```

## 插件顺序

一个 Vite 插件可以额外指定一个 `enforce` 属性（类似于 webpack 加载器）来调整它的应用顺序。`enforce` 的值可以是`pre` 或 `post`。解析后的插件将按照以下顺序排列:

- Alias
- 带有 `enforce: 'pre'` 的用户插件
- Vite 内置插件
- 没有 enforce 值的用户插件
- Vite 构建用的插件
- 带有 `enforce: 'post'` 的用户插件

## Rollup 插件兼容性

相当数量的 Rollup 插件将直接作为 Vite 插件工作（例如：`@rollup/plugin-alias` 或 `@rollup/plugin-json`），但并不是所有的，因为有些插件钩子在非构建式的开发服务器上下文中没有意义。

一般来说，只要一个 Rollup 插件符合以下标准，那么它应该只是作为一个 Vite 插件:

- 没有使用 [`moduleParsed`](https://rollupjs.org/guide/en/#moduleparsed) 钩子。
- 它在打包钩子和输出钩子之间没有很强的耦合。

如果一个 Rollup 插件只在构建阶段有意义，则在 `build.rollupOptions.plugins` 下指定即可。

你也可以用 Vite 独有的属性来扩展现有的 Rollup 插件:

```js
// vite.config.js
import example from 'rollup-plugin-example'
export default {
  plugins: [
    {
      ...example(),
      enforce: 'post',
      apply: 'build'
    }
  ]
}
```

查看 [Vite Rollup 插件](https://vite-rollup-plugins.patak.dev) 获取兼容的官方 rollup 插件列表及其使用指南。

## 路径规范化

Vite 会在解析 id 时使用 POSIX 分隔符（ / ）标准化路径，同时也适用于 Windows 的分卷。而另一方面，Rollup 在默认情况下保持解析的路径不变，因此解析的 id 在 Windows 中会使用 win32 分隔符（ \\ ）。然而，Rollup 插件会从 `@rollup/pluginutils` 中使用一个 [`normalizePath` 工具函数](https://github.com/rollup/plugins/tree/master/packages/pluginutils#normalizepath)，它在执行比较之前将分隔符转换为 POSIX。所以意味着当这些插件在 Vite 中使用时，`include` 和 `exclude` 两个配置模式，以及与已解析路径比较相似的路径会正常工作。

所以对于 Vite 插件来说，在将路径与已解析的 id 进行比较时，首先规范化路径以使用 POSIX 分隔符是很重要的。从 `vite` 模块中也导出了一个等效的 `normalizePath` 工具函数。

```js
import { normalizePath } from 'vite'
normalizePath('foo\\bar') // 'foo/bar'
normalizePath('foo/bar') // 'foo/bar'
```
