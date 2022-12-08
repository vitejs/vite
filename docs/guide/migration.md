# Migration from v3

## Rollup 3

Vite is now using [Rollup 3](https://github.com/vitejs/vite/issues/9870), which allowed us to simplify Vite's internal asset handling and has many improvements. See the [Rollup 3 release notes here](https://github.com/rollup/rollup/releases).

Rollup 3 is mostly compatible with Rollup 2. If you are using custom [`rollupOptions`](../config/build-options.md#rollup-options) in your project and encounter issues, refer to Rollup documentation to upgrade your config.

## Modern Browser Baseline change

The production bundle assumes support for modern JavaScript. By default, Vite targets browsers which support the [native ES Modules](https://caniuse.com/es6-module), [native ESM dynamic import](https://caniuse.com/es6-module-dynamic-import), and [`import.meta`](https://caniuse.com/mdn-javascript_operators_import_meta):

- Chrome >=87
- Firefox >=78
- Safari >=14 (bumped from Safari 13 in Vite 4)
- Edge >=88

A small fraction of users will now require using [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy), which will automatically generate legacy chunks and corresponding ES language feature polyfills.

With the new target for modern browsers, modern builds can safely use [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) and the [nullish coallessing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) isn't transpiled anymore.

## Config Options Changes

The following options that were already deprecated in v3 have been removed:

- `...` (switch to [`...`](../config/shared-options.md#resolve-alias))

### Build Changes

The build default charset is now utf8 [#10753](https://github.com/vitejs/vite/issues/10753)

### Dev Server Changes

...

### SSR Changes

...

## General Changes

### Importing CSS as a string

In Vite 3, importing the default export of a `.css` file could introduce a double loading of CSS.

```ts
import cssString from './global.css'
```

This double loading could occur since a `.css` file will be emitted and it's likely that the CSS string will also be used by the application code — for example, injected by the framework runtime. From Vite 4, the `.css` default export [has been deprecated](https://github.com/vitejs/vite/issues/11094). The `?inline` query suffix modifier needs to be used in this case, as that doesn't emit the imported `.css` styles.

```ts
import stuff from './global.css?inline'
```

### `dotenv` update

Vite is now using dotenv 16 and dotenv-expand 9 (previously dotenv 14 and dotenv-expand 5).

If you have a value including `#` or `` ` ``, you will need to wrap them with quotes.
See their changelog for more details ([`dotenv`](https://github.com/motdotla/dotenv/blob/master/CHANGELOG.md), [`dotenv-expand`](https://github.com/motdotla/dotenv-expand/blob/master/CHANGELOG.md)).

## Advanced

There are some changes which only affect plugin/tool creators.

- [[#11036] feat(client)!: remove never implemented hot.decline](https://github.com/vitejs/vite/issues/11036)
  - use `hot.invalidate` instead
- [[#9669] feat: align object interface for `transformIndexHtml` hook](https://github.com/vitejs/vite/issues/9669)
  - use `order` instead of `enforce`

Also there are other breaking changes which only affect few users.

- [[#11101] feat(ssr)!: remove dedupe and mode support for CJS](https://github.com/vitejs/vite/pull/11101)
  - You should migrate to the default ESM mode for SSR, CJS SSR support may be removed in the next Vite major.
- [[#10475] feat: handle static assets in case-sensitive manner](https://github.com/vitejs/vite/pull/10475)
  - Your project shouldn't rely on an OS ignoring file names casing.
- [[#10996] fix!: make `NODE_ENV` more predictable](https://github.com/vitejs/vite/pull/10996)
  - Refer to the PR for an explanation about this change.
- [[#10903] refactor(types)!: remove facade type files](https://github.com/vitejs/vite/pull/10903)

## Migration from v2

Check the [Migration from v2 Guide](https://v3.vitejs.dev/guide/migration.html) in the Vite v3 docs first to see the needed changes to port your app to Vite v3, and then proceed with the changes on this page.
