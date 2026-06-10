import fsp from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import { describe, expect, onTestFinished, test } from 'vitest'
import { type RawData, WebSocket } from 'ws'
import { HMR_HEADER } from '../server/ws'
import { type PreviewServer, preview } from '../preview'

describe('preview', () => {
  test('does not inject the reload client by default', async () => {
    const { server } = await startPreview()

    const html = await fetchHtml(server)

    expect(html).not.toContain('new WebSocket')
  })

  test('injects the reload client when watch is enabled', async () => {
    const { server } = await startPreview({ watch: true })

    const html = await fetchHtml(server)

    expect(html).toContain('new WebSocket')
    expect(html).toContain(server.config.webSocketToken)
  })

  test('sends a full reload when an output file changes', async () => {
    const { root, server } = await startPreview({ watch: true })
    await server._watcherReady

    const ws = new WebSocket(getPreviewWebSocketUrl(server), HMR_HEADER)
    onTestFinished(() => ws.close())
    await once(ws, 'open')

    const message = waitForWebSocketMessage(
      ws,
      (payload) => payload.type === 'full-reload',
    )
    await fsp.writeFile(
      path.join(root, 'dist/index.html'),
      '<html><head></head><body><h1>updated</h1></body></html>',
    )

    await expect(message).resolves.toMatchObject({
      type: 'full-reload',
      path: '*',
    })
  })
})

async function startPreview({
  watch = false,
}: {
  watch?: boolean
} = {}): Promise<{ root: string; server: PreviewServer }> {
  const root = await fsp.mkdtemp(path.join(tmpdir(), 'vite-preview-'))
  await fsp.mkdir(path.join(root, 'dist'), { recursive: true })
  await fsp.writeFile(
    path.join(root, 'dist/index.html'),
    '<html><head></head><body><h1>preview</h1></body></html>',
  )

  const server = await preview({
    root,
    configFile: false,
    logLevel: 'silent',
    preview: {
      port: 0,
      strictPort: true,
      watch,
    },
  })
  onTestFinished(async () => {
    await server.close()
    await fsp.rm(root, { recursive: true, force: true })
  })

  return { root, server }
}

async function fetchHtml(server: PreviewServer): Promise<string> {
  const url = new URL('/', server.resolvedUrls!.local[0])
  const response = await fetch(url)
  return response.text()
}

function getPreviewWebSocketUrl(server: PreviewServer): string {
  const url = new URL(server.resolvedUrls!.local[0])
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', server.config.webSocketToken)
  return url.href
}

type WebSocketPayload = {
  type?: string
  path?: string
}

function waitForWebSocketMessage(
  ws: WebSocket,
  predicate: (payload: WebSocketPayload) => boolean,
): Promise<WebSocketPayload> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for websocket message'))
    }, 5000)
    const onMessage = (data: RawData) => {
      const payload = JSON.parse(data.toString()) as WebSocketPayload
      if (!predicate(payload)) return

      cleanup()
      resolve(payload)
    }
    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }
    const cleanup = () => {
      clearTimeout(timeout)
      ws.off('message', onMessage)
      ws.off('error', onError)
    }

    ws.on('message', onMessage)
    ws.on('error', onError)
  })
}
