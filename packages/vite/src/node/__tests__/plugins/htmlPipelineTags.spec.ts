import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { Plugin, ViteDevServer } from '../..'
import { createServer } from '../..'
import {
  injectModulePipelineTagsFromHtmlTransforms,
  stripUnservableDevModuleScripts,
} from '../../plugins/html'

const tempDirs: string[] = []
let server: ViteDevServer | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

function createTempRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-html-pipeline-'))
  tempDirs.push(dir)
  return dir
}

describe('stripUnservableDevModuleScripts', () => {
  test('removes /@id/ and /@fs/ module scripts', () => {
    const html = `<!doctype html><head>
<script type="module" src="/@id/virtual:overlay.js"></script>
<script type="module" src="/@fs/Users/x/inject.js"></script>
<script type="module" src="/assets/index.js"></script>
</head>`
    const stripped = stripUnservableDevModuleScripts(html)
    expect(stripped).not.toContain('/@id/')
    expect(stripped).not.toContain('/@fs/')
    expect(stripped).toContain('/assets/index.js')
  })
})

describe('injectModulePipelineTagsFromHtmlTransforms', () => {
  test('injects only module pipeline tags from default-order hooks', async () => {
    const html = '<!doctype html><html><head></head><body></body></html>'
    const result = await injectModulePipelineTagsFromHtmlTransforms(
      html,
      [
        () => [
          {
            tag: 'script',
            attrs: { type: 'module', src: '/@id/virtual:overlay.js' },
            injectTo: 'head-prepend',
          },
          {
            tag: 'meta',
            attrs: { name: 'description', content: 'nope' },
          },
        ],
      ],
      {} as any,
      { path: '/', filename: 'index.html' },
    )
    expect(result).toContain('src="/@id/virtual:overlay.js"')
    expect(result).not.toContain('description')
  })
})

describe('bundledDev virtual module HTML injection', () => {
  // regression test for https://github.com/vitejs/vite/issues/22864
  test('includes default-order injected virtual modules in the bundle', async () => {
    const root = createTempRoot()
    fs.writeFileSync(
      path.join(root, 'index.html'),
      `<!doctype html>
<html>
  <head><title>t</title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
    )
    fs.mkdirSync(path.join(root, 'src'))
    fs.writeFileSync(
      path.join(root, 'src/main.js'),
      `document.getElementById('app').textContent = 'ok'\n`,
    )

    const virtualId = 'virtual:injected-overlay.js'
    const resolvedVirtualId = `\0${virtualId}`
    const injectPlugin: Plugin = {
      name: 'test-virtual-inject',
      resolveId(id) {
        // Match the decoded virtual id only (not the `/@id/` browser URL),
        // same as typical ecosystem plugins such as Vue DevTools.
        if (id === virtualId) return resolvedVirtualId
      },
      load(id) {
        if (id === resolvedVirtualId) {
          return 'window.__VIRTUAL_INJECTED__ = true'
        }
      },
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            attrs: { type: 'module', src: `/@id/${virtualId}` },
            injectTo: 'head-prepend',
          },
        ]
      },
    }

    server = await createServer({
      configFile: false,
      root,
      logLevel: 'error',
      experimental: { bundledDev: true },
      plugins: [injectPlugin],
    })
    await server.listen()

    const bundledDev = server.environments.client.bundledDev
    expect(bundledDev).toBeTruthy()
    await vi.waitFor(() => {
      expect(bundledDev!.hasBuildOutput).toBe(true)
    })

    const htmlRes = await fetch(server.resolvedUrls!.local[0])
    const html = await htmlRes.text()
    expect(html).not.toContain('Bundling in progress')
    expect(html).not.toContain(`/@id/${virtualId}`)
    expect(html).toMatch(/\/assets\/[^"]+\.js/)

    const assetPath = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1]
    expect(assetPath).toBeTruthy()
    const jsRes = await fetch(
      new URL(assetPath!, server.resolvedUrls!.local[0]),
    )
    const js = await jsRes.text()
    expect(js).toContain('__VIRTUAL_INJECTED__')
    expect(js).toContain('virtual:injected-overlay.js')
  })
})
