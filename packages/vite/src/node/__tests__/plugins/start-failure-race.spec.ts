import { describe, expect, test, vi } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
import type { Plugin } from '../../plugin'
import { createServer } from '../../server'
import type { DevEnvironment } from '../../server/environment'

const ENTRY_ID = 'entry.js'
const RESOLVED_ENTRY_ID = `\0${ENTRY_ID}`
const resolveEntryPlugin: Plugin = {
  name: 'resolve-entry.js',
  resolveId(id) {
    if (id === ENTRY_ID) {
      return RESOLVED_ENTRY_ID
    }
  },
  load(id) {
    if (id === RESOLVED_ENTRY_ID) {
      return 'export default {}'
    }
  },
}

describe('createServer startup failure while environment init is in flight', () => {
  test('closes every environment plugin container that gets created', async () => {
    const error = new Error('createEnvironment failed')
    const gate = promiseWithResolvers<void>()
    const containersCreated = vi.fn()
    const containersClosed = vi.fn()

    const probePlugin: Plugin = {
      name: 'probe',
      // the options hook runs once per environment plugin container
      // during environment init; blocking it keeps the default client
      // and ssr environments mid-init when startup fails
      async options() {
        containersCreated()
        await gate.promise
      },
      // called by pluginContainer.close()
      closeBundle() {
        containersClosed()
      },
    }
    const faultyPlugin: Plugin = {
      name: 'faulty',
      config() {
        return {
          environments: {
            custom: {
              dev: {
                createEnvironment() {
                  throw error
                },
              },
            },
          },
        }
      },
    }

    // keep the default environments mid-init only briefly; startup must
    // still fail, but the in-flight inits have to be able to finish
    setTimeout(() => gate.resolve(), 100)

    await expect(
      createServer({
        configFile: false,
        root: import.meta.dirname,
        plugins: [probePlugin, faultyPlugin, resolveEntryPlugin],
        logLevel: 'silent',
        server: {
          middlewareMode: true,
          ws: false,
        },
      }),
    ).rejects.toBe(error)

    // every plugin container that was created must have been closed
    expect(containersCreated).toHaveBeenCalled()
    expect(containersClosed.mock.calls.length).toBe(
      containersCreated.mock.calls.length,
    )
  })

  test('close() cleans up an environment whose own init rejects before the plugin container is created', async () => {
    const error = new Error('options hook failed')
    let thrown = false
    let failedEnvironment: DevEnvironment | undefined
    let depsOptimizerClose: ReturnType<typeof vi.spyOn> | undefined
    const healthyContainerClosed = vi.fn()

    const probePlugin: Plugin = {
      name: 'probe',
      // the options hook runs once per environment plugin container
      // during environment init; rejecting it here makes that
      // environment's init fail before its plugin container is assigned
      options() {
        if (!thrown) {
          thrown = true
          failedEnvironment = this.environment as DevEnvironment
          if (failedEnvironment.depsOptimizer) {
            depsOptimizerClose = vi.spyOn(
              failedEnvironment.depsOptimizer,
              'close',
            )
          }
          throw error
        }
      },
      // called by pluginContainer.close() of the environments whose
      // init succeeded
      closeBundle() {
        healthyContainerClosed()
      },
    }

    await expect(
      createServer({
        configFile: false,
        root: import.meta.dirname,
        plugins: [probePlugin, resolveEntryPlugin],
        logLevel: 'silent',
        server: {
          middlewareMode: true,
          ws: false,
        },
      }),
    ).rejects.toBe(error)

    // the environment whose init rejected never got a plugin container,
    // so there is no container to close, but close() must still run the
    // rest of its cleanup; without the guard in DevEnvironment.close()
    // it rejects on the pluginContainer getter and skips everything else
    expect(failedEnvironment).toBeDefined()
    expect(depsOptimizerClose).toBeDefined()
    expect(depsOptimizerClose).toHaveBeenCalled()
    // sibling environments are unaffected and closed normally
    expect(healthyContainerClosed).toHaveBeenCalled()
  })
})
