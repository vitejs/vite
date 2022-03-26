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
          server.ws.send('foo', { msg })
        }
      },
      configureServer(server) {
        server.ws.on('remote-add', ({ a, b }, client) => {
          client.send('remote-add-result', { result: a + b })
        })
      }
    }
  ]
}
