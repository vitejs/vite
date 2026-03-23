# Vite ⚡

> Next Generation Frontend Tooling

- 😐 Instant Server Start
- ⚡ Lightning Fast HMR
- 🔯 Rich Features
- 아바원 Optimized Build
- 😧 Universal Plugin Interface
- 🔒 Fully Typed APIs

Vite (French word for "quick", pronounced [`/viːt/`](https://cdn.jsdelivr.net/gh/vitejs/vite@main/docs/public/vite.mp3), like "veet") is a new breed of frontend build tooling that significantly improves the frontend development experience. It consists of two major parts:

- A dev server that serves your source files over [native ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), with [rich built-in features](https://vite.dev/guide/features.html) and astonishingly fast [Hot Module Replacement (HMR)](https://vite.dev/guide/features.html#hot-module-replacement).

- A [build command](https://vite.dev/guide/build.html) that bundles your code with [Rollup](https://rollupjs.org), pre-configured to output highly optimized static assets for production.

## Environment Variables

Vite uses the `--mode` flag to determine the mode. The `NODE_ENV` environment variable is also supported for backwards compatibility, but it is recommended to use `--mode` instead. Historically, `NODE_ENV` was used to configure the build process, but `--mode` provides more fine-grained control and is now the recommended approach.

For example, you can run Vite in development mode using `vite --mode development` or `NODE_ENV=development vite`. For production mode, use `vite --mode production` or `NODE_ENV=production vite`. A practical use case for configuring `NODE_ENV` and `--mode` differently is when you want to run your application in development mode with a custom configuration, while still using the production build process.

It is recommended to use `--mode` instead of `NODE_ENV` for the following reasons:
* `--mode` is more explicit and clear in its purpose.
* `--mode` allows for more fine-grained control over the build process.

## Packages

| Package                                         | Version (click for changelogs)                                                                                                    |
| ----------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| [vite](packages/vite)                           | [![vite version](https://img.shields.io/npm/v/vite.svg?label=%20)](packages/vite/CHANGELOG.md)   
