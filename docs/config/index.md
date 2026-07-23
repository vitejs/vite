---
title: Configuring Vite
---

# Configuring Vite

When running `vite` from the command line, Vite will automatically try to resolve a config file named `vite.config.js` inside [project root](/guide/#index-html-and-project-root) (other JS and TS extensions are also supported).

The most basic config file looks like this:

```js [vite.config.js]
export default {
  // config options
}
```

Note that to use ES modules syntax in the config file, it should be in a file detected as ESM by Node.js, e.g. `.mjs` or `.js` with `"type": "module"` in closest `package.json`.

You can also explicitly specify a config file to use with the `--config` CLI option (resolved relative to `cwd`):

```bash
vite --config my-config.js
```

<ScrimbaLink href="https://scrimba.com/intro-to-vite-c03p6pbbdq/~05jg?via=vite" title="Configuring Vite">Watch an interactive lesson on Scrimba</ScrimbaLink>

::: tip CONFIG LOADING
By default, Vite uses [Rolldown](https://rolldown.rs/) to bundle the config into a temporary file and load it. If you're using an environment that supports TypeScript (e.g. Node 22.18+), or if you're only writing plain JavaScript, you can specify `--configLoader native` to use the environment's native runtime to load the config file. `configLoader: 'native'` is planned to become the default in a future major version.
:::

## Config Intellisense

Since Vite ships with TypeScript typings, you can leverage your IDE's intellisense with jsdoc type hints:

```js
/** @type {import('vite').UserConfig} */
export default {
  // ...
}
```

Alternatively, you can use the `defineConfig` helper which should provide intellisense without the need for jsdoc annotations:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  // ...
})
```

Vite also supports TypeScript config files. You can use `vite.config.ts` with the `defineConfig` helper function above, or with the `satisfies` operator:

```ts
import type { UserConfig } from 'vite'

export default {
  // ...
} satisfies UserConfig
```

## Conditional Config

If the config needs to conditionally determine options based on the command (`serve` or `build`), the [mode](/guide/env-and-mode#modes) being used, if it's an SSR build (`isSsrBuild`), or is previewing the build (`isPreview`), it can export a function instead:

```js twoslash
import { defineConfig } from 'vite'
// ---cut---
export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (command === 'serve') {
    return {
      // dev specific config
    }
  } else {
    // command === 'build'
    return {
      // build specific config
    }
  }
})
```

It is important to note that in Vite's API the `command` value is `serve` during dev (in the cli [`vite`](/guide/cli#vite), `vite dev`, and `vite serve` are aliases), and `build` when building for production ([`vite build`](/guide/cli#vite-build)).

`isSsrBuild` and `isPreview` are additional optional flags to differentiate the kind of `build` and `serve` commands respectively. Some tools that load the Vite config may not support these flags and will pass `undefined` instead. Hence, it's recommended to use explicit comparison against `true` and `false`.

## Async Config

If the config needs to call async functions, it can export an async function instead. And this async function can also be passed through `defineConfig` for improved intellisense support:

```js twoslash
import { defineConfig } from 'vite'
// ---cut---
export default defineConfig(async ({ command, mode }) => {
  const data = await asyncFunction()
  return {
    // vite config
  }
})
```

## Using Environment Variables in Config

Environment variables available while the config itself is being evaluated are only those that already exist in the current process environment (`process.env`). Vite deliberately defers loading any `.env*` files until _after_ the user config has been resolved because the set of files to load depends on config options like [`root`](/guide/#index-html-and-project-root) and [`envDir`](/config/shared-options.md#envdir), and also on the final `mode`.

This means: variables defined in `.env`, `.env.local`, `.env.[mode]`, or `.env.[mode].local` are **not** automatically injected into `process.env` while your `vite.config.*` is running. They _are_ automatically loaded later and exposed to application code via `import.meta.env` (with the default `VITE_` prefix filter) exactly as documented in [Env Variables and Modes](/guide/env-and-mode.html). So if you only need to pass values from `.env*` files to the app, you don't need to call anything in the config.

If, however, values from `.env*` files must influence the config itself (for example to set `server.port`, conditionally enable plugins, or compute `define` replacements), you can load them manually using the exported [`loadEnv`](/guide/api-javascript.html#loadenv) helper.

```js twoslash
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      // Provide an explicit app-level constant derived from an env var.
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    // Example: use an env var to set the dev server port conditionally.
    server: {
      port: env.APP_PORT ? Number(env.APP_PORT) : 5173,
    },
  }
})
```

## Debugging the Config File in VS Code

For the most reliable debugging experience, use the native config loader when starting Vite:

```bash
vite --configLoader native
```

The native loader executes the original config file directly, so breakpoints in the config file and in plugin hooks such as `transform` map to the original source. It requires a runtime that supports the syntax used by your config file, such as Node.js 22.18+ for TypeScript files.

When using `--configLoader bundle` (the current default, though `native` is planned to become the default in a future major version), Vite generates an inline source map and writes the bundled config to `node_modules/.vite-temp` before loading it. If you need to use the bundle loader, add the temporary directory for the JavaScript Debug Terminal in `.vscode/settings.json`:

```json
{
  "debug.javascript.terminalOptions": {
    "resolveSourceMapLocations": [
      "${workspaceFolder}/**",
      "!**/node_modules/**",
      "**/node_modules/.vite-temp/**"
    ]
  }
}
```

This setting only applies to the JavaScript Debug Terminal, it does not affect launch configurations started from the Run and Debug view. To support this for the Run and Debug view, add the temporary directory in `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Vite",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["exec", "vite", "--configLoader", "bundle"],
      "console": "integratedTerminal",
      "sourceMaps": true,
      "resolveSourceMapLocations": [
        "${workspaceFolder}/**",
        "!**/node_modules/**",
        "**/node_modules/.vite-temp/**"
      ]
    }
  ]
}
```
