# Env Variables and Modes

## Env Variables

Vite exposes env variables on the special **`import.meta.env`** object. Some built-in variables are available in all cases:

- **`import.meta.env.MODE`**: {string} the [mode](#modes) the app is running in.

- **`import.meta.env.BASE_URL`**: {string} the base url the app is being served from. In development, this is always `/`. In production, this is determined by the [`build.base` config option](/config/#build-base).

- **`import.meta.env.PROD`**: {boolean} whether the app is running in production.

- **`import.meta.env.DEV`**: {boolean} whether the app is running in development (always the opposite of `import.meta.env.PROD`)

:::tip
These env variables are statically replaced during build, so make sure to always reference them using the full format.
:::

## `.env` Files

Vite uses [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the following files in your project root:

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

Loaded env variables are also exposed to your client source code via `import.meta.env`.

To prevent accidentally leaking env variables to the client, only variables prefixed with `VITE_` are exposed to your Vite-processed code. e.g. the following file:

```
DB_PASSWORD=foobar
VITE_SOME_KEY=123
```

Only `VITE_SOME_KEY` will be exposed as `import.meta.env.VITE_SOME_KEY` to your client source code, but `DB_PASSWORD` will not.

:::warning SECURITY NOTES

- `.env.*.local` files are local-only and can contain sensitive variables. You should add `.local` to your `.gitignore` to avoid them being checked into git.

- Since any variables exposed to your Vite source code will end up in your client bundle, `VITE_*` variables should _not_ contain any sensitive information.
:::

## Modes

By default, the dev server (`serve` command) runs in `development` mode, and the `build` command runs in `production` mode.

This means when running `vite build`, it will load the env variables from `.env.production` if there is one:

```
# .env.production
VITE_APP_TITLE=My App
```

In your app, you can render the title using `import.meta.env.VITE_APP_TITLE`.

However, it is important to understand that **mode** is a wider concept than just development vs. production. A typical example is you may want to have a "staging" mode where it should have production-like behavior, but with slightly different env variables from production.

You can overwrite the default mode used for a command by passing the `--mode` option flag. For example, if you want to build your app for our hypothetical staging mode:

```bash
vite build --mode staging
```

And to get the behavior we want, we need a `.env.staging` file:

```
# .env.staging
NODE_ENV=production
VITE_APP_TITLE=My App (staging)
```

Now your staging app should have production-like behavior, but displaying a different title from production.