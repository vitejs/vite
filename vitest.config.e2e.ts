import { resolve } from 'node:path'
import { defaultExclude, defineConfig } from 'vitest/config'

// Spec files that do not pass yet with `experimental.bundledDev` forced on
// (`pnpm run test-serve-bundled`) — remove entries as bundled dev gains
// support (vitejs/vite#23028). A file where only a few cases fail is not
// listed here; those cases use `bundledDevTodo()` / `bundledDevUnsupported()`
// from `playground/test-utils.ts` instead.
const bundledDevExclude = ['./playground/hmr-ssr/__tests__/hmr-ssr.spec.ts']

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
    setupFiles: ['./playground/vitestSetup.ts'],
    projects: (['serve', 'serve-bundled', 'build'] as const).map(
      (mode, groupOrder) => {
        const isBuild = mode === 'build'
        const isBundledDev = mode === 'serve-bundled'
        return {
          test: {
            name: mode,
            provide: { playgroundMode: mode },
            globalSetup: ['./playground/vitestGlobalSetup.ts'],
            // Playgrounds use fixed ports, so run modes sequentially.
            sequence: { groupOrder },
            env: { NODE_ENV: isBuild ? 'production' : 'development' },
            exclude: [
              ...(isBundledDev ? bundledDevExclude : []),
              ...(isBuild || isBundledDev
                ? ['./playground/object-hooks/**/*.spec.[tj]s'] // object hook sequential
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
                description:
                  'Does not pass under bundled dev yet (vitejs/vite#23028).',
                todo: isBundledDev,
              },
            ],
          },
        }
      },
    ),
    testTimeout: timeout,
    hookTimeout: timeout,
    reporters: 'dot',
    deps: {
      // Prevent Vitest from running the workspace packages in Vite's SSR runtime
      moduleDirectories: ['node_modules', 'packages'],
    },
    expect: {
      poll: {
        timeout: 50 * (process.env.CI ? 400 : 50),
      },
    },
    isolate: false,
  },
  oxc: {
    target: 'node20',
  },
  publicDir: false,
})
