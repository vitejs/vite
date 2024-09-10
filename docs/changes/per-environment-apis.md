# Move to per-environment APIs

::: tip Feedback
Give us feedback at [Environment API feedback discussion](https://github.com/vitejs/vite/discussions/16358)
:::

Multiple APIs from ViteDevServer related to module graph has replaced with more isolated Environment APIs.

- `server.moduleGraph` -> [`environment.moduleGraph`](/guide/api-environment#separate-module-graphs)
- `server.transformRequest` -> `environment.transformRequest`
- `server.warmupRequest` -> `environment.warmupRequest`

Affect scope: `Vite Plugin Authors`

::: warning Future Deprecation
The Environment instance was first introduced at `v6.0`. The deprecation of `server.moduleGraph` and other methods that are now in environments is planned for `v7.0`. We don't recommend moving away from server methods yet. To identify your usage, set these in your vite config.

```ts
future: {
  removeServerModuleGraph: 'warn',
  removeServerTransformRequest: 'warn',
}
```

:::

## Motivation

// TODO:

## Migration Guide

// TODO:
