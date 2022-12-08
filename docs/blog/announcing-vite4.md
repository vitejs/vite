---
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
      content: https://vitejs.dev/og-image-announcing-vite4.png
  - - meta
    - property: og:url
      content: https://vitejs.dev/blog/announcing-vite4
  - - meta
    - property: og:description
      content: Vite 4 Release Announcement
  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 4.0 is out!

Vite 3 [was released](./announcing-vite3.md) five months ago. npm downloads per week have gone from 1 million to 2.5 million since then. The ecosystem has matured too. We saw the stable releases of [Astro 1.0](https://astro.build/), [Nuxt 3](https://v3.nuxtjs.org/), and other Vite powered frameworks are close to reaching stable. Storybook announced first class support for Vite as one of its main features for [Storybook 7.0](https://storybook.js.org/blog/first-class-vite-support-in-storybook/). Deno now [supports Vite](). [Vitest](https://vitest.dev) adoption is exploding, and it will soon represent half of Vite's npm downloads.

As a showcase of the growth Vite and related projects have experienced, the Vite ecosystem gathered on October 11th at [ViteConf 2022](https://viteconf.org/2022/replay). We saw representants from the main web framework and tools tell stories of innovation and collaboration. And in a symbolic move, the Rollup team choose that exact day to release their latest major: [Rollup 3](https://rollupjs.org).

![Vite 4 Announcement Cover Image](/og-image-announcing-vite4.png)

Today, the Vite [team](https://vitejs.dev/team) with the help our ecosystem partners, is happy to announce the release of Vite 4, powered during build time by Rollup 3. We've worked with the ecosystem to ensure a smooth upgrade path for this new major. Vite is now using [Rollup 3](https://github.com/vitejs/vite/issues/9870), which allowed us to simplify Vite's internal asset handling and has many improvements. See the [Rollup 3 release notes here](https://github.com/rollup/rollup/releases).

Quick links:

- [Docs](/)
- [Migration Guide](/guide/migration)
- [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#300-2022-12-09)

Docs in other languages:

- [简体中文](https://cn.vitejs.dev/)
- [日本語](https://ja.vitejs.dev/)
- [Español](https://es.vitejs.dev/)

If you recently started using Vite, we suggest reading the [Why Vite Guide](https://vitejs.dev/guide/why.html) and checking out [the Getting Started](https://vitejs.dev/guide/) and [Features guide](https://vitejs.dev/guide/features). If you want to get involved, contributions are welcome at [GitHub](https://github.com/vitejs/vite). Almost [700 collaborators](https://github.com/vitejs/vite/graphs/contributors) have contributed to Vite. Follow the updates on [Twitter](https://twitter.com/vite_js) and [Mastodon](https://webtoo.ls/@vite), or join collaborate with others on our [Discord community](http://chat.vitejs.dev/).

## Try Vite 4 now

Use `pnpm create vite` to scafold a Vite project with your preferred framework, or open a started template online to play with Vite 4 using [vite.new](https://vite.new).

You can also run `pnpm create vite-extra` to get access to templates from other frameworks and runtimes (ssr templates, Solid, deno, library starter). `create vite-extra` templates are also available when you run `create vite` under the `Others` option.

Vite starter templates are intended to be used to create playground to test Vite with different frameworks. When building your next project, we recommend reaching out for the starters recommended by each framework. Some frameworks now redirect in `create vite` to their own starters too (`create-vue` and `Nuxt 3` for Vue, and `SvelteKit` for Svelte).

### New React plugin using SWC during development

[SWC](https://swc.rs/) is now a mature replacement for [Babel](https://babeljs.io/), especially in the context of React projects. SWC's React Fast Refresh implementation is a lot faster than Babel, and for some projects, it is now a better alternative. From Vite 4, two plugins are available for React projects with different tradeoffs. We believe that both approaches are worth supporting at this point, and we'll continue to explore improvements to both plugins in the future.

#### @vitejs/plugin-react

[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) is a plugin that uses esbuild and Babel, achieving fast HMR with a small package footprint and the flexibility of being able to use the babel transform pipeline.

#### @vitejs/plugin-react-swc (new)

[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) is a new plugin that uses esbuild during build, but replaces Babel with SWC during development. For big projects that don't require non-standard React extensions, cold start and Hot Module Replacement (HMR) can be significantly faster.

### Compatibility

The modern browser build now targets `safari14` by default for wider ES2020 compatibility (https://github.com/vitejs/vite/issues/9063). This means that modern builds can now use [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) and that the [nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) isn't transpiled anymore. If you need to support older browsers, you can add [`@vitejs/plugin-legacy`](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) as usual.

#### Importing CSS as a string

In Vite 3, importing the default export of a `.css` file could introduce a double loading of CSS.

```ts
import cssString from './global.css'
```

This double loading could occur since a `.css` file will be emitted and it's likely that the CSS string will also be used by the application code — for example, injected by the framework runtime. From Vite 4, the `.css` default export [has been deprecated](https://github.com/vitejs/vite/issues/11094). The `?inline` query suffix modifier needs to be used in this case, as that doesn't emit the imported `.css` styles.

```ts
import stuff from './global.css?inline'
```

Learn more in the [Migration Guide](/guide/migration).

#### Other features

- CLI Shortcuts (press `h` during dev)
- Support for patch-package when pre bundling dependencies ([#10286](https://github.com/vitejs/vite/issues/10286))
- Cleaner build logs output ([#10895](https://github.com/vitejs/vite/issues/10895)) and switch to `kB` to align with browser dev tools ([#10982](https://github.com/vitejs/vite/issues/10982))
- Improved error messages during SSR ([#11156](https://github.com/vitejs/vite/issues/11156))
- Vite 4.0.0 install size is 23% smaller compared to vite 3.2.5 (14.1 MB vs 18.3 MB)

## Upgrades to Vite Core

We also improved the contributing experience for collaborators to [Vite Core](https://github.com/vitejs/vite).

### Framework plugins out of core

[`@vitejs/plugin-vue`](https://github.com/vitejs/vite-plugin-vue) and [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react) have been part of Vite core monorepo since the first versions of Vite. This helped us to get a close feedback loop when making changes as we were getting both Core and the plugins tested and released together. With [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) we can get this feedback with these plugins developed on independent repositories, so from Vite 4, [they have been moved out of the Vite core monorepo](https://github.com/vitejs/vite/pull/11158). This is meaningful for Vite's framework-agnostic story, and will allow us to build independent teams to maintain each of the plugins. If you have bugs to report or features to request, please create issues on the new repositories moving forward: [`vitejs/vite-plugin-vue`](https://github.com/vitejs/vite-plugin-vue) and [`vitejs/vite-plugin-react`](https://github.com/vitejs/vite-plugin-react).

### vite-ecosystem-ci continues to evolve

We have worked closely with projects in the ecosystem to ensure that frameworks powered by Vite are ready for Vite 3. [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) allows us to run the CI's from the leading players in the ecosystem against Vite's main branch and receive timely reports before introducing a regression. Today's release should soon be compatible with most projects using Vite.

## Acknowledgments

Vite 4 is the result of the aggregate effort of members of the [Vite Team](/team) working together with ecosystem project maintainers and other collaborators to Vite core. We want to thank everyone that have implemented features, and fixes, given feedback, and have been involved in Vite 4.

We also want to thank individuals and companies sponsoring the Vite team, and companies investing in Vite development: [@antfu7](https://twitter.com/antfu7)'s work on Vite and the ecosystem is part of his job at [Nuxt Labs](https://nuxtlabs.com/), [Astro](https://astro.build) is funding [@bluwy](https://twitter.com/bluwy) Vite core work, and [StackBlitz](https://stackblitz.com/) hires [@patak_dev](https://twitter.com/patak_dev) to work full time on Vite.

## What's Next

Our inmidiate focus would be on triaging newly opened issues to avoid disruption by possible regressions. Next year, we plan to do two new major releases around May and October aligning with the End Of Life of Node 14 and Node 16.

If you are interested in helping improve Vite, the best way to get on board is to help with triaging issues. Join [our Discord](https://chat.vitejs.dev) and look for the `#contributing` channel. Or get involved in our `#docs`, `#help` others, or create plugins. We are just getting started. There are many open ideas to keep improving Vite's DX.
