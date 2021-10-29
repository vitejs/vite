# @vitejs/plugin-vue2

[![NPM version](https://img.shields.io/npm/v/@vitejs/plugin-vue2?color=a1b858&label=)](https://www.npmjs.com/package/@vitejs/plugin-vue2)

## Install

```bash
npm install @vitejs/plugin-vue2 -D
```

```js
// vite.config.js
import vue2 from '@vitejs/plugin-vue2'

export default {
  plugins: [vue2(/* options */)]
}
```

## Options

### `vueTemplateOptions`

Type: `Object`<br>
Default: `null`

The options for `@vue/component-compiler-utils`.

### `jsx`

Type: `Boolean`<br>
Default: `false`

The options for jsx transform.

### `jsxOptions`

Type: `Object`<br>

The options for `@vue/babel-preset-jsx`.

### `target`

Type: `String`<br>

The options for esbuild to transform script code

## License

MIT
