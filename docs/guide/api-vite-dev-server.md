# ViteDevServer

The object returned by [`createServer`](./api-javascript#createserver). Use it to attach middleware, transform modules and HTML, drive HMR, and control the server lifecycle.

```ts
interface ViteDevServer {
  config: ResolvedConfig
  middlewares: Connect.Server
  httpServer: http.Server | null
  watcher: FSWatcher
  ws: WebSocketServer
  pluginContainer: PluginContainer
  moduleGraph: ModuleGraph
  resolvedUrls: ResolvedServerUrls | null
  transformRequest(
    url: string,
    options?: TransformOptions,
  ): Promise<TransformResult | null>
  transformIndexHtml(
    url: string,
    html: string,
    originalUrl?: string,
  ): Promise<string>
  ssrLoadModule(
    url: string,
    options?: { fixStacktrace?: boolean },
  ): Promise<Record<string, any>>
  ssrFixStacktrace(e: Error): void
  reloadModule(module: ModuleNode): Promise<void>
  listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
  restart(forceOptimize?: boolean): Promise<void>
  close(): Promise<void>
  bindCLIShortcuts(options?: BindCLIShortcutsOptions<ViteDevServer>): void
  waitForRequestsIdle: (ignoredId?: string) => Promise<void>
}
```

## `server.config`

The resolved Vite config object for this server.

## `server.middlewares`

A [Connect](https://github.com/senchalabs/connect#use-middleware) app instance.

- Attach custom middlewares with `server.middlewares.use(...)`.
- Use it as the request handler of a custom HTTP server, or as middleware in any Connect-style Node.js framework (Express, Koa via a Connect adapter, etc.).

In [middleware mode](/config/server-options.html#server-middlewaremode), this is the primary way the parent server receives Vite-handled requests.

## `server.httpServer`

The native Node.js `http.Server` instance Vite created. It is `null` in middleware mode, where the parent server owns the HTTP socket.

## `server.watcher`

A [Chokidar](https://github.com/paulmillr/chokidar/tree/3.6.0#api) watcher instance used for file-change detection.

If [`server.watch`](/config/server-options.html#server-watch) is set to `null`, no files are watched and calling `add` / `unwatch` has no effect. The emitter is still present so listeners can attach safely.

## `server.ws`

WebSocket server used for HMR and custom events. Exposes a `send(payload)` method (and related channel APIs) for pushing updates to connected clients. See the [HMR API](./api-hmr) for the client-side counterpart.

## `server.pluginContainer`

Rollup plugin container that can run plugin hooks on a given file (resolve, load, transform, and related pipeline steps).

:::tip Environment API
Prefer the per-environment `pluginContainer` on [`server.environments`](./api-environment-instances) when working with the Environment API. The top-level `server.pluginContainer` remains available for compatibility.
:::

## `server.moduleGraph`

Module graph that tracks import relationships, URL-to-file mapping, and HMR state. Use it with [`reloadModule`](#server-reloadmodule) when you need to invalidate a specific module programmatically.

## `server.resolvedUrls`

The resolved URLs Vite prints on the CLI (URL-encoded), or `null` in middleware mode / when the server is not listening on any port.

## `server.transformRequest(url, options?)`

Programmatically resolve, load, and transform a URL and return the result **without** going through the HTTP request pipeline. Useful for SSR frameworks, custom middlewares, and tools that need the same transform pipeline Vite uses for browser requests.

Returns `Promise<TransformResult | null>`.

## `server.transformIndexHtml(url, html, originalUrl?)`

Apply Vite's built-in HTML transforms and any plugin [`transformIndexHtml`](./api-plugin#transformindexhtml) hooks to `html`.

**Parameters:**

- `url` — The HTML file's URL path as Vite sees it (for example `/index.html` or `/foo/index.html`). Used to resolve relative asset URLs against that HTML file's directory.
- `html` — The raw HTML string to transform.
- `originalUrl` _(optional)_ — The browser request URL that led to this HTML being served (Connect's `req.originalUrl`). Pass this when you are serving HTML for a non-root path that fell back to `/index.html` (SPA fallback).

### Why `originalUrl` matters

When Vite rewrites relative `<script>` / asset URLs in HTML, it normally keys off the HTML file path (`url`). There is a special case for the root `index.html` served under a nested route:

If a request such as `/a/b` falls back to `/index.html`, a relative import like `./index.js` would otherwise be rewritten against `/` and miss the `/a/` prefix the browser expects. When `originalUrl` is provided, is not `'/'`, and `url` is `/index.html`, Vite prefixes those relative URLs with the app `base` so they resolve from the fallback request path instead.

Vite's own HTML middleware passes `req.originalUrl` for this reason:

```ts
html = await server.transformIndexHtml(url, html, req.originalUrl)
```

When calling `transformIndexHtml` yourself outside that middleware (tests, custom HTML endpoints, framework adapters), pass `originalUrl` whenever the HTML is being served in response to a URL that differs from the HTML file path—especially SPA fallbacks. You can omit it when transforming `/index.html` for `/` or when `url` already reflects the HTML file's real directory.

## `server.ssrLoadModule(url, options?)`

Load a given URL as an instantiated module for SSR. Returns the module's exports.

Pass `{ fixStacktrace: true }` to rewrite stack traces in thrown errors so they point at source files (see [`ssrFixStacktrace`](#server-ssrfixstacktrace)).

## `server.ssrFixStacktrace(e)`

Mutate the given SSR `Error` by rewriting its stack trace to map bundled / transformed locations back to original source locations.

## `server.reloadModule(module)`

Trigger HMR for a module node already present in [`server.moduleGraph`](#server-modulegraph). Retrieve the node from the graph, then call this method. No-op when HMR is disabled (`server.config.server.hmr === false`).

## `server.listen(port?, isRestart?)`

Start the HTTP server (and print URLs unless suppressed). Returns the same `ViteDevServer` instance.

Typically used right after [`createServer`](./api-javascript#createserver):

```ts
const server = await createServer()
await server.listen()
server.printUrls()
```

## `server.restart(forceOptimize?)`

Restart the server. When `forceOptimize` is `true`, force the dependency optimizer to re-bundle (same effect as the `--force` CLI flag).

## `server.close()`

Stop the server and release watchers / sockets. Await this during graceful shutdown.

## `server.bindCLIShortcuts(options?)`

Bind Vite's interactive CLI shortcuts (for example restart / quit) to the terminal. Pass `{ print: true }` to also print the shortcut help, matching the CLI experience.

## `server.waitForRequestsIdle(ignoredId?)` {#server-waitforrequestsidle}

:::warning Experimental
`waitForRequestsIdle` is experimental.
:::

`await server.waitForRequestsIdle(id)` waits until all static imports have been processed. If called from a load or transform plugin hook, pass the current module `id` to avoid deadlocks. After the first static-imports section of the module graph has been processed, subsequent calls resolve immediately.

:::info
`waitForRequestsIdle` is meant as an escape hatch for features that cannot follow the on-demand nature of the Vite dev server. During startup, tools like Tailwind can use it to delay generating app CSS classes until app code has been seen, avoiding flashes of style changes. When this function is used in a load or transform hook with the default HTTP/1 server, one of the six HTTP channels is blocked until the server processes all static imports. Vite's dependency optimizer currently uses this function to avoid full-page reloads on missing dependencies by delaying loading of pre-bundled dependencies until all imported dependencies have been collected from static imported sources. Vite may switch to a different strategy in a future major release, setting `optimizeDeps.holdUntilCrawlEnd: false` by default to avoid the performance hit in large applications during cold start.
:::
