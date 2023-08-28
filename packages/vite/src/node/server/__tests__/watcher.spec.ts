import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { createServer } from '../index'

const __dirname = dirname(fileURLToPath(import.meta.url))

afterEach(() => {
  writeFileSync(
    resolve(__dirname, 'fixtures/watched/index.js'),
    "export const test = 'initial text'\n",
  )
})

// watcher is unstable on windows
describe.skipIf(process.platform === 'win32')('watcher configuration', () => {
  it("when watcher is disabled, editing files doesn't trigger watcher", async () => {
    const server = await createServer({
      server: {
        watch: null,
      },
    })
    server.watcher.on('change', () => {
      expect.unreachable()
    })

    server.watcher.add(resolve(__dirname, 'fixtures/watched/index.js'))
    writeFileSync(
      resolve(__dirname, 'fixtures/watched/index.js'),
      'export const test = "new text"',
    )

    // make sure watcher doesn't trigger
    await new Promise((resolve) => setTimeout(resolve, 500))
  })

  it('when watcher is not disable, editing files triggers watcher', async () => {
    expect.assertions(1)
    const server = await createServer({
      server: {
        // "ready" event might not be triggered on macos otherwise
        watch:
          process.platform === 'darwin'
            ? {
                useFsEvents: false,
                usePolling: false,
              }
            : {},
      },
    })
    const filename = resolve(__dirname, 'fixtures/watched/index.js')

    return new Promise<void>((resolve) => {
      server.watcher.on('change', (e) => {
        expect(e).toMatch('/fixtures/watched/index.js')
        resolve()
      })

      server.watcher.on('ready', () => {
        server.watcher.add(filename)
        writeFileSync(filename, 'export const test = "new text"')
      })
    })
  })
})
