# @vitejs/plugin-vue-jsx [![npm](https://img.shields.io/npm/v/@vitejs/plugin-vue-jsx.svg)](https://npmjs.com/package/@vitejs/plugin-vue-jsx)

Provides Vue 3 JSX & TSX support with HMR.

```js
// vite.config.js
import vueJsx from '@vitejs/plugin-vue-jsx'

export default {
  plugins: [
    vueJsx({
      // options are passed on to @vue/babel-plugin-jsx
    })
  ]
}
```

## Options

### include

Type: `(string | RegExp)[] | string | RegExp | null`

Default: `/\.[jt]sx$/`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files the plugin should operate on.

### exclude

Type: `(string | RegExp)[] | string | RegExp | null`

Default: `undefined`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files to be ignored by the plugin.

> See [@vue/babel-plugin-jsx](https://github.com/vuejs/jsx-next) for other options.

## HMR Detection

This plugin supports HMR of Vue JSX components. The detection requirements are:

- The component must be exported.
- The component must be declared by calling `defineComponent` via a root-level statement, either variable declaration or export declaration.

### Supported patterns

```jsx
import { defineComponent } from 'vue'

// named exports w/ variable declaration: ok
export const Foo = defineComponent({})

// named exports referencing variable declaration: ok
const Bar = defineComponent({ render() { return <div>Test</div> }})
export { Bar }

// default export call: ok
export default defineComponent({ render() { return <div>Test</div> }})

// default export referencing variable declaration: ok
const Baz = defineComponent({ render() { return <div>Test</div> }})
export default Baz
```

### Non-supported patterns

```jsx
// not using `defineComponent` call
export const Bar = { ... }

// not exported
const Foo = defineComponent(...)
```
