---
title: Vite 8.1 is out!
author:
  name: The Vite Team
date: 2026-06-23
sidebar: false
head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Announcing Vite 8.1
  - - meta
    - property: og:image
      content: https://vite.dev/og-image-announcing-vite8-1.webp
  - - meta
    - property: og:url
      content: https://vite.dev/blog/announcing-vite8-1
  - - meta
    - property: og:description
      content: Vite 8.1 Release Announcement

  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 8.1 is out!

_June 23, 2026_

![Vite 8 Announcement Cover Image](/og-image-announcing-vite8-1.webp)

Vite 8 [was released](./announcing-vite8.md) in March with a single unified bundler powered by [Rolldown](https://rolldown.rs/), opening the door to further improvements. It is now seeing 41.6 million weekly downloads, almost reaching the total downloads of Vite 7. Alongside resolving upgrade regressions, we've been working on new features, and we're excited to announce the release of Vite 8.1.

Quick links:

- [Docs](/)
- Translations: [简体中文](https://cn.vite.dev/), [日本語](https://ja.vite.dev/), [Español](https://es.vite.dev/), [Português](https://pt.vite.dev/), [한국어](https://ko.vite.dev/), [Deutsch](https://de.vite.dev/), [فارسی](https://fa.vite.dev/)
- [GitHub Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)

Play online with Vite 8.1 using [vite.new](https://vite.new) or scaffold a Vite app locally with your preferred framework running `pnpm create vite`. Check out the [Getting Started Guide](/guide/) for more information.

We invite you to help us improve Vite (joining the more than [1.2K contributors to Vite Core](https://github.com/vitejs/vite/graphs/contributors)), our dependencies, or plugins and projects in the ecosystem. Learn more at our [Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md). A good way to get started is by [triaging issues](https://github.com/vitejs/vite/issues), [reviewing PRs](https://github.com/vitejs/vite/pulls), sending tests PRs based on open issues, and supporting others in [Discussions](https://github.com/vitejs/vite/discussions) or Vite Land's [help forum](https://discord.com/channels/804011606160703521/1019670660856942652). If you have questions, join our [Discord community](https://chat.vite.dev) and talk to us in the [#contributing channel](https://discord.com/channels/804011606160703521/804439875226173480).

Stay updated and connect with others building on top of Vite by following us on [Bluesky](https://bsky.app/profile/vite.dev), [X](https://twitter.com/vite_js), or [Mastodon](https://webtoo.ls/@vite).

## Features

### Experimental Bundled Dev Mode

Experimental support for bundled dev mode is now available. This was previously called as "Full Bundle Mode". This mode is to improve performance of huge applications that suffer from the number of modules.

In our initial testing with an app loading 10,000 React components, bundled dev mode achieved around 15x faster startup and 10x faster full page reloads compared to the unbundled dev server, while keeping HMR instant regardless of the application size. Early testing on real-world applications shows similar gains: the Linear team saw cold start rendering up to 3x faster, full reloads around 40% faster, and 10x fewer network requests.

::: details Why bundled dev mode?

Vite is known for its unbundled dev server approach, which is a main reason for Vite's speed and popularity when it was first introduced. This approach was initially an experiment to see just how far we could push the boundaries of development server performance without traditional bundling.

However, as projects scale in size and complexity, it has become clear that Vite's unbundled dev approach can degrade performance during development. Because each module is fetched separately, the browser must process a large number of requests, which increases startup and refresh overhead. This impact is especially noticeable in large applications and becomes more severe when developers are behind a network proxy, resulting in slower refresh times and a worse developer experience.

Bundled Dev Mode would allow serving bundled files not only in production but also during development, combining the best of both worlds:

- Fast startup times even for large applications
- Reduced network overhead on page refreshes
- Maintained efficient HMR on top of ESM output

:::

Currently, it focuses on the browser side and the basic plugins and the main features. If you are using a third party plugin, it may not work with this mode. If you are using a minor feature, it may not work as well. We are working on expanding the support and preparing a document that clarifies the changes that may be needed on the plugin side. See [the design document](https://github.com/vitejs/vite/discussions/22746) for more details about the roadmap.

To enable this mode, you can pass `--experimental-bundle` or add `experimental.bundledDev: true` to your `vite.config.js`:

```ts [vite.config.js]
import { defineConfig } from 'vite'

export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
```

Share your feedback in [the discussion](https://github.com/vitejs/vite/discussions/22747).

### Experimental Chunk Import Map

In the output bundle, the import statement of a chunk includes the hash of that chunk. This is to ensure the new chunk is loaded if the chunk content has changed. However, this also causes the hash of the chunk importing the changed chunk to change, cascading the change to all the chunks that import the changed chunk transitively.

```dot
digraph chunk_hash_cascade {
  rankdir=TB
  node [shape=box style="rounded,filled" fontname="Arial" fontsize=11 margin="0.25,0.12" fontcolor="${#3c3c43|#ffffff}" color="${#c2c2c4|#3c3f44}"]
  edge [color="${#67676c|#98989f}" fontname="Arial" fontsize=10 fontcolor="${#67676c|#98989f}"]
  bgcolor="transparent"

  utils [label="utils.[e5f6 → 88xx].js\ncontent edited" fillcolor="${#fcf4dc|#38301a}" color="${#e0a800|#d4a72c}"]
  page  [label="page.[c3d4 → 77yy].js\nre-hashed by cascade" fillcolor="${#fde8e8|#3a1f22}" color="${#d5393e|#f66f81}"]
  entry [label="entry.[a1b2 → 99zz].js\nre-hashed by cascade" fillcolor="${#fde8e8|#3a1f22}" color="${#d5393e|#f66f81}"]

  entry -> page  [label="  imports (embeds hash)\l" color="${#d5393e|#f66f81}" fontcolor="${#d5393e|#f66f81}"]
  page  -> utils [label="  imports (embeds hash)\l" color="${#d5393e|#f66f81}" fontcolor="${#d5393e|#f66f81}"]
}
```

The experimental chunk import map feature solves this problem utilizing import maps and improves the cache efficiency. This feature is built on top of [Rolldown's feature](https://rolldown.rs/reference/InputOptions.experimental#chunkimportmap), but adds the support for Vite specific features. Huge thanks to [Taisei Mima](https://github.com/bhbs) for their research and initial implementation of this feature!

Note that `experimental.renderBuiltUrl` currently does not work with this option.

See [the guide](/guide/features#chunk-import-map-optimization) and [the option docs](/config/build-options#build-chunkimportmap) for more details. Share your feedback in [the discussion](https://github.com/vitejs/vite/discussions/22703).

### Wasm ESM integration Support

[Wasm ESM integration proposal](https://github.com/WebAssembly/esm-integration/blob/main/proposals/esm-integration/README.md) is now supported in Vite. You can now import wasm files and use the exported functions directly:

```ts
import { add } from './add.wasm'

console.log(add(1, 2)) // 3
```

Huge thanks to [Menci](https://github.com/Menci) for their creation and maintenance of vite-plugin-wasm while the proposal was early stages and also for upstreaming the implementation to Vite core!

See [the guide](/guide/features#esm-integration) for more details.

### One step closer to use Lightning CSS by default

We have worked with the Lightning CSS team to add features that was supported by PostCSS but was lacking in Lightning CSS. Vite 8.1 now has these two features:

- Allow external CSS files imported in CSS files ([lightningcss#479](https://github.com/parcel-bundler/lightningcss/issues/479))
- Register file dependencies by plugins ([lightningcss#877](https://github.com/parcel-bundler/lightningcss/issues/877))

We are thinking of changing the default CSS preprocessor to Lightning CSS in the next major release. Please try it out by [`css.transformer: 'lightningcss'`](/config/shared-options#css-transformer) and share your feedback in [the discussion](https://github.com/vitejs/vite/discussions/13835).

### Case Insensitive Matching For `import.meta.glob`

`import.meta.glob` now supports `caseSensitive` option to match files case insensitively.

```ts
// matches ./dir/Module1.js
const modules = import.meta.glob('./dir/module*.js', {
  caseSensitive: false,
})
```

### Asset Discovery For Custom HTML Elements And Attributes

Previously, Vite would only discover assets for the elements and attributes that was pre-defined. Now, you can use the [`html.additionalAssetSources`](/config/shared-options#html-additionalassetsources) option to add more elements and attributes.

```html
<html-import src="./some/other/file.html"></html-import>
<img
  src="/layout-default.png"
  data-src-dark="/layout-dark.png"
  data-src-light="/layout-light.png"
/>
```

```ts [vite.config.js]
import { defineConfig } from 'vite'

export default defineConfig({
  html: {
    additionalAssetSources: {
      'html-import': {
        srcAttributes: 'src',
      },
      img: {
        srcAttributes: ['data-src-dark', 'data-src-light'],
      },
    },
  },
})
```

## Other Changes

Check out the [Changelog](https://github.com/vitejs/vite/blob/v8.1.0/packages/vite/CHANGELOG.md) for other features and bug fixes.

## Acknowledgments

Vite 8.1 is possible thanks to our community of contributors, maintainers in the ecosystem, and the [Vite Team](/team). Vite is brought to you by [VoidZero](https://voidzero.dev), in partnership with [Bolt](https://bolt.new/) and [Nuxt Labs](https://nuxtlabs.com/). We also want to thank our sponsors on [Vite's GitHub Sponsors](https://github.com/sponsors/vitejs) and [Vite's Open Collective](https://opencollective.com/vite).
