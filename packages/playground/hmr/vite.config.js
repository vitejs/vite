/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [
    {
      name: 'mock-custom',
      async handleHotUpdate({ file, read, server }) {
        if (file.endsWith('customFile.js')) {
          const content = await read()
          const msg = content.match(/export const msg = '(\w+)'/)[1]
          server.ws.send({
            type: 'custom',
            event: 'foo',
            data: {
              msg
            }
          })
        }
      },
      configureServer(server) {
        server.ws.onEvent('remote-add', ({ a, b }, client) => {
          client.send({
            type: 'custom',
            event: 'remote-add-result',
            data: { result: a + b }
          })
        })
      }
    }
  ]
}
