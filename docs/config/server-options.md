# Server Options

Unless noted, the options in this section are only applied to dev.

## server.host

- **Type:** `string | boolean`
- **Default:** `'localhost'`

Specify which IP addresses the server should listen on.
Set this to `0.0.0.0` or `true` to listen on all addresses, including LAN and public addresses.

This can be set via the CLI using `--host 0.0.0.0` or `--host`.

::: tip NOTE

There are cases when other servers might respond instead of Vite.

The first case is when `localhost` is used. Node.js under v17 reorders the result of DNS-resolved addresses by default. When accessing `localhost`, browsers use DNS to resolve the address and that address might differ from the address which Vite is listening to. Vite prints the resolved address when it differs.

You can set [`dns.setDefaultResultOrder('verbatim')`](https://nodejs.org/api/dns.html#dns_dns_setdefaultresultorder_order) to disable the reordering behavior. Vite will then print the address as `localhost`.

```js twoslash [vite.config.js]
import { defineConfig } from 'vite'
import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  // omit
})
```

The second case is when wildcard hosts (e.g. `0.0.0.0`) are used. This is because servers listening on non-wildcard hosts take priority over those listening on wildcard hosts.

:::

::: tip Accessing the server on WSL2 from your LAN

When running Vite on WSL2, it is not sufficient to set `host: true` to access the server from your LAN.
See [the WSL document](https://learn.microsoft.com/en-us/windows/wsl/networking#accessing-a-wsl-2-distribution-from-your-local-area-network-lan) for more details.

:::

## server.allowedHosts

- **Type:** `string[] | true`
- **Default:** `[]`

The hostnames that Vite is allowed to respond to.
`localhost` and domains under `.localhost` and all IP addresses are allowed by default.
When using HTTPS, this check is skipped.

If a string starts with `.`, it will allow that hostname without the `.` and all subdomains under the hostname. For example, `.example.com` will allow `example.com`, `foo.example.com`, and `foo.bar.example.com`. If set to `true`, the server is allowed to respond to requests for any hosts.

::: details What hosts are safe to be added?

Hosts that you have control over which IP addresses they resolve to are safe to add to the list of allowed hosts.

For example, if you own a domain `vite.dev`, you can add `vite.dev` and `.vite.dev` to the list. If you don't own that domain and you cannot trust the owner of that domain, you should not add it.

Especially, you should never add Top-Level Domains like `.com` to the list. This is because anyone can purchase a domain like `example.com` and control the IP address it resolves to.

:::

::: danger

Setting `server.allowedHosts` to `true` allows any website to send requests to your dev server through DNS rebinding attacks, allowing them to download your source code and content. We recommend always using an explicit list of allowed hosts. See [GHSA-vg6x-rcgg-rjx6](https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6) for more details.

:::

::: details Configure via environment variable
You can set the environment variable `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` to add an additional allowed host.
:::

## server.port

- **Type:** `number`
- **Default:** `5173`

Specify server port. Note if the port is already being used, Vite will automatically try the next available port so this may not be the actual port the server ends up listening on.

## server.strictPort

- **Type:** `boolean`

Set to `true` to exit if port is already in use, instead of automatically trying the next available port.

## server.https

- **Type:** `https.ServerOptions`

Enable TLS + HTTP/2. The value is an [options object](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) passed to `https.createServer()`.

Note that this downgrades to TLS only when the [`server.proxy` option](#server-proxy) is also used.

A valid certificate is needed. For a basic setup, you can add [@vitejs/plugin-basic-ssl](https://github.com/vitejs/vite-plugin-basic-ssl) to the project plugins, which will automatically create and cache a self-signed certificate. But we recommend creating your own certificates.

## server.open

- **Type:** `boolean | string`

Automatically open the app in the browser on server start. When the value is a string, it will be used as the URL's pathname. If you want to open the server in a specific browser you like, you can set the env `process.env.BROWSER` (e.g. `firefox`). You can also set `process.env.BROWSER_ARGS` to pass additional arguments (e.g. `--incognito`).

`BROWSER` and `BROWSER_ARGS` are also special environment variables you can set in the `.env` file to configure it. See [the `open` package](https://github.com/sindresorhus/open#app) for more details.

**Example:**

```js
export default defineConfig({
  server: {
    open: '/docs/index.html',
  },
})
```

## server.proxy

- **Type:** `Record<string, string | ProxyOptions>`

Configure custom proxy rules for the dev server. Expects an object of `{ key: options }` pairs. Any requests that request path starts with that key will be proxied to that specified target. If the key starts with `^`, it will be interpreted as a `RegExp`. The `configure` option can be used to access the proxy instance. If a request matches any of the configured proxy rules, the request won't be transformed by Vite.

Note that if you are using non-relative [`base`](/config/shared-options.md#base), you must prefix each key with that `base`.

Extends [`http-proxy-3`](https://github.com/sagemathinc/http-proxy-3#options). Additional options are [here](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/middlewares/proxy.ts#L13).

In some cases, you might also want to configure the underlying dev server (e.g. to add custom middlewares to the internal [connect](https://github.com/senchalabs/connect) app). In order to do that, you need to write your own [plugin](/guide/using-plugins.html) and use [configureServer](/guide/api-plugin.html#configureserver) function.

**Example:**

```js
export default defineConfig({
  server: {
    proxy: {
      // string shorthand:
      // http://localhost:5173/foo
      //   -> http://localhost:4567/foo
      '/foo': 'http://localhost:4567',
      // with options:
      // http://localhost:5173/api/bar
      //   -> http://jsonplaceholder.typicode.com/bar
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // with RegExp:
      // http://localhost:5173/fallback/
      //   -> http://jsonplaceholder.typicode.com/
      '^/fallback/.*': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fallback/, ''),
      },
      // Using the proxy instance
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        configure: (proxy, options) => {
          // proxy will be an instance of 'http-proxy'
        },
      },
      // Proxying websockets or socket.io:
      // ws://localhost:5173/socket.io
      //   -> ws://localhost:5174/socket.io
      // Exercise caution using `rewriteWsOrigin` as it can leave the
      // proxying open to CSRF attacks.
      '/socket.io': {
        target: 'ws://localhost:5174',
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
})
```

## server.cors

- **Type:** `boolean | CorsOptions`
- **Default:** `{ origin: /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/ }` (allows localhost, `127.0.0.1` and `::1`)

Configure CORS for the dev server. Pass an [options object](https://github.com/expressjs/cors#configuration-options) to fine tune the behavior or `true` to allow any origin.

::: danger

Setting `server.cors` to `true` allows any website to send requests to your dev server and download your source code and content. We recommend always using an explicit list of allowed origins.

:::

## server.headers

- **Type:** `OutgoingHttpHeaders`

Specify server response headers.

## server.hmr

- **Type:** `boolean | { protocol?: string, host?: string, port?: number, path?: string, timeout?: number, overlay?: boolean, clientPort?: number, server?: Server }`

Disable or configure HMR connection (in cases where the HMR websocket must use a different address from the http server).

Set `server.hmr.overlay` to `false` to disable the server error overlay.

`protocol` sets the WebSocket protocol used for the HMR connection: `ws` (WebSocket) or `wss` (WebSocket Secure).

`clientPort` is an advanced option that overrides the port only on the client side, allowing you to serve the websocket on a different port than the client code looks for it on.

When `server.hmr.server` is defined, Vite will process the HMR connection requests through the provided server. If not in middleware mode, Vite will attempt to process HMR connection requests through the existing server. This can be helpful when using self-signed certificates or when you want to expose Vite over a network on a single port.

Check out [`vite-setup-catalogue`](https://github.com/sapphi-red/vite-setup-catalogue) for some examples.

::: tip NOTE

With the default configuration, reverse proxies in front of Vite are expected to support proxying WebSocket. If the Vite HMR client fails to connect WebSocket, the client will fall back to connecting the WebSocket directly to the Vite HMR server bypassing the reverse proxies:

```
Direct websocket connection fallback. Check out https://vite.dev/config/server-options.html#server-hmr to remove the previous connection error.
```

The error that appears in the Browser when the fallback happens can be ignored. To avoid the error by directly bypassing reverse proxies, you could either:

- configure the reverse proxy to proxy WebSocket too
- set [`server.strictPort = true`](#server-strictport) and set `server.hmr.clientPort` to the same value with `server.port`
- set `server.hmr.port` to a different value from [`server.port`](#server-port)

:::

## server.warmup

- **Type:** `{ clientFiles?: string[], ssrFiles?: string[] }`
- **Related:** [Warm Up Frequently Used Files](/guide/performance.html#warm-up-frequently-used-files)

Warm up files to transform and cache the results in advance. This improves the initial page load during server starts and prevents transform waterfalls.

`clientFiles` are files that are used in the client only, while `ssrFiles` are files that are used in SSR only. They accept an array of file paths or [`tinyglobby`](https://github.com/SuperchupuDev/tinyglobby) patterns relative to the `root`.

Make sure to only add files that are frequently used to not overload the Vite dev server on startup.

```js
export default defineConfig({
  server: {
    warmup: {
      clientFiles: ['./src/components/*.vue', './src/utils/big-utils.js'],
      ssrFiles: ['./src/server/modules/*.js'],
    },
  },
})
```

## server.watch

- **Type:** `object | null`

File system watcher options to pass on to [chokidar](https://github.com/paulmillr/chokidar/tree/3.6.0#api).

The Vite server watcher watches the `root` and skips the `.git/`, `node_modules/`, `test-results/`, and Vite's `cacheDir` and `build.outDir` directories by default. When updating a watched file, Vite will apply HMR and update the page only if needed.

If set to `null`, no files will be watched. [`server.watcher`](/guide/api-javascript.html#vitedevserver) will provide a compatible event emitter, but calling `add` or `unwatch` will have no effect.

::: warning Watching files in `node_modules`

It's currently not possible to watch files and packages in `node_modules`. For further progress and workarounds, you can follow [issue #8619](https://github.com/vitejs/vite/issues/8619).

:::

::: warning Using Vite on Windows Subsystem for Linux (WSL) 2

When running Vite on WSL2, file system watching does not work when a file is edited by Windows applications (non-WSL2 process). This is due to [a WSL2 limitation](https://github.com/microsoft/WSL/issues/4739). This also applies to running on Docker with a WSL2 backend.

To fix it, you could either:

- **Recommended**: Use WSL2 applications to edit your files.
  - It is also recommended to move the project folder outside of a Windows filesystem. Accessing Windows filesystem from WSL2 is slow. Removing that overhead will improve performance.
- Set `{ usePolling: true }`.
  - Note that [`usePolling` leads to high CPU utilization](https://github.com/paulmillr/chokidar/tree/3.6.0#performance).

:::

## server.middlewareMode

- **Type:** `boolean`
- **Default:** `false`

Create Vite server in middleware mode.

- **Related:** [appType](./shared-options#apptype), [SSR - Setting Up the Dev Server](/guide/ssr#setting-up-the-dev-server)

- **Example:**

```js twoslash
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    // don't include Vite's default HTML handling middlewares
    appType: 'custom',
  })
  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    // Since `appType` is `'custom'`, should serve response here.
    // Note: if `appType` is `'spa'` or `'mpa'`, Vite includes middlewares
    // to handle HTML requests and 404s so user middlewares should be added
    // before Vite's middlewares to take effect instead
  })
}

createServer()
```

## server.fs.strict

- **Type:** `boolean`
- **Default:** `true` (enabled by default since Vite 2.7)

Restrict serving files outside of workspace root.

## server.fs.allow

- **Type:** `string[]`

Restrict files that could be served via `/@fs/`. When `server.fs.strict` is set to `true`, accessing files outside this directory list that aren't imported from an allowed file will result in a 403.

Both directories and files can be provided.

Vite will search for the root of the potential workspace and use it as default. A valid workspace met the following conditions, otherwise will fall back to the [project root](/guide/#index-html-and-project-root).

- contains `workspaces` field in `package.json`
- contains one of the following file
  - `lerna.json`
  - `pnpm-workspace.yaml`

Accepts a path to specify the custom workspace root. Could be a absolute path or a path relative to [project root](/guide/#index-html-and-project-root). For example:

```js
export default defineConfig({
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
})
```

When `server.fs.allow` is specified, the auto workspace root detection will be disabled. To extend the original behavior, a utility `searchForWorkspaceRoot` is exposed:

```js
import { defineConfig, searchForWorkspaceRoot } from 'vite'

export default defineConfig({
  server: {
    fs: {
      allow: [
        // search up for workspace root
        searchForWorkspaceRoot(process.cwd()),
        // your custom rules
        '/path/to/custom/allow_directory',
        '/path/to/custom/allow_file.demo',
      ],
    },
  },
})
```

## server.fs.deny

- **Type:** `string[]`
- **Default:** `['.env', '.env.*', '*.{crt,pem}', '**/.git/**']`

Blocklist for sensitive files being restricted to be served by Vite dev server. This will have higher priority than [`server.fs.allow`](#server-fs-allow). [picomatch patterns](https://github.com/micromatch/picomatch#globbing-features) are supported.

::: tip NOTE

This blocklist does not apply to [the public directory](/guide/assets.md#the-public-directory). All files in the public directory are served without any filtering, since they are copied directly to the output directory during build.

:::

## server.origin

- **Type:** `string`

Defines the origin of the generated asset URLs during development.

```js
export default defineConfig({
  server: {
    origin: 'http://127.0.0.1:8080',
  },
})
```

## server.sourcemapIgnoreList

- **Type:** `false | (sourcePath: string, sourcemapPath: string) => boolean`
- **Default:** `(sourcePath) => sourcePath.includes('node_modules')`

Whether or not to ignore source files in the server sourcemap, used to populate the [`x_google_ignoreList` source map extension](https://developer.chrome.com/articles/x-google-ignore-list/).

`server.sourcemapIgnoreList` is the equivalent of [`build.rollupOptions.output.sourcemapIgnoreList`](https://rollupjs.org/configuration-options/#output-sourcemapignorelist) for the dev server. A difference between the two config options is that the rollup function is called with a relative path for `sourcePath` while `server.sourcemapIgnoreList` is called with an absolute path. During dev, most modules have the map and the source in the same folder, so the relative path for `sourcePath` is the file name itself. In these cases, absolute paths makes it convenient to be used instead.

By default, it excludes all paths containing `node_modules`. You can pass `false` to disable this behavior, or, for full control, a function that takes the source path and sourcemap path and returns whether to ignore the source path.

```js
export default defineConfig({
  server: {
    // This is the default value, and will add all files with node_modules
    // in their paths to the ignore list.
    sourcemapIgnoreList(sourcePath, sourcemapPath) {
      return sourcePath.includes('node_modules')
    },
  },
})
```

::: tip Note
[`server.sourcemapIgnoreList`](#server-sourcemapignorelist) and [`build.rollupOptions.output.sourcemapIgnoreList`](https://rollupjs.org/configuration-options/#output-sourcemapignorelist) need to be set independently. `server.sourcemapIgnoreList` is a server only config and doesn't get its default value from the defined rollup options.
:::
