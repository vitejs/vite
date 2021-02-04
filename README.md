<p align="center">
  <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://vitejs.dev/logo.svg" alt="Vite logo">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/vite"><img src="https://img.shields.io/npm/v/vite.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite.svg" alt="node compatility"></a>
  <a href="https://app.circleci.com/pipelines/github/vitejs/vite?branch=main"><img src="https://circleci.com/gh/vitejs/vite/tree/main.svg?style=shield" alt="unix build status"></a>
  <a href="https://ci.appveyor.com/project/yyx990803/vite/branch/main"><img src="https://ci.appveyor.com/api/projects/status/0q4j8062olbcs71l/branch/main?svg=true" alt="windows build status"></a>
  <a href="https://chat.vitejs.dev"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
</p>
<br/>

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

Vite is now in 2.0 beta. Check out the [Migration Guide](https://vitejs.dev/guide/migration.html) if you are upgrading from 1.x.

## Packages

| Package                                                       | Version (click for changelogs)                                                                                                                         |
| ------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [vite](packages/vite)                                         | [![vite version](https://img.shields.io/npm/v/vite.svg?label=%20)](packages/vite/CHANGELOG.md)                                                         |
| [@vitejs/plugin-vue](packages/plugin-vue)                     | [![plugin-vue version](https://img.shields.io/npm/v/@vitejs/plugin-vue.svg?label=%20)](packages/plugin-vue/CHANGELOG.md)                               |
| [@vitejs/plugin-vue-jsx](packages/plugin-vue-jsx)             | [![plugin-vue-jsx version](https://img.shields.io/npm/v/@vitejs/plugin-vue-jsx.svg?label=%20)](packages/plugin-vue-jsx/CHANGELOG.md)                   |
| [@vitejs/plugin-react-refresh](packages/plugin-react-refresh) | [![plugin-react-refresh version](https://img.shields.io/npm/v/@vitejs/plugin-react-refresh.svg?label=%20)](packages/plugin-react-refresh/CHANGELOG.md) |
| [@vitejs/plugin-legacy](packages/plugin-legacy)               | [![plugin-legacy version](https://img.shields.io/npm/v/@vitejs/plugin-legacy.svg?label=%20)](packages/plugin-legacy/CHANGELOG.md)                      |
| [@vitejs/create-app](packages/create-app)                     | [![create-app version](https://img.shields.io/npm/v/@vitejs/create-app.svg?label=%20)](packages/create-app/CHANGELOG.md)                               |

## Contribution

See [Contributing Guide](https://github.com/vitejs/vite/tree/main/.github/contributing.md).

## License

MIT

[npm-img]: https://img.shields.io/npm/v/vite.svg
[npm-url]: https://npmjs.com/package/vite
[node-img]: https://img.shields.io/node/v/vite.svg
[node-url]: https://nodejs.org/en/about/releases/
[unix-ci-img]: https://circleci.com/gh/vitejs/vite/tree/main.svg?style=shield
[unix-ci-url]: https://app.circleci.com/pipelines/github/vitejs/vite?branch=main
[windows-ci-img]: https://ci.appveyor.com/api/projects/status/0q4j8062olbcs71l/branch/main?svg=true
[windows-ci-url]: https://ci.appveyor.com/project/yyx990803/vite/branch/main
[discord-img]: https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord
[discord-url]: https://chat.vitejs.dev
