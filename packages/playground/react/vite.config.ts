import reactPlugin from '@vitejs/plugin-react'

const config: import('vite').UserConfig = {
  plugins: [
    reactPlugin({
      jsxRuntime: 'automatic'
    })
  ],
  clearScreen: false,
  build: {
    // to make tests faster
    minify: false
  }
}

export default config
