# 服务端渲染

Vite 为服务端渲染（SSR）提供了内建支持。

:::tip 注意
SSR 特别指支持在 Node.js 中运行相同应用程序的前端框架（例如 React、Preact、Vue 和 Svelte），将其预渲染成 HTML，最后在客户端进行脱水化处理。如果你正在寻找与传统服务器端框架的集成，请查看 [后端集成指南](./backend-integration)。

下面的指南还假定您在选择的框架中有使用 SSR 的经验，并且只关注特定于 vite 的集成细节。
:::

## 示例项目

这里的 Vite 范例包含了 Vue 3 和 React 的 SSR 设置示例，可以作为本指南的参考:

- [Vue 3](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue)
- [React](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-react)

## 源代码结构

一个典型的 SSR 应用应该有如下的源文件结构：

```
- index.html
- src/
  - main.js          # 导出环境无关的（通用的）应用代码
  - entry-client.js  # 将应用挂载到一个 DOM 元素上
  - entry-server.js  # 使用框架的 SSR API 渲染该应用
```

`index.html` 将需要引用 `entry-client.js` 并包含一个占位标记供给服务端渲染时注入：

```html
<div id="app"><!--app-html--></div>
<script type="module" src="/src/entry-client.js"></script>
```

你可以使用任何你喜欢的占位标记来替代 `<!--app-html-->`，只要它能够被正确替换。

:::tip
如果需要基于 SSR 和 client 执行条件逻辑，可以使用 `import.meta.env.SSR`。这是在构建过程中被静态替换的，因此它将允许对未使用的分支进行摇树优化。
:::

## 设置开发服务器

