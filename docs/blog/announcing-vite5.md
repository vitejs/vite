---
title: Vite 5.0 is out!
author:
  name: The Vite Team
date: 2023-11-16
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
      content: https://vite.dev/og-image-announcing-vite5.png
  - - meta
    - property: og:url
      content: https://vite.dev/blog/announcing-vite5
  - - meta
    - property: og:description
      content: Vite 5 Release Announcement
  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 5.0 is out!

_November 16, 2023_

![Vite 5 Announcement Cover Image](/og-image-announcing-vite5.png)

Vite 4 [was released](./announcing-vite4.md) almost a year ago, and it served as a solid base for the ecosystem. npm downloads per week jumped from 2.5 million to 7.5 million, as projects keep building on a shared infrastructure. Frameworks continued to innovate, and on top of [Astro](https://astro.build/), [Nuxt](https://nuxt.com/), [SvelteKit](https://kit.svelte.dev/), [Solid Start](https://www.solidjs.com/blog/introducing-solidstart), [Qwik City](https://qwik.builder.io/qwikcity/overview/), between others, we saw new frameworks joining and making the ecosystem stronger. [RedwoodJS](https://redwoodjs.com/) and [Remix](https://remix.run/) switching to Vite paves the way for further adoption in the React ecosystem. [Vitest](https://vitest.dev) kept growing at an even faster pace than Vite. Its team has been hard at work and will soon [release Vitest 1.0](https://github.com/vitest-dev/vitest/issues/3596). The story of Vite when used with other tools such as [Storybook](https://storybook.js.org), [Nx](https://nx.dev), and [Playwright](https://playwright.dev) kept improving, and the same goes for environments, with Vite dev working both in [Deno](https://deno.com) and [Bun](https://bun.sh).

We had the second edition of [ViteConf](https://viteconf.org/23/replay) a month ago, hosted by [StackBlitz](https://stackblitz.com). Like last year, most of the projects in the ecosystem got together to share ideas and connect to keep expanding the commons. We're also seeing new pieces complement the meta-framework tool belt like [Volar](https://volarjs.dev/) and [Nitro](https://nitro.unjs.io/). The Rollup team released [Rollup 4](https://rollupjs.org) that same day, a tradition Lukas started last year.

Six months ago, Vite 4.3 [was released](./announcing-vite4.md). This release significantly improved the dev server performance. However, there is still ample room for improvement. At ViteConf, [Evan You unveiled Vite's long-term plan to work on Rolldown](https://www.youtube.com/watch?v=hrdwQHoAp0M), a Rust-port of Rollup with compatible APIs. Once it is ready, we intend to use it in Vite Core to take on the tasks of both Rollup and esbuild. This will mean a boost in build performance (and later on in dev performance too as we move perf-sensitive parts of Vite itself to Rust), and a big reduction of inconsistencies between dev and build. Rolldown is currently in early stages and the team is preparing to open source the codebase before the end of the year. Stay tuned!

Today, we mark another big milestone in Vite's path. The Vite [team](/team), [contributors](https://github.com/vitejs/vite/graphs/contributors), and ecosystem partners, are excited to announce the release of Vite 5. Vite is now using [Rollup 4](https://github.com/vitejs/vite/pull/14508), which already represents a big boost in build performance. And there are also new options to improve your dev server performance profile.

Vite 5 focuses on cleaning up the API (removing deprecated features) and streamlines several features closing long-standing issues, for example switching `define` to use proper AST replacements instead of regexes. We also continue to take steps to future-proof Vite (Node.js 18+ is now required, and [the CJS Node API has been deprecated](/guide/migration#deprecate-cjs-node-api)).

Quick links:

- [Docs](/)
- [Migration Guide](/guide/migration)
- [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#500-2023-11-16)

Docs in other languages:

- [简体中文](https://cn.vite.dev/)
- [日本語](https://ja.vite.dev/)
- [Español](https://es.vite.dev/)
- [Português](https://pt.vite.dev/)
- [한국어](https://ko.vite.dev/)
- [Deutsch](https://de.vite.dev/) (new translation!)

If you're new to Vite, we suggest reading first the [Getting Started](/guide/) and [Features](/guide/features) guides.

We appreciate the more than [850 contributors to Vite Core](https://github.com/vitejs/vite/graphs/contributors), and the maintainers and contributors of Vite plugins, integrations, tools, and translations that have helped us reach here. We encourage you to get involved and continue to improve Vite with us. You can learn more at our [Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md). To get started, we recommend [triaging issues](https://github.com/vitejs/vite/issues), [reviewing PRs](https://github.com/vitejs/vite/pulls), sending failing tests PRs based on open issues, and helping others in [Discussions](https://github.com/vitejs/vite/discussions) and Vite Land's [help forum](https://discord.com/channels/804011606160703521/1019670660856942652). You'll learn a lot along the way and have a smooth path to further contributions to the project. If you have doubts, join us on our [Discord community](http://chat.vite.dev/) and say hi on the [#contributing channel](https://discord.com/channels/804011606160703521/804439875226173480).

To stay up to date, follow us on [X](https://twitter.com/vite_js) or [Mastodon](https://webtoo.ls/@vite).

## Quick start with Vite 5

Use `pnpm create vite` to scaffold a Vite project with your preferred framework, or open a started template online to play with Vite 5 using [vite.new](https://vite.new). You can also run `pnpm create vite-extra` to get access to templates from other frameworks and runtimes (Solid, Deno, SSR, and library starters). `create vite-extra` templates are also available when you run `create vite` under the `Others` option.

Note that Vite starter templates are intended to be used as a playground to test Vite with different frameworks. When building your next project, we recommend reaching out to the starters recommended by each framework. Some frameworks now redirect in `create vite` to their starters too (`create-vue` and `Nuxt 3` for Vue, and `SvelteKit` for Svelte).

## Node.js Support

Vite no longer supports Node.js 14 / 16 / 17 / 19, which reached its EOL. Node.js 18 / 20+ is now required.

## Performance

On top of Rollup 4's build performance improvements, there is a new guide to help you identify and fix common performance issues at [https://vite.dev/guide/performance](/guide/performance).

Vite 5 also introduces [server.warmup](/guide/performance.html#warm-up-frequently-used-files), a new feature to improve startup time. It lets you define a list of modules that should be pre-transformed as soon as the server starts. When using [`--open` or `server.open`](/config/server-options.html#server-open), Vite will also automatically warm up the entry point of your app or the provided URL to open.

## Main Changes

- [Vite is now powered by Rollup 4](/guide/migration#rollup-4)
- [The CJS Node API has been deprecated](/guide/migration#deprecate-cjs-node-api)
- [Rework `define` and `import.meta.env.*` replacement strategy](/guide/migration#rework-define-and-import-meta-env-replacement-strategy)
- [SSR externalized modules value now matches production](/guide/migration#ssr-externalized-modules-value-now-matches-production)
- [`worker.plugins` is now a function](/guide/migration#worker-plugins-is-now-a-function)
- [Allow path containing `.` to fallback to index.html](/guide/migration#allow-path-containing-to-fallback-to-index-html)
- [Align dev and preview HTML serving behavior](/guide/migration#align-dev-and-preview-html-serving-behaviour)
- [Manifest files are now generated in `.vite` directory by default](/guide/migration#manifest-files-are-now-generated-in-vite-directory-by-default)
- [CLI shortcuts require an additional `Enter` press](/guide/migration#cli-shortcuts-require-an-additional-enter-press)
- [Update `experimentalDecorators` and `useDefineForClassFields` TypeScript behavior](/guide/migration#update-experimentaldecorators-and-usedefineforclassfields-typescript-behaviour)
- [Remove `--https` flag and `https: true`](/guide/migration#remove-https-flag-and-https-true)
- [Remove `resolvePackageEntry` and `resolvePackageData` APIs](/guide/migration#remove-resolvepackageentry-and-resolvepackagedata-apis)
- [Removes previously deprecated APIs](/guide/migration#removed-deprecated-apis)
- [Read more about advanced changes affecting plugin and tool authors](/guide/migration#advanced)

## Migrating to Vite 5

We have worked with ecosystem partners to ensure a smooth migration to this new major. Once again, [vite-ecosystem-ci](https://www.youtube.com/watch?v=7L4I4lDzO48) has been crucial to help us make bolder changes while avoiding regressions. We're thrilled to see other ecosystems adopt similar schemes to improve the collaboration between their projects and downstream maintainers.

For most projects, the update to Vite 5 should be straight forward. But we advise reviewing the [detailed Migration Guide](/guide/migration) before upgrading.

A low level breakdown with the full list of changes to Vite core can be found at the [Vite 5 Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#500-2023-11-16).

## Acknowledgments

Vite 5 is the result of long hours of work by our community of contributors, downstream maintainers, plugins authors, and the [Vite Team](/team). A big shout out to [Bjorn Lu](https://twitter.com/bluwyoo) for leading the release process for this major.

We're also thankful to individuals and companies sponsoring Vite development. [StackBlitz](https://stackblitz.com/), [Nuxt Labs](https://nuxtlabs.com/), and [Astro](https://astro.build) continue to invest in Vite by hiring Vite team members. A shout out to sponsors on [Vite's GitHub Sponsors](https://github.com/sponsors/vitejs), [Vite's Open Collective](https://opencollective.com/vite), and [Evan You's GitHub Sponsors](https://github.com/sponsors/yyx990803). A special mention to [Remix](https://remix.run/) for becoming a Gold sponsor and contributing back after switching to Vite.
