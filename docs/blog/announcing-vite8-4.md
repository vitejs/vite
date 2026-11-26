---
title: Vite 8.4 is out!
author:
  name: The Vite Team
date: 2026-11-26
sidebar: false
head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Announcing Vite 8.4
  - - meta
    - property: og:image
      content: https://vite.dev/og-image-announcing-vite8-4.webp
  - - meta
    - property: og:url
      content: https://vite.dev/blog/announcing-vite8-4
  - - meta
    - property: og:description
      content: Vite 8.4 Release Announcement

  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 8.4 is out!

_November 26, 2026_

<!-- TODO: update image -->

![Vite 8.4 Announcement Cover Image](/og-image-announcing-vite8-4.webp)

Quick links:

- [Docs](/)
- Translations: [简体中文](https://cn.vite.dev/), [日本語](https://ja.vite.dev/), [Español](https://es.vite.dev/), [한국어](https://ko.vite.dev/), [Deutsch](https://de.vite.dev/)
- [GitHub Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)

Play online with Vite 8.4 using [vite.new](https://vite.new) or scaffold a Vite app locally with your preferred framework running `pnpm create vite`. Check out the [Getting Started Guide](/guide/) for more information.

We invite you to help us improve Vite (joining the more than [1.3K contributors to Vite Core](https://github.com/vitejs/vite/graphs/contributors)), our dependencies, or plugins and projects in the ecosystem. Learn more at our [Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md). A good way to get started is by [triaging issues](https://github.com/vitejs/vite/issues), [reviewing PRs](https://github.com/vitejs/vite/pulls), sending tests PRs based on open issues, and supporting others in [Discussions](https://github.com/vitejs/vite/discussions) or Vite Land's [help forum](https://discord.com/channels/804011606160703521/1019670660856942652). If you have questions, join our [Discord community](https://chat.vite.dev) and talk to us in the [#contributing channel](https://discord.com/channels/804011606160703521/804439875226173480).

Stay updated and connect with others building on top of Vite by following us on [Bluesky](https://bsky.app/profile/vite.dev) or [X](https://twitter.com/vite_js).

## Features

### Allow-list Based File Serve Check

The [`server.fs`](/config/server-options#server-fs-strict) file serve check is a security feature to disallow files to be served in case the dev server is reachable from a threat actor. It was first introduced in Vite 2.7 and had been improved over the years. The check was a block-list based approach where you and Vite needed to list the sensitive files. This made sense initially as one of Vite's feature is to have implicit entrypoints.

Due to the nature of the block-list approach, we have to fix the bypasses exploiting the quirks of the file system, HTTP parsing. While we had been patching the block-list approach for less breakage in the ecosystem, given that the number of attacks are increasing, Vite 8.4 introduces a stricter allow-list based check. `server.fs.strict: 'extended'` was added to also apply the checks to modules loaded by plugins, and Vite now registers the referenced modules in the allow list not only via `import` but also via other ways such as `url()` in CSS.

Combining `server.fs.strict: 'extended'` with `server.fs.allow: []`, you can now opt in to the allow-list based approach. This will only allow the files referenced from the entrypoint, including the transitive references. We intend to switch to this approach by default in the next major.

If a plugin generates a module that references an asset not by `import`, it can call [`this.environment.addSafeModule`](/guide/api-environment-plugins#registering-safe-modules) so that users don't need to add the referenced module in `server.fs.allow`.

### Refetching Dynamic Imports

[The HTML specification has been updated](https://github.com/whatwg/html/pull/10327) this July to let browsers retry failed module fetches for dynamic imports. The new behavior is implemented by Chrome 156+, Firefox 155+, Safari Technology Preview 252. Vite 8.4 improves the preload helper for the dynamic imports so that the CSS for the dynamic chunk is re-fetched when the dynamic import is re-executed.

```js
export const onClick = async () => {
  // Before: this import threw an error
  //         if the fetch failed even for the second click
  //
  // After: the import succeeds if the fetch on the second
  //        click succeeds even after the first fetch failed
  //        (if the browser supports)
  const SuccessComponent = await import('./Success.ts')
  render(SuccessComponent)
}
```

### Subpath imports in CSS `url()`

While Vite has been supporting [subpath imports](https://nodejs.org/docs/latest-v26.x/api/packages.html#subpath-imports) for a while, it was not supported for CSS `url()`. This was due to the conflict with the hash URLs.

Now Vite tries to resolve as a subpath import and falls back as the raw hash URL if the resolution failed.

We now recommend using subpath imports over [`resolve.alias`](/config/shared-options#resolve-alias) or [tsconfig paths](/config/shared-options#resolve-tsconfigpaths), as it is supported by Node.js and TypeScript.

### Duplicate CLI Process Detection

Now Vite detects duplicate CLI processes. If you run a dev server for the same project with a similar option while it's running, Vite exits with an error message so it avoids running the same project:

```
Found another Vite dev process for this project at http://localhost:5173/ (PID 12345).
Pass --bypass-lock to bypass this check.
```

### Wasm Source Phase Import

[Source phase import](https://github.com/tc39/proposal-source-phase-imports) for Wasm is now supported in Vite. You can now import wasm files with source phase imports and get the `WebAssembly.Module` value:

```ts
import source mod from './mod.wasm'

const instance = await WebAssembly.instantiate(mod, {
  './imports.js': { someFunc: () => {} },
})
```

This is going to be supported by TypeScript 7.1, which is [currently beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/). Once TypeScript 7.1 is stable, we will recommend using it over [the Vite-specific `.wasm?init` feature](/guide/features#manual-initialization).

See [the guide](/guide/features#esm-integration) for more details.

### Highly Experimental Bundled Dev Mode for SSR

Highly experimental support of bundled dev mode for SSR is now available. This is the foundation for the bundled dev mode support for meta-frameworks. We'll be continuing to work on it.

## Other Changes

Check out the [Changelog](https://github.com/vitejs/vite/blob/v8.4.0/packages/vite/CHANGELOG.md) for other features and bug fixes.

## Acknowledgments

Vite 8.4 is possible thanks to our community of contributors, maintainers in the ecosystem, and the [Vite Team](/team). Vite is brought to you by [VoidZero](https://voidzero.dev), in partnership with [Bolt](https://bolt.new/) and [Nuxt Labs](https://nuxtlabs.com/). We also want to thank our sponsors on [Vite's GitHub Sponsors](https://github.com/sponsors/vitejs) and [Vite's Open Collective](https://opencollective.com/vite).
