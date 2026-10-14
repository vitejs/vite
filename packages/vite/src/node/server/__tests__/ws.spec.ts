import { PassThrough } from 'node:stream'
import { expect, onTestFinished, test } from 'vitest'
import { createServer } from '../index'

test('ignores errors from unmatched WebSocket upgrade sockets', async () => {
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
  })
  onTestFinished(async () => {
    await server.close()
  })
  await server.listen()

  const socket = new PassThrough()
  server.httpServer!.emit(
    'upgrade',
    {
      url: '/',
      headers: { host: '127.0.0.1', upgrade: 'websocket' },
    },
    socket,
    Buffer.alloc(0),
  )

  expect(() => {
    socket.emit(
      'error',
      Object.assign(new Error('socket reset'), { code: 'ECONNRESET' }),
    )
  }).not.toThrow()
})
