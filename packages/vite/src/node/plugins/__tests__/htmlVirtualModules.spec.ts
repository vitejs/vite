import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { build, createServer, type Plugin, type ViteDevServer } from '../..'

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-html-virtual-'))
  tempDirs.push(dir)
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html>
<html>
  <head><title>t</title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
  )
  fs.mkdirSync(path.join(dir, 'src'))
  fs.writeFileSync(
    path.join(dir, 'src/main.js'),
    `document.getElementById('app').textContent = 'ok'\n`,
  )
  return dir
}

const JS_ID = 'virtual:html-injected.js'
const CSS_ID = 'virtual:html-injected.css'

/** Injects the two virtual modules as the browser URLs a plugin would use. */
function virtualModuleInjectionPlugin(order?: 'pre'): Plugin {
  const handler = () => [
    {
      tag: 'script',
      attrs: { type: 'module', src: `/@id/${JS_ID}` },
      injectTo: 'head-prepend',
    },
    {
      tag: 'link',
      attrs: { rel: 'stylesheet', href: `/@id/${CSS_ID}` },
      injectTo: 'head-prepend',
    },
  ]
  return {
    name: 'virtual-module-injection',
    resolveId(id) {
      if (id === JS_ID || id === CSS_ID) return `\0${id}`
    },
    load(id) {
      if (id === `\0${JS_ID}`) {
        return `globalThis.__VIRTUAL_JS__ = true\n`
      }
      if (id === `\0${CSS_ID}`) {
        return `.virtual { color: rgb(0, 128, 0) }\n`
      }
    },
    transformIndexHtml: order ? { order, handler } : handler,
  }
}

// https://github.com/vitejs/vite/issues/22864
describe('transformIndexHtml injected virtual modules', () => {
  // The documented way to inject a pipeline tag. `/@id/` is the browser URL
  // form plugins use, which the HTML scan has to convert before resolving.
  test('order: pre module and stylesheet tags are bundled', async () => {
    const root = createTempRoot()
    const outDir = path.join(root, 'dist')

    await build({
      configFile: false,
      root,
      logLevel: 'error',
      plugins: [virtualModuleInjectionPlugin('pre')],
      build: { outDir, emptyOutDir: true },
    })

    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf-8')
    expect(html).not.toContain(`/@id/${JS_ID}`)
    expect(html).not.toContain(`/@id/${CSS_ID}`)

    const files = fs.readdirSync(path.join(outDir, 'assets'))
    expect(files).toContainEqual(expect.stringMatching(/^index.*\.js$/))
    expect(files).toContainEqual(expect.stringMatching(/^index.*\.css$/))

    const js = fs.readFileSync(
      path.join(
        outDir,
        'assets',
        files.find((f) => /^index.*\.js$/.test(f))!,
      ),
      'utf-8',
    )
    expect(js).toContain('__VIRTUAL_JS__')

    const css = fs.readFileSync(
      path.join(
        outDir,
        'assets',
        files.find((f) => /^index.*\.css$/.test(f))!,
      ),
      'utf-8',
    )
    expect(css).toContain('.virtual')
    expect(css).toContain('color')
  })

  // A default-order injection used to leave a `/@id/` tag that resolved to
  // `200 text/html` (the SPA fallback) instead of the module.
  test('bundled dev includes default-order injected modules in the bundle', async () => {
    const root = createTempRoot()

    server = await createServer({
      configFile: false,
      root,
      logLevel: 'error',
      experimental: { bundledDev: true },
      plugins: [virtualModuleInjectionPlugin()],
    })
    await server.listen()

    const bundledDev = server.environments.client.bundledDev
    expect(bundledDev).toBeTruthy()

    const url = server.resolvedUrls!.local[0]
    // the server serves a "bundling in progress" page until the first build
    let html = ''
    for (let i = 0; i < 200; i++) {
      html = await (await fetch(url)).text()
      if (html.includes('/assets/')) break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    expect(html).not.toContain('Bundling in progress')
    expect(html).not.toContain(`/@id/${JS_ID}`)
    expect(html).not.toContain(`/@id/${CSS_ID}`)

    const entryPath = html.match(/src="(\/assets\/[^"]+\.js)"/)![1]
    const entry = await (await fetch(new URL(entryPath, url))).text()
    expect(entry).toContain('__VIRTUAL_JS__')
    // bundled dev injects CSS from the chunk instead of emitting a stylesheet
    expect(entry).toContain('.virtual')
  })
})
