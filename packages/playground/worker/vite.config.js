const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    assetsInlineLimit: 0,
    // to make tests faster
    minify: false
  },
});
