# ViteDevServer API

`createServer` returns a `ViteDevServer` instance. It provides the running development server, its module environments, and the APIs that integrations use to transform requests, serve HTML, and coordinate server lifecycle.

## Properties

### `config`

- **Type:** `ResolvedConfig`

The fully resolved Vite configuration for this server.

### `middlewares`

- **Type:** `Connect.Server`

The [Connect](https://github.com/senchalabs/connect#use-middleware) application used by the development server. Add custom middleware with `server.middlewares.use()`, or use it as the handler for your own Connect-compatible HTTP server.

### `httpServer`

- **Type:** `HttpServer | null`

The native Node HTTP server. It is `null` when `server.middlewareMode` is enabled because the host application owns the HTTP server in that mode.

### `watcher`

- **Type:** `FSWatcher`

The Chokidar watcher used by Vite. When `config.server.watch` is `null`, Vite does not watch files and calls such as `watcher.add()` and `watcher.unwatch()` have no effect.

### `ws`

- **Type:** `WebSocketServer`

The WebSocket server used for HMR communication. Use `server.ws.send(payload)` to send a custom message to connected clients.

### `hot`

- **Type:** `NormalizedHotChannel`

An alias for `server.environments.client.hot`. To interact with every environment, iterate over `server.environments` instead.

### `pluginContainer`

- **Type:** `PluginContainer`

The plugin container that runs plugin hooks for a file. Most integrations should use the higher-level server methods rather than calling this container directly.

### `environments`

- **Type:** `Record<'client' | 'ssr' | (string & {}), DevEnvironment>`

The module execution environments attached to the server. Vite creates `client` and `ssr` environments by default. Frameworks can add custom environments. See the [Environment API](./api-environment) for the environment-specific APIs.

### `moduleGraph`

- **Type:** `ModuleGraph`

The client module graph. It tracks module URLs, files, import relationships, and HMR state. Use `server.environments` when an integration needs to work with module graphs for all environments.

### `resolvedUrls`

- **Type:** `ResolvedServerUrls | null`

The URL lists printed by the CLI, with URL-encoded paths. It is `null` in middleware mode and before the server starts listening.

## Request and HTML transforms

### `transformRequest`

- **Type:** `(url: string, options?: TransformOptions) => Promise<TransformResult | null>`

Resolves, loads, and transforms a URL without sending it through the HTTP request pipeline. It returns `null` when Vite cannot transform the request.

### `warmupRequest`

- **Type:** `(url: string, options?: TransformOptions) => Promise<void>`

Warms a URL so its next request can use the transform cache. Errors are handled and reported internally, so this method does not throw for a failed warmup.

### `transformIndexHtml`

- **Type:** `(url: string, html: string, originalUrl?: string) => Promise<string>`

Applies Vite's built-in HTML transforms and every registered `transformIndexHtml` plugin hook.

`url` is the public URL for the HTML being transformed. It controls the filename exposed to plugins and how Vite resolves asset URLs. Pass `originalUrl` when your middleware is serving `index.html` as a fallback for a different request URL. This preserves the request location when Vite rewrites relative script and asset URLs.

```ts
app.use('*', async (req, res) => {
  const template = await fs.readFile('index.html', 'utf-8')
  const html = await vite.transformIndexHtml('/', template, req.originalUrl)
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})
```

### `ssrTransform`

- **Type:** `(code: string, inMap: SourceMap | { mappings: '' } | null, url: string, originalCode?: string) => Promise<TransformResult | null>`

Transforms module code into the format used by Vite's SSR module runner. This is a low-level API for integrations that need to transform already-loaded source.

### `ssrLoadModule`

- **Type:** `(url: string, options?: { fixStacktrace?: boolean }) => Promise<Record<string, any>>`

Loads a URL as an instantiated SSR module. By default, errors have their stack traces rewritten with `ssrFixStacktrace`. Set `fixStacktrace` to `false` to keep the original stack trace.

### `ssrRewriteStacktrace`

- **Type:** `(stack: string) => string`

Returns a stack trace with Vite's SSR source maps applied.

### `ssrFixStacktrace`

- **Type:** `(error: Error) => void`

Rewrites an SSR error's `stack` in place using Vite's source maps.

## Server lifecycle

### `listen`

- **Type:** `(port?: number, isRestart?: boolean) => Promise<ViteDevServer>`

Starts the HTTP server. `createServer()` listens automatically. When using `createServer({ server: { middlewareMode: true } })`, the host application manages listening instead.

### `close`

- **Type:** `() => Promise<void>`

Stops the server and closes its resources. Call it when an integration no longer needs the development server.

### `restart`

- **Type:** `(forceOptimize?: boolean) => Promise<void>`

Restarts the server. Pass `true` to force dependency optimization, equivalent to starting Vite with `--force`.

### `printUrls`

- **Type:** `() => void`

Prints the local and network URLs for a listening server.

### `bindCLIShortcuts`

- **Type:** `(options?: BindCLIShortcutsOptions<ViteDevServer>) => void`

Binds Vite's CLI keyboard shortcuts for the server. This is useful for integrations that create a server and provide their own terminal interface.

### `openBrowser`

- **Type:** `() => void`

Opens the development server URL in a browser.

## Module updates

### `reloadModule`

- **Type:** `(module: ModuleNode) => Promise<void>`

Triggers an HMR update for a module in the client module graph. Retrieve the module with `server.moduleGraph`. This is a no-op when HMR is disabled.

### `waitForRequestsIdle`

- **Type:** `(ignoredId?: string) => Promise<void>`
- **Status:** Experimental

Waits until Vite has processed the static imports it is currently crawling. If you call it from a `load` or `transform` hook, pass that hook's module ID as `ignoredId` to avoid a deadlock. Calls made after the first static-import crawl resolve immediately.

Use this only as an escape hatch for startup work that cannot follow Vite's on-demand model. For example, a tool can delay generating CSS until Vite has seen the application's imports, avoiding a flash of style changes. The dependency optimizer uses this pattern to collect static imports before it loads pre-bundled dependencies. It can delay cold starts in large applications, and Vite may adopt a different strategy in a future major release.
