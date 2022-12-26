import { expect, test } from 'vitest'
import { port } from './serve'
import { page } from '~utils'

const url = `http://localhost:${port}/`

const waitForInitialWebSocketMessageWithoutRequestFailure = () =>
  new Promise<{ webSocketUrl: string; payload: any }>((resolve, reject) => {
    page.on('requestfailed', (request) => {
      reject(new Error(request.failure().errorText + ` (${request.url()})`))
    })

    page.once('websocket', (ws) => {
      ws.once('framereceived', (data) => {
        resolve({
          webSocketUrl: ws.url(),
          payload: JSON.parse(data.payload.toString()),
        })
      })
      ws.once('socketerror', (err) => {
        reject(err)
      })
    })
  })

test('HMR WebSocket connection should use the same host as the main server', async () => {
  const initialWebSocketMessagePromise =
    waitForInitialWebSocketMessageWithoutRequestFailure()
  await page.goto(url)
  const initialWebSocket = await initialWebSocketMessagePromise

  expect(initialWebSocket.payload).toEqual({ type: 'connected' })
  expect(initialWebSocket.webSocketUrl).toBe(url.replace('http://', 'ws://'))
})
