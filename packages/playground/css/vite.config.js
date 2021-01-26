/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  alias: {
    '@': __dirname
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `$injectedColor: orange;`
      }
    }
  }
}
