# vite

> No-bundle Dev Server for Vue Single-File Components

**⚠️ Warning: Experimental ⚠️**

Create the following files:

**index.html**

```html
<div id="app"></div>
<script type="module">
import { createApp } from 'vue'
import Comp from './Comp.vue'

createApp(Comp).mount('#app')
</script>
```

**Comp.vue**

```vue
<template>
  <button @click="count++">{{ count }}</button>
</template>

<script>
export default {
  data: () => ({ count: 0 })
}
</script>

<style scoped>
button { color: red }
</style>
```

Then run:

```bash
npx vite
```

Go to `http://localhost:3000`, edit the `.vue` file to see changes hot-updated instantly.

## How It Works

- Imports are requested by the browser as native ES module imports - there's no bundling.

- The server intercepts requests to `*.vue` files, compiles them on the fly, and sends them back as JavaScript.

- Imports to npm packages inside `.js` files (and in `<script>` of `index.html`) are re-written on the fly to point to locally installed files (only packages that provide ES module builds will work - `"module"` field will be used if present in `package.json`). There is also plans to integrate with [Snowpack](https://www.snowpack.dev/) to leverage its `web_modules`.

- For libraries that provide ES modules builds that work in browsers, you can also directly import them from a CDN.

## TODOs

- SourceMap
- Snowpack integration
- Custom imports map support
