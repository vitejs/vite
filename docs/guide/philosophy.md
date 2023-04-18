# Project Philosophy

## Lean Extendable Core

Vite doesn't intend to cover every use case for every user. [Vite core]() must remain lean with a small API surface to keep the project maintainable long-term. This goal is possible thanks to [Vite's rollup-based plugin system](./api-plugin.md). Features that can be implemented as plugins will not be added to Vite core. [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) is a great example of what can be achieved out of Vite core, and there are a lot of [well maintained plugins](https://github.com/vitejs/awesome-vite#plugins) to cover your needs. Vite works closely with the Rollup project to ensure that plugins can be used in both plain-rollup and Vite projects as much as possible, trying to push needed extensions to the Plugin API upstream when possible.

## A Pragmatic Approach to Performance

Vite has been focused on performance since its [origins](./why.md). Its dev server architecture allows HMR that stays fast as projects scale. Vite uses native tools like [esbuild](https://esbuild.github.io/) and [SWC](https://github.com/vitejs/vite-plugin-react-swc) to implement intensive tasks but keeps the rest of the code in JS to balance speed with flexibility. When needed, framework plugins will tap into [Babel](https://babeljs.io/) to compile user code. And during build time Vite currently uses [Rollup](https://rollupjs.org/) where bundling size and having access to a wide ecosystem of plugins are more important than raw speed. Vite will continue to evolve internally, using new libraries as they appear to improve DX while keeping its API stable.

## Building Frameworks on top of Vite

Although Vite can be used by users directly, it shines as a tool to create frameworks. Vite core is framework agnostic, but there are polished plugins for each UI frameworks. Its [JS API](./api-javascript.md) allows App Framework authors to use Vite features to create tailored experiences for their users. Vite includes support for [SSR primitives](./ssr.md), usually present in higher-level tools but fundamental to building modern web frameworks. And Vite plugins complete the picture offering a way to share between frameworks. Vite is also a great fit when paired with [Backend frameworks](./backend-integration.md) like [Ruby](https://vite-ruby.netlify.app/) and [Laravel](https://laravel.com/docs/10.x/vite).

## Vite-powered Tooling

The Vite Ecosystem works to ensure Vite projects can seamlessly integrate with the wide range of tools we use to develop modern apps. For example, Vite has first-class support in [Storybook](https://storybook.js.org/docs/react/builders/vite). Vite is also used to power new features in common tools. Vite powers Component Testing in both [Playwright](https://playwright.dev/docs/test-components) and [Cypress](https://docs.cypress.io/guides/component-testing/overview). The ecosystem tries to work with established projects when possible, but there are cases where Vite enables the creation of new projects as in the case of [Vitest], a fast test framework. A common theme in tools based on Vite is the collapsing of configuration for a project under a unified Vite pipeline. A single `vite.config.js` would be used to configure the build, dev, and test environments.

## An Active Ecosystem

Vite evolution is a cooperation between framework and plugin maintainers, users, and the Vite team. We encourage active participation in Vite's Core development once a project adopts Vite. We work closely with the main projects in the ecosystem to minimize regressions on each release, aided by tools like [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci). It allows us to run the CI of major projects using Vite on each commit and PR and gives us a clear status of how the Ecosystem would react to a release. We strive to fix regressions before they hit users and allow projects to update to the next versions as soon as they are released. If you are working with Vite, we invite you to [Vite's Discord](https://chat.vitejs.dev) and get involved in the project too.
