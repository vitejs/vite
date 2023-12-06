# SSR Options

## ssr.external

- **Type:** `string[] | true`
- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

Externalize dependencies for SSR. By default, all dependencies are externalized, except linked dependencies for HMR. This can opted-out by adding the dependency to this option, or set `true` to force externalize all dependencies.

## ssr.noExternal

- **Type:** `string | RegExp | (string | RegExp)[] | true`
- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

Prevent listed dependencies from being externalized for SSR. If `true`, no dependencies are externalized. If a dependency is explicitly defined in `ssr.external`, it will take priority and be externalized along with its transitive dependencies.

## ssr.target

- **Type:** `'node' | 'webworker'`
- **Default:** `node`

Build target for the SSR server.

## ssr.resolve.conditions

- **Type:** `string[]`
- **Related:** [Resolve Conditions](./shared-options.md#resolve-conditions)

Defaults to the the root [`resolve.conditions`](./shared-options.md#resolve-conditions).

These conditions are used in the plugin pipeline, and only affect non-externalized dependencies during the SSR build. Use `ssr.resolve.externalConditions` to affect externalized imports.

## ssr.resolve.externalConditions

- **Type:** `string[]`
- **Default:** `[]`

Conditions that are used during ssr import (including `ssrLoadModule`) of externalized dependencies.
