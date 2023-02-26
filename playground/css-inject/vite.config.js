/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  css: {
    devSourcemap: true,
    inject: (node) => {
      document.body.querySelector('custom-element').shadowRoot.appendChild(node)
    },
  },
  build: {
    sourcemap: true,
  },
}
