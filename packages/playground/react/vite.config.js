const reactRefresh = require('@vitejs/plugin-react-refresh')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [reactRefresh()],
  esbuild: {
    jsxInject: `import React from 'react'`
  }
}
