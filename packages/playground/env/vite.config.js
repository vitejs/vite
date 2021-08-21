const { defineConfig } = require('vite')

module.exports = defineConfig({
  envVariblePrefix: ['VITE_', 'CUSTOM_PREFIX_']
})
