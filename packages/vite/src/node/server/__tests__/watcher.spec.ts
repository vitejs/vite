import { describe, expect, it } from 'vitest'
import { createServer } from '../index'

const stubGetWatchedCode = /getWatched\(\) \{.+?return \{\};.+?\}/s

describe('watcher configuration', () => {
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
})
