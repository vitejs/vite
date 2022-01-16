import { httpServerStart } from 'vite/src/node/http'
import { resolveConfig } from 'vite/src/node'

describe('start preview server', () => {
  test('[strictPort=false, host=127.0.0.1] should use another port when already start a server on localhost.', async () => {
    const originalPort = 5000
    const server = require('http').createServer()
    server.listen(originalPort, 'localhost')

    const testServer = require('http').createServer()
    const config = await resolveConfig({}, 'serve', 'production')
    const port = await httpServerStart(testServer, {
      port: originalPort,
      strictPort: false,
      host: '127.0.0.1',
      logger: config.logger
    })

    expect(port).not.toEqual(originalPort)

    server.close()
    testServer.close()
  })

  test('[strictPort=true, host=127.0.0.1] should use another port when already start a server on localhost.', async () => {
    const originalPort = 5000
    const server = require('http').createServer()
    server.listen(originalPort, 'localhost')

    const config = await resolveConfig({}, 'serve', 'production')
    const testServer = require('http').createServer()
    expect(
      httpServerStart(testServer, {
        port: originalPort,
        strictPort: true,
        host: '127.0.0.1',
        logger: config.logger
      })
    ).rejects.toEqual(new Error(`Port ${originalPort} is already in use`))

    server.close()
    testServer.close()
  })
})
