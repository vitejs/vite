# Environment API for Plugins

:::info Release Candidate
The Environment API is generally in the release candidate phase. We'll maintain stability in the APIs between major releases to allow the ecosystem to experiment and build upon them. However, note that [some specific APIs](/changes/#considering) are still considered experimental.

We plan to stabilize these new APIs (with potential breaking changes) in a future major release once downstream projects have had time to experiment with the new features and validate them.

Resources:

- [Feedback discussion](https://github.com/vitejs/vite/discussions/16358) where we are gathering feedback about the new APIs.
- [Environment API PR](https://github.com/vitejs/vite/pull/16471) where the new API were implemented and reviewed.

Please share your feedback with us.
:::

## Accessing the Current Environment in Hooks

Given that there were only two Environments until Vite 6 (`client` and `ssr`), a `ssr` boolean was enough to identify the current environment in Vite APIs. Plugin Hooks received a `ssr` boolean in the last options parameter, and several APIs expected an optional last `ssr` parameter to properly associate modules to the correct environment (for example `server.moduleGraph.getModuleByUrl(url, { ssr })`).

With the advent of configurable environments, we now have a uniform way to access their options and instance in plugins. Plugin hooks now expose `this.environment` in their context, and APIs that previously expected a `ssr` boolean are now scoped to the proper environment (for example `environment.moduleGraph.getModuleByUrl(url)`).

The Vite server has a shared plugin pipeline, but when a module is processed it is always done in the context of a given environment. The `environment` instance is available in the plugin context.

A plugin could use the `environment` instance to change how a module is processed depending on the configuration for the environment (which can be accessed using `environment.config`).

```ts
  transform(code, id) {
    console.log(this.environment.config.resolve.conditions)
  }
```

## Registering New Environments Using Hooks

Plugins can add new environments in the `config` hook (for example to have a separate module graph for [RSC](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)):

```ts
  config(config: UserConfig) {
    config.environments.rsc ??= {}
  }
```

An empty object is enough to register the environment, default values from the root level environment config.

## Configuring Environment Using Hooks

While the `config` hook is running, the complete list of environments isn't yet known and the environments can be affected by both the default values from the root level environment config or explicitly through the `config.environments` record.
Plugins should set default values using the `config` hook. To configure each environment, they can use the new `configEnvironment` hook. This hook is called for each environment with its partially resolved config including resolution of final defaults.

```ts
  configEnvironment(name: string, options: EnvironmentOptions) {
    if (name === 'rsc') {
      options.resolve.conditions = // ...
```

## The `hotUpdate` Hook

- **Type:** `(this: { environment: DevEnvironment }, options: HotUpdateOptions) => Array<EnvironmentModuleNode> | void | Promise<Array<EnvironmentModuleNode> | void>`
- **See also:** [HMR API](./api-hmr)

The `hotUpdate` hook allows plugins to perform custom HMR update handling for a given environment. When a file changes, the HMR algorithm is run for each environment in series according to the order in `server.environments`, so the `hotUpdate` hook will be called multiple times. The hook receives a context object with the following signature:

```ts
interface HotUpdateOptions {
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

## Per-environment State in Plugins

Given that the same plugin instance is used for different environments, the plugin state needs to be keyed with `this.environment`. This is the same pattern the ecosystem has already been using to keep state about modules using the `ssr` boolean as key to avoid mixing client and ssr modules state. A `Map<Environment, State>` can be used to keep the state for each environment separately. Note that for backward compatibility, `buildStart` and `buildEnd` are only called for the client environment without the `perEnvironmentStartEndDuringDev: true` flag.

```js
function PerEnvironmentCountTransformedModulesPlugin() {
  const state = new Map<Environment, { count: number }>()
  return {
    name: 'count-transformed-modules',
    perEnvironmentStartEndDuringDev: true,
    buildStart() {
      state.set(this.environment, { count: 0 })
    },
    transform(id) {
      state.get(this.environment).count++
    },
    buildEnd() {
      console.log(this.environment.name, state.get(this.environment).count)
    }
  }
}
```

## Per-environment Plugins

A plugin can define what are the environments it should apply to with the `applyToEnvironment` function.

```js
const UnoCssPlugin = () => {
  // shared global state
  return {
    buildStart() {
      // init per-environment state with WeakMap<Environment,Data>
      // using this.environment
    },
    configureServer() {
      // use global hooks normally
    },
    applyToEnvironment(environment) {
      // return true if this plugin should be active in this environment,
      // or return a new plugin to replace it.
      // if the hook is not used, the plugin is active in all environments
    },
    resolveId(id, importer) {
      // only called for environments this plugin apply to
    },
  }
}
```

If a plugin isn't environment aware and has state that isn't keyed on the current environment, the `applyToEnvironment` hook allows to easily make it per-environment.

```js
import { nonShareablePlugin } from 'non-shareable-plugin'

export default defineConfig({
  plugins: [
    {
      name: 'per-environment-plugin',
      applyToEnvironment(environment) {
        return nonShareablePlugin({ outputName: environment.name })
      },
    },
  ],
})
```

Vite exports a `perEnvironmentPlugin` helper to simplify these cases where no other hooks are required:

```js
import { nonShareablePlugin } from 'non-shareable-plugin'

export default defineConfig({
  plugins: [
    perEnvironmentPlugin('per-environment-plugin', (environment) =>
      nonShareablePlugin({ outputName: environment.name }),
    ),
  ],
})
```

The `applyToEnvironment` hook is called at config time, currently after `configResolved` due to projects in the ecosystem modifying the plugins in it. Environment plugins resolution may be moved before `configResolved` in the future.

## Environment in Build Hooks

In the same way as during dev, plugin hooks also receive the environment instance during build, replacing the `ssr` boolean.
This also works for `renderChunk`, `generateBundle`, and other build only hooks.

## Shared Plugins During Build

Before Vite 6, the plugins pipelines worked in a different way during dev and build:

- **During dev:** plugins are shared
- **During Build:** plugins are isolated for each environment (in different processes: `vite build` then `vite build --ssr`).

This forced frameworks to share state between the `client` build and the `ssr` build through manifest files written to the file system. In Vite 6, we are now building all environments in a single process so the way the plugins pipeline and inter-environment communication can be aligned with dev.

In a future major, we could have complete alignment:

- **During both dev and build:** plugins are shared, with [per-environment filtering](#per-environment-plugins)

There will also be a single `ResolvedConfig` instance shared during build, allowing for caching at entire app build process level in the same way as we have been doing with `WeakMap<ResolvedConfig, CachedData>` during dev.

For Vite 6, we need to do a smaller step to keep backward compatibility. Ecosystem plugins are currently using `config.build` instead of `environment.config.build` to access configuration, so we need to create a new `ResolvedConfig` per-environment by default. A project can opt-in into sharing the full config and plugins pipeline setting `builder.sharedConfigBuild` to `true`.

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
