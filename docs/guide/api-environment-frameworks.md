# Environment API for Frameworks

:::warning Experimental
Initial work for this API was introduced in Vite 5.1 with the name "Vite Runtime API". This guide describes a revised API, renamed to Environment API. This API will be released in Vite 6 as experimental. You can already test it in the latest `vite@6.0.0-beta.x` version.

Resources:

- [Feedback discussion](https://github.com/vitejs/vite/discussions/16358) where we are gathering feedback about the new APIs.
- [Environment API PR](https://github.com/vitejs/vite/pull/16471) where the new API were implemented and reviewed.

Please share with us your feedback as you test the proposal.
:::

## Environments and frameworks

The implicit `ssr` environment and other non-client environments use a `RunnableDevEnvironment` by default during dev. While this is only implementable for some runtimes as it requires the runtime to be the same with the one the Vite server is running in, this works similarly with `ssrLoadModule` and allows frameworks for to migrate and enable HMR during for their SSR dev story. You can guard any runnable environment with an `isRunnableDevEnvironment` function.

```ts
export class RunnableDevEnvironment extends DevEnvironment {
  public readonly runner: ModuleRunnner
}

class ModuleRunner {
  /**
   * URL to execute. Accepts file path, server path, or id relative to the root.
   * Returns an instantiated module (same as in ssrLoadModule)
   */
  public async import(url: string): Promise<Record<string, any>>
  /**
   * Other ModuleRunner methods...
   */
}

if (isRunnableDevEnvironment(server.environments.ssr)) {
  await server.environments.ssr.runner.import('/entry-point.js')
}
```

## Default `RunnableDevEnvironment`

Given a Vite server configured in middleware mode as described by the [SSR setup guide](/guide/ssr#setting-up-the-dev-server), let's implement the SSR middleware using the environment API. Error handling is omitted.

```js
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  environments: {
    server: {
      // by default, the modules are run in the same process as the vite dev server during dev
    },
  },
})

// You might need to cast this to RunnableDevEnvironment in TypeScript or use
// the "isRunnableDevEnvironment" function to guard the access to the runner
const environment = server.environments.node

app.use('*', async (req, res, next) => {
  const url = req.originalUrl

  // 1. Read index.html
  let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')

  // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
  //    and also applies HTML transforms from Vite plugins, e.g. global
  //    preambles from @vitejs/plugin-react
  template = await server.transformIndexHtml(url, template)

  // 3. Load the server entry. import(url) automatically transforms
  //    ESM source code to be usable in Node.js! There is no bundling
  //    required, and provides full HMR support.
  const { render } = await environment.runner.import('/src/entry-server.js')

  // 4. render the app HTML. This assumes entry-server.js's exported
  //     `render` function calls appropriate framework SSR APIs,
  //    e.g. ReactDOMServer.renderToString()
  const appHtml = await render(url)

  // 5. Inject the app-rendered HTML into the template.
  const html = template.replace(`<!--ssr-outlet-->`, appHtml)

  // 6. Send the rendered HTML back.
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})
```

::: warning Accessing Module on the Server
We do not want to encourage communication between the server and the runner. One of the problems that was exposed with `vite.ssrLoadModule` is over-reliance on the server state inside the processed modules. This makes it harder to implement runtime-agnostic SSR since user environment might have no access to server APIs. For example, this code assumes that Vite server and user code can run in the same context:

```ts
const vite = createServer()
const routes = collectRoutes()

const { processRoutes } = await vite.ssrLoadModule('internal:routes-processor')
processRoutes(routes)
```

This makes it impossible to run user code in the same way it might run in production (for example, on the edge) because the server state and user state are coupled. So instead, we recommend using virtual modules to import the state and process it inside the user module:

```ts
// this code runs on another machine or in another thread

import { runner } from './ssr-module-runner.js'
import { processRoutes } from './routes-processor.js'

const { routes } = await runner.import('virtual:ssr-routes')
processRoutes(routes)
```

Simple setups like in [SSR Guide](/guide/ssr) can still use `server.transformIndexHtml` directly if it's not expected that the server will run in a different process in production. However, if the server will run in an edge environment or a separate process, we recommend creating a virtual module to load HTML:

```ts {13-21}
function vitePluginVirtualIndexHtml(): Plugin {
  let server: ViteDevServer | undefined
  return {
    name: vitePluginVirtualIndexHtml.name,
    configureServer(server_) {
      server = server_
    },
    resolveId(source) {
      return source === 'virtual:index-html' ? '\0' + source : undefined
    },
    async load(id) {
      if (id === '\0' + 'virtual:index-html') {
        let html: string
        if (server) {
          this.addWatchFile('index.html')
          html = await fs.promises.readFile('index.html', 'utf-8')
          html = await server.transformIndexHtml('/', html)
        } else {
          html = await fs.promises.readFile('dist/client/index.html', 'utf-8')
        }
        return `export default ${JSON.stringify(html)}`
      }
      return
    },
  }
}
```

Then in SSR entry point you can call `import('virtual:index-html')` to retrieve the processed HTML:

```ts
import { render } from 'framework'

// this example uses cloudflare syntax
export default {
  async fetch() {
    // during dev, it will return transformed HTML
    // during build, it will bundle the basic index.html into a string
    const { default: html } = await import('virtual:index-html')
    return new Response(render(html), {
      headers: { 'content-type': 'text/html' },
    })
  },
}
```

This keeps the HTML processing server agnostic.

:::

## Runtime agnostic SSR

:::info Running a module without relying on `RunnableDevEnvironment`

The initial proposal had a `run` method on the `DevEnvironment` class that would allow consumers to invoke an import on the runner side by using the `transport` option. During our testing we found out that the API was not universal enough to start recommending it. At the moment, we are looking for feedback on [the `FetchableDevEnvironment` proposal](https://github.com/vitejs/vite/discussions/18191).

:::

## Environments during build

In the CLI, calling `vite build` and `vite build --ssr` will still build the client only and ssr only environments for backward compatibility.

When `builder.entireApp` is `true` (or when calling `vite build --app`), `vite build` will opt-in into building the entire app instead. This would later on become the default in a future major. A `ViteBuilder` instance will be created (build-time equivalent to a `ViteDevServer`) to build all configured environments for production. By default the build of environments is run in series respecting the order of the `environments` record. A framework or user can further configure how the environments are built using:

```js
export default {
  builder: {
    buildApp: async (builder) => {
      const environments = Object.values(builder.environments)
      return Promise.all(
        environments.map((environment) => builder.build(environment)),
      )
    },
  },
}
```

## Environment agnostic code

Most of the time, the current `environment` instance will be available as part of the context of the code being run so the need to access them through `server.environments` should be rare. For example, inside plugin hooks the environment is exposed as part of the `PluginContext`, so it can be accessed using `this.environment`. See [Environment API for Plugins](./api-environment-plugins.md) to learn about how to build environment aware plugins.
