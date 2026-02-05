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

Uses [Oxc Transformer](https://oxc.rs/docs/guide/usage/transformer) and [Babel](https://babeljs.io/), achieving fast HMR with a small package footprint and the flexibility of being able to use the Babel transform pipeline. Without additional Babel plugins, only Oxc Transformer is used.

### [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react-swc)

Replaces Babel with [SWC](https://swc.rs/) during development. During production builds, SWC+Oxc Transformer are used when using plugins, and Oxc Transformer only otherwise. For big projects that require custom plugins, cold start and Hot Module Replacement (HMR) can be significantly faster, if the plugin is also available for SWC.

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