在构建 SSR 应用程序时，您可能希望完全控制主服务器，并将 Vite 与生产环境解耦。因此，建议在中间件模式下使用 Vite。下面是一个关于 [express](https://expressjs.com/) 的例子：

**server.js**

```js{18-20}
const fs = require('fs')
const path = require('path')
const express = require('express')
const { createServer: createViteServer } = require('vite')

async function createServer() {
  const app = express()

  // 以中间件模式创建 vite 应用，这将禁用 Vite 自身的 HTML 服务逻辑
  // 并让上级服务器接管控制
  const vite = await createViteServer({
    server: { middlewareMode: true }
  })
  // 使用 vite 的 Connect 实例作为中间件
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    // 服务 index.html - 下面我们来处理这个问题
  })

  app.listen(3000)
}

createServer()
```

这里 `vite` 是 [ViteDevServer](./api-javascript#vitedevserver) 的一个实例。`vite.middlewares` 是一个 [Connect](https://github.com/senchalabs/connect) 实例，它可以在任何一个兼容 connect 的 Node.js 框架中被用作一个中间件。

下一步是实现 `*` 处理程序供给服务端渲染的 HTML：

```js
app.use('*', async (req, res) => {
  const url = req.originalUrl

  try {
    // 1. 读取 index.html
    let template = fs.readFileSync(
      path.resolve(__dirname, 'index.html'),
      'utf-8'
    )

    // 2. 应用 vite HTML 转换。这将会注入 vite HMR 客户端，and
    //    同时也会从 Vite 插件应用 HTML 转换。
    //    例如：@vitejs/plugin-react-refresh 中的 global preambles
    template = await vite.transformIndexHtml(url, template)

    // 3. 加载服务器入口。vite.ssrLoadModule 将自动转换
    //    你的 ESM 源代码将在 Node.js 也可用了！无需打包
    //    并提供类似 HMR 的根据情况随时失效。
    const { render } = await vite.ssrLoadModule('/src/entry-server.js')

    // 4. 渲染应用的 HTML。这架设 entry-server.js 的导出 `render`
    //    函数调用了相应 framework 的 SSR API。
    //    例如 ReacDOMServer.renderToString()
    const appHtml = await render(url)

    // 5. 注入应用渲染的 HTML 到模板中。
    const html = template.replace(`<!--ssr-outlet-->`, appHtml)

    // 6. 将渲染完成的 HTML 返回
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    // 如果捕获到了一个错误，让 vite 来修复该堆栈，这样它就可以映射回
    // 你的实际源代码中。
    vite.ssrFixStacktrace(e)
    console.error(e)
    res.status(500).end(e.message)
  }
})
```

`package.json` 中的 `dev` 脚本也应该相应地改变，使用服务器脚本：

```diff
  "scripts": {
-   "dev": "vite"
+   "dev": "node server"
  }
```

## 生产环境构建

为了将 SSR 项目交付生产，我们需要：

1. 正常生成一个客户端构建；
2. 再生成一个 SSR 构建，可以通过 `require()` 直接加载因此我们无需再经过 Vite 的 `ssrLoadModule`;

`package.json` 中的脚本应该看起来像这样：

```json
{
  "scripts": {
    "dev": "node server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.js "
  }
}
```

注意使用 `--ssr` 标志表明这将会是一个 SSR 构建。它也应该能指明 SSR 入口。

接着，在 `server.js` 中，通过检出 `process.env.NODE_ENV` 我们需要添加一些生产环境特定的逻辑：

- 取而代之的是使用 `dist/client/index.html` 作为模板而不是读取根目录的 `index.html`，因为它包含了到客户端构建的正确资源链接。

- 取而代之的是使用 `require('./dist/server/entry-server.js')` 而不是 `await vite.ssrLoadModule('/src/entry-server.js')`（该文件是 SSR 构建的最终结果）。

- 将 `vite` 开发服务器的创建和所有使用都移到 dev-only 条件分支后面，然后添加静态文件服务中间件来服务 `dist/client` 中的文件。

可以在此参考 [Vue](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue) 和 [React](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-react) 的启动范例。

### 生成预加载指令

> 此章节仅对 Vue 适用。

`@vitejs/plugin-vue` 将自动注册在向关联的 Vue SSR 上下文呈现请求期间实例化的组件模块 ID。这个信息可以用来推断异步 chunk 和资源，应该为给定的路由预加载。

为了利用这一点，添加 `--ssrManifest` 标志到客户端构建脚本（是的，从客户端构建生成 SSR 清单，因为我们希望将模块 ID 映射到客户端文件）：

```diff
- "build:client": "vite build --outDir dist/client",
+ "build:client": "vite build --outDir dist/client --ssrManifest",
```

这将生成一个 `dist/client/ssr-manifest.json` 文件，它包含了模块 ID 到它们关联的 chunk 和资源文件的映射。

接下来，在 `src/entry-server.js` 中：

```js
const ctx = {}
const html = await renderToString(app, ctx)
// ctx.modules 现在是一个渲染期间使用的模块 ID 的 Set
```

我们现在需要读取该清单并将其传递到 `src/entry-server.js` 导出的 `render` 函数中，如此我们就有了足够的信息，来为被异步路由使用的文件渲染预加载指令！查看 [示例代码](https://github.com/vitejs/vite/blob/main/packages/playground/ssr-vue/src/entry-server.js) 查看完整示例。

## 预渲染 / SSG

如果预先知道某些路由所需的路由和数据，我们可以使用与生产环境 SSR 相同的逻辑将这些路由预先渲染到静态 HTML 中。这也被称为静态站点生成（SSG）。查看 [示例渲染代码](https://github.com/vitejs/vite/blob/main/packages/playground/ssr-vue/prerender.js) 查看有效示例。

## 启发式外部化

许多依赖都附带 ESM 和 CommonJS 文件。当运行 SSR 时，提供 CommonJS 构建的依赖关系可以从 Vite 的 SSR 转换/模块系统进行 “外部化”，从而加速开发和构建。例如，并非去拉取 React 的预构建的 ESM 版本然后将其转换回 Node.js 兼容版本，用 `require('react')` 代替会更有效。它还大大提高了 SSR 包构建的速度。

Vite 基于以下启发式执行自动化的 SSR 外部化:

- 如果一个依赖的解析 ESM 入口点和它的默认 Node 入口点不同，它的默认 Node 入口可能是一个可以外部化的 CommonJS 构建。例如，`vue` 将被自动外部化，因为它同时提供 ESM 和 CommonJS 构建。

- 否则，Vite 将检查包的入口点是否包含有效的 ESM 语法 - 如果不包含，这个包可能是 CommonJS，将被外部化。例如，`react-dom` 将被自动外部化，因为它只指定了唯一的一个 CommonJS 格式的入口。

如果这个启发式导致了错误，你可以通过 `ssr.external` 和 `ssr.noExternal` 配置项手动调整。

在未来，这个启发式将可能得到改进，使其也能够外部化兼容 Node 的 ESM 构建依赖。（并在 SSR 模块加载时使用 `import()` 引入它们）。

## SSR 专有插件逻辑

一些框架，如 Vue 或 Svelte，会根据客户端渲染和服务端渲染的区别，将组件编译成不同的格式。可以向以下的插件钩子中，给 Vite 传递额外的 `ssr` 参数来支持根据情景转换：

- `resolveId`
- `load`
- `transform`

**示例：**

```js
export function mySSRPlugin() {
  return {
    name: 'my-ssr',
    transform(code, id, ssr) {
      if (ssr) {
        // 执行 ssr 专有转换...
      }
    }
  }
}
```
