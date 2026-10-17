# @paul-browne/vite

A fork of [Vite](https://github.com/vitejs/vite) with options for tools built on Vite that want their own name in its output ([vitejs/vite#23175](https://github.com/vitejs/vite/issues/23175), [vitejs/vite#23695](https://github.com/vitejs/vite/pull/23695)):

- `displayName` shows the tool's name instead of "vite" in CLI banners, log prefixes and the browser console, and leaves Vite's own plugin names (`vite:*`) out of errors, warnings and the error overlay.
- `hiddenPluginNames` leaves more plugin names out the same way, such as the tool's own.
- `configHint` points the error overlay's tip and the blocked-host error at the tool's config file instead of `vite.config.js`.

Each release is based on an upstream Vite release, with the patch number raised for the fork's own changes: 8.3.5 is upstream 8.3.4 plus `hiddenPluginNames` and `configHint`.

Install it under the `vite` name so plugins and `import ... from 'vite'` keep working:

```sh
npm i -D vite@npm:@paul-browne/vite
```

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  displayName: 'my-tool',
  hiddenPluginNames: [/^my-tool:/],
  configHint: { file: 'my-tool.config.js', key: 'vite' },
})
```

The original Vite README follows.

---

# Vite ⚡

> Next Generation Frontend Tooling

- 💡 Instant Server Start
- ⚡️ Lightning Fast HMR
- 🛠️ Rich Features
- 📦 Optimized Build
- 🔩 Universal Plugin Interface
- 🔑 Fully Typed APIs

Vite (French word for "quick", pronounced [`/viːt/`](https://cdn.jsdelivr.net/gh/vitejs/vite@main/docs/public/vite.mp3), like "veet") is a build tool that aims to provide a faster and leaner development experience for modern web projects. It consists of two major parts:

- A dev server that provides [rich feature enhancements](https://vite.dev/guide/features) over [native ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), for example extremely fast [Hot Module Replacement (HMR)](https://vite.dev/guide/features#hot-module-replacement).

- A build command that bundles your code with [Rolldown](https://rolldown.rs), pre-configured to output highly optimized static assets for production.

In addition, Vite is highly extensible via its [Plugin API](https://vite.dev/guide/api-plugin.html) and [JavaScript API](https://vite.dev/guide/api-javascript.html) with full typing support.

[Read the Docs to Learn More](https://vite.dev).
