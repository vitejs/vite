# Rolldown Integration

Vite is planning to integrate [Rolldown](https://rolldown.rs), a Rust-powered JavaScript bundler, to improve build performance and capabilities.

## What is Rolldown?

Rolldown is a modern, high-performance JavaScript bundler written in Rust. It's designed as a drop-in replacement for Rollup, aiming to provide significant performance improvements while maintaining compatibility with the existing ecosystem.

Rolldown focuses on three key principles:

- **Speed**: Built with Rust for maximum performance
- **Compatibility**: Works with existing Rollup plugins
- **Developer Experience**: Familiar API for Rollup users

## Why Vite is Migrating to Rolldown

1. **Unification**: Vite currently uses esbuild for dependency pre-bundling and Rollup for production builds. Rolldown aims to unify these into a single, high-performance bundler that can be used for both purposes, reducing complexity.

2. **Performance**: Rolldown's Rust-based implementation offers significant performance improvements over JavaScript-based bundlers. While specific benchmarks may vary by project size and complexity, early tests show promising speed increases compared to Rollup.

For additional insights on the motivations behind Rolldown, see the [reasons why Rolldown is being built](https://rolldown.rs/guide/#why-rolldown).

## Benefits of Trying `rolldown-vite`

- Experience significantly faster build times, especially for larger projects
- Provide valuable feedback to help shape the future of Vite's bundling experience
- Prepare your projects for the eventual official Rolldown integration

## How to Try Rolldown

The rolldown-powered version of Vite is currently available as a separate package called `rolldown-vite`. You can try it by adding package overrides to your `package.json`:

:::code-group

```json [npm]
{
  "overrides": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

```json [Yarn]
{
  "resolutions": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

```json [pnpm]
{
  "pnpm": {
    "overrides": {
      "vite": "npm:rolldown-vite@latest"
    }
  }
}
```

```json [Bun]
{
  "overrides": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

:::

After adding these overrides, reinstall your dependencies and start your development server or build your project as usual. No further configuration changes are required.

## Known Limitations

While Rolldown aims to be a drop-in replacement for Rollup, there are features that are still being implemented and minor intentional behavior differences. For a comprehensive list, please refer to [this GitHub PR](https://github.com/vitejs/rolldown-vite/pull/84#issue-2903144667) which is regularly updated.

## Reporting Issues

Since this is an experimental integration, you may encounter issues. If you do, please report them in the [`vitejs/rolldown-vite`](https://github.com/vitejs/rolldown-vite) repository, **not the main Vite repository**.

When [reporting issues](https://github.com/vitejs/rolldown-vite/issues/new), please follow the issue template and provide:

- A minimal reproduction of the issue
- Your environment details (OS, Node version, package manager)
- Any relevant error messages or logs

For real-time discussions and troubleshooting, make sure to join the [Rolldown Discord](https://chat.rolldown.rs/).

## Future Plans

The `rolldown-vite` package is a temporary solution to gather feedback and stabilize the Rolldown integration. In the future, this functionality will be merged back into the main Vite repository.

We encourage you to try out `rolldown-vite` and contribute to its development through feedback and issue reports.
