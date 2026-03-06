# Project Philosophy

## Lean Extendable Core

Vite doesn't intend to cover every use case for every user. Vite aims to support the most common patterns to build Web apps out-of-the-box, but [Vite core](https://github.com/vitejs/vite) must remain lean with a small API surface to keep the project maintainable long-term. This goal is possible thanks to [Vite's rollup-based plugin system](./api-plugin.md). Features that can be implemented as external plugins will generally not be added to Vite core. [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) is a great example of what can be achieved out of Vite core, and there are a lot of [well maintained plugins](https://github.com/vitejs/awesome-vite#plugins) to cover your needs. Vite works closely with the Rollup project to ensure that plugins can be used in both plain-rollup and Vite projects as much as possible, trying to push needed extensions to the Plugin API upstream when possible.

## Pushing the Modern Web

Vite provides opinionated features that push writing modern code. For example:

- The source code can only be written in ESM, where non-ESM dependencies need to be [pre-bundled as ESM](./dep-pre-bundling) in order to work.
- Web workers are encouraged to be written with the [`new Worker` syntax](./features#web-workers) to follow modern standards.
- Node.js modules cannot be used in the browser.

When adding new features, these patterns are followed to create a future-proof API, which may not always be compatible with other build tools.

## A Pragmatic Approach to Performance

Vite has been focused on performance since its [origins](./why.md). Its dev server architecture allows HMR that stays fast as projects scale. Vite is based on native tools that includes [Oxc toolchain](https://oxc.rs/) and [Rolldown](https://rolldown.rs/) to implement intensive tasks but keeps the rest of the code in JS to balance speed with flexibility. When needed, framework plugins will tap into [Babel](https://babeljs.io/) to compile user code. Thanks to Rolldown's Rollup plugin compatibility, Vite has access to a wide ecosystem of plugins.

## Building Frameworks on Top of Vite

Although Vite can be used by users directly, it shines as a tool to create frameworks. Vite core is framework agnostic, but there are polished plugins for each UI framework. Its [JS API](./api-javascript.md) allows App Framework authors to use Vite features to create tailored experiences for their users. Vite includes support for [SSR primitives](./ssr.md), usually present in higher-level tools but fundamental to building modern web frameworks. And Vite plugins complete the picture by offering a way to share between frameworks. Vite is also a great fit when paired with [Backend frameworks](./backend-integration.md) like [Ruby](https://vite-ruby.netlify.app/) and [Laravel](https://laravel.com/docs/vite).

## An Active Ecosystem

Vite evolution is a cooperation between framework and plugin maintainers, users, and the Vite team. We encourage active participation in Vite's Core development once a project adopts Vite. We work closely with the main projects in the ecosystem to minimize regressions on each release, aided by tools like [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci). It allows us to run the CI of major projects using Vite on selected PRs and gives us a clear status of how the Ecosystem would react to a release. We strive to fix regressions before they hit users and allow projects to update to the next versions as soon as they are released. If you are working with Vite, we invite you to join [Vite's Discord](https://chat.vite.dev) and get involved in the project too.
