import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

export default defineConfig({
  experimental: {
    hmrPartialAccept: true,
  },
  plugins: [
    {
      name: 'mock-custom',
      async handleHotUpdate({ file, read, server }) {
        if (file.endsWith('customFile.js')) {
          const content = await read()
          const msg = content.match(/export const msg = '(\w+)'/)[1]
          server.ws.send('custom:foo', { msg })
        }
      },
      configureServer(server) {
        server.ws.on('custom:remote-add', ({ a, b }, client) => {
          client.send('custom:remote-add-result', { result: a + b })
        })
      },
    },
    virtualPlugin(),
  ],
})

function virtualPlugin(): Plugin {
  let num = 0
  return {
    name: 'virtual-file',
    resolveId(id) {
      if (id === 'virtual:file') {
        return '\0virtual:file'
      }
    },
    load(id) {
      if (id === '\0virtual:file') {
        return `\
import { virtual as _virtual } from "/importedVirtual.js";
export const virtual = _virtual + '${num}';`
      }
    },
    configureServer(server) {
      server.ws.on('virtual:increment', async () => {
        const mod = await server.moduleGraph.getModuleByUrl('\0virtual:file')
        if (mod) {
          num++
          server.reloadModule(mod)
        }
      })
    },
  }
}
