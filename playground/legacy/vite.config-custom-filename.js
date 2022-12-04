const legacy = require('@vitejs/plugin-legacy').default

module.exports = {
  plugins: [legacy({ modernPolyfills: true })],
  build: {
    manifest: true,
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
      },
    },
  },
}
