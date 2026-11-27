import { resolve } from 'node:path'
import { setImmediate } from 'node:timers/promises'
import { test, vi } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
import { BundledDev } from '../bundledDev'
import { createServer } from '../index'

test('handles closing while the initial bundle is still running', async () => {
  const initialBuild = promiseWithResolvers<void>()
  const waitForInitialBuildFinish = vi
    .spyOn(BundledDev.prototype as any, 'waitForInitialBuildFinish')
    .mockReturnValue(initialBuild.promise)
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    experimental: {
      bundledDev: true,
    },
    build: {
      rolldownOptions: {
        input: resolve(
          import.meta.dirname,
          '../../ssr/runtime/__tests__/fixtures/simple.js',
        ),
      },
    },
    server: {
      port: 0,
      ws: false,
      watch: null,
    },
  })

  try {
    await server.listen()
    const closePromise = server.close()
    await setImmediate()
    initialBuild.reject(new Error('bundle closed'))
    await closePromise
  } finally {
    waitForInitialBuildFinish.mockRestore()
  }
})
