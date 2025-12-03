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

Note Vite supports using ES modules syntax in the config file even if the project is not using native Node ESM, e.g. `"type": "module"` in `package.json`. In this case, the config file is auto pre-processed before load.

You can also explicitly specify a config file to use with the `--config` CLI option (resolved relative to `cwd`):

```bash
vite --config my-config.js
```

::: tip CONFIG LOADING
By default, Vite uses [Rolldown](https://rolldown.rs/) to bundle the config into a temporary file and load it. This may cause issues when importing TypeScript files in a monorepo. If you encounter any issues with this approach, you can specify `--configLoader runner` to use the [module runner](/guide/api-environment-runtimes.html#modulerunner) instead, which will not create a temporary config and will transform any files on the fly. Note that module runner doesn't support CJS in config files, but external CJS packages should work as usual.

Alternatively, if you're using an environment that supports TypeScript (e.g. `node --experimental-strip-types`), or if you're only writing plain JavaScript, you can specify `--configLoader native` to use the environment's native runtime to load the config file. Note that updates to modules imported by the config file are not detected and hence would not auto-restart the Vite server.
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

## Debugging the Config File on VS Code

With the default `--configLoader bundle` behavior, Vite writes the generated temporary configuration file to the `node_modules/.vite-temp` folder and a file not found error will occur when setting breakpoint debugging in the Vite config file. To fix the issue, add the following configuration to `.vscode/settings.json`:

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
