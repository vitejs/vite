import react from '@vitejs/plugin-react'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  plugins: [
    react({
      // TODO: When bundling with esbuild >0.14.4 or rollup, jsxRuntime: 'automatic' no
      // longer works for this example. See #6639
      jsxRuntime: 'classic',
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  clearScreen: false,
  build: {
    // to make tests faster
    minify: false
  }
}

export default config
