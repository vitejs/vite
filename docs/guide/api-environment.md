# Environment API

:::warning Low-level API
Initial work for this API was introduced in Vite 5.1 with the name "Vite Runtime API". This guide describes a revised API, renamed to Environment API. This API will be released in Vite 6 as experimental. You can already test it in the latest `vite@6.0.0-beta.x` version.

Resources:

- [Feedback discussion](https://github.com/vitejs/vite/discussions/16358) where we are gathering feedback about the new APIs.
- [Environment API PR](https://github.com/vitejs/vite/pull/16471) where the new API were implemented and reviewed.

Please share with us your feedback as you test the proposal.
:::

Vite 6 formalizes the concept of Environments, introducing new APIs to create and configure them as well as accessing options and context utilities with a consistent API. Since Vite 2, there were two implicit Environments (`client` and `ssr`). Plugin Hooks received a `ssr` boolean in the last options parameter to identify the target environment for each processed module. Several APIs expected an optional last `ssr` parameter to properly associate modules to the correct environment (for example `server.moduleGraph.getModuleByUrl(url, { ssr })`). The `ssr` environment was configured using `config.ssr` that had a partial set of the options present in the client environment. During dev, both `client` and `ssr` environment were running concurrently with a single shared plugin pipeline. During build, each build got a new resolved config instance with a new set of plugins.

The new Environment API not only makes these two default environment explicit, but allows users to create as many named environments as needed. There is a uniform way to configure environments (using `config.environments`) and the environment options and context utilities associated to a module being processed is accessible in plugin hooks using `this.environment`. APIs that previously expected a `ssr` boolean are now scoped to the proper environment (for example `environment.moduleGraph.getModuleByUrl(url)`). During dev, all environments are run concurrently as before. During build, for backward compatibility each build gets its own resolved config instance. But plugins or users can opt-in into a shared build pipeline.

Even if there are big changes internally, and new opt-in APIs, there are no breaking changes from Vite 5. The initial goal of Vite 6 will be to move the ecosystem to the new major as smoothly as possible, delaying promoting the adoption of new APIs in plugins until there is enough users ready to consume the new versions of these plugins.

## Using environments in the Vite server

A single Vite dev server can be used to interact with different module execution environments concurrently. We'll use the word environment to refer to a configured Vite processing pipeline that can resolve ids, load, and process source code and is connected to a runtime where the code is executed. The transformed source code is called a module, and the relationships between the modules processed in each environment are kept in a module graph. The code for these modules is sent to the runtimes associated with each environment to be executed. When a module is evaluated, the runtime will request its imported modules triggering the processing of a section of the module graph. In a typical Vite app, environments will be used for the ES modules served to the client and for the server program that does SSR. An app can do SSR in a Node server, but also other JS runtimes like [Cloudflare's workerd](https://github.com/cloudflare/workerd). So we can have different types of environments on the same Vite server: browser environments, node environments, and workerd environments, to name a few.

A Vite Module Runner allows running any code by processing it with Vite plugins first. It is different from `server.ssrLoadModule` because the runner implementation is decoupled from the server. This allows library and framework authors to implement their layer of communication between the Vite server and the runner. The browser communicates with its corresponding environment using the server Web Socket and through HTTP requests. The Node Module runner can directly do function calls to process modules as it is running in the same process. Other environments could run modules connecting to a JS runtime like workerd, or a Worker Thread as Vitest does.

All these environments share Vite's HTTP server, middlewares, and Web Socket. The resolved config and plugins pipeline are also shared, but plugins can use `apply` so its hooks are only called for certain environments. The environment can also be accessed inside hooks for fine-grained control.

![Vite Environments](../images/vite-environments.svg)

A Vite dev server exposes two environments by default: a `client` environment and an `ssr` environment. The client environment is a browser environment by default, and the module runner is implemented by importing the virtual module `/@vite/client` to client apps. The SSR environment runs in the same Node runtime as the Vite server by default and allows application servers to be used to render requests during dev with full HMR support. We'll discuss later how frameworks and users can change the environment types for the default client and SSR environments, or register new environments (for example to have a separate module graph for [RSC](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)).

The available environments can be accessed using `server.environments`:

```js
const environment = server.environments.client

environment.transformRequest(url)

console.log(server.environments.ssr.moduleGraph)
```

Most of the time, the current `environment` instance will be available as part of the context of the code being run so the need to access them through `server.environments` should be rare. For example, inside plugin hooks the environment is exposed as part of the `PluginContext`, so it can be accessed using `this.environment`.

A dev environment is an instance of the `DevEnvironment` class:

```ts
class DevEnvironment {
  /**
   * Unique identifier for the environment in a Vite server.
   * By default Vite exposes 'client' and 'ssr' environments.
   */
  name: string
  /**
   * Communication channel to send and receive messages from the
   * associated module runner in the target runtime.
   */
  hot: HotChannel | null
  /**
   * Graph of module nodes, with the imported relationship between
   * processed modules and the cached result of the processed code.
   */
  moduleGraph: EnvironmentModuleGraph
  /**
   * Resolved plugins for this environment, including the ones
   * created using the per-environment `create` hook
   */
  plugins: Plugin[]
  /**
   * Allows to resolve, load, and transform code through the
   * environment plugins pipeline
   */
  pluginContainer: EnvironmentPluginContainer
  /**
   * Resolved config options for this environment. Options at the server
   * global scope are taken as defaults for all environments, and can
   * be overridden (resolve conditions, external, optimizedDeps)
   */
  config: ResolvedConfig & ResolvedDevEnvironmentOptions

  constructor(name, config, { hot, options }: DevEnvironmentSetup)

  /**
   * Resolve the URL to an id, load it, and process the code using the
   * plugins pipeline. The module graph is also updated.
   */
  async transformRequest(url: string): TransformResult

  /**
   * Register a request to be processed with low priority. This is useful
   * to avoid waterfalls. The Vite server has information about the imported
   * modules by other requests, so it can warmup the module graph so the
   * modules are already processed when they are requested.
   */
  async warmupRequest(url: string): void
}
```

With `TransformResult` being:

```ts
interface TransformResult {
  code: string
  map: SourceMap | { mappings: '' } | null
  etag?: string
  deps?: string[]
  dynamicDeps?: string[]
}
```

Vite also supports a `RunnableDevEnvironment`, that extends a `DevEnvironment` exposing a `ModuleRunner` instance. You can guard any runnable environment with an `isRunnableDevEnvironment` function.

:::warning
The `runner` is evaluated eagerly when it's accessed for the first time. Beware that Vite enables source map support when the `runner` is created by calling `process.setSourceMapsEnabled` or by overriding `Error.prepareStackTrace` if it's not available.
:::

```ts
export class RunnableDevEnvironment extends DevEnvironment {
  public readonly runner: ModuleRunnner
}

if (isRunnableDevEnvironment(server.environments.ssr)) {
  await server.environments.ssr.runner.import('/entry-point.js')
}
```

An environment instance in the Vite server lets you process a URL using the `environment.transformRequest(url)` method. This function will use the plugin pipeline to resolve the `url` to a module `id`, load it (reading the file from the file system or through a plugin that implements a virtual module), and then transform the code. While transforming the module, imports and other metadata will be recorded in the environment module graph by creating or updating the corresponding module node. When processing is done, the transform result is also stored in the module.

But the environment instance can't execute the code itself, as the runtime where the module will be run could be different from the one the Vite server is running in. This is the case for the browser environment. When a html is loaded in the browser, its scripts are executed triggering the evaluation of the entire static module graph. Each imported URL generates a request to the Vite server to get the module code, which ends up handled by the Transform Middleware by calling `server.environments.client.transformRequest(url)`. The connection between the environment instance in the server and the module runner in the browser is carried out through HTTP in this case.

:::info transformRequest naming
We are using `transformRequest(url)` and `warmupRequest(url)` in the current version of this proposal so it is easier to discuss and understand for users used to Vite's current API. Before releasing, we can take the opportunity to review these names too. For example, it could be named `environment.processModule(url)` or `environment.loadModule(url)` taking a page from Rollup's `context.load(id)` in plugin hooks. For the moment, we think keeping the current names and delaying this discussion is better.
:::

:::info Running a module
The initial proposal had a `run` method that would allow consumers to invoke an import on the runner side by using the `transport` option. During our testing we found out that the API was not universal enough to start recommending it. We are open to implement a built-in layer for remote SSR implementation based on the frameworks feedback. In the meantime, Vite still exposes a [`RunnerTransport` API](#runnertransport) to hide the complexity of the runner RPC.
:::

In dev mode the default `ssr` environment is a `RunnableDevEnvironment` with a module runner that implements evaluation using `new AsyncFunction` running in the same JS runtime as the dev server. This runner is an instance of `ModuleRunner` that exposes:

```ts
class ModuleRunner {
  /**
   * URL to execute. Accepts file path, server path, or id relative to the root.
   * Returns an instantiated module (same as in ssrLoadModule)
   */
  public async import(url: string): Promise<Record<string, any>>
  /**
   * Other ModuleRunner methods...
   */
```

:::info
In the v5.1 Runtime API, there were `executeUrl` and `executeEntryPoint` methods - they are now merged into a single `import` method. If you want to opt-out of the HMR support, create a runner with `hmr: false` flag.
:::

Given a Vite server configured in middleware mode as described by the [SSR setup guide](/guide/ssr#setting-up-the-dev-server), let's implement the SSR middleware using the environment API. Error handling is omitted.

```js
import { createServer, createRunnableDevEnvironment } from 'vite'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  environments: {
    node: {
      dev: {
        // Default Vite SSR environment can be overridden in the config, so
        // make sure you have a Node environment before the request is received.
        createEnvironment(name, config) {
          return createRunnableDevEnvironment(name, config)
        },
      },
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

## Environment agnostic SSR

::: info
It isn't clear yet what APIs Vite should provide to cover the most common SSR use cases. We are thinking on releasing the Environment API without an official way to do environment agnostic SSR to let the ecosystem explore common patterns first.
:::

## Separate module graphs

Each environment has an isolated module graph. All module graphs have the same signature, so generic algorithms can be implemented to crawl or query the graph without depending on the environment. `hotUpdate` is a good example. When a file is modified, the module graph of each environment will be used to discover the affected modules and perform HMR for each environment independently.

::: info
Vite v5 had a mixed Client and SSR module graph. Given an unprocessed or invalidated node, it isn't possible to know if it corresponds to the Client, SSR, or both environments. Module nodes have some properties prefixed, like `clientImportedModules` and `ssrImportedModules` (and `importedModules` that returns the union of both). `importers` contains all importers from both the Client and SSR environment for each module node. A module node also has `transformResult` and `ssrTransformResult`. A backward compatibility layer allows the ecosystem to migrate from the deprecated `server.moduleGraph`.
:::

Each module is represented by a `EnvironmentModuleNode` instance. Modules may be registered in the graph without yet being processed (`transformResult` would be `null` in that case). `importers` and `importedModules` are also updated after the module is processed.

```ts
class EnvironmentModuleNode {
  environment: string

  url: string
  id: string | null = null
  file: string | null = null

  type: 'js' | 'css'

  importers = new Set<EnvironmentModuleNode>()
  importedModules = new Set<EnvironmentModuleNode>()
  importedBindings: Map<string, Set<string>> | null = null

  info?: ModuleInfo
  meta?: Record<string, any>
  transformResult: TransformResult | null = null

  acceptedHmrDeps = new Set<EnvironmentModuleNode>()
  acceptedHmrExports: Set<string> | null = null
  isSelfAccepting?: boolean
  lastHMRTimestamp = 0
  lastInvalidationTimestamp = 0
}
```

`environment.moduleGraph` is an instance of `EnvironmentModuleGraph`:

```ts
export class EnvironmentModuleGraph {
  environment: string

  urlToModuleMap = new Map<string, EnvironmentModuleNode>()
  idToModuleMap = new Map<string, EnvironmentModuleNode>()
  etagToModuleMap = new Map<string, EnvironmentModuleNode>()
  fileToModulesMap = new Map<string, Set<EnvironmentModuleNode>>()

  constructor(
    environment: string,
    resolveId: (url: string) => Promise<PartialResolvedId | null>,
  )

  async getModuleByUrl(
    rawUrl: string,
  ): Promise<EnvironmentModuleNode | undefined>

  getModulesByFile(file: string): Set<EnvironmentModuleNode> | undefined

  onFileChange(file: string): void

  invalidateModule(
    mod: EnvironmentModuleNode,
    seen: Set<EnvironmentModuleNode> = new Set(),
    timestamp: number = Date.now(),
    isHmr: boolean = false,
  ): void

  invalidateAll(): void

  async ensureEntryFromUrl(
    rawUrl: string,
    setIsSelfAccepting = true,
  ): Promise<EnvironmentModuleNode>

  createFileOnlyEntry(file: string): EnvironmentModuleNode

  async resolveUrl(url: string): Promise<ResolvedUrl>

  updateModuleTransformResult(
    mod: EnvironmentModuleNode,
    result: TransformResult | null,
  ): void

  getModuleByEtag(etag: string): EnvironmentModuleNode | undefined
}
```

## Creating new environments

One of the goals of this feature is to provide a customizable API to process and run code. Users can create new environment types using the exposed primitives.

```ts
import { DevEnvironment, RemoteEnvironmentTransport } from 'vite'

function createWorkerdDevEnvironment(name: string, config: ResolvedConfig, context: DevEnvironmentContext) {
  const hot = /* ... */
  const connection = /* ... */
  const transport = new RemoteEnvironmentTransport({
    send: (data) => connection.send(data),
    onMessage: (listener) => connection.on('message', listener),
  })

  const workerdDevEnvironment = new DevEnvironment(name, config, {
    options: {
      resolve: { conditions: ['custom'] },
      ...context.options,
    },
    hot,
    remoteRunner: {
      transport,
    },
  })
  return workerdDevEnvironment
}
```

Then users can create a workerd environment to do SSR using:

```js
const ssrEnvironment = createWorkerdEnvironment('ssr', config)
```

## Environment Configuration

Environments are explicitly configured with the `environments` config option.

```js
export default {
  environments: {
    client: {
      resolve: {
        conditions: [], // configure the Client environment
      },
    },
    ssr: {
      dev: {
        optimizeDeps: {}, // configure the SSR environment
      },
    },
    rsc: {
      resolve: {
        noExternal: true, // configure a custom environment
      },
    },
  },
}
```

All environment configs extend from user's root config, allowing users add defaults for all environments at the root level. This is quite useful for the common use case of configuring a Vite client only app, that can be done without going through `environments.client`.

```js
export default {
  resolve: {
    conditions: [], // configure a default for all environments
  },
}
```

The `EnvironmentOptions` interface exposes all the per-environment options. There are `SharedEnvironmentOptions` that apply to both `build` and `dev`, like `resolve`. And there are `DevEnvironmentOptions` and `BuildEnvironmentOptions` for dev and build specific options (like `dev.optimizeDeps` or `build.outDir`).

```ts
interface EnvironmentOptions extends SharedEnvironmentOptions {
  dev: DevOptions
  build: BuildOptions
}
```

As we explained, Environment specific options defined at the root level of user config are used for the default client environment (the `UserConfig` interface extends from the `EnvironmentOptions` interface). And environments can be configured explicitly using the `environments` record. The `client` and `ssr` environments are always present during dev, even if an empty object is set to `environments`. This allows backward compatibility with `server.ssrLoadModule(url)` and `server.moduleGraph`. During build, the `client` environment is always present, and the `ssr` environment is only present if it is explicitly configured (using `environments.ssr` or for backward compatibility `build.ssr`).

```ts
interface UserConfig extends EnvironmentOptions {
  environments: Record<string, EnvironmentOptions>
  // other options
}
```

::: info

The `ssr` top level property has many options in common with `EnvironmentOptions`. This option was created for the same use case as `environments` but only allowed configuration of a small number of options. We're going to deprecate it in favour of a unified way to define environment configuration.

:::

## Custom environment instances

To create custom dev or build environment instances, you can use the `dev.createEnvironment` or `build.createEnvironment` functions.

```js
export default {
  environments: {
    rsc: {
      dev: {
        createEnvironment(name, config, { watcher }) {
          // Called with 'rsc' and the resolved config during dev
          return createRunnableDevEnvironment(name, config, {
            hot: customHotChannel(),
            watcher
          })
        }
      },
      build: {
        createEnvironment(name, config) {
          // Called with 'rsc' and the resolved config during build
          return createNodeBuildEnvironment(name, config)
        }
        outDir: '/dist/rsc',
      },
    },
  },
}
```

The environment will be accessible in middlewares or plugin hooks through `server.environments`. In plugin hooks, the environment instance is passed in the options so they can do conditions depending on the way they are configured.

Environment providers like Workerd, can expose an environment provider for the most common case of using the same runtime for both dev and build environments. The default environment options can also be set so the user doesn't need to do it.

```js
function createWorkedEnvironment(userConfig) {
  return mergeConfig(
    {
      resolve: {
        conditions: [
          /*...*/
        ],
      },
      dev: {
        createEnvironment(name, config, { watcher }) {
          return createWorkerdDevEnvironment(name, config, {
            hot: customHotChannel(),
            watcher,
          })
        },
      },
      build: {
        createEnvironment(name, config) {
          return createWorkerdBuildEnvironment(name, config)
        },
      },
    },
    userConfig,
  )
}
```

Then the config file can be written as

```js
import { createWorkerdEnvironment } from 'vite-environment-workerd'

export default {
  environments: {
    ssr: createWorkerdEnvironment({
      build: {
        outDir: '/dist/ssr',
      },
    }),
    rsc: createWorkerdEnvironment({
      build: {
        outDir: '/dist/rsc',
      },
    }),
  ],
}
```

In this case we see how the `ssr` environment can be configured to use workerd as it's runtime. Additionally a new custom RSC environment is also defined, backed by a separate instance of the workerd runtime.

## Plugins and environments

### Accessing the current environment in hooks

The Vite server has a shared plugin pipeline, but when a module is processed it is always done in the context of a given environment. The `environment` instance is available in the plugin context of `resolveId`, `load`, and `transform`.

A plugin could use the `environment` instance to:

- Only apply logic for certain environments.
- Change the way they work depending on the configuration for the environment, which can be accessed using `environment.config`. The vite core resolve plugin modifies the way it resolves ids based on `environment.config.resolve.conditions` for example.

```ts
  transform(code, id) {
    console.log(this.environment.config.resolve.conditions)
  }
```

### Registering new environments using hooks

Plugins can add new environments in the `config` hook:

```ts
  config(config: UserConfig) {
    config.environments.rsc ??= {}
  }
```

An empty object is enough to register the environment, default values from the root level environment config.

### Configuring environment using hooks

While the `config` hook is running, the complete list of environments isn't yet known and the environments can be affected by both the default values from the root level environment config or explicitly through the `config.environments` record.
Plugins should set default values using the `config` hook. To configure each environment, they can use the new `configEnvironment` hook. This hook is called for each environment with its partially resolved config including resolution of final defaults.

```ts
  configEnvironment(name: string, options: EnvironmentOptions) {
    if (name === 'rsc') {
      options.resolve.conditions = // ...
```

### The `hotUpdate` hook

- **Type:** `(this: { environment: DevEnvironment }, options: HotUpdateOptions) => Array<EnvironmentModuleNode> | void | Promise<Array<EnvironmentModuleNode> | void>`
- **See also:** [HMR API](./api-hmr)

The `hotUpdate` hook allows plugins to perform custom HMR update handling for a given environment. When a file changes, the HMR algorithm is run for each environment in series according to the order in `server.environments`, so the `hotUpdate` hook will be called multiple times. The hook receives a context object with the following signature:

```ts
interface HotUpdateContext {
  type: 'create' | 'update' | 'delete'
  file: string
  timestamp: number
  modules: Array<EnvironmentModuleNode>
  read: () => string | Promise<string>
  server: ViteDevServer
}
```

- `this.environment` is the module execution environment where a file update is currently being processed.

- `modules` is an array of modules in this environment that are affected by the changed file. It's an array because a single file may map to multiple served modules (e.g. Vue SFCs).

- `read` is an async read function that returns the content of the file. This is provided because, on some systems, the file change callback may fire too fast before the editor finishes updating the file, and direct `fs.readFile` will return empty content. The read function passed in normalizes this behavior.

The hook can choose to:

- Filter and narrow down the affected module list so that the HMR is more accurate.

- Return an empty array and perform a full reload:

  ```js
  hotUpdate({ modules, timestamp }) {
    if (this.environment.name !== 'client')
      return

    // Invalidate modules manually
    const invalidatedModules = new Set()
    for (const mod of modules) {
      this.environment.moduleGraph.invalidateModule(
        mod,
        invalidatedModules,
        timestamp,
        true
      )
    }
    this.environment.hot.send({ type: 'full-reload' })
    return []
  }
  ```

- Return an empty array and perform complete custom HMR handling by sending custom events to the client:

  ```js
  hotUpdate() {
    if (this.environment.name !== 'client')
      return

    this.environment.hot.send({
      type: 'custom',
      event: 'special-update',
      data: {}
    })
    return []
  }
  ```

  Client code should register the corresponding handler using the [HMR API](./api-hmr) (this could be injected by the same plugin's `transform` hook):

  ```js
  if (import.meta.hot) {
    import.meta.hot.on('special-update', (data) => {
      // perform custom update
    })
  }
  ```

### Per-environment Plugins

A plugin can define what are the environments it should apply to with the `applyToEnvironment` function.

```js
const UnoCssPlugin = () => {
  // shared global state
  return {
    buildStart() {
      // init per environment state with WeakMap<Environment,Data>, this.environment
    },
    configureServer() {
      // use global hooks normally
    },
    applyToEnvironment(environment) {
      // return true if this plugin should be active in this environment
      // if the function isn't provided, the plugin is active in all environments
    },
    resolveId(id, importer) {
      // only called for environments this plugin apply to
    },
  }
}
```

## `ModuleRunner`

A module runner is instantiated in the target runtime. All APIs in the next section are imported from `vite/module-runner` unless stated otherwise. This export entry point is kept as lightweight as possible, only exporting the minimal needed to create module runners.

**Type Signature:**

```ts
export class ModuleRunner {
  constructor(
    public options: ModuleRunnerOptions,
    public evaluator: ModuleEvaluator,
    private debug?: ModuleRunnerDebugger,
  ) {}
  /**
   * URL to execute. Accepts file path, server path, or id relative to the root.
   */
  public async import<T = any>(url: string): Promise<T>
  /**
   * Clear all caches including HMR listeners.
   */
  public clearCache(): void
  /**
   * Clears all caches, removes all HMR listeners, and resets source map support.
   * This method doesn't stop the HMR connection.
   */
  public async close(): Promise<void>
  /**
   * Returns `true` if the runner has been closed by calling `close()` method.
   */
  public isClosed(): boolean
}
```

The module evaluator in `ModuleRunner` is responsible for executing the code. Vite exports `ESModulesEvaluator` out of the box, it uses `new AsyncFunction` to evaluate the code. You can provide your own implementation if your JavaScript runtime doesn't support unsafe evaluation.

Module runner exposes `import` method. When Vite server triggers `full-reload` HMR event, all affected modules will be re-executed. Be aware that Module Runner doesn't update `exports` object when this happens (it overrides it), you would need to run `import` or get the module from `evaluatedModules` again if you rely on having the latest `exports` object.

**Example Usage:**

```js
import { ModuleRunner, ESModulesEvaluator } from 'vite/module-runner'
import { root, fetchModule } from './rpc-implementation.js'

const moduleRunner = new ModuleRunner(
  {
    root,
    fetchModule,
    // you can also provide hmr.connection to support HMR
  },
  new ESModulesEvaluator(),
)

await moduleRunner.import('/src/entry-point.js')
```

## `ModuleRunnerOptions`

```ts
export interface ModuleRunnerOptions {
  /**
   * Root of the project
   */
  root: string
  /**
   * A set of methods to communicate with the server.
   */
  transport: RunnerTransport
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
        connection: ModuleRunnerHMRConnection
        /**
         * Configure HMR logger.
         */
        logger?: false | HMRLogger
      }
  /**
   * Custom module cache. If not provided, it creates a separate module cache for each module runner instance.
   */
  evaluatedModules?: EvaluatedModules
}
```

## `ModuleEvaluator`

**Type Signature:**

```ts
export interface ModuleEvaluator {
  /**
   * Number of prefixed lines in the transformed code.
   */
  startOffset?: number
  /**
   * Evaluate code that was transformed by Vite.
   * @param context Function context
   * @param code Transformed code
   * @param id ID that was used to fetch the module
   */
  runInlinedModule(
    context: ModuleRunnerContext,
    code: string,
    id: string,
  ): Promise<any>
  /**
   * evaluate externalized module.
   * @param file File URL to the external module
   */
  runExternalModule(file: string): Promise<any>
}
```

Vite exports `ESModulesEvaluator` that implements this interface by default. It uses `new AsyncFunction` to evaluate code, so if the code has inlined source map it should contain an [offset of 2 lines](https://tc39.es/ecma262/#sec-createdynamicfunction) to accommodate for new lines added. This is done automatically by the `ESModulesEvaluator`. Custom evaluators will not add additional lines.

## RunnerTransport

**Type Signature:**

```ts
interface RunnerTransport {
  /**
   * A method to get the information about the module.
   */
  fetchModule: FetchFunction
}
```

Transport object that communicates with the environment via an RPC or by directly calling the function. By default, you need to pass an object with `fetchModule` method - it can use any type of RPC inside of it, but Vite also exposes bidirectional transport interface via a `RemoteRunnerTransport` class to make the configuration easier. You need to couple it with the `RemoteEnvironmentTransport` instance on the server like in this example where module runner is created in the worker thread:

::: code-group

```ts [worker.js]
import { parentPort } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import {
  ESModulesEvaluator,
  ModuleRunner,
  RemoteRunnerTransport,
} from 'vite/module-runner'

const runner = new ModuleRunner(
  {
    root: fileURLToPath(new URL('./', import.meta.url)),
    transport: new RemoteRunnerTransport({
      send: (data) => parentPort.postMessage(data),
      onMessage: (listener) => parentPort.on('message', listener),
      timeout: 5000,
    }),
  },
  new ESModulesEvaluator(),
)
```

```ts [server.js]
import { BroadcastChannel } from 'node:worker_threads'
import { createServer, RemoteEnvironmentTransport, DevEnvironment } from 'vite'

function createWorkerEnvironment(name, config, context) {
  const worker = new Worker('./worker.js')
  return new DevEnvironment(name, config, {
    hot: /* custom hot channel */,
    remoteRunner: {
      transport: new RemoteEnvironmentTransport({
        send: (data) => worker.postMessage(data),
        onMessage: (listener) => worker.on('message', listener),
      }),
    },
  })
}

await createServer({
  environments: {
    worker: {
      dev: {
        createEnvironment: createWorkerEnvironment,
      },
    },
  },
})
```

:::

`RemoteRunnerTransport` and `RemoteEnvironmentTransport` are meant to be used together, but you don't have to use them at all. You can define your own function to communicate between the runner and the server. For example, if you connect to the environment via an HTTP request, you can call `fetch().json()` in `fetchModule` function:

```ts
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'

export const runner = new ModuleRunner(
  {
    root: fileURLToPath(new URL('./', import.meta.url)),
    transport: {
      async fetchModule(id, importer) {
        const response = await fetch(
          `http://my-vite-server/fetch?id=${id}&importer=${importer}`,
        )
        return response.json()
      },
    },
  },
  new ESModulesEvaluator(),
)

await runner.import('/entry.js')
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

## ModuleRunnerHMRConnection

**Type Signature:**

```ts
export interface ModuleRunnerHMRConnection {
  /**
   * Checked before sending messages to the server.
   */
  isReady(): boolean
  /**
   * Send a message to the server.
   */
  send(payload: HotPayload): void
  /**
   * Configure how HMR is handled when this connection triggers an update.
   * This method expects that the connection will start listening for HMR updates and call this callback when it's received.
   */
  onUpdate(callback: (payload: HotPayload) => void): void
}
```

This interface defines how HMR communication is established. Vite exports `ServerHMRConnector` from the main entry point to support HMR during Vite SSR. The `isReady` and `send` methods are usually called when the custom event is triggered (like, `import.meta.hot.send("my-event")`).

`onUpdate` is called only once when the new module runner is initiated. It passed down a method that should be called when connection triggers the HMR event. The implementation depends on the type of connection (as an example, it can be `WebSocket`/`EventEmitter`/`MessageChannel`), but it usually looks something like this:

```js
function onUpdate(callback) {
  this.connection.on('hmr', (event) => callback(event.data))
}
```

The callback is queued and it will wait for the current update to be resolved before processing the next update. Unlike the browser implementation, HMR updates in a module runner will wait until all listeners (like, `vite:beforeUpdate`/`vite:beforeFullReload`) are finished before updating the modules.

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

### Environment in build hooks

In the same way as during dev, plugin hooks also receive the environment instance during build, replacing the `ssr` boolean.
This also works for `renderChunk`, `generateBundle`, and other build only hooks.

### Shared plugins during build

Before Vite 6, the plugins pipelines worked in a different way during dev and build:

- **During dev:** plugins are shared
- **During Build:** plugins are isolated for each environment (in different processes: `vite build` then `vite build --ssr`).

This forced frameworks to share state between the `client` build and the `ssr` build through manifest files written to the file system. In Vite 6, we are now building all environments in a single process so the way the plugins pipeline and inter-environment communication can be aligned with dev.

In a future major (Vite 7 or 8), we aim to have complete alignment:

- **During both dev and build:** plugins are shared, with [per-environment filtering](#per-environment-plugins)

There will also be a single `ResolvedConfig` instance shared during build, allowing for caching at entire app build process level in the same way as we have been doing with `WeakMap<ResolvedConfig, CachedData>` during dev.

For Vite 6, we need to do a smaller step to keep backward compatibility. Ecosystem plugins are currently using `config.build` instead of `environment.config.build` to access configuration, so we need to create a new `ResolvedConfig` per environment by default. A project can opt-in into sharing the full config and plugins pipeline setting `builder.sharedConfigBuild` to `true`.

This option would only work of a small subset of projects at first, so plugin authors can opt-in for a particular plugin to be shared by setting the `sharedDuringBuild` flag to `true`. This allows for easily sharing state both for regular plugins:

```js
function myPlugin() {
  // Share state among all environments in dev and build
  const sharedState = ...
  return {
    name: 'shared-plugin',
    transform(code, id) { ... },

    // Opt-in into a single instance for all environments
    sharedDuringBuild: true,
  }
}
```

## Backward Compatibility

The current Vite server API are not yet deprecated and are backward compatible with Vite 5. The new Environment API is experimental.

The `server.moduleGraph` returns a mixed view of the client and ssr module graphs. Backward compatible mixed module nodes will be returned from all its methods. The same scheme is used for the module nodes passed to `handleHotUpdate`.

We don't recommend switching to Environment API yet. We are aiming for a good portion of the user base to adopt Vite 6 before so plugins don't need to maintain two versions. Checkout the future breaking changes section for information on future deprecations and upgrade path:

- [`this.environment` in Hooks](/changes/this-environment-in-hooks)
- [HMR `hotUpdate` Plugin Hook](/changes/hotupdate-hook)
- [Move to per-environment APIs](/changes/per-environment-apis)
- [SSR using `ModuleRunner` API](/changes/ssr-using-modulerunner)
- [Shared plugins during build](/changes/shared-plugins-during-build)
