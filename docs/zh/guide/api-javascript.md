# JavaScript API

Vite 的 JavaScript API 是完全类型化的，我们推荐使用 TypeScript 或者在 VSCode 中启用 JS 类型检查来利用智能提示和类型校验。

## `createServer`

**类型签名**

```ts
async function createServer(inlineConfig?: InlineConfig): Promise<ViteDevServer>
```

**使用示例**

```js
const { createServer } = require('vite')
;async () => {
  const server = await createServer({
    // 任何合法的用户配置选项，加上 `mode` 和 `configFile`
    configFile: false,
    root: __dirname,
    server: {
      port: 1337
    }
  })
  await server.listen()
}
```

## `InlineConfig`

`InlineConfig` 接口扩展了 `UserConfig` 并添加了以下属性：

- `mode`：覆盖默认的模式 (开发服务器使用 `'development'`)
- `configFile`：指明要使用的配置文件。如果没有设置，Vite 将尝试从项目根目录自动解析。设置为 `false` 可以禁用自动解析功能。

## `ViteDevServer`

```ts
interface ViteDevServer {
  /**
   * 被解析的 vite 配置对象
   */
  config: ResolvedConfig
  /**
   * 链接应用实例
   * 这也可以用作自定义 http 服务器的处理函数
   * https://github.com/senchalabs/connect#use-middleware
   */
  app: Connect.Server
  /**
   * 本机 node http 服务器实例
   */
  httpServer: http.Server
  /**
   * chokidar 监听器实例
   * https://github.com/paulmillr/chokidar#api
   */
  watcher: FSWatcher
  /**
   * web socket 服务器，带有 `send(payload)` 方法
   */
  ws: WebSocketServer
  /**
   * Rollup 插件容器，可以针对给定文件运行插件钩子
   */
  pluginContainer: PluginContainer
  /**
   * 跟踪导入关系、url 到文件映射和 hmr 状态的模块图。
   */
  moduleGraph: ModuleGraph
  /**
   * 以代码方式解析、加载和转换 url 并获取结果
   * 而不需要通过 http 请求管道。
   */
  transformRequest(url: string): Promise<TransformResult | null>
  /**
   * 使用 esbuild 转换文件的工具函数。对于某些插件是有用的。
   */
  transformWithEsbuild(
    code: string,
    filename: string,
    options?: EsbuildTransformOptions,
    inMap?: object
  ): Promise<EsbuildTransformResult>
  /**
   * 启动服务器
   */
  listen(port?: number): Promise<ViteDevServer>
  /**
   * 停止服务器
   */
  close(): Promise<void>
}
```

## `build`

**类型校验**

```ts
async function build(
  inlineConfig?: InlineConfig
): Promise<RollupOutput | RollupOutput[]>
```

**使用示例**

```js
const path = require('path')
import { build } from 'vite' const { build } = require('vite')
;async () => {
  await build({
    root: path.resolve(__dirname, './project'),
    build: {
      base: '/foo/',
      rollupOptions: {
        // ...
      }
    }
  })
}
```

## `resolveConfig`

**类型校验**

```ts
async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve'
): Promise<ResolvedConfig>
```
