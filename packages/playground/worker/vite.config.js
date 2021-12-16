const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    assetsInlineLimit: 0,
    minify: false
  },
});
