# SSR Options

## ssr.external

- **Type:** `string[] | true`
- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

Externalize the given dependencies and their transitive dependencies for SSR. By default, all dependencies are externalized except for linked dependencies (for HMR). If you prefer to externalize the linked dependency, you can pass its name to this option.

If `true`, all dependencies including linked dependencies are externalized.

Note that the explicitly listed dependencies (using `string[]` type) will always take priority if they're also listed in `ssr.noExternal` (using any type).

## ssr.noExternal

- **Type:** `string | RegExp | (string | RegExp)[] | true`
- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

Prevent listed dependencies from being externalized for SSR, which they will get bundled in build. By default, only linked dependencies are not externalized (for HMR). If you prefer to externalize the linked dependency, you can pass its name to the `ssr.external` option.

If `true`, no dependencies are externalized. However, dependencies explicitly listed in `ssr.external` (using `string[]` type) can take priority and still be externalized. If `ssr.target: 'node'` is set, Node.js built-ins will also be externalized by default.

Note that if both `ssr.noExternal: true` and `ssr.external: true` are configured, `ssr.noExternal` takes priority and no dependencies are externalized.

## ssr.target

- **Type:** `'node' | 'webworker'`
- **Default:** `node`

Build target for the SSR server.

## ssr.resolve.conditions

- **Type:** `string[]`
- **Related:** [Resolve Conditions](./shared-options.md#resolve-conditions)

Defaults to the root [`resolve.conditions`](./shared-options.md#resolve-conditions).

These conditions are used in the plugin pipeline, and only affect non-externalized dependencies during the SSR build. Use `ssr.resolve.externalConditions` to affect externalized imports.

## ssr.resolve.externalConditions

- **Type:** `string[]`
- **Default:** `[]`

Conditions that are used during ssr import (including `ssrLoadModule`) of externalized dependencies.
