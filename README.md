<p align="center">
  <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://vitejs.dev/logo.svg" alt="Vite logo">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/vite"><img src="https://img.shields.io/npm/v/vite.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite.svg" alt="node compatibility"></a>
  <a href="https://chat.vitejs.dev"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
</p>
<br/>

# ‹div›RIOTS Tools

<p align="center">
  <a href="https://backlight.dev"><img src="https://img.shields.io/badge/Backlight.dev-Design%20System%20Editor-%23f8c307" alt="backlight.dev"></a>
  <a href="https://webcomponents.dev"><img src="https://img.shields.io/badge/WebComponents.dev-Web%20Components%20Studio-%23459BCF" alt="webcomponents.dev"></a>
  <a href="https://components.studio"><img src="https://img.shields.io/badge/Components.studio-Components%20Studio-%23319795" alt="components.studio"></a>
</p>


[‹div›RIOTS](https://divriots.com) are makers of online studios dedicated to Design Systems and Components. We use the *Vite* project in the rendering process of the built-in preview in the editor itself.

# Vite for Browser ⚡

This is a fork of vite which aims at being used in a browser (served by service worker).

Here are the changes made, required to run it in the Browser:
- Generate an un-bundled `browser` build: [rollup.config.js#L218-L274](https://github.com/divriots/vite/blob/browser-vite/packages/vite/rollup.config.js#L218-L274)
  - avoids duplicate dependencies in App using it
  - prefers browser alternatives for dependencies
- Shim CLI-only dependencies (chalk,debug...): [rollup.config.js#L470-L477](https://github.com/divriots/vite/blob/browser-vite/packages/vite/rollup.config.js#L470-L477)
- Limit FS dependency
  - remove watch/glob/config
  - but keep resolving project files through FS (will be shimmed in-App)
- Remove serve
- Remove dependency handling/optimizing/resolving
  - handled in-App through custom plugins
  - using a service to generate/serve optimized dependencies (see below)

Another change was made to support running the dependency optimizer as a service:
- Parse CJS exports (using cjs-module-lexer) to avoid the es-interop transform (further de-coupling vite & optimizer): [#8e80d8](https://github.com/divriots/vite/commit/8e80d88372b4ea287b502ceec7edf52a4c3026b3)

---

**That's all folks ! Below is upstream README !**

---

# Vite ⚡

> Next Generation Frontend Tooling

- 💡 Instant Server Start
- ⚡️ Lightning Fast HMR
- 🛠️ Rich Features
- 📦 Optimized Build
- 🔩 Universal Plugin Interface
- 🔑 Fully Typed APIs

Vite (French word for "fast", pronounced `/vit/`) is a new breed of frontend build tool that significantly improves the frontend development experience. It consists of two major parts:

- A dev server that serves your source files over [native ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), with [rich built-in features](https://vitejs.dev/guide/features.html) and astonishingly fast [Hot Module Replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement).

- A [build command](https://vitejs.dev/guide/build.html) that bundles your code with [Rollup](https://rollupjs.org), pre-configured to output highly optimized static assets for production.

In addition, Vite is highly extensible via its [Plugin API](https://vitejs.dev/guide/api-plugin.html) and [JavaScript API](https://vitejs.dev/guide/api-javascript.html) with full typing support.

[Read the Docs to Learn More](https://vitejs.dev).

## Migrating from 1.x

Check out the [Migration Guide](https://vitejs.dev/guide/migration.html) if you are upgrading from 1.x.

## Packages

| Package                                                       | Version (click for changelogs)                                                                                                                         |
| ------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [vite](packages/vite)                                         | [![vite version](https://img.shields.io/npm/v/vite.svg?label=%20)](packages/vite/CHANGELOG.md)                                                         |
| [@vitejs/plugin-vue](packages/plugin-vue)                     | [![plugin-vue version](https://img.shields.io/npm/v/@vitejs/plugin-vue.svg?label=%20)](packages/plugin-vue/CHANGELOG.md)                               |
| [@vitejs/plugin-vue-jsx](packages/plugin-vue-jsx)             | [![plugin-vue-jsx version](https://img.shields.io/npm/v/@vitejs/plugin-vue-jsx.svg?label=%20)](packages/plugin-vue-jsx/CHANGELOG.md)                   |
| [@vitejs/plugin-react-refresh](packages/plugin-react-refresh) | [![plugin-react-refresh version](https://img.shields.io/npm/v/@vitejs/plugin-react-refresh.svg?label=%20)](packages/plugin-react-refresh/CHANGELOG.md) |
| [@vitejs/plugin-legacy](packages/plugin-legacy)               | [![plugin-legacy version](https://img.shields.io/npm/v/@vitejs/plugin-legacy.svg?label=%20)](packages/plugin-legacy/CHANGELOG.md)                      |
| [create-vite](packages/create-vite)                           | [![create-vite version](https://img.shields.io/npm/v/create-vite.svg?label=%20)](packages/create-vite/CHANGELOG.md)                                    |

## Contribution

See [Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md).

## License

MIT
