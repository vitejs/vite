# vite ⚡

[![npm][npm-img]][npm-url]
[![node][node-img]][node-url]
[![unix CI status][unix-ci-img]][unix-ci-url]
[![windows CI status][windows-ci-img]][windows-ci-url]

> Next Generation Frontend Tooling

- 💡 Instant Server Start
- ⚡️ Lightning Fast HMR
- 🛠️ Rich Features
- 📦 Optimized Build
- 🔩 Universal Plugin Interface
- 🔑 Fully Typed APIs

Vite (French word for "fast", pronounced `/vit/`) is a new breed of frontend build tool that significantly improves the frontend development experience. It consists of two major parts:

- A dev server that serves your source files over [native ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), with [rich built-in features](./features) and astonishingly fast [Hot Module Replacement (HMR)](./features#hot-module-replacement).

- A [build command](./build) that bundles your code with [Rollup](https://rollupjs.org), pre-configured to output highly optimized static assets for production.

In addition, Vite is highly extensible via its [Plugin API](./api-plugin) and [JavaScript API](./api-javascript) with full typing support.

[Read the Docs to Learn More](https://vitejs.dev).

## Migrating from 1.x

Vite is now in 2.0 beta. Check out the [Migration Guide](https://vitejs.dev/guide/migration.html) if you are upgrading from 1.x.

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
