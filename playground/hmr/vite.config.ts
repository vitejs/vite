import fs from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

export default defineConfig({
  experimental: {
    hmrPartialAccept: true,
  },
  build: {
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
  ],
})

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
        const depPath = path.resolve(__dirname, './css-deps/dep.js')
        const dep = await fs.readFile(depPath, 'utf-8')
        const color = dep.match(/color = '(.+?)'/)[1]
        this.addWatchFile(depPath)
        return code.replace('replaced', color)
      }
    },
  }
}
