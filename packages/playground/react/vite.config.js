const reactRefresh = require('@vitejs/plugin-react-refresh')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [reactRefresh()],
  alias: {
    react: '@pika/react/source.development.js',
    'react-dom': '@pika/react-dom/source.development.js'
  }
}
