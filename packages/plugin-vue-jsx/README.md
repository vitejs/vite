# @vitejs/plugin-vue-jsx

Provides optimized Vue 3 JSX support via [@vue/babel-plugin-jsx](https://github.com/vuejs/jsx-next).

```js
// vite.config.js
import vueJsx from '@vitejs/plugin-vue-jsx'

export default {
  plugins: [vueJsx({
    // options are passed on to @vue/babel-plugin-jsx
  })]
}
```
