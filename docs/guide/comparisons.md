# Comparisons with Other No-Bundler Solutions

## Snowpack

[Snowpack](https://www.snowpack.dev/) is also a no-bundle native ESM dev server that is very similar in scope to Vite. Aside from different implementation details, the two projects share a lot in terms of technical advantages over traditional tooling. Vite's dependency pre-bundling is also inspired by Snowpack v1 (now [`esinstall`](https://github.com/snowpackjs/snowpack/tree/main/esinstall)). Some of the main differences between the two projects are:

**Production Build**

Snowpack's default build output is unbundled: it transforms each file into separate built modules, which can then be fed into different "optimizers" that perform the actual bundling. The benefit of this is that you can choose between different end-bundlers to fit specific needs (e.g. webpack, Rollup, or even esbuild), the downside is that it's a bit of a fragmented experience - for example, the esbuild optimizer is still unstable, the Rollup optimizer is not officially maintained, and different optimizers have different output and configurations.

Vite opts to have a deeper integration with one single bundler (Rollup) in order to provide a more streamlined experience. It also allows Vite to support a [Universal Plugin API](./api-plugin) that works for both dev and build.

Due to a more integrated build process, Vite supports a wide range of features that are currently not available in Snowpack build optimizers:

- [Multi-Page Support](./build#multi-page-app)
- [Library Mode](./build#library-mode)
- [Automatic CSS code-splitting](./features#css-code-splitting)
- [Optimized async chunk loading](./features#async-chunk-loading-optimization)
- Official [legacy mode plugin](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) that generates dual modern/legacy bundles and auto delivers the right bundle based on browser support.

**Faster Dependency Pre-Bundling**

Vite uses [esbuild](https://esbuild.github.io/) instead of Rollup for dependency pre-bundling. This results in significant performance improvements in terms of cold server start and re-bundling on dependency invalidations.

**Monorepo Support**

Vite is designed to handle monorepo setups and we have users successfully using it with Yarn, Yarn 2, and PNPM based monorepos.

**CSS Pre-Processor Support**

Vite provides more refined support for Sass and Less, including improved `@import` resolution (aliases and npm dependencies) and [automatic `url()` rebasing for inlined files](./features#import-inlining-and-rebasing).

**First Class Vue Support**

Vite was initially created to serve as the future foundation of [Vue.js](https://vuejs.org/) tooling. Although as of 2.0 Vite is now fully framework-agnostic, the official Vue plugin still provides first-class support for Vue's Single File Component format, covering all advanced features such as template asset reference resolving, `<script setup>`, `<style module>`, custom blocks and more. In addition, Vite provides fine-grained HMR for Vue SFCs. For example, updating the `<template>` or `<style>` of an SFC will perform hot updates without resetting its state.

## WMR

[WMR](https://github.com/preactjs/wmr) by the Preact team provides a similar feature set, and Vite 2.0's support for Rollup's plugin interface is inspired by it.

WMR is mainly designed for [Preact](https://preactjs.com/) projects, and offers more integrated features such as pre-rendering. In terms of scope, it's closer to a Preact meta framework, with the same emphasis on compact size as Preact itself. If you are using Preact, WMR is likely going to offer a more fine-tuned experience.

## @web/dev-server

[@web/dev-server](https://modern-web.dev/docs/dev-server/overview/) (previously `es-dev-server`) is a great project and Vite 1.0's Koa-based server setup was inspired by it.

`@web/dev-server` is a bit lower-level in terms of scope. It does not provide official framework integrations, and requires manually setting up a Rollup configuration for the production build.

Overall, Vite is a more opinionated / higher-level tool that aims to provide a more out-of-the-box workflow. That said, the `@web` umbrella project contains many other excellent tools that may benefit Vite users as well.
