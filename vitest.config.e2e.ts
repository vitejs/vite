import { resolve } from 'node:path'
import { defaultExclude, defineConfig } from 'vitest/config'

const isBuild = !!process.env.VITE_TEST_BUILD
const isBundledDev = !isBuild && !!process.env.VITE_TEST_BUNDLED_DEV

// Spec files that pass with `experimental.bundledDev` forced on
// (`pnpm run test-serve-bundled`). Commented-out entries do not pass yet —
// uncomment them as bundled dev gains support (vitejs/vite#23028). A file
// with only a few failing cases stays enabled here and marks those cases
// with `test.skipIf(isBundledDev)` instead.
const bundledDevInclude = [
  './playground/alias/__tests__/alias.spec.ts',
  './playground/assets-sanitize/__tests__/assets-sanitize.spec.ts',
  // './playground/assets/__tests__/assets.spec.ts',
  // './playground/assets/__tests__/encoded-base/assets-encoded-base.spec.ts',
  // './playground/assets/__tests__/relative-base/assets-relative-base.spec.ts',
  // './playground/assets/__tests__/runtime-base/assets-runtime-base.spec.ts',
  // './playground/assets/__tests__/url-base/assets-url-base.spec.ts',
  './playground/backend-integration/__tests__/backend-integration.spec.ts',
  './playground/base-conflict/__tests__/base-conflict.spec.ts',
  './playground/build-old/__tests__/build-old.spec.ts',
  // './playground/chunk-importmap/__tests__/chunk-importmap.spec.ts',
  './playground/cli-module/__tests__/cli-module.spec.ts',
  './playground/cli/__tests__/cli.spec.ts',
  './playground/client-reload/__tests__/client-reload.spec.ts',
  './playground/csp/__tests__/csp.spec.ts',
  './playground/css-codesplit-cjs/__tests__/css-codesplit-cjs.spec.ts',
  './playground/css-codesplit/__tests__/css-codesplit-consistent.spec.ts',
  './playground/css-codesplit/__tests__/css-codesplit.spec.ts',
  './playground/css-dynamic-import/__tests__/css-dynamic-import.spec.ts',
  './playground/css-lightningcss-proxy/__tests__/css-lightningcss-proxy.spec.ts',
  './playground/css-lightningcss-root/__tests__/css-lightningcss-root.spec.ts',
  './playground/css-lightningcss/__tests__/css-lightningcss.spec.ts',
  './playground/css-no-codesplit/__tests__/css-no-codesplit.spec.ts',
  // './playground/css-sourcemap/__tests__/css-sourcemap.spec.ts',
  './playground/css-sourcemap/__tests__/lib-entry/css-sourcemap-lib-entry.spec.ts',
  // './playground/css-sourcemap/__tests__/lightningcss/lightningcss.spec.ts',
  // './playground/css/__tests__/css.spec.ts',
  // './playground/css/__tests__/lightningcss/lightningcss.spec.ts',
  './playground/css/__tests__/no-css-minify/css-no-css-minify.spec.ts',
  './playground/css/__tests__/postcss-plugins-different-dir/css-postcss-plugins-different-dir.spec.ts',
  './playground/css/__tests__/same-file-name/css-same-file-name.spec.ts',
  './playground/css/__tests__/sass-modern-compiler-build/sass-modern-compiler.spec.ts',
  './playground/css/postcss-caching/css.spec.ts',
  './playground/data-uri/__tests__/data-uri.spec.ts',
  './playground/define/__tests__/define.spec.ts',
  './playground/dynamic-import-inline/__tests__/dynamic-import-inline.spec.ts',
  './playground/dynamic-import/__tests__/dynamic-import.spec.ts',
  './playground/env-nested/__tests__/env-nested.spec.ts',
  './playground/env/__tests__/env.spec.ts',
  './playground/environment-react-ssr/__tests__/environment-react-ssr.spec.ts',
  './playground/extensions/__tests__/extensions.spec.ts',
  './playground/external/__tests__/external.spec.ts',
  './playground/forward-console/__test__/forward-console.spec.ts',
  // './playground/fs-serve/__tests__/base/fs-serve-base.spec.ts',
  // './playground/fs-serve/__tests__/deny/fs-serve-deny.spec.ts',
  // './playground/fs-serve/__tests__/fs-serve.spec.ts',
  './playground/glob-import/__tests__/glob-import.spec.ts',
  './playground/hmr-full-bundle-mode/__tests__/build-hooks.spec.ts',
  './playground/hmr-full-bundle-mode/__tests__/hmr-full-bundle-mode.spec.ts',
  './playground/hmr-root/__tests__/hmr-root.spec.ts',
  './playground/hmr-ssr/__tests__/hmr-ssr.spec.ts',
  // './playground/hmr/__tests__/hmr.spec.ts',
  // './playground/html/__tests__/html.spec.ts',
  './playground/import-attribute/__tests__/import-attribute.spec.ts',
  // './playground/js-sourcemap/__tests__/js-sourcemap.spec.ts',
  './playground/json/__tests__/csr/json-csr.spec.ts',
  './playground/legacy/__tests__/chunk-importmap/legacy-chunk-importmap.spec.ts',
  './playground/legacy/__tests__/client-and-ssr/legacy-client-legacy-ssr-sequential-builds.spec.ts',
  './playground/legacy/__tests__/legacy.spec.ts',
  './playground/legacy/__tests__/modern-target/legacy-modern-target.spec.ts',
  './playground/legacy/__tests__/no-polyfills-no-systemjs/legacy-no-polyfills-no-systemjs.spec.ts',
  './playground/legacy/__tests__/no-polyfills/legacy-no-polyfills.spec.ts',
  './playground/legacy/__tests__/ssr/legacy-ssr.spec.ts',
  './playground/legacy/__tests__/watch/legacy-styles-only-entry-watch.spec.ts',
  './playground/lib/__tests__/lib.spec.ts',
  './playground/minify/__tests__/minify.spec.ts',
  './playground/module-graph/__tests__/module-graph.spec.ts',
  './playground/multiple-entrypoints/__tests__/multiple-entrypoints.spec.ts',
  './playground/nested-deps/__tests__/nested-deps.spec.ts',
  './playground/object-hooks/__tests__/object-hooks.spec.ts',
  './playground/optimize-deps-no-discovery/__tests__/optimize-deps-no-discovery.spec.ts',
  // './playground/optimize-deps/__tests__/optimize-deps.spec.ts',
  './playground/optimize-missing-deps/__test__/optimize-missing-deps.spec.ts',
  './playground/preload/__tests__/preload-disabled/preload-disabled.spec.ts',
  './playground/preload/__tests__/preload.spec.ts',
  './playground/preload/__tests__/resolve-deps/preload-resolve-deps.spec.ts',
  './playground/preserve-symlinks/__tests__/preserve-symlinks.spec.ts',
  './playground/proxy-bypass/__tests__/proxy-bypass.spec.ts',
  './playground/proxy-hmr/__tests__/proxy-hmr.spec.ts',
  './playground/resolve-tsconfig-paths/__tests__/resolve.spec.ts',
  './playground/resolve/__tests__/mainfields-custom-first/resolve-mainfields-custom-first.spec.ts',
  './playground/resolve/__tests__/resolve.spec.ts',
  './playground/resolve/__tests__/sass-node-builtin-clash/resolve-sass-node-builtin-clash.spec.ts',
  './playground/ssr-alias/__tests__/ssr-alias.spec.ts',
  './playground/ssr-conditions/__tests__/ssr-conditions.spec.ts',
  './playground/ssr-deps/__tests__/ssr-deps.spec.ts',
  './playground/ssr-html/__tests__/ssr-html.spec.ts',
  './playground/ssr-noexternal/__tests__/ssr-noexternal.spec.ts',
  './playground/ssr-pug/__tests__/ssr-pug.spec.ts',
  './playground/ssr-resolve/__tests__/ssr-resolve.spec.ts',
  './playground/ssr-wasm/__tests__/ssr-wasm.spec.ts',
  './playground/ssr-webworker/__tests__/ssr-webworker.spec.ts',
  './playground/ssr/__tests__/ssr.spec.ts',
  './playground/tailwind-sourcemap/__tests__/tailwind-sourcemap.spec.ts',
  './playground/tailwind-v3/__test__/tailwind-v3.spec.ts',
  './playground/tailwind/__test__/tailwind.spec.ts',
  './playground/transform-plugin/__tests__/base/transform-plugin.spec.ts',
  './playground/transform-plugin/__tests__/transform-plugin.spec.ts',
  './playground/tsconfig-json-load-error/__tests__/tsconfig-json-load-error.spec.ts',
  './playground/tsconfig-json/__tests__/tsconfig-json.spec.ts',
  './playground/wasm/__tests__/wasm.spec.ts',
  // './playground/worker/__tests__/es/worker-es.spec.ts',
  // './playground/worker/__tests__/iife/worker-iife.spec.ts',
  './playground/worker/__tests__/relative-base-iife/worker-relative-base-iife.spec.ts',
  // './playground/worker/__tests__/relative-base/worker-relative-base.spec.ts',
  './playground/worker/__tests__/sourcemap-hidden/worker-sourcemap-hidden.spec.ts',
  './playground/worker/__tests__/sourcemap-inline/worker-sourcemap-inline.spec.ts',
  './playground/worker/__tests__/sourcemap/worker-sourcemap.spec.ts',
]

const timeout = process.env.PWDEBUG ? Infinity : process.env.CI ? 50000 : 30000

export default defineConfig({
  resolve: {
    alias: {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      '~utils': resolve(import.meta.dirname, './playground/test-utils'),
    },
  },
  test: {
    include: isBundledDev
      ? bundledDevInclude
      : ['./playground/**/*.spec.[tj]s'],
    exclude: [
      ...(isBuild
        ? [
            './playground/object-hooks/**/*.spec.[tj]s', // object hook sequential
          ]
        : []),
      ...defaultExclude,
    ],
    setupFiles: ['./playground/vitestSetup.ts'],
    globalSetup: ['./playground/vitestGlobalSetup.ts'],
    testTimeout: timeout,
    hookTimeout: timeout,
    reporters: 'dot',
    deps: {
      // Prevent Vitest from running the workspace packages in Vite's SSR runtime
      moduleDirectories: ['node_modules', 'packages'],
    },
    expect: {
      poll: {
        timeout: 50 * (process.env.CI ? 200 : 50),
      },
    },
    env: {
      NODE_ENV: process.env.VITE_TEST_BUILD ? 'production' : 'development',
    },
  },
  oxc: {
    target: 'node20',
  },
  publicDir: false,
})
