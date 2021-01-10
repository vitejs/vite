const vue = require('@vitejs/plugin-vue')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  dedupe: ['react'],

  optimizeDeps: {
    include: ['optimize-deps-linked-include'],
    plugins: [vue()]
  },

  build: {
    // to make tests faster
    minify: false
  },

  plugins: [
    vue(),
    // for axios request test
    {
      name: 'mock',
      configureServer({ app }) {
        app.use('/ping', (_, res) => {
          res.statusCode = 200
          res.end('pong')
        })
      }
    }
  ]
}
