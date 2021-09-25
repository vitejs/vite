const vuePlugin = require('@vitejs/plugin-vue')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [
    vuePlugin(),
    {
      name: 'virtual',
      resolveId(id) {
        if (id === '@foo') {
          return id
        }
      },
      load(id) {
        if (id === '@foo') {
          return `export default { msg: 'hi' }`
        }
      }
    }
  ],
  build: {
    minify: false
  }
}
