import { expect, onTestFinished, test } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
import { createServer } from '../index'

test('queues one follow-up restart while a restart is in flight', async () => {
  const restartEntered = promiseWithResolvers<void>()
  const restartGate = promiseWithResolvers<void>()
  const forceOptimizeDeps: boolean[] = []
  let configCalls = 0

  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false },
    plugins: [
      {
        name: 'restart-during-restart',
        async config(config) {
          configCalls++
          forceOptimizeDeps.push(
            (config as { forceOptimizeDeps?: boolean }).forceOptimizeDeps ===
              true,
          )

          if (configCalls === 2) {
            restartEntered.resolve()
            await restartGate.promise
          }
        },
      },
    ],
  })

  onTestFinished(async () => {
    await server.close()
  })

  const firstRestart = server.restart()
  await restartEntered.promise

  const queuedRestarts = [
    server.restart(),
    server.restart(true),
    server.restart(),
  ]

  restartGate.resolve()
  await Promise.all([firstRestart, ...queuedRestarts])

  expect(configCalls).toBe(3)
  expect(forceOptimizeDeps).toEqual([false, false, true])
})
