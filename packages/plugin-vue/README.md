# @vitejs/plugin-vue

Note: requires `@vue/compiler-sfc` as peer dependency. This is largely a port of `rollup-plugin-vue` with some vite-specific tweaks.

```js
// vite.config.js
// @ts-check
import vuePlugin from '@vitejs/plugin-vue'

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  plugins: [vuePlugin()]
}

export default config
```

```ts
// vite.config.ts
import vuePlugin from '@vitejs/plugin-vue'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  plugins: [vuePlugin()]
}

export default config
```

## License

MIT
