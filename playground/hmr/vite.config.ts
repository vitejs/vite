import { defineConfig } from 'vite'

export default defineConfig({
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
      }
    }
  ]
})
