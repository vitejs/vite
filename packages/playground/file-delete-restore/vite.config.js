const reactRefresh = require('@vitejs/plugin-react-refresh')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [reactRefresh()],
  build: {
    // to make tests faster
    minify: false
  },
  esbuild: {
    jsxInject: `import React from 'react'`
  }
}
