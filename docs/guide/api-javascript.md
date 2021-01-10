# JavaScript API

Vite's JavaScript APIs are fully typed, and it's recommended to use TypeScript or enable JS type checking in VSCode to leverage the intellisense and validation.

## `createServer`

**Type Signature**

```ts
async function createServer(inlineConfig?: InlineConfig): Promise<ViteDevServer>
```

**Example Usage**

```js
const { createServer } = require('vite')

;(async () => {
  const server = await createServer({
    // any valid user config options, plus `mode` and `configFile`
    configFile: false,
    root: __dirname,
    server: {
      port: 1337
    }
  })
  await server.listen()
})()
```

## `InlineConfig`

The `InlineConfig` interface extends `UserConfig` with additional properties:

- `mode`: override default mode (`'development'` for server)
- `configFile`: specify config file to use. If not set, Vite will try to automatically resolve one from project root. Set to `false` to disable auto resolving.

## `ViteDevServer`

```ts
interface ViteDevServer {
  /**
   * The resolved vite config object
   */
  config: ResolvedConfig
  /**
   * connect app instance
   * This can also be used as the handler function of a custom http server
   * https://github.com/senchalabs/connect#use-middleware
   */
  app: Connect.Server
  /**
   * native Node http server instance
   */
  httpServer: http.Server
  /**
   * chokidar watcher instance
   * https://github.com/paulmillr/chokidar#api
   */
  watcher: FSWatcher
  /**
   * web socket server with `send(payload)` method
   */
  ws: WebSocketServer
  /**
   * Rollup plugin container that can run plugin hooks on a given file
   */
  pluginContainer: PluginContainer
  /**
   * Module graph that tracks the import relationships, url to file mapping
   * and hmr state.
   */
  moduleGraph: ModuleGraph
  /**
   * Programmatically resolve, load and transform a URL and get the result
   * without going through the http request pipeline.
   */
  transformRequest(url: string): Promise<TransformResult | null>
  /**
   * Util for transforming a file with esbuild.
   * Can be useful for certain plugins.
   */
  transformWithEsbuild(
    code: string,
    filename: string,
    options?: EsbuildTransformOptions,
    inMap?: object
  ): Promise<EsbuildTransformResult>
  /**
   * Start the server.
   */
  listen(port?: number): Promise<ViteDevServer>
  /**
   * Stop the server.
   */
  close(): Promise<void>
}
```

## `build`

**Type Signature**

```ts
async function build(
  inlineConfig?: InlineConfig
): Promise<RollupOutput | RollupOutput[]>
```

**Example Usage**

```js
const path = require('path')
const { build } = require('vite')

;(async () => {
  await build({
    root: path.resolve(__dirname, './project'),
    build: {
      base: '/foo/',
      rollupOptions: {
        // ...
      }
    }
  })
})()
```

## `resolveConfig`

**Type Signature**

```ts
async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve'
): Promise<ResolvedConfig>
```
