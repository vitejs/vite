# @vitejs/plugin-cdn [![npm](https://img.shields.io/npm/v/@vitejs/plugin-cdn.svg)](https://npmjs.com/package/@vitejs/plugin-cdn)

**Note: this plugin requires `vite@^2.0.0-beta.26`**.

A plugin that loads specified dependencies over Native-ESM CDNs during dev, and downloads / includes them in the production bundle during build.

## Usage

```js
// vite.config.js
import cdn from '@vitejs/plugin-cdn'

export default {
  plugins: [
    // provider can be one of: 'skypack' | 'esm.run' | 'jspm'
    cdn('skypack', {
      // list dependencies like in package.json
      // note that jspm does not support semver ranges
      vue: '^3.0.5'
    })
  ]
}
```

## Supported Native ESM CDNs

- [`'skypack'`](https://www.skypack.dev/)
- [`esm.run`](https://www.jsdelivr.com/esm)
- [`jspm`](https://jspm.org/)