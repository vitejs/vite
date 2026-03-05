import fs from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { TestCssLinkPlugin } from './css-link/plugin'

export default defineConfig(({ command }) => ({
  experimental: {
    hmrPartialAccept: true,
  },
  build: {
    rollupOptions: {
      input: [
        path.resolve(import.meta.dirname, './index.html'),
        ...(command === 'build'
          ? []
          : [path.resolve(import.meta.dirname, './missing-import/index.html')]),
        path.resolve(
          import.meta.dirname,
          './unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html',
        ),
        path.resolve(import.meta.dirname, './counter/index.html'),
        path.resolve(
          import.meta.dirname,
          './self-accept-within-circular/index.html',
        ),
        path.resolve(import.meta.dirname, './css-deps/index.html'),
      ],
    },
    assetsInlineLimit(filePath) {
      if (filePath.endsWith('logo-no-inline.svg')) {
        return false
      }
    },
  },
  plugins: [
    {
      name: 'mock-custom',
      async hotUpdate({ file, read }) {
        if (file.endsWith('customFile.js')) {
          const content = await read()
          const msg = content.match(/export const msg = '(\w+)'/)[1]
          this.environment.hot.send('custom:foo', { msg })
          this.environment.hot.send('custom:remove', { msg })
        }
      },
      configureServer(server) {
        server.environments.client.hot.on(
          'custom:remote-add',
          ({ a, b }, client) => {
            client.send('custom:remote-add-result', { result: a + b })
          },
        )
      },
    },
    virtualPlugin(),
    transformCountPlugin(),
    watchCssDepsPlugin(),
    TestCssLinkPlugin(),
    hotEventsPlugin(),
  ],
}))

function virtualPlugin(): Plugin {
  let num = 0
  return {
    name: 'virtual-file',
    resolveId(id) {
      if (id.startsWith('virtual:file')) {
        return '\0' + id
      }
    },
    load(id) {
      if (id.startsWith('\0virtual:file')) {
        return `\
import { virtual as _virtual } from "/importedVirtual.js";
export const virtual = _virtual + '${num}';`
      }
    },
    configureServer(server) {
      server.environments.client.hot.on('virtual:increment', async (suffix) => {
        const mod = await server.environments.client.moduleGraph.getModuleById(
          '\0virtual:file' + (suffix || ''),
        )
        if (mod) {
          num++
          server.environments.client.reloadModule(mod)
        }
      })
    },
  }
}

function transformCountPlugin(): Plugin {
  let num = 0
  return {
    name: 'transform-count',
    transform(code) {
      if (code.includes('__TRANSFORM_COUNT__')) {
        return code.replace('__TRANSFORM_COUNT__', String(++num))
      }
    },
  }
}

function watchCssDepsPlugin(): Plugin {
  return {
    name: 'watch-css-deps',
    async transform(code, id) {
      // replace the `replaced` identifier in the CSS file with the adjacent
      // `dep.js` file's `color` variable.
      if (id.includes('css-deps/main.css')) {
        const depPath = path.resolve(import.meta.dirname, './css-deps/dep.js')
        const dep = await fs.readFile(depPath, 'utf-8')
        const color = dep.match(/color = '(.+?)'/)[1]
        this.addWatchFile(depPath)
        return code.replace('replaced', color)
      }
    },
  }
}

function hotEventsPlugin(): Plugin {
  return {
    name: 'hot-events',
    configureServer(server) {
      let connectCount = 0
      let disconnectCount = 0
      const clientEnv = server.environments.client
      clientEnv.hot.on('vite:client:connect', () => connectCount++)
      clientEnv.hot.on('vite:client:disconnect', () => disconnectCount++)

      server.middlewares.use((req, res, next) => {
        if (req.url === '/hot-events-counts') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ connectCount, disconnectCount }))
          return
        }
        next()
      })
    },
  }
}
