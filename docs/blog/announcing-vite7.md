---
title: Vite 7.0 is out!
author:
  name: The Vite Team
date: 2025-06-24
sidebar: false
head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Announcing Vite 7
  - - meta
    - property: og:image
      content: https://vite.dev/og-image-announcing-vite7.png
  - - meta
    - property: og:url
      content: https://vite.dev/blog/announcing-vite7
  - - meta
    - property: og:description
      content: Vite 7 Release Announcement
  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 7.0 is out!

_June 24, 2025_

![Vite 7 Announcement Cover Image](/og-image-announcing-vite7.png)

We're happy to share the release of Vite 7! It has been 5 years since Evan You sent the first commit to the Vite repo, and nobody could have predicted how much the frontend ecosystem would change since then. Most modern frontend frameworks and tools are now working together, building on top of Vite's shared infrastructure. And they can innovate at a faster pace by sharing at a higher level. Vite is now being downloaded 31 million times a week, with a 14 million increase in the last seven months since the previous major release.

This year, we're making several big steps. To start with, [ViteConf](https://viteconf.org) is going to be in person! The Vite Ecosystem will gather in Amsterdam on October 9-10! Organized by [JSWorld](https://jsworldconference.com/) in partnership with [Bolt](https://bolt.new), [VoidZero](https://voidzero.dev), and the Vite Core Team! We had three incredible [ViteConf online editions](https://www.youtube.com/@viteconf/playlists), and we can't wait to meet in real life. Check out the speakers and get your ticket at the [ViteConf site](https://viteconf.org)!

And [VoidZero](https://voidzero.dev/posts/announcing-voidzero-inc) continues to make significant strides in its mission to build an open source unified development toolchain for the JavaScript ecosystem. Over the last year, the VoidZero team has been working on [Rolldown](https://rolldown.rs/), a Rust-based next-generation bundler, as part of a broader effort to modernize Vite's core. You can try out the Rolldown-powered Vite today by using the `rolldown-vite` package instead of the default `vite` package. It is a drop-in replacement, as Rolldown will become the default bundler for Vite in the future. Switching should reduce your build time, especially for larger projects. Read more at the [Rolldown-vite announcement blog post](https://voidzero.dev/posts/announcing-rolldown-vite) and our [migration guide](https://vite.dev/rolldown).

Through a partnership between VoidZero and [NuxtLabs](https://nuxtlabs.com/), Anthony Fu is working on creating Vite DevTools. They will offer deeper and more insightful debugging and analysis for all Vite-based projects and frameworks. You can read more on the [VoidZero and NuxtLabs join forces on Vite Devtools blog post](https://voidzero.dev/posts/voidzero-nuxtlabs-vite-devtools).

Quick links:

- [Docs](/)
- New Translation: [فارسی](https://fa.vite.dev/)
- Other Translations: [简体中文](https://cn.vite.dev/), [日本語](https://ja.vite.dev/), [Español](https://es.vite.dev/), [Português](https://pt.vite.dev/), [한국어](https://ko.vite.dev/), [Deutsch](https://de.vite.dev/)
- [Migration Guide](/guide/migration)
- [GitHub Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)

Play online with Vite 7 using [vite.new](https://vite.new) or scaffold a Vite app locally with your preferred framework running `pnpm create vite`. Check out the [Getting Started Guide](/guide/) for more information.

We invite you to help us improve Vite (joining the more than [1.1K contributors to Vite Core](https://github.com/vitejs/vite/graphs/contributors)), our dependencies, or plugins and projects in the ecosystem. Learn more at our [Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md). A good way to get started is by [triaging issues](https://github.com/vitejs/vite/issues), [reviewing PRs](https://github.com/vitejs/vite/pulls), sending tests PRs based on open issues, and supporting others in [Discussions](https://github.com/vitejs/vite/discussions) or Vite Land's [help forum](https://discord.com/channels/804011606160703521/1019670660856942652). If you have questions, join our [Discord community](http://chat.vite.dev/) and talk to us in the [#contributing channel](https://discord.com/channels/804011606160703521/804439875226173480).

Stay updated and connect with others building on top of Vite by following us on [Bluesky](https://bsky.app/profile/vite.dev), [X](https://twitter.com/vite_js), or [Mastodon](https://webtoo.ls/@vite).

## Node.js Support

Vite now requires Node.js 20.19+, 22.12+. We have dropped Node.js 18, now that it has reached its [EOL](https://endoflife.date/nodejs) at the end of April 2025.

We require these new ranges so Node.js supports `require(esm)` without a flag. This allows us to distribute Vite 7.0 as ESM only without preventing the Vite JavaScript API from being required by CJS modules. Check out Anthony Fu's [Move on to ESM-only](https://antfu.me/posts/move-on-to-esm-only) for a detailed review of the current state of ESM in the ecosystem.

## Default Browser Target Changed to Baseline Widely Available

[Baseline](https://web-platform-dx.github.io/web-features/) gives us clear information about which web platform features work across their core browser set today. Baseline Widely Available indicates the feature is well-established and works across many devices and browser versions, being available across browsers for at least 30 months.

In Vite 7, the default browser target is changing from `'modules'` to a new default: `'baseline-widely-available'`. The set of browsers will be updated on each major to match the list of minimum browser versions compatible with Baseline Widely available features. The default browser value of `build.target` is changing in Vite 7.0:

- Chrome 87 → 107
- Edge 88 → 107
- Firefox 78 → 104
- Safari 14.0 → 16.0

This change adds predictability to the default browser target for future releases.

## Vitest

For Vitest users, Vite 7.0 is supported from Vitest 3.2. You can read more about how the Vitest team keeps improving Vite testing story in the [Vitest 3.2 release blog post](https://vitest.dev/blog/vitest-3-2.html).

## Environment API

Vite 6 was the most significant major release since Vite 2, adding new capabilities with the [new experimental Environment API](https://vite.dev/blog/announcing-vite6.html#experimental-environment-api). We are keeping the new APIs as experimental while the ecosystem reviews how the new APIs fit on their projects and provide feedback. If you're building on top of Vite, we encourage you to test the new APIs and reach out to us in the [open Feedback discussion here](https://github.com/vitejs/vite/discussions/16358).

In Vite 7, we added a new `buildApp` hook to let plugins coordinate the building of environments. Read more in the [Environment API for Frameworks guide](/guide/api-environment-frameworks.html#environments-during-build).

We want to thank the teams that have been testing the new APIs and helping us stabilize the new features. The Cloudflare team, for example, announced the 1.0 release of their Cloudflare Vite plugin, as well as official support for React Router v7. Their plugin shows the potential of Environment API for runtime providers. Learn more about their approach and future steps at ["Just use Vite”… with the Workers runtime](https://blog.cloudflare.com/introducing-the-cloudflare-vite-plugin/).

## Migrating to Vite 7

Vite 7 should be a smooth update from Vite 6. We're removing already deprecated features, like Sass legacy API support and the `splitVendorChunkPlugin` that shouldn't affect your projects. We still suggest you review the [detailed Migration Guide](/guide/migration) before upgrading.

The complete list of changes is at the [Vite 7 Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md).

## Acknowledgments

Vite 7 was crafted by the [Vite Team](/team) with the help of the wide community of contributors, downstream maintainers, plugin authors. A special shout-out to [sapphi-red](https://github.com/sapphi-red) for his remarkable work on `rolldown-vite` and this release. Vite is brought to you by [VoidZero](https://voidzero.dev), in partnership with [Bolt](https://bolt.new/) and [Nuxt Labs](https://nuxtlabs.com/). We also want to thank our sponsors on [Vite's GitHub Sponsors](https://github.com/sponsors/vitejs) and [Vite's Open Collective](https://opencollective.com/vite).
