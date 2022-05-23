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

Note Vite supports using ES modules syntax in the config file even if the project is not using native Node ESM via `type: "module"`. In this case, the config file is auto pre-processed before load.

You can also explicitly specify a config file to use with the `--config` CLI option (resolved relative to `cwd`):

```bash
vite --config my-config.js
```

::: tip NOTE
Vite will replace `__filename`, `__dirname`, and `import.meta.url` in config files and its deps. Using these as variable names or passing as a parameter to a function with string double quote (example `console.log`) will result in an error:

```js
const __filename = "value"
// will be transformed to
const "path/vite.config.js" = "value"

console.log("import.meta.url") // break error on build
```

:::

## Config Intellisense

Since Vite ships with TypeScript typings, you can leverage your IDE's intellisense with jsdoc type hints:

```js
/**
 * @type {import('vite').UserConfig}
 */
const config = {
  // ...
}

export default config
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

If the config needs to conditional determine options based on the command (`dev`/`serve` or `build`) or the [mode](/guide/env-and-mode) being used, it can export a function instead:

```js
export default defineConfig(({ command, mode }) => {
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

Note that Vite doesn't load `.env` files by default as the files to load can only be determined after evaluating the Vite config, for example, the `root` and `envDir` options affects the loading behaviour. However, you can use the exported `loadEnv` helper to load the specific `.env` file if needed.

```js
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // vite config
    define: {
      __APP_ENV__: env.APP_ENV
    }
  }
})
```
