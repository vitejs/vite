import fsp from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { type PreviewServer, preview } from '../preview'

// Keep in sync with `previewReloadPath` in `../preview`.
const previewReloadPath = '/@vite/preview-reload'

describe('preview', () => {
  test('does not inject the reload client by default', async () => {
    const { server } = await startPreview()

    const html = await fetchHtml(server)

    expect(html).not.toContain(previewReloadPath)
    expect(html).not.toContain('location.reload')
  })

  test('injects the reload client when watch is enabled', async () => {
    const { server } = await startPreview({ watch: true })

    const html = await fetchHtml(server)

    expect(html).toContain(previewReloadPath)
    expect(html).toContain('location.reload')
    // the reload is driven by polling, not a WebSocket connection
    expect(html).not.toContain('new WebSocket')
  })

  test('updates the reload token when an output file changes', async () => {
    const { root, server } = await startPreview({ watch: true })
    await server._watcherReady

    const initialToken = await fetchReloadToken(server)

    await fsp.writeFile(
      path.join(root, 'dist/index.html'),
      '<html><head></head><body><h1>updated</h1></body></html>',
    )

    const token = await waitForReloadToken(
      server,
      (value) => value !== initialToken,
    )
    expect(token).not.toBe(initialToken)
  })

  test('holds a long-poll request until an output file changes', async () => {
    const { root, server } = await startPreview({ watch: true })
    await server._watcherReady

    const initialToken = await fetchReloadToken(server)

    // A poll that already knows the current token is held open by the server.
    const url = new URL(previewReloadPath, server.resolvedUrls!.local[0])
    url.searchParams.set('token', initialToken)
    const pending = fetch(url, { cache: 'no-store' }).then((res) => res.text())

    let settled = false
    void pending.then(() => {
      settled = true
    })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(settled).toBe(false)

    await fsp.writeFile(
      path.join(root, 'dist/index.html'),
      '<html><head></head><body><h1>updated</h1></body></html>',
    )

    const token = await pending
    expect(token).not.toBe(initialToken)
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

async function fetchReloadToken(server: PreviewServer): Promise<string> {
  const url = new URL(previewReloadPath, server.resolvedUrls!.local[0])
  const response = await fetch(url, { cache: 'no-store' })
  return response.text()
}

async function waitForReloadToken(
  server: PreviewServer,
  predicate: (token: string) => boolean,
): Promise<string> {
  const deadline = Date.now() + 5000
  let token = await fetchReloadToken(server)
  while (!predicate(token) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    token = await fetchReloadToken(server)
  }
  return token
}
