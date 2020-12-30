# @vitejs/plugin-react-refresh

```js
// vite.config.js
// @ts-check
import reactRefreshPlugin from '@vitejs/plugin-react-refresh'

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  plugins: [reactRefreshPlugin()]
}

export default config
```

```ts
// vite.config.ts
import reactRefreshPlugin from '@vitejs/plugin-react-refresh'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  plugins: [reactRefreshPlugin()]
}

export default config
```

## License

MIT
