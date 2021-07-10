import reactPlugin from '@vitejs/plugin-react'

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [reactPlugin()],
  build: {
    // to make tests faster
    minify: false
  }
}
