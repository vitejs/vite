import { resolve } from 'node:path'
import { defaultExclude, defineConfig } from 'vitest/config'

const isBuild = !!process.env.VITE_TEST_BUILD
const isBundledDev = !isBuild && !!process.env.VITE_TEST_BUNDLED_DEV

// Spec files that do not pass yet with `experimental.bundledDev` forced on
// (`pnpm run test-serve-bundled`) — remove entries as bundled dev gains
// support (vitejs/vite#23028). A file where only a few cases fail is not
// listed here; those cases use `bundledDevTodo()` / `bundledDevUnsupported()`
// from `playground/test-utils.ts` instead.
const bundledDevExclude = [
  './playground/hmr-ssr/__tests__/hmr-ssr.spec.ts',
  './playground/legacy/__tests__/chunk-importmap/legacy-chunk-importmap.spec.ts',
  './playground/object-hooks/__tests__/object-hooks.spec.ts',
  './playground/optimize-deps/__tests__/optimize-deps.spec.ts',
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
    tags: [
      {
        name: 'bundled-dev/unsupported',
        description: 'Does not apply to bundled dev, by design.',
        skip: isBundledDev,
      },
      {
        name: 'bundled-dev/todo',
        description: 'Does not pass under bundled dev yet (vitejs/vite#23028).',
        todo: isBundledDev,
      },
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
