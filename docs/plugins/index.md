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

Uses esbuild and Babel, achieving fast HMR with a small package footprint and the flexibility of being able to use the Babel transform pipeline. Without additional Babel plugins, only esbuild is used during builds.

### [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react-swc)

Replaces Babel with SWC during development. During production builds, SWC+esbuild are used when using plugins, and esbuild only otherwise. For big projects that don't require non-standard React extensions, cold start and Hot Module Replacement (HMR) can be significantly faster.

### [@vitejs/plugin-rsc](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)

Vite supports [React Server Components (RSC)](https://react.dev/reference/rsc/server-components) through the plugin. It utilizes the [Environment API](/guide/api-environment) to provide low-level primitives that React frameworks can use to integrate RSC features. You can try a minimal standalone RSC application with:

```bash
npm create vite@latest -- --template rsc
```

Read the [plugin documentation](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc) to learn more.

### [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy)

Provides legacy browsers support for the production build.

## Community Plugins

Check out [awesome-vite](https://github.com/vitejs/awesome-vite#plugins) - you can also submit a PR to list your plugins there.

## Rollup Plugins

[Vite plugins](../guide/api-plugin) are an extension of Rollup's plugin interface. Check out the [Rollup Plugin Compatibility section](../guide/api-plugin#rollup-plugin-compatibility) for more information.
