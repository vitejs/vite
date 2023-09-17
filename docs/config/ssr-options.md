# SSR Options

## ssr.external

- **Type:** `string[]`
- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

Force externalize dependencies for SSR.

## ssr.noExternal

- **Type:** `string | RegExp | (string | RegExp)[] | true`
- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

Prevent listed dependencies from being externalized for SSR. If `true`, no dependencies are externalized.

## ssr.target

- **Type:** `'node' | 'webworker'`
- **Default:** `node`

Build target for the SSR server.
