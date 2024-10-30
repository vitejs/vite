---
title: Vite 4.0 is out!
author:
  name: The Vite Team
date: 2022-12-09
sidebar: false
head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Announcing Vite 4
  - - meta
    - property: og:image
      content: https://vite.dev/og-image-announcing-vite4.png
  - - meta
    - property: og:url
      content: https://vite.dev/blog/announcing-vite4
  - - meta
    - property: og:description
      content: Vite 4 Release Announcement
  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 4.0 is out!

_December 9, 2022_ - Check out the [Vite 5.0 announcement](./announcing-vite5.md)

Vite 3 [was released](./announcing-vite3.md) five months ago. npm downloads per week have gone from 1 million to 2.5 million since then. The ecosystem has matured too, and continues to grow. In this year's [Jamstack Conf survey](https://twitter.com/vite_js/status/1589665610119585793), usage among the community jumped from 14% to 32% while keeping a high 9.7 satisfaction score. We saw the stable releases of [Astro 1.0](https://astro.build/), [Nuxt 3](https://v3.nuxtjs.org/), and other Vite-powered frameworks that are innovating and collaborating: [SvelteKit](https://kit.svelte.dev/), [Solid Start](https://www.solidjs.com/blog/introducing-solidstart), [Qwik City](https://qwik.builder.io/qwikcity/overview/). Storybook announced first-class support for Vite as one of its main features for [Storybook 7.0](https://storybook.js.org/blog/first-class-vite-support-in-storybook/). Deno now [supports Vite](https://www.youtube.com/watch?v=Zjojo9wdvmY). [Vitest](https://vitest.dev) adoption is exploding, it will soon represent half of Vite's npm downloads. Nx is also investing in the ecosystem, and [officially supports Vite](https://nx.dev/packages/vite).

[![Vite 4 Ecosystem](/ecosystem-vite4.png)](https://viteconf.org/2022/replay)

As a showcase of the growth Vite and related projects have experienced, the Vite ecosystem gathered on October 11th at [ViteConf 2022](https://viteconf.org/2022/replay). We saw representatives from the main web framework and tools tell stories of innovation and collaboration. And in a symbolic move, the Rollup team choose that exact day to release [Rollup 3](https://rollupjs.org).

Today, the Vite [team](https://vite.dev/team) with the help of our ecosystem partners, is happy to announce the release of Vite 4, powered during build time by Rollup 3. We've worked with the ecosystem to ensure a smooth upgrade path for this new major. Vite is now using [Rollup 3](https://github.com/vitejs/vite/issues/9870), which allowed us to simplify Vite's internal asset handling and has many improvements. See the [Rollup 3 release notes here](https://github.com/rollup/rollup/releases/tag/v3.0.0).

![Vite 4 Announcement Cover Image](/og-image-announcing-vite4.png)

Quick links:

- [Docs](/)
- [Migration Guide](https://v4.vite.dev/guide/migration.html)
- [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#400-2022-12-09)

Docs in other languages:

- [简体中文](https://cn.vite.dev/)
- [日本語](https://ja.vite.dev/)
- [Español](https://es.vite.dev/)

If you recently started using Vite, we suggest reading the [Why Vite Guide](https://vite.dev/guide/why.html) and checking out [the Getting Started](https://vite.dev/guide/) and [Features guide](https://vite.dev/guide/features). If you want to get involved, contributions are welcome at [GitHub](https://github.com/vitejs/vite). Almost [700 collaborators](https://github.com/vitejs/vite/graphs/contributors) have contributed to Vite. Follow the updates on [Twitter](https://twitter.com/vite_js) and [Mastodon](https://webtoo.ls/@vite), or join collaborate with others on our [Discord community](http://chat.vite.dev/).

## Start playing with Vite 4

Use `pnpm create vite` to scaffold a Vite project with your preferred framework, or open a started template online to play with Vite 4 using [vite.new](https://vite.new).

You can also run `pnpm create vite-extra` to get access to templates from other frameworks and runtimes (Solid, Deno, SSR, and library starters). `create vite-extra` templates are also available when you run `create vite` under the `Others` option.

Note that Vite starter templates are intended to be used as a playground to test Vite with different frameworks. When building your next project, we recommend reaching out to the starters recommended by each framework. Some frameworks now redirect in `create vite` to their starters too (`create-vue` and `Nuxt 3` for Vue, and `SvelteKit` for Svelte).

## New React plugin using SWC during development

[SWC](https://swc.rs/) is now a mature replacement for [Babel](https://babeljs.io/), especially in the context of React projects. SWC's React Fast Refresh implementation is a lot faster than Babel, and for some projects, it is now a better alternative. From Vite 4, two plugins are available for React projects with different tradeoffs. We believe that both approaches are worth supporting at this point, and we'll continue to explore improvements to both plugins in the future.

### @vitejs/plugin-react

[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) is a plugin that uses esbuild and Babel, achieving fast HMR with a small package footprint and the flexibility of being able to use the Babel transform pipeline.

### @vitejs/plugin-react-swc (new)

[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) is a new plugin that uses esbuild during build, but replaces Babel with SWC during development. For big projects that don't require non-standard React extensions, cold start and Hot Module Replacement (HMR) can be significantly faster.

## Browser Compatibility

The modern browser build now targets `safari14` by default for wider ES2020 compatibility. This means that modern builds can now use [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) and that the [nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) isn't transpiled anymore. If you need to support older browsers, you can add [`@vitejs/plugin-legacy`](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) as usual.

## Importing CSS as a String

In Vite 3, importing the default export of a `.css` file could introduce a double loading of CSS.

```ts
import cssString from './global.css'
```

This double loading could occur since a `.css` file will be emitted and it's likely that the CSS string will also be used by the application code — for example, injected by the framework runtime. From Vite 4, the `.css` default export [has been deprecated](https://github.com/vitejs/vite/issues/11094). The `?inline` query suffix modifier needs to be used in this case, as that doesn't emit the imported `.css` styles.

```ts
import stuff from './global.css?inline'
```

Learn more in the [Migration Guide](https://v4.vite.dev/guide/migration.html).

## Environment Variables

Vite now uses `dotenv` 16 and `dotenv-expand` 9 (previously `dotenv` 14 and `dotenv-expand` 5). If you have a value including `#` or `` ` ``, you will need to wrap them with quotes.

```diff
-VITE_APP=ab#cd`ef
+VITE_APP="ab#cd`ef"
```

For more details, see the [`dotenv`](https://github.com/motdotla/dotenv/blob/master/CHANGELOG.md) and [`dotenv-expand` changelog](https://github.com/motdotla/dotenv-expand/blob/master/CHANGELOG.md).

## Other Features

- CLI Shortcuts (press `h` during dev to see them all) ([#11228](https://github.com/vitejs/vite/pull/11228))
- Support for patch-package when pre bundling dependencies ([#10286](https://github.com/vitejs/vite/issues/10286))
- Cleaner build logs output ([#10895](https://github.com/vitejs/vite/issues/10895)) and switch to `kB` to align with browser dev tools ([#10982](https://github.com/vitejs/vite/issues/10982))
- Improved error messages during SSR ([#11156](https://github.com/vitejs/vite/issues/11156))

## Reduced Package Size

Vite cares about its footprint, to speed up installation, especially in the use case of playgrounds for documentation and reproductions. And once more, this major brings improvements in Vite's package size. Vite 4 install size is 23% smaller compared to vite 3.2.5 (14.1 MB vs 18.3 MB).

## Upgrades to Vite Core

[Vite Core](https://github.com/vitejs/vite) and [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) continue to evolve to provide a better experience to maintainers and collaborators and to ensure that Vite development scales to cope with the growth in the ecosystem.

### Framework plugins out of core

[`@vitejs/plugin-vue`](https://github.com/vitejs/vite-plugin-vue) and [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react) have been part of Vite core monorepo since the first versions of Vite. This helped us to get a close feedback loop when making changes as we were getting both Core and the plugins tested and released together. With [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) we can get this feedback with these plugins developed on independent repositories, so from Vite 4, [they have been moved out of the Vite core monorepo](https://github.com/vitejs/vite/pull/11158). This is meaningful for Vite's framework-agnostic story and will allow us to build independent teams to maintain each of the plugins. If you have bugs to report or features to request, please create issues on the new repositories moving forward: [`vitejs/vite-plugin-vue`](https://github.com/vitejs/vite-plugin-vue) and [`vitejs/vite-plugin-react`](https://github.com/vitejs/vite-plugin-react).

### vite-ecosystem-ci improvements

[vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) extends Vite's CI by providing on-demand status reports on the state of the CIs of [most major downstream projects](https://github.com/vitejs/vite-ecosystem-ci/tree/main/tests). We run vite-ecosystem-ci three times a week against Vite's main branch and receive timely reports before introducing a regression. Vite 4 will soon be compatible with most projects using Vite, which already prepared branches with the needed changes and will be releasing them in the next few days. We are also able to run vite-ecosystem-ci on-demand on PRs using `/ecosystem-ci run` in a comment, allowing us to know [the effect of changes](https://github.com/vitejs/vite/pull/11269#issuecomment-1343365064) before they hit main.

## Acknowledgments

Vite 4 wouldn't be possible without uncountable hours of work by Vite contributors, many of them maintainers of downstream projects and plugins, and the efforts of the [Vite Team](/team). All of us have worked together to improve Vite's DX once more, for every framework and app using it. We're grateful to be able to improve a common base for such a vibrant ecosystem.

We're also thankful to individuals and companies sponsoring the Vite team, and companies investing directly in Vite's future: [@antfu7](https://twitter.com/antfu7)'s work on Vite and the ecosystem is part of his job at [Nuxt Labs](https://nuxtlabs.com/), [Astro](https://astro.build) is funding [@bluwyoo](https://twitter.com/bluwyoo)'s' Vite core work, and [StackBlitz](https://stackblitz.com/) hires [@patak_dev](https://twitter.com/patak_dev) to work full time on Vite.

## Next steps

Our immediate focus would be on triaging newly opened issues to avoid disruption by possible regressions. If you would like to get involved and help us improve Vite, we suggest starting with issues triaging. Join [our Discord](https://chat.vite.dev) and reach out on the `#contributing` channel. Polish our `#docs` story, and `#help` others. We need to continue to build a helpful and welcoming community for the next wave of users, as Vite's adoption continues to grow.

There are a lot of open fronts to keep improving the DX of everyone that has chosen Vite to power their frameworks and develop their apps. Onwards!
