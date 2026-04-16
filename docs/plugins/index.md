# Plugins

:::tip NOTE
Vite aims to provide out-of-the-box support for common web development patterns. Before searching for a Vite or Compatible Rollup plugin, check out the [Features Guide](../guide/features.md). A lot of the cases where a plugin would be needed in a Rollup project are already covered in Vite.
:::

Check out [Using Plugins](../guide/using-plugins) for information on how to use plugins.

## Official Plugins

### [@vitejs/plugin-vue](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue)

Provides Vue 3 Single File Components support.

### [@vitejs/plugin-vue-jsx](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue-jsx)

Provides Vue 3 JSX support (via [dedicated Babel transform](https://github.com/vuejs/babel-plugin-jsx)).

### [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)

Provides [React Fast Refresh](https://github.com/facebook/react/tree/main/packages/react-refresh) support using [Oxc Transformer](https://oxc.rs/docs/guide/usage/transformer) for JSX and TypeScript compilation. This is the **recommended default** for most React projects.

### [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react-swc)

Replaces Oxc with [SWC](https://swc.rs/) during development. During production builds, SWC+Oxc Transformer are used when using plugins. This plugin is beneficial when you need SWC-specific plugins (e.g., for styled-components or Emotion), or for large projects where SWC's compilation speed provides measurable improvements in cold start and Hot Module Replacement (HMR) times.

::: tip Choosing between plugin-react and plugin-react-swc
Use `@vitejs/plugin-react` unless you have a specific need for SWC plugins or have measured a performance benefit from SWC in your project. Both plugins provide React Fast Refresh and can be swapped without changing your application code.
:::

### [@vitejs/plugin-rsc](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)

Vite supports [React Server Components (RSC)](https://react.dev/reference/rsc/server-components) through the plugin. It utilizes the [Environment API](/guide/api-environment) to provide low-level primitives that React frameworks can use to integrate RSC features. You can try a minimal standalone RSC application with:

```bash
npm create vite@latest -- --template rsc
```

Read the [plugin documentation](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc) to learn more.

### [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy)

Provides legacy browsers support for the production build.

## Community Plugins

Check out [Vite Plugin Registry](https://registry.vite.dev/plugins) for the list of plugins published to npm.

## Rolldown Builtin Plugins

Vite uses [Rolldown](https://rolldown.rs/) under the hood and it provides a few builtin plugins for common use cases.

Read the [Rolldown Builtin Plugins section](https://rolldown.rs/builtin-plugins/) for more information.

## Rolldown / Rollup Plugins

[Vite plugins](../guide/api-plugin) are an extension of Rollup's plugin interface. Check out the [Rollup Plugin Compatibility section](../guide/api-plugin#rolldown-plugin-compatibility) for more information.
