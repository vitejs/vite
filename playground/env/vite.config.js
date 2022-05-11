const { defineConfig } = require('vite')

module.exports = defineConfig({
  envPrefix: ['VITE_', 'CUSTOM_PREFIX_']
})
