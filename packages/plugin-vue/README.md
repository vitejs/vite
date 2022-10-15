# @vitejs/plugin-vue [![npm](https://img.shields.io/npm/v/@vitejs/plugin-vue.svg)](https://npmjs.com/package/@vitejs/plugin-vue)

> Note: as of `vue` 3.2.13+ and `@vitejs/plugin-vue` 1.9.0+, `@vue/compiler-sfc` is no longer required as a peer dependency.

```js
// vite.config.js
import vue from '@vitejs/plugin-vue'

export default {
  plugins: [vue()]
}
```

## Options

```ts
export interface Options {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]

  ssr?: boolean
  isProduction?: boolean

  /**
   * Transform Vue SFCs into custom elements (requires vue@^3.2.0)
   * - `true` -> all `*.vue` imports are converted into custom elements
   * - `string | RegExp` -> matched files are converted into custom elements
   *
   * @default /\.ce\.vue$/
   */
  customElement?: boolean | string | RegExp | (string | RegExp)[]

  /**
   * Enable Vue reactivity transform (experimental, requires vue@^3.2.25).
   * https://github.com/vuejs/core/tree/master/packages/reactivity-transform
   *
   * - `true`: transform will be enabled for all vue,js(x),ts(x) files except
   *           those inside node_modules
   * - `string | RegExp`: apply to vue + only matched files (will include
   *                      node_modules, so specify directories in necessary)
   * - `false`: disable in all cases
   *
   * @default false
   */
  reactivityTransform?: boolean | string | RegExp | (string | RegExp)[]

  // options to pass on to vue/compiler-sfc
  script?: Partial<Pick<SFCScriptCompileOptions, 'babelParserPlugins'>>
  template?: Partial<
    Pick<
      SFCTemplateCompileOptions,
      | 'compiler'
      | 'compilerOptions'
      | 'preprocessOptions'
      | 'preprocessCustomRequire'
      | 'transformAssetUrls'
    >
  >
  style?: Partial<Pick<SFCStyleCompileOptions, 'trim'>>
}
```

## Asset URL handling

When `@vitejs/plugin-vue` compiles the `<template>` blocks in SFCs, it also converts any encountered asset URLs into ESM imports.

For example, the following template snippet:

```vue
<img src="../image.png" />
```

Is the same as:

```vue
<script setup>
import _imports_0 from '../image.png'
</script>

<img :src="_imports_0" />
```

By default the following tag/attribute combinations are transformed, and can be configured using the `template.transformAssetUrls` option.

```js
{
  video: ['src', 'poster'],
  source: ['src'],
  img: ['src'],
  image: ['xlink:href', 'href'],
  use: ['xlink:href', 'href']
}
```

Note that only attribute values that are static strings are transformed. Otherwise, you'd need to import the asset manually, e.g. `import imgUrl from '../image.png'`.

## Example for passing options to `vue/compiler-sfc`:

```ts
import vue from '@vitejs/plugin-vue'

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // ...
        },
        transformAssetUrls: {
          // ...
        }
      }
    })
  ]
}
```

## Example for transforming custom blocks

```ts
import vue from '@vitejs/plugin-vue'
import yaml from 'js-yaml'

const vueI18nPlugin = {
  name: 'vue-i18n',
  transform(code, id) {
    if (!/vue&type=i18n/.test(id)) {
      return
    }
    if (/\.ya?ml$/.test(id)) {
      code = JSON.stringify(yaml.load(code.trim()))
    }
    return `export default Comp => {
      Comp.i18n = ${code}
    }`
  }
}

export default {
  plugins: [vue(), vueI18nPlugin]
}
```

## Using Vue SFCs as Custom Elements

> Requires `vue@^3.2.0` & `@vitejs/plugin-vue@^1.4.0`

Vue 3.2 introduces the `defineCustomElement` method, which works with SFCs. By default, `<style>` tags inside SFCs are extracted and merged into CSS files during build. However when shipping a library of custom elements, it may be desirable to inline the styles as JavaScript strings and inject them into the custom elements' shadow root instead.

Starting in 1.4.0, files ending with `*.ce.vue` will be compiled in "custom elements" mode: its `<style>` tags are compiled into inlined CSS strings and attached to the component as its `styles` property:

```js
import { defineCustomElement } from 'vue'
import Example from './Example.ce.vue'

console.log(Example.styles) // ['/* css content */']

// register
customElements.define('my-example', defineCustomElement(Example))
```

Note in custom elements mode there is no need to use `<style scoped>` since the CSS is already scoped inside the shadow DOM.

The `customElement` plugin option can be used to configure the behavior:

- `{ customElement: true }` will import all `*.vue` files in custom element mode.
- Use a string or regex pattern to change how files should be loaded as Custom Elements (this check is applied after `include` and `exclude` matches).

## License

MIT
