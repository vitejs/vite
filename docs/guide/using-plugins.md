# Using Plugins

Vite can be extended using plugins, which are based on Rollup's well-designed plugin interface with a few extra Vite-specific options. This means that Vite users can rely on the mature ecosystem of Rollup plugins, while also being able to extend the dev server and SSR functionality as needed.

## Adding a Plugin

To use a plugin, it needs to be added to the `devDependencies` of the project and included in the `plugins` array in the `vite.config.js` config file. For example, to provide support for legacy browsers, the official [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) can be used:

```
$ npm add -D @vitejs/plugin-legacy
```

```js
// vite.config.js
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
})
```

`plugins` also accepts presets including several plugins as a single element. This is useful for complex features (like framework integration) that are implemented using several plugins. The array will be flattened internally.

Falsy plugins will be ignored, which can be used to easily activate or deactivate plugins.

## Finding Plugins

:::tip NOTE
Vite aims to provide out-of-the-box support for common web development patterns. Before searching for a Vite or compatible Rollup plugin, check out the [Features Guide](../guide/features.md). A lot of the cases where a plugin would be needed in a Rollup project are already covered in Vite.
:::

Check out the [Plugins section](../plugins/) for information about official plugins. Community plugins are listed in [awesome-vite](https://github.com/vitejs/awesome-vite#plugins). For compatible Rollup plugins, check out [Vite Rollup Plugins](https://vite-rollup-plugins.patak.dev) for a list of compatible official Rollup plugins with usage instructions or the [Rollup Plugin Compatibility section](../guide/api-plugin#rollup-plugin-compatibility) in case it is not listed there.

You can also find plugins that follow the [recommended conventions](./api-plugin.md#conventions) using a [npm search for vite-plugin](https://www.npmjs.com/search?q=vite-plugin&ranking=popularity) for Vite plugins or a [npm search for rollup-plugin](https://www.npmjs.com/search?q=rollup-plugin&ranking=popularity) for Rollup plugins.

## Enforcing Plugin Ordering

For compatibility with some Rollup plugins, it may be needed to enforce the order of the plugin or only apply at build time. This should be an implementation detail for Vite plugins. You can enforce the position of a plugin with the `enforce` modifier:

- `pre`: invoke plugin before Vite core plugins
- default: invoke plugin after Vite core plugins
- `post`: invoke plugin after Vite build plugins

```js
// vite.config.js
import image from '@rollup/plugin-image'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      ...image(),
      enforce: 'pre',
    },
  ],
})
```

Check out [Plugins API Guide](./api-plugin.md#plugin-ordering) for detailed information, and look out for the `enforce` label and usage instructions for popular plugins in the [Vite Rollup Plugins](https://vite-rollup-plugins.patak.dev) compatibility listing.

## Conditional Application

By default, plugins are invoked for both serve and build. In cases where a plugin needs to be conditionally applied only during serve or build, use the `apply` property to only invoke them during `'build'` or `'serve'`:

```js
// vite.config.js
import typescript2 from 'rollup-plugin-typescript2'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      ...typescript2(),
      apply: 'build',
    },
  ],
})
```

## Building Plugins

Check out the [Plugins API Guide](./api-plugin.md) for documentation about creating plugins.
