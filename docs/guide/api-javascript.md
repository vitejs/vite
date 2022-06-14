# JavaScript API

Vite's JavaScript APIs are fully typed, and it's recommended to use TypeScript or enable JS type checking in VS Code to leverage the intellisense and validation.

## `createServer`

**Type Signature:**

```ts
async function createServer(inlineConfig?: InlineConfig): Promise<ViteDevServer>
```

**Example Usage:**

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

  server.printUrls()
})()
```

::: tip NOTE
When using `createServer` and `build` in the same Node.js process, both functions rely on `process.env.`<wbr>`NODE_ENV` to work properly, which also depends on the `mode` config option. To prevent conflicting behavior, set `process.env.`<wbr>`NODE_ENV` or the `mode` of the two APIs to `development`. Otherwise, you can spawn a child process to run the APIs separately.
:::

## `InlineConfig`

The `InlineConfig` interface extends `UserConfig` with additional properties:

- `configFile`: specify config file to use. If not set, Vite will try to automatically resolve one from project root. Set to `false` to disable auto resolving.
- `envFile`: Set to `false` to disable `.env` files.

## `ViteDevServer`

```ts
interface ViteDevServer {
  /**
   * The resolved Vite config object.
   */
  config: ResolvedConfig
  /**
   * A connect app instance
   * - Can be used to attach custom middlewares to the dev server.
   * - Can also be used as the handler function of a custom http server
   *   or as a middleware in any connect-style Node.js frameworks.
   *
   * https://github.com/senchalabs/connect#use-middleware
   */
  middlewares: Connect.Server
  /**
   * Native Node http server instance.
   * Will be null in middleware mode.
   */
  httpServer: http.Server | null
  /**
   * Chokidar watcher instance.
   * https://github.com/paulmillr/chokidar#api
   */
  watcher: FSWatcher
  /**
   * Web socket server with `send(payload)` method.
   */
  ws: WebSocketServer
  /**
   * Rollup plugin container that can run plugin hooks on a given file.
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
  transformRequest(
    url: string,
    options?: TransformOptions
  ): Promise<TransformResult | null>
  /**
   * Apply Vite built-in HTML transforms and any plugin HTML transforms.
   */
  transformIndexHtml(url: string, html: string): Promise<string>
  /**
   * Load a given URL as an instantiated module for SSR.
   */
  ssrLoadModule(
    url: string,
    options?: { fixStacktrace?: boolean }
  ): Promise<Record<string, any>>
  /**
   * Fix ssr error stacktrace.
   */
  ssrFixStacktrace(e: Error): void
  /**
   * Start the server.
   */
  listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
  /**
   * Restart the server.
   *
   * @param forceOptimize - force the optimizer to re-bundle, same as --force cli flag
   */
  restart(forceOptimize?: boolean): Promise<void>
  /**
   * Stop the server.
   */
  close(): Promise<void>
}
```

## `build`

**Type Signature:**

```ts
async function build(
  inlineConfig?: InlineConfig
): Promise<RollupOutput | RollupOutput[]>
```

**Example Usage:**

```js
const path = require('path')
const { build } = require('vite')

;(async () => {
  await build({
    root: path.resolve(__dirname, './project'),
    base: '/foo/',
    build: {
      rollupOptions: {
        // ...
      }
    }
  })
})()
```

## `preview`

**Type Signature:**

```ts
async function preview(inlineConfig?: InlineConfig): Promise<PreviewServer>
```

**Example Usage:**

```js
const { preview } = require('vite')

;(async () => {
  const previewServer = await preview({
    // any valid user config options, plus `mode` and `configFile`
    preview: {
      port: 8080,
      open: true
    }
  })

  previewServer.printUrls()
})()
```

## `resolveConfig`

**Type Signature:**

```ts
async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
  defaultMode?: string
): Promise<ResolvedConfig>
```

The `command` value is `serve` in dev (in the cli `vite`, `vite dev`, and `vite serve` are aliases).

## `transformWithEsbuild`

**Type Signature:**

```ts
async function transformWithEsbuild(
  code: string,
  filename: string,
  options?: EsbuildTransformOptions,
  inMap?: object
): Promise<ESBuildTransformResult>
```
