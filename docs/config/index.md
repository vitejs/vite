---
title: Configuring Vite
---

# Configuring Vite

When running `vite` from the command line, Vite will automatically try to resolve a config file named `vite.config.js` inside [project root](/guide/#index-html-and-project-root).

The most basic config file looks like this:

```js
// vite.config.js
export default {
  // config options
}
```

Note Vite supports using ES modules syntax in the config file even if the project is not using native Node ESM, e.g. `type: "module"` in `package.json`. In this case, the config file is auto pre-processed before load.

You can also explicitly specify a config file to use with the `--config` CLI option (resolved relative to `cwd`):

```bash
vite --config my-config.js
```

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

Vite also directly supports TS config files. You can use `vite.config.ts` with the `defineConfig` helper as well.

## Conditional Config

If the config needs to conditionally determine options based on the command (`dev`/`serve` or `build`), the [mode](/guide/env-and-mode) being used, or if it is an SSR build (`ssrBuild`), it can export a function instead:

```js
export default defineConfig(({ command, mode, ssrBuild }) => {
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

It is important to note that in Vite's API the `command` value is `serve` during dev (in the cli `vite`, `vite dev`, and `vite serve` are aliases), and `build` when building for production (`vite build`).

`ssrBuild` is experimental. It is only available during build instead of a more general `ssr` flag because, during dev, the config is shared by the single server handling SSR and non-SSR requests. The value could be `undefined` for tools that don't have separate commands for the browser and SSR build, so use explicit comparison against `true` and `false`.

## Async Config

If the config needs to call async function, it can export a async function instead:

```js
export default defineConfig(async ({ command, mode }) => {
  const data = await asyncFunction()
  return {
    // vite config
  }
})
```

## Environment Variables

Environmental Variables can be obtained from `process.env` as usual.

Note that Vite doesn't load `.env` files by default as the files to load can only be determined after evaluating the Vite config, for example, the `root` and `envDir` options affect the loading behaviour. However, you can use the exported `loadEnv` helper to load the specific `.env` file if needed.

```js
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // vite config
    define: {
      __APP_ENV__: env.APP_ENV,
    },
  }
})
```
