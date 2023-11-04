---
sidebar: false
head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Announcing Vite 5
  - - meta
    - property: og:image
      content: https://vitejs.dev/og-image-announcing-vite5.png
  - - meta
    - property: og:url
      content: https://vitejs.dev/blog/announcing-vite5
  - - meta
    - property: og:description
      content: Vite 5 Release Announcement
  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 5.0 is out!

_November ?, 2023_

Vite 4 [was released](./announcing-vite4.md) almost a year ago, and it served as a solid base for the ecosystem. npm downloads per week jumped from 2.5 million to 7.5 million, as projects keep betting on building shared infrastructure. Frameworks continued to innovate, and on top of [Astro](https://astro.build/), [Nuxt](https://nuxt.com/), [SvelteKit](https://kit.svelte.dev/), [Solid Start](https://www.solidjs.com/blog/introducing-solidstart), [Qwik City](https://qwik.builder.io/qwikcity/overview/), between others, we saw new frameworks joining and making the ecosystem stronger. [RedwoodJS](https://redwoodjs.com/) and [Remix](https://remix.run/) switching to Vite paves the way for further adoption in the React ecosystem. [Vitest](https://vitest.dev) kept growing at an even faster pace than Vite. The story of Vite when used with other tools such as Storybook, Nx, and Playwright kept improving, and the same goes for environments, with Vite dev working both in Deno and Bun.

We had the second edition of [ViteConf](https://viteconf.org/23/replay) a month ago, hosted by [StackBlitz](https://stackblitz.com). Like last year, most of the projects in the ecosystem got together to share ideas and connect to keep expanding the commons. We're also seeing new pieces complement the meta-framework toolbelt like [Volar](https://volarjs.dev/) and [Nitro](https://nitro.unjs.io/). The Rollup team released [Rollup 4](https://rollupjs.org) that same day, a tradition Lukas started last year.

Six months ago, Vite 4.3 [was released](./announcing-vite4.md). This release significantly improved the dev server performance. However, there is still ample room for improvement. At ViteConf, [Evan You unveilled Vite's long-term plan to work on Rolldown](https://www.youtube.com/watch?v=hrdwQHoAp0M), a Rust-port of Rollup with a best-effort to keep it API compatible. Once it is ready, we intend to use it in Vite Core to take on the tasks of both Rollup and esbuild. This will mean a boost in build performance (and later on in dev performance too as we move perf-sensitive parts of Vite itself to Rust), and a big reduction of inconsistencies between dev and build.

And today, we mark a big milestone in that path. The Vite [team](/team), [contributors](https://github.com/vitejs/vite/graphs/contributors), and ecosystem partners, are excited to announce the release of Vite 5. Vite is now using [Rollup 4](https://github.com/vitejs/vite/pull/14508), which already represents a big boost in build performance.

![Vite 5 Announcement Cover Image](/og-image-announcing-vite5.png)

Quick links:

- [Docs](/)
- [Migration Guide](/guide/migration)
- TODO: update link [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#400-2023-11-10)

Docs in other languages:

- [简体中文](https://cn.vitejs.dev/)
- [日本語](https://ja.vitejs.dev/)
- [Español](https://es.vitejs.dev/)
- [Português](https://pt.vitejs.dev/)
- [한국어](https://ko.vitejs.dev/)
- TODO: German docs

If you're new to Vite, we suggest reading first the [Getting Started](/guide/) and [Features](/guide/features) guides.

We appreciate the more than [850 contributors](https://github.com/vitejs/vite/graphs/contributors) that have helped us reach here. We encourage you to get involved and continue to improve Vite with us. You can learn more on our [Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md). To get started, we recommend [triaging issues](https://github.com/vitejs/vite/issues), [reviewing PRs](https://github.com/vitejs/vite/pulls), sending failing tests PRs based on open issues, and helping others in [Discussions](https://github.com/vitejs/vite/discussions) and Vite Land's [help forum](https://discord.com/channels/804011606160703521/1019670660856942652). You'll learn a lot along the way and have a smooth path to further contributions to the project. If you have doubts, join us on our [Discord community](http://chat.vitejs.dev/) and say hi on the [#contributing channel](https://discord.com/channels/804011606160703521/804439875226173480).

To stay up to date, follow us on [X](https://twitter.com/vite_js) or [Mastodon](https://webtoo.ls/@vite).

## Quick start with Vite 5

Use `pnpm create vite` to scaffold a Vite project with your preferred framework, or open a started template online to play with Vite 5 using [vite.new](https://vite.new). You can also run `pnpm create vite-extra` to get access to templates from other frameworks and runtimes (Solid, Deno, SSR, and library starters). `create vite-extra` templates are also available when you run `create vite` under the `Others` option.

Note that Vite starter templates are intended to be used as a playground to test Vite with different frameworks. When building your next project, we recommend reaching out to the starters recommended by each framework. Some frameworks now redirect in `create vite` to their starters too (`create-vue` and `Nuxt 3` for Vue, and `SvelteKit` for Svelte).

## Node.js Support

Vite no longer supports Node.js 14 / 16 / 17 / 19, which reached its EOL. Node.js 18 / 20+ is now required.

## Performance

There is a new guide to help you identify and fix common performance issues at [https://vitejs.dev/guide/performance](/guide/performance).

Vite 5 introduced [server.warmup](/guide/performance.html#warm-up-frequently-used-files), a new feature to improve startup time. It lets you define a list of modules that should be pretransformed as soon as the server starts. When using [`--open` or `server.open`](/config/server-options.html#server-open) Vite will also automatically warm up the entry point of your app or the provided URL to open.

## Main changes

- [Vite is now powered by Rollup 4](/guide/migration#rollup-4).
- [The CJS Node API has been deprecated](/guide/migration#deprecate-cjs-node-api)
- [Rework define and import.meta.env.\* replacement strategy](/guide/migration#rework-define-and-import-meta-env-replacement-strategy)
- [SSR externalized modules value now matches production](/guide/migration#ssr-externalized-modules-value-now-matches-production)
- [`worker.plugins` is now a function](/guide/migration#worker-plugins-is-now-a-function)
- [Allow path containing . to fallback to index.html](/guide/migration#allow-path-containing-to-fallback-to-index-html)
- [Align dev and preview HTML serving behaviour](/guide/migration#align-dev-and-preview-html-serving-behaviour)
- [Manifest files are now generated in `.vite` directory by default](/guide/migration#manifest-files-are-now-generated-in-vite-directory-by-default)
- [CLI shortcuts require an additional Enter press](/guide/migration#cli-shortcuts-require-an-additional-enter-press)
- [Update experimentalDecorators and useDefineForClassFields TypeScript behaviour](/guide/migration#update-experimentaldecorators-and-usedefineforclassfields-typescript-behaviour)
- [Removes previously deprecated APIs](/guide/migration#removed-deprecated-apis)
- [Read more about advanced changes affecting plugin and tool authors](/guide/migration#advanced)

## Acknowledgments

Vite 5 is the result of long hours of work by our community of contributors, downstream maintainers, plugins authors, and the [Vite Team](/team). A big shoutout to [Bjorn Lu](https://twitter.com/bluwyoo) for leading the release process for this major.

We're also thankful to individuals and companies sponsoring Vite development. [StackBlitz](https://stackblitz.com/), [Nuxt Labs](https://nuxtlabs.com/), and [Astro](https://astro.build) continue to bet on Vite by hiring Vite team members. A shoutout to sponsors on [Vite's GitHub Sponsors](https://github.com/sponsors/vitejs), [Vite's Open Collective](https://opencollective.com/vite), and [Evan You's GitHub Sponsors](https://github.com/sponsors/yyx990803). A special mention to [Remix](https://remix.run/) for becoming a Gold sponsor and contributing back after switching to Vite.
