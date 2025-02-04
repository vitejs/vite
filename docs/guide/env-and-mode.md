# Env Variables and Modes

## Env Variables

Vite exposes env variables on the special **`import.meta.env`** object, which are statically replaced at build time. Some built-in variables are available in all cases:

- **`import.meta.env.MODE`**: {string} the [mode](#modes) the app is running in.

- **`import.meta.env.BASE_URL`**: {string} the base url the app is being served from. This is determined by the [`base` config option](/config/shared-options.md#base).

- **`import.meta.env.PROD`**: {boolean} whether the app is running in production (running the dev server with `NODE_ENV='production'` or running an app built with `NODE_ENV='production'`).

- **`import.meta.env.DEV`**: {boolean} whether the app is running in development (always the opposite of `import.meta.env.PROD`)

- **`import.meta.env.SSR`**: {boolean} whether the app is running in the [server](./ssr.md#conditional-logic).

## `.env` Files

Vite uses [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the following files in your [environment directory](/config/shared-options.md#envdir):

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

:::tip Env Loading Priorities

An env file for a specific mode (e.g. `.env.production`) will take higher priority than a generic one (e.g. `.env`).

Vite will always load `.env` and `.env.local` in addition to the mode-specific `.env.[mode]` file. Variables declared in mode-specific files will take precedence over those in generic files, but variables defined only in `.env` or `.env.local` will still be available in the environment.

In addition, environment variables that already exist when Vite is executed have the highest priority and will not be overwritten by `.env` files. For example, when running `VITE_SOME_KEY=123 vite build`.

`.env` files are loaded at the start of Vite. Restart the server after making changes.
:::

Loaded env variables are also exposed to your client source code via `import.meta.env` as strings.

To prevent accidentally leaking env variables to the client, only variables prefixed with `VITE_` are exposed to your Vite-processed code. e.g. for the following env variables:

```[.env]
VITE_SOME_KEY=123
DB_PASSWORD=foobar
```

Only `VITE_SOME_KEY` will be exposed as `import.meta.env.VITE_SOME_KEY` to your client source code, but `DB_PASSWORD` will not.

```js
console.log(import.meta.env.VITE_SOME_KEY) // "123"
console.log(import.meta.env.DB_PASSWORD) // undefined
```

:::tip Env parsing

As shown above, `VITE_SOME_KEY` is a number but returns a string when parsed. The same would also happen for boolean env variables. Make sure to convert to the desired type when using it in your code.
:::

Also, Vite uses [dotenv-expand](https://github.com/motdotla/dotenv-expand) to expand variables written in env files out of the box. To learn more about the syntax, check out [their docs](https://github.com/motdotla/dotenv-expand#what-rules-does-the-expansion-engine-follow).

Note that if you want to use `$` inside your environment value, you have to escape it with `\`.

```[.env]
KEY=123
NEW_KEY1=test$foo   # test
NEW_KEY2=test\$foo  # test$foo
NEW_KEY3=test$KEY   # test123
```

If you want to customize the env variables prefix, see the [envPrefix](/config/shared-options.html#envprefix) option.

:::warning SECURITY NOTES

- `.env.*.local` files are local-only and can contain sensitive variables. You should add `*.local` to your `.gitignore` to avoid them being checked into git.

- Since any variables exposed to your Vite source code will end up in your client bundle, `VITE_*` variables should _not_ contain any sensitive information.
  :::

::: details Expanding variables in reverse order

Vite supports expanding variables in reverse order.
For example, the `.env` below will be evaluated as `VITE_FOO=foobar`, `VITE_BAR=bar`.

```[.env]
VITE_FOO=foo${VITE_BAR}
VITE_BAR=bar
```

This does not work in shell scripts and other tools like `docker-compose`.
That said, Vite supports this behavior as this has been supported by `dotenv-expand` for a long time and other tools in JavaScript ecosystem uses older versions that supports this behavior.

To avoid interop issues, it is recommended to avoid relying on this behavior. Vite may start emitting warnings for this behavior in the future.

:::

### IntelliSense for TypeScript

By default, Vite provides type definitions for `import.meta.env` in [`vite/client.d.ts`](https://github.com/vitejs/vite/blob/main/packages/vite/client.d.ts). While you can define more custom env variables in `.env.[mode]` files, you may want to get TypeScript IntelliSense for user-defined env variables that are prefixed with `VITE_`.

To achieve this, you can create an `vite-env.d.ts` in `src` directory, then augment `ImportMetaEnv` like this:

```typescript [vite-env.d.ts]
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

If your code relies on types from browser environments such as [DOM](https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts) and [WebWorker](https://github.com/microsoft/TypeScript/blob/main/src/lib/webworker.generated.d.ts), you can update the [lib](https://www.typescriptlang.org/tsconfig#lib) field in `tsconfig.json`.

```json [tsconfig.json]
{
  "lib": ["WebWorker"]
}
```

:::warning Imports will break type augmentation

If the `ImportMetaEnv` augmentation does not work, make sure you do not have any `import` statements in `vite-env.d.ts`. See the [TypeScript documentation](https://www.typescriptlang.org/docs/handbook/2/modules.html#how-javascript-modules-are-defined) for more information.
:::

## HTML Env Replacement

Vite also supports replacing env variables in HTML files. Any properties in `import.meta.env` can be used in HTML files with a special `%ENV_NAME%` syntax:

```html
<h1>Vite is running in %MODE%</h1>
<p>Using data from %VITE_API_URL%</p>
```

If the env doesn't exist in `import.meta.env`, e.g. `%NON_EXISTENT%`, it will be ignored and not replaced, unlike `import.meta.env.NON_EXISTENT` in JS where it's replaced as `undefined`.

Given that Vite is used by many frameworks, it is intentionally unopinionated about complex replacements like conditionals. Vite can be extended using [an existing userland plugin](https://github.com/vitejs/awesome-vite#transformers) or a custom plugin that implements the [`transformIndexHtml` hook](./api-plugin#transformindexhtml).

## Modes

By default, the dev server (`dev` command) runs in `development` mode and the `build` command runs in `production` mode.

This means when running `vite build`, it will load the env variables from `.env.production` if there is one:

```
# .env.production
VITE_APP_TITLE=My App
```

In your app, you can render the title using `import.meta.env.VITE_APP_TITLE`.

In some cases, you may want to run `vite build` with a different mode to render a different title. You can overwrite the default mode used for a command by passing the `--mode` option flag. For example, if you want to build your app for a staging mode:

```bash
vite build --mode staging
```

And create a `.env.staging` file:

```
# .env.staging
VITE_APP_TITLE=My App (staging)
```

As `vite build` runs a production build by default, you can also change this and run a development build by using a different mode and `.env` file configuration:

```
# .env.testing
NODE_ENV=development
```

## NODE_ENV and Modes

It's important to note that `NODE_ENV` (`process.env.NODE_ENV`) and modes are two different concepts. Here's how different commands affect the `NODE_ENV` and mode:

| Command                                              | NODE_ENV        | Mode            |
| ---------------------------------------------------- | --------------- | --------------- |
| `vite build`                                         | `"production"`  | `"production"`  |
| `vite build --mode development`                      | `"production"`  | `"development"` |
| `NODE_ENV=development vite build`                    | `"development"` | `"production"`  |
| `NODE_ENV=development vite build --mode development` | `"development"` | `"development"` |

The different values of `NODE_ENV` and mode also reflect on its corresponding `import.meta.env` properties:

| Command                | `import.meta.env.PROD` | `import.meta.env.DEV` |
| ---------------------- | ---------------------- | --------------------- |
| `NODE_ENV=production`  | `true`                 | `false`               |
| `NODE_ENV=development` | `false`                | `true`                |
| `NODE_ENV=other`       | `false`                | `true`                |

| Command              | `import.meta.env.MODE` |
| -------------------- | ---------------------- |
| `--mode production`  | `"production"`         |
| `--mode development` | `"development"`        |
| `--mode staging`     | `"staging"`            |

:::tip `NODE_ENV` in `.env` files

`NODE_ENV=...` can be set in the command, and also in your `.env` file. If `NODE_ENV` is specified in a `.env.[mode]` file, the mode can be used to control its value. However, both `NODE_ENV` and modes remain as two different concepts.

The main benefit with `NODE_ENV=...` in the command is that it allows Vite to detect the value early. It also allows you to read `process.env.NODE_ENV` in your Vite config as Vite can only load the env files once the config is evaluated.
:::
