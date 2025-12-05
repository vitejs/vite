---
title: 'Vite 8 Beta: The Rolldown-powered Vite'
author:
  name: The Vite Team
date: 2025-12-03
sidebar: false
head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Announcing Vite 8 Beta
  - - meta
    - property: og:image
      content: https://vite.dev/og-image-announcing-vite8-beta.webp
  - - meta
    - property: og:url
      content: https://vite.dev/blog/announcing-vite8-beta
  - - meta
    - property: og:description
      content: Vite 8 Beta Release Announcement
  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 8 Beta: The Rolldown-powered Vite

_December 3, 2025_

![Vite 8 Beta Announcement Cover Image](/og-image-announcing-vite8-beta.webp)

TL;DR: The first beta of Vite 8, powered by [Rolldown](https://rolldown.rs/), is now available. Vite 8 ships significantly faster production builds and unlocks future improvement possibilities. You can try the new release by upgrading `vite` to version `8.0.0-beta.0` and reading the [migration guide](/guide/migration).

---

We're excited to release the first beta of Vite 8. This release unifies the underlying toolchain and brings better consistent behaviors, alongside significant build performance improvements. Vite now uses [Rolldown](https://rolldown.rs/) as its bundler, replacing the previous combination of esbuild and Rollup.

## A new bundler for the web

Vite previously relied on two bundlers to meet differing requirements for development and production builds:

1. esbuild for fast compilation during development
2. Rollup for bundling, chunking, and optimizing production builds

This approach lets Vite focus on developer experience and orchestration instead of reinventing parsing and bundling. However, maintaining two separate bundling pipelines introduced inconsistencies: separate transformation pipelines, different plugin systems and a growing amount of glue code to keep bundling behavior aligned between development and production.

To solve this, [VoidZero team](https://voidzero.dev) has built **Rolldown**, the next-generation bundler with the goal to be used in Vite. It is designed for:

- **Performance**: Rolldown is written in Rust and operates at native speed. It matches esbuild’s performance level and is [**10–30× faster than Rollup**](https://github.com/rolldown/benchmarks).
- **Compatibility**: Rolldown supports the same plugin API as Rollup and Vite. Most Vite plugins work out of the box with Vite 8.
- **More Features**: Rolldown unlocks more advanced features for Vite, including full bundle mode, more flexible chunk split control, module-level persistent cache, Module Federation, and more.

## Unifying the toolchain

The impact of Vite’s bundler swap goes beyond performance. Bundlers leverage parsers, resolvers, transformers, and minifiers. Rolldown uses Oxc, another project led by VoidZero, for these purposes.

**That makes Vite the entry point to an end-to-end toolchain maintained by the same team: The build tool (Vite), the bundler (Rolldown) and the compiler (Oxc).**

This alignment ensures behavior consistency across the stack, and allows us to rapidly adopt and align with new language specifications as JavaScript continues to evolve. It also unlocks a wide range of improvements that previously couldn’t be done by Vite alone. For example, we can leverage Oxc’s semantic analysis to perform better tree-shaking in Rolldown.

## How Vite migrated to Rolldown

The migration to a Rolldown-powered Vite is a foundational change. Therefore, our team took deliberate steps to implement it without sacrificing stability or ecosystem compatibility.

First, a separate `rolldown-vite` package was [released as a technical preview](https://voidzero.dev/posts/announcing-rolldown-vite). This allowed us to work with early adopters without affecting the stable version of Vite. Early adopters benefited from Rolldown’s performance gains while providing valuable feedback. Highlights:

- Linear's production build times were reduced from 46s to 6s
- Ramp reduced their build time by 57%
- Mercedes-Benz.io cut their build time down by up to 38%
- Beehiiv reduced their build time by 64%

Next, we set up a test suite for validating key Vite plugins against `rolldown-vite`. This CI job helped us catch regressions and compatibility issues early, especially for frameworks and meta-frameworks such as SvelteKit, react-router and Storybook.

Lastly, we built a compatibility layer to help migrate developers from Rollup and esbuild options to the corresponding Rolldown options.

As a result, there is a smooth migration path to Vite 8 for everyone.

## Migrating to Vite 8 Beta

Since Vite 8 touches the core build behavior, we focused on keeping the configuration API and plugin hooks unchanged. We created a [migration guide](/guide/migration) to help you upgrade.

There are two available upgrade paths:

1. **Direct Upgrade:** Update `vite` in `package.json` and run the usual dev and build commands.
2. **Gradual Migration:** Migrate from Vite 7 to the `rolldown-vite` package, and then to Vite 8. This allows you to identify incompatibilities or issues isolated to Rolldown without other changes to Vite. (Recommended for larger or complex projects)

> [!IMPORTANT]
> If you are relying on specific Rollup or esbuild options, you might need to make some adjustments to your Vite config. Please refer to the [migration guide](/guide/migration) for detailed instructions and examples.
> As with all non-stable, major releases, thorough testing is recommended after upgrading to ensure everything works as expected. Please make sure to report any [issues](https://github.com/vitejs/rolldown-vite/issues).

If you use a framework or tool that uses Vite as dependency, for example Astro, Nuxt, or Vitest, you have to override the `vite` dependency in your `package.json`, which works slightly different depending on your package manager:

:::code-group

```json [npm]
{
  "overrides": {
    "vite": "8.0.0-beta.0"
  }
}
```

```json [Yarn]
{
  "resolutions": {
    "vite": "8.0.0-beta.0"
  }
}
```

```json [pnpm]
{
  "pnpm": {
    "overrides": {
      "vite": "8.0.0-beta.0"
    }
  }
}
```

```json [Bun]
{
  "overrides": {
    "vite": "8.0.0-beta.0"
  }
}
```

:::

After adding these overrides, reinstall your dependencies and start your development server or build your project as usual.

## Additional Features in Vite 8

In addition to shipping with Rolldown, Vite 8 comes with:

- **Built-in tsconfig `paths` support:** Developers can enable it by setting [`resolve.tsconfigPaths`](/config/shared-options.md#resolve-tsconfigpaths) to `true`. This feature has a small performance cost and is not enabled by default.
- **`emitDecoratorMetadata` support:** Vite 8 now has built-in automatic support for TypeScript's [`emitDecoratorMetadata` option](https://www.typescriptlang.org/tsconfig/#emitDecoratorMetadata). See the [Features](/guide/features.md#emitdecoratormetadata) page for more details.

## Looking Ahead

Speed has always been a defining feature for Vite. The integration with Rolldown and, by extension, Oxc means JavaScript developers benefit from Rust’s speed. Upgrading to Vite 8 should result in performance gains simply from using Rust.

We are also excited to ship Vite’s Full Bundle Mode soon, which drastically improves Vite’s dev server speed for large projects. Preliminary results show 3× faster dev server startup, 40% faster full reloads, and 10× fewer network requests.

Another defining Vite feature is the plugin ecosystem. We want JavaScript developers to continue extending and customizing Vite in JavaScript, the language they’re familiar with, while benefiting from Rust’s performance gains. Our team is collaborating with VoidZero team to accelerate JavaScript plugin usage in these Rust-based systems.

Upcoming optimizations that are currently experimental:

- [**Raw AST transfer**](https://github.com/oxc-project/oxc/issues/2409). Allow JavaScript plugins to access the Rust-produced AST with minimal overhead.
- [**Native MagicString transforms**](https://rolldown.rs/in-depth/native-magic-string#native-magicstring). Simple custom transforms with logic in JavaScript but computation in Rust.

## **Connect with us**

If you've tried Vite 8 beta, then we'd love to hear your feedback! Please report any issues or share your experience:

- **Discord**: Join our [community server](https://chat.vite.dev/) for real-time discussions
- **GitHub**: Share feedback on [GitHub discussions](https://github.com/vitejs/vite/discussions)
- **Issues**: Report issues on the [rolldown-vite repository](https://github.com/vitejs/rolldown-vite/issues) for bugs and regressions
- **Wins**: Share your improved build times in the [rolldown-vite-perf-wins repository](https://github.com/vitejs/rolldown-vite-perf-wins)

We appreciate all reports and reproduction cases. They help guide us towards the release of a stable 8.0.0.
