import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()]
  // To automatically inject React you can uncomment the following lines
  // (you also have to set "jsx" to true in tsconfig.json):
  // esbuild: {
  //   jsxInject: "import React from 'react';",
  // }
})
