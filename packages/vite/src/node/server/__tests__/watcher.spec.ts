import { resolve } from 'node:path'
import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import chokidar from 'chokidar'
import { createServer } from '../index'

const stubGetWatchedCode = /getWatched\(\) \{.+?return \{\};.+?\}/s

let watchSpy: MockInstance<
  Parameters<typeof chokidar.watch>,
  ReturnType<typeof chokidar.watch>
>

vi.mock('../../config', async () => {
  const config: typeof import('../../config') =
    await vi.importActual('../../config')
  const resolveConfig = config.resolveConfig
  vi.spyOn(config, 'resolveConfig').mockImplementation(async (...args) => {
    const resolved: Awaited<ReturnType<typeof resolveConfig>> =
      await resolveConfig.call(config, ...args)
    resolved.configFileDependencies.push(
      resolve('fake/config/dependency.js').replace(/\\/g, '/'),
    )
    return resolved
  })
  return config
})

describe('watcher configuration', () => {
  beforeEach(() => {
    watchSpy = vi.spyOn(chokidar, 'watch')
  })

  afterEach(() => {
    watchSpy.mockRestore()
  })

  it('when watcher is disabled, return noop watcher', async () => {
    const server = await createServer({
      server: {
        watch: null,
      },
    })
    expect(server.watcher.getWatched.toString()).toMatch(stubGetWatchedCode)
  })

  it('when watcher is not disabled, return chokidar watcher', async () => {
    const server = await createServer({
      server: {
        watch: {},
      },
    })
    expect(server.watcher.getWatched.toString()).not.toMatch(stubGetWatchedCode)
  })

  it('should watch the root directory, config file dependencies, dotenv files, and the public directory', async () => {
    await createServer({
      server: {
        watch: {},
      },
      publicDir: '__test_public__',
    })
    expect(watchSpy).toHaveBeenLastCalledWith(
      expect.arrayContaining(
        [
          process.cwd(),
          resolve('fake/config/dependency.js'),
          resolve('.env'),
          resolve('.env.local'),
          resolve('.env.development'),
          resolve('.env.development.local'),
          resolve('__test_public__'),
        ].map((file) => file.replace(/\\/g, '/')),
      ),
      expect.anything(),
    )
  })
})
