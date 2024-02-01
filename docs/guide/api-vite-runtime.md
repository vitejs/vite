# Vite Runtime API

:::warning Low-level API
This API was introduced in Vite 5.1 as an experimental feature. It was added to [gather feedback](https://github.com/vitejs/vite/discussions/15774). There will probably be breaking changes to it in Vite 5.2, so make sure to pin the Vite version to `~5.1.0` when using it. This is a low-level API meant for library and framework authors. If your goal is to create an application, make sure to check out the higher-level SSR plugins and tools at [Awesome Vite SSR section](https://github.com/vitejs/awesome-vite#ssr) first.
:::

The "Vite Runtime" is a tool that allows running any code by processing it with Vite plugins first. It is different from `server.ssrLoadModule` because the runtime implementation is decoupled from the server. This allows library and framework authors to implement their own layer of communication between the server and the runtime.

One of the goals of this feature is to provide a customizable API to process and run the code. Vite provides enough tools to use Vite Runtime out of the box, but users can build upon it if their needs do not align with Vite's built-in implementation.

All APIs can be imported from `vite/runtime` unless stated otherwise.

## `ViteRuntime`

**Type Signature:**

```ts
export class ViteRuntime {
  constructor(
    public options: ViteRuntimeOptions,
    public runner: ViteModuleRunner,
    private debug?: ViteRuntimeDebugger,
  ) {}
  /**
   * URL to execute. Accepts file path, server path, or id relative to the root.
   */
  public async executeUrl<T = any>(url: string): Promise<T>
  /**
   * Entry point URL to execute. Accepts file path, server path or id relative to the root.
   * In the case of a full reload triggered by HMR, this is the module that will be reloaded.
   * If this method is called multiple times, all entry points will be reloaded one at a time.
   */
  public async executeEntrypoint<T = any>(url: string): Promise<T>
  /**
   * Clear all caches including HMR listeners.
   */
  public clearCache(): void
  /**
   * Clears all caches, removes all HMR listeners, and resets source map support.
   * This method doesn't stop the HMR connection.
   */
  public async destroy(): Promise<void>
  /**
   * Returns `true` if the runtime has been destroyed by calling `destroy()` method.
   */
  public isDestroyed(): boolean
}
```

::: tip Advanced Usage
If you are just migrating from `server.ssrLoadModule` and want to support HMR, consider using [`createViteRuntime`](#createviteruntime) instead.
:::

The `ViteRuntime` class requires `root` and `fetchModule` options when initiated. Vite exposes `ssrFetchModule` on the [`server`](/guide/api-javascript) instance for easier integration with Vite SSR. Vite also exports `fetchModule` from its main entry point - it doesn't make any assumptions about how the code is running unlike `ssrFetchModule` that expects the code to run using `new Function`. This can be seen in source maps that these functions return.

Runner in `ViteRuntime` is responsible for executing the code. Vite exports `ESModulesRunner` out of the box, it uses `new AsyncFunction` to run the code. You can provide your own implementation if your JavaScript runtime doesn't support unsafe evaluation.

The two main methods that runtime exposes are `executeUrl` and `executeEntrypoint`. The only difference between them is that all modules executed by `executeEntrypoint` will be reexecuted if HMR triggers `full-reload` event. Be aware that Vite Runtime doesn't update `exports` object when this happens (it overrides it), you would need to run `executeUrl` or get the module from `moduleCache` again if you rely on having the latest `exports` object.

**Example Usage:**

```js
import { ViteRuntime, ESModulesRunner } from 'vite/runtime'
import { root, fetchModule } from './rpc-implementation.js'

const runtime = new ViteRuntime(
  {
    root,
    fetchModule,
    // you can also provide hmr.connection to support HMR
  },
  new ESModulesRunner(),
)

await runtime.executeEntrypoint('/src/entry-point.js')
```

## `ViteRuntimeOptions`

```ts
export interface ViteRuntimeOptions {
  /**
   * Root of the project
   */
  root: string
  /**
   * A method to get the information about the module.
   * For SSR, Vite exposes `server.ssrFetchModule` function that you can use here.
   * For other runtime use cases, Vite also exposes `fetchModule` from its main entry point.
   */
  fetchModule: FetchFunction
  /**
   * Configure how source maps are resolved. Prefers `node` if `process.setSourceMapsEnabled` is available.
   * Otherwise it will use `prepareStackTrace` by default which overrides `Error.prepareStackTrace` method.
   * You can provide an object to configure how file contents and source maps are resolved for files that were not processed by Vite.
   */
  sourcemapInterceptor?:
    | false
    | 'node'
    | 'prepareStackTrace'
    | InterceptorOptions
  /**
   * Disable HMR or configure HMR options.
   */
  hmr?:
    | false
    | {
        /**
         * Configure how HMR communicates between the client and the server.
         */
        connection: HMRRuntimeConnection
        /**
         * Configure HMR logger.
         */
        logger?: false | HMRLogger
      }
  /**
   * Custom module cache. If not provided, it creates a separate module cache for each ViteRuntime instance.
   */
  moduleCache?: ModuleCacheMap
}
```

## `ViteModuleRunner`

**Type Signature:**

```ts
export interface ViteModuleRunner {
  /**
   * Run code that was transformed by Vite.
   * @param context Function context
   * @param code Transformed code
   * @param id ID that was used to fetch the module
   */
  runViteModule(
    context: ViteRuntimeModuleContext,
    code: string,
    id: string,
  ): Promise<any>
  /**
   * Run externalized module.
   * @param file File URL to the external module
   */
  runExternalModule(file: string): Promise<any>
}
```

Vite exports `ESModulesRunner` that implements this interface by default. It uses `new AsyncFunction` to run code, so if the code has inlined source map it should contain an [offset of 2 lines](https://tc39.es/ecma262/#sec-createdynamicfunction) to accommodate for new lines added. This is done automatically by `server.ssrFetchModule`. If your runner implementation doesn't have this constraint, you should use `fetchModule` (exported from `vite`) directly.

## HMRRuntimeConnection

**Type Signature:**

```ts
export interface HMRRuntimeConnection {
  /**
   * Checked before sending messages to the client.
   */
  isReady(): boolean
  /**
   * Send message to the client.
   */
  send(message: string): void
  /**
   * Configure how HMR is handled when this connection triggers an update.
   * This method expects that connection will start listening for HMR updates and call this callback when it's received.
   */
  onUpdate(callback: (payload: HMRPayload) => void): void
}
```

This interface defines how HMR communication is established. Vite exports `ServerHMRConnector` from the main entry point to support HMR during Vite SSR. The `isReady` and `send` methods are usually called when the custom event is triggered (like, `import.meta.hot.send("my-event")`).

`onUpdate` is called only once when the new runtime is initiated. It passed down a method that should be called when connection triggers the HMR event. The implementation depends on the type of connection (as an example, it can be `WebSocket`/`EventEmitter`/`MessageChannel`), but it usually looks something like this:

```js
function onUpdate(callback) {
  this.connection.on('hmr', (event) => callback(event.data))
}
```

The callback is queued and it will wait for the current update to be resolved before processing the next update. Unlike the browser implementation, HMR updates in Vite Runtime wait until all listeners (like, `vite:beforeUpdate`/`vite:beforeFullReload`) are finished before updating the modules.

## `createViteRuntime`

**Type Signature:**

```ts
async function createViteRuntime(
  server: ViteDevServer,
  options?: MainThreadRuntimeOptions,
): Promise<ViteRuntime>
```

**Example Usage:**

```js
import { createServer } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

;(async () => {
  const server = await createServer({
    root: __dirname,
  })
  await server.listen()

  const runtime = await createViteRuntime(server)
  await runtime.executeEntrypoint('/src/entry-point.js')
})()
```

This method serves as an easy replacement for `server.ssrLoadModule`. Unlike `ssrLoadModule`, `createViteRuntime` provides HMR support out of the box. You can pass down [`options`](#mainthreadruntimeoptions) to customize how SSR runtime behaves to suit your needs.

## `MainThreadRuntimeOptions`

```ts
export interface MainThreadRuntimeOptions
  extends Omit<ViteRuntimeOptions, 'root' | 'fetchModule' | 'hmr'> {
  /**
   * Disable HMR or configure HMR logger.
   */
  hmr?:
    | false
    | {
        logger?: false | HMRLogger
      }
  /**
   * Provide a custom module runner. This controls how the code is executed.
   */
  runner?: ViteModuleRunner
}
```
