# @vitejs/plugin-vue [![npm](https://img.shields.io/npm/v/@vitejs/plugin-vue.svg)](https://npmjs.com/package/@vitejs/plugin-vue)

Note: requires `@vue/compiler-sfc` as peer dependency. This is largely a port of `rollup-plugin-vue` with some vite-specific tweaks.

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
   * Transform Vue SFCs into custom elements (requires Vue >= 3.2.0)
   * - `true` -> all `*.vue` imports are converted into custom elements
   * - `string | RegExp` -> matched files are converted into custom elements
   *
   * @default /\.ce\.vue$/
   */
  customElement?: boolean | string | RegExp | (string | RegExp)[]

  // options to pass on to @vue/compiler-sfc
  script?: Partial<SFCScriptCompileOptions>
  template?: Partial<SFCTemplateCompileOptions>
  style?: Partial<SFCStyleCompileOptions>
}
```

## Example for passing options to `@vue/compiler-dom`:

```ts
import vue from '@vitejs/plugin-vue'

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
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

const vueI18nPlugin = {
  name: 'vue-i18n',
  transform(code, id) {
    if (!/vue&type=i18n/.test(id)) {
      return
    }
    if (/\.ya?ml$/.test(id)) {
      code = JSON.stringify(require('js-yaml').safeLoad(code.trim()))
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

> Requires `vue@^3.2.0`

By default, files ending in `*.ce.vue` will be processed as native Custom Elements when imported (created with `defineCustomElement` from Vue core):

```js
import Example from './Example.ce.vue'

// register
customElements.define('my-example', Example)

// can also be instantiated
const myExample = new Example()
```

The `customElement` plugin option can be used to configure the behavior:

- `{ customElement: true }` will import all `*.vue` files as Custom Elements.
- Use a string or regex pattern to change how files should be loaded as Custom Elements (this check is applied after `include` and `exclude` matches).

## License

MIT
