# SSR Options

- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

:::warning Experimental
SSR options may be adjusted in minor releases.
:::

## ssr.external

- **Type:** `string[]`

Force externalize dependencies for SSR.

## ssr.noExternal

- **Type:** `string | RegExp | (string | RegExp)[] | true`

Prevent listed dependencies from being externalized for SSR. If `true`, no dependencies are externalized.

## ssr.target

- **Type:** `'node' | 'webworker'`
- **Default:** `node`

Build target for the SSR server.
