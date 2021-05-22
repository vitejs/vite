import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()]
  // To automatically inject React you can uncomment the following lines:
  // esbuild: {
  //   jsxInject: "import React from 'react';",
  // }
})
