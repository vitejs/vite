const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  server: {
    fs: {
      strict: true,
      allow: [path.resolve(__dirname, 'src')],
      deny: ['**/deny/**']
    }
  },
  define: {
    ROOT: JSON.stringify(path.dirname(__dirname).replace(/\\/g, '/'))
  }
})
