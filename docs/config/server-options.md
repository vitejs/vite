# Server Options

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

```js
// vite.config.js
import { defineConfig } from 'vite'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  // omit
})
```

The second case is when wildcard hosts (e.g. `0.0.0.0`) are used. This is because servers listening on non-wildcard hosts take priority over those listening on wildcard hosts.

:::

## server.port

- **Type:** `number`
- **Default:** `5173`

Specify server port. Note if the port is already being used, Vite will automatically try the next available port so this may not be the actual port the server ends up listening on.

## server.strictPort

- **Type:** `boolean`

Set to `true` to exit if port is already in use, instead of automatically trying the next available port.

## server.https

- **Type:** `boolean | https.ServerOptions`

Enable TLS + HTTP/2. Note this downgrades to TLS only when the [`server.proxy` option](#server-proxy) is also used.

The value can also be an [options object](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) passed to `https.createServer()`.

A valid certificate is needed. For a basic setup, you can add [@vitejs/plugin-basic-ssl](https://github.com/vitejs/vite-plugin-basic-ssl) to the project plugins, which will automatically create and cache a self-signed certificate. But we recommend creating your own certificates.

## server.open

- **Type:** `boolean | string`

Automatically open the app in the browser on server start. When the value is a string, it will be used as the URL's pathname. If you want to open the server in a specific browser you like, you can set the env `process.env.BROWSER` (e.g. `firefox`). See [the `open` package](https://github.com/sindresorhus/open#app) for more details.

**Example:**

```js
export default defineConfig({
  server: {
    open: '/docs/index.html'
  }
})
```

## server.proxy

- **Type:** `Record<string, string | ProxyOptions>`

Configure custom proxy rules for the dev server. Expects an object of `{ key: options }` pairs. Any requests that request path starts with that key will be proxied to that specified target. If the key starts with `^`, it will be interpreted as a `RegExp`. The `configure` option can be used to access the proxy instance.

Note that if you are using non-relative [`base`](/config/shared-options.md#base), you must prefix each key with that `base`.

Uses [`http-proxy`](https://github.com/http-party/node-http-proxy). Full options [here](https://github.com/http-party/node-http-proxy#options).

In some cases, you might also want to configure the underlying dev server (e.g. to add custom middlewares to the internal [connect](https://github.com/senchalabs/connect) app). In order to do that, you need to write your own [plugin](/guide/using-plugins.html) and use [configureServer](/guide/api-plugin.html#configureserver) function.

**Example:**

```js
export default defineConfig({
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/foo -> http://localhost:4567/foo
      '/foo': 'http://localhost:4567',
      // with options: http://localhost:5173/api/bar-> http://jsonplaceholder.typicode.com/bar
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // with RegEx: http://localhost:5173/fallback/ -> http://jsonplaceholder.typicode.com/
      '^/fallback/.*': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fallback/, '')
      },
      // Using the proxy instance
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        configure: (proxy, options) => {
          // proxy will be an instance of 'http-proxy'
        }
      },
      // Proxying websockets or socket.io: ws://localhost:5173/socket.io -> ws://localhost:5174/socket.io
      '/socket.io': {
        target: 'ws://localhost:5174',
        ws: true
      }
    }
  }
})
```

## server.cors

- **Type:** `boolean | CorsOptions`

Configure CORS for the dev server. This is enabled by default and allows any origin. Pass an [options object](https://github.com/expressjs/cors) to fine tune the behavior or `false` to disable.

## server.headers

- **Type:** `OutgoingHttpHeaders`

Specify server response headers.

## server.hmr

- **Type:** `boolean | { protocol?: string, host?: string, port?: number, path?: string, timeout?: number, overlay?: boolean, clientPort?: number, server?: Server }`

Disable or configure HMR connection (in cases where the HMR websocket must use a different address from the http server).

Set `server.hmr.overlay` to `false` to disable the server error overlay.

`clientPort` is an advanced option that overrides the port only on the client side, allowing you to serve the websocket on a different port than the client code looks for it on.

When `server.hmr.server` is defined, Vite will process the HMR connection requests through the provided server. If not in middleware mode, Vite will attempt to process HMR connection requests through the existing server. This can be helpful when using self-signed certificates or when you want to expose Vite over a network on a single port.

Check out [`vite-setup-catalogue`](https://github.com/sapphi-red/vite-setup-catalogue) for some examples.

::: tip NOTE

With the default configuration, reverse proxies in front of Vite are expected to support proxying WebSocket. If the Vite HMR client fails to connect WebSocket, the client will fall back to connecting the WebSocket directly to the Vite HMR server bypassing the reverse proxies:

```
Direct websocket connection fallback. Check out https://vitejs.dev/config/server-options.html#server-hmr to remove the previous connection error.
```

The error that appears in the Browser when the fallback happens can be ignored. To avoid the error by directly bypassing reverse proxies, you could either:

- configure the reverse proxy to proxy WebSocket too
- set [`server.strictPort = true`](#server-strictport) and set `server.hmr.clientPort` to the same value with `server.port`
- set `server.hmr.port` to a different value from [`server.port`](#server-port)

:::

## server.watch

- **Type:** `object`

File system watcher options to pass on to [chokidar](https://github.com/paulmillr/chokidar#api).

The Vite server watcher skips `.git/` and `node_modules/` directories by default. If you want to watch a package inside `node_modules/`, you can pass a negated glob pattern to `server.watch.ignored`. That is:

```js
export default defineConfig({
  server: {
    watch: {
      ignored: ['!**/node_modules/your-package-name/**']
    }
  },
  // The watched package must be excluded from optimization,
  // so that it can appear in the dependency graph and trigger hot reload.
  optimizeDeps: {
    exclude: ['your-package-name']
  }
})
```

::: warning Using Vite on Windows Subsystem for Linux (WSL) 2

When running Vite on WSL2, file system watching does not work when a file is edited by Windows applications (non-WSL2 process). This is due to [a WSL2 limitation](https://github.com/microsoft/WSL/issues/4739). This also applies to running on Docker with a WSL2 backend.

To fix it, you could either:

- **Recommended**: Use WSL2 applications to edit your files.
  - It is also recommended to move the project folder outside of a Windows filesystem. Accessing Windows filesystem from WSL2 is slow. Removing that overhead will improve performance.
- Set `{ usePolling: true }`.
  - Note that [`usePolling` leads to high CPU utilization](https://github.com/paulmillr/chokidar#performance).

:::

## server.middlewareMode

- **Type:** `boolean`
- **Default:** `false`

Create Vite server in middleware mode.

- **Related:** [appType](./shared-options#apptype), [SSR - Setting Up the Dev Server](/guide/ssr#setting-up-the-dev-server)

- **Example:**

```js
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom' // don't include Vite's default HTML handling middlewares
  })
  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    // Since `appType` is `'custom'`, should serve response here.
    // Note: if `appType` is `'spa'` or `'mpa'`, Vite includes middlewares to handle
    // HTML requests and 404s so user middlewares should be added
    // before Vite's middlewares to take effect instead
  })
}

createServer()
```

## server.base

- **Type:** `string | undefined`

Prepend this folder to http requests, for use when proxying vite as a subfolder. Should start with the `/` character.

## server.fs.strict

- **Type:** `boolean`
- **Default:** `true` (enabled by default since Vite 2.7)

Restrict serving files outside of workspace root.

## server.fs.allow

- **Type:** `string[]`

Restrict files that could be served via `/@fs/`. When `server.fs.strict` is set to `true`, accessing files outside this directory list that aren't imported from an allowed file will result in a 403.

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
      allow: ['..']
    }
  }
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
        '/path/to/custom/allow'
      ]
    }
  }
})
```

## server.fs.deny

- **Type:** `string[]`
- **Default:** `['.env', '.env.*', '*.{pem,crt}']`

Blocklist for sensitive files being restricted to be served by Vite dev server. This will have higher priority than [`server.fs.allow`](#server-fs-allow). [picomatch patterns](https://github.com/micromatch/picomatch#globbing-features) are supported.

## server.origin

- **Type:** `string`

Defines the origin of the generated asset URLs during development.

```js
export default defineConfig({
  server: {
    origin: 'http://127.0.0.1:8080'
  }
})
```
