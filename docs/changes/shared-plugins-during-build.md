# Shared Plugins during Build

::: tip Feedback
Give us feedback at [Environment API feedback discussion](https://github.com/vitejs/vite/discussions/16358)
:::

See [Shared plugins during build](/guide/api-environment.md#shared-plugins-during-build).

Affect scope: `Vite Plugin Authors`

::: warning Future Default Change
`builder.sharedConfigBuild` was first introduce in `v6.0`. You can set it true to check how your plugins work with a shared config. We're looking for feedback about changing the default in a future major once the plugin ecosystem is ready.
:::

## Motivation

Align dev and build plugin pipelines.

## Migration Guide

To be able to share plugins across environments, plugin state must be keyed by the current environment. A plugin of the following form will count the number of transformed modules across all environments.

```js
function CountTransformedModulesPlugin() {
  let transformedModules
  return {
    name: 'count-transformed-modules',
    buildStart() {
      transformedModules = 0
    },
    transform(id) {
      transformedModules++
    },
    buildEnd() {
      console.log(transformedModules)
    },
  }
}
```

If we instead want to count the number of transformed modules for each environment, we need to keep a map:

```js
function PerEnvironmentCountTransformedModulesPlugin() {
  const state = new Map<Environment, { count: number }>()
  return {
    name: 'count-transformed-modules',
    perEnvironmentStartEndDuringDev: true,
    buildStart() {
      state.set(this.environment, { count: 0 })
    }
    transform(id) {
      state.get(this.environment).count++
    },
    buildEnd() {
      console.log(this.environment.name, state.get(this.environment).count)
    }
  }
}
```

To simplify this pattern, Vite exports a `perEnvironmentState` helper:

```js
function PerEnvironmentCountTransformedModulesPlugin() {
  const state = perEnvironmentState<{ count: number }>(() => ({ count: 0 }))
  return {
    name: 'count-transformed-modules',
    perEnvironmentStartEndDuringDev: true,
    buildStart() {
      state(this).count = 0
    }
    transform(id) {
      state(this).count++
    },
    buildEnd() {
      console.log(this.environment.name, state(this).count)
    }
  }
}
```
