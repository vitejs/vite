import { resolve } from 'node:path'
import { defaultExclude, defineConfig } from 'vitest/config'

const isBuild = !!process.env.VITE_TEST_BUILD
const isBundledDev = !isBuild && !!process.env.VITE_TEST_BUNDLED_DEV

// Spec files that do not pass yet with `experimental.bundledDev` forced on
// (`pnpm run test-serve-bundled`) — remove entries as bundled dev gains
// support (vitejs/vite#23028). A file where only a few cases fail is not
// listed here; those cases are marked `test.skipIf(isBundledDev)` instead.
const bundledDevExclude = [
  './playground/assets-sanitize/__tests__/assets-sanitize.spec.ts',
  './playground/assets/__tests__/assets.spec.ts',
  './playground/assets/__tests__/encoded-base/assets-encoded-base.spec.ts',
  './playground/assets/__tests__/relative-base/assets-relative-base.spec.ts',
  './playground/assets/__tests__/runtime-base/assets-runtime-base.spec.ts',
  './playground/assets/__tests__/url-base/assets-url-base.spec.ts',
  './playground/backend-integration/__tests__/backend-integration.spec.ts',
  './playground/chunk-importmap/__tests__/chunk-importmap.spec.ts',
  './playground/csp/__tests__/csp.spec.ts',
  './playground/css-codesplit/__tests__/css-codesplit.spec.ts',
  './playground/css-lightningcss-root/__tests__/css-lightningcss-root.spec.ts',
  './playground/css-no-codesplit/__tests__/css-no-codesplit.spec.ts',
  './playground/css-sourcemap/__tests__/css-sourcemap.spec.ts',
  './playground/css-sourcemap/__tests__/lightningcss/lightningcss.spec.ts',
  './playground/css/__tests__/css.spec.ts',
  './playground/css/__tests__/lightningcss/lightningcss.spec.ts',
  './playground/forward-console/__test__/forward-console.spec.ts',
  './playground/fs-serve/__tests__/base/fs-serve-base.spec.ts',
  './playground/fs-serve/__tests__/deny/fs-serve-deny.spec.ts',
  './playground/fs-serve/__tests__/fs-serve.spec.ts',
  './playground/hmr/__tests__/hmr.spec.ts',
  './playground/html/__tests__/html.spec.ts',
  './playground/js-sourcemap/__tests__/js-sourcemap.spec.ts',
  './playground/legacy/__tests__/chunk-importmap/legacy-chunk-importmap.spec.ts',
  './playground/module-graph/__tests__/module-graph.spec.ts',
  './playground/object-hooks/__tests__/object-hooks.spec.ts',
  './playground/optimize-deps/__tests__/optimize-deps.spec.ts',
  './playground/tailwind-v3/__test__/tailwind-v3.spec.ts',
  './playground/tailwind/__test__/tailwind.spec.ts',
  './playground/transform-plugin/__tests__/base/transform-plugin.spec.ts',
  './playground/tsconfig-json-load-error/__tests__/tsconfig-json-load-error.spec.ts',
  './playground/worker/__tests__/es/worker-es.spec.ts',
  './playground/worker/__tests__/iife/worker-iife.spec.ts',
  './playground/worker/__tests__/relative-base-iife/worker-relative-base-iife.spec.ts',
  './playground/worker/__tests__/relative-base/worker-relative-base.spec.ts',
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
    include: ['./playground/**/*.spec.[tj]s'],
    exclude: [
      ...(isBundledDev ? bundledDevExclude : []),
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
