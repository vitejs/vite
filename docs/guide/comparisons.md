# Comparisons

## WMR

[WMR](https://github.com/preactjs/wmr) by the Preact team provides a similar feature set, and Vite 2.0's support for Rollup's plugin interface is inspired by it.

WMR is mainly designed for [Preact](https://preactjs.com/) projects, and offers more integrated features such as pre-rendering. In terms of scope, it's closer to a Preact meta framework, with the same emphasis on compact size as Preact itself. If you are using Preact, WMR is likely going to offer a more fine-tuned experience.

## @web/dev-server

[@web/dev-server](https://modern-web.dev/docs/dev-server/overview/) (previously `es-dev-server`) is a great project and Vite 1.0's Koa-based server setup was inspired by it.

`@web/dev-server` is a bit lower-level in terms of scope. It does not provide official framework integrations, and requires manually setting up a Rollup configuration for the production build.

Overall, Vite is a more opinionated / higher-level tool that aims to provide a more out-of-the-box workflow. That said, the `@web` umbrella project contains many other excellent tools that may benefit Vite users as well.

## Snowpack

[Snowpack](https://www.snowpack.dev/) was also a no-bundle native ESM dev server, very similar in scope to Vite. The project is no longer being maintained. The Snowpack team is now working on [Astro](https://astro.build/), a static site builder powered by Vite. The Astro team is now an active player in the ecosystem, and they are helping to improve Vite.

Aside from different implementation details, the two projects shared a lot in terms of technical advantages over traditional tooling. Vite's dependency pre-bundling is also inspired by Snowpack v1 (now [`esinstall`](https://github.com/snowpackjs/snowpack/tree/main/esinstall)). Some of the main differences between the two projects are listed in [the v2 Comparisons Guide](https://v2.vitejs.dev/guide/comparisons).
