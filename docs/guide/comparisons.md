# Comparisons

## WMR

[WMR](https://github.com/preactjs/wmr) by the Preact team looked to provide a similar feature set. Vite's universal Rollup plugin API for dev and build was inspired by it.

WMR is no longer maintained. The Preact team now recommends Vite with [@preactjs/preset-vite](https://github.com/preactjs/preset-vite).

## @web/dev-server

[@web/dev-server](https://modern-web.dev/docs/dev-server/overview/) (previously `es-dev-server`) is a great project and Vite 1.0's Koa-based server setup was inspired by it.

`@web/dev-server` is a bit lower-level in terms of scope. It does not provide official framework integrations, and requires manually setting up a Rollup configuration for the production build.

Overall, Vite is a more opinionated / higher-level tool that aims to provide a more out-of-the-box workflow. That said, the `@web` umbrella project contains many other excellent tools that may benefit Vite users as well.

## Snowpack

[Snowpack](https://www.snowpack.dev/) was also a no-bundle native ESM dev server, very similar in scope to Vite. The project is no longer being maintained. The Snowpack team is now working on [Astro](https://astro.build/), a static site builder powered by Vite. The Astro team is now an active player in the ecosystem, and they are helping to improve Vite.

Aside from different implementation details, the two projects shared a lot in terms of technical advantages over traditional tooling. Vite's dependency pre-bundling is also inspired by Snowpack v1 (now [`esinstall`](https://github.com/snowpackjs/snowpack/tree/main/esinstall)). Some of the main differences between the two projects are listed in [the v2 Comparisons Guide](https://v2.vite.dev/guide/comparisons).
