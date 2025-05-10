# Move to Per-environment APIs

::: tip Feedback
Give us feedback at [Environment API feedback discussion](https://github.com/vitejs/vite/discussions/16358)
:::

Multiple APIs from `ViteDevServer` related to module graph and modules transforms have been moved to the `DevEnvironment` instances.

Affect scope: `Vite Plugin Authors`

::: warning Future Deprecation
The `Environment` instance was first introduced at `v6.0`. The deprecation of `server.moduleGraph` and other methods that are now in environments is planned for `v7.0`. We don't recommend moving away from server methods yet. To identify your usage, set these in your vite config.

```ts
future: {
  removeServerModuleGraph: 'warn',
  removeServerTransformRequest: 'warn',
}
```

:::

## Motivation

In Vite v5 and before, a single Vite dev server always had two environments (`client` and `ssr`). The `server.moduleGraph` had mixed modules from both of these environments. Nodes were connected through `clientImportedModules` and `ssrImportedModules` lists (but a single `importers` list was maintained for each). A transformed module was represented by an `id` and a `ssr` boolean. This boolean needed to be passed to APIs, for example `server.moduleGraph.getModuleByUrl(url, ssr)` and `server.transformRequest(url, { ssr })`.

In Vite v6, it is now possible to create any number of custom environments (`client`, `ssr`, `edge`, etc). A single `ssr` boolean isn't enough anymore. Instead of changing the APIs to be of the form `server.transformRequest(url, { environment })`, we moved these methods to the environment instance allowing them to be called without a Vite dev server.

## Migration Guide

- `server.moduleGraph` -> [`environment.moduleGraph`](/guide/api-environment#separate-module-graphs)
- `server.transformRequest(url, ssr)` -> `environment.transformRequest(url)`
- `server.warmupRequest(url, ssr)` -> `environment.warmupRequest(url)`
