# JavaScript API

Vite's JavaScript APIs are fully typed, and it's recommended to use TypeScript or enable JS type checking in VSCode to leverage the intellisense and validation.

## `createServer`

**Type Signature**

```ts
async function createServer(
  inlineConfig?: UserConfig & { mode?: string },
  configPath?: string | false
): Promise<ViteDevServer>
```

**Example Usage**

```js
import { createServer } from 'vite'
;async () => {
  const server = await createServer({
    // any valid user config options
    root: __dirname,
    server: {
      port: 1337
    }
  })
  await server.listen()
}
```

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
   * Programatically resolve, load and transform a URL and get the result
   * without going through the http request pipeline.
   */
  transformRequest(url: string): Promise<TransformResult | null>
  /**
   * Util for transfoming a file with esbuild.
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
  inlineConfig?: UserConfig & { mode?: string },
  configPath?: string | false
): Promise<RollupOutput | RollupOutput[]>
```

**Example Usage**

```js
import path from 'path'
import { build } from 'vite'
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

**Type Signature**

```ts
async function resolveConfig(
  inlineConfig: UserConfig,
  command: 'build' | 'serve',
  mode: string,
  configPath?: string | false
): Promise<ResolvedConfig>
```
