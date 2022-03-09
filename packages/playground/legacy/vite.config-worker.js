const legacy = require('@vitejs/plugin-legacy').default

module.exports = {
  plugins: [legacy()],
  build: {
    target: 'chrome60'
  }
}
