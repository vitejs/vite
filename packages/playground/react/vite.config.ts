import reactPlugin from '@vitejs/plugin-react'

const config: import('vite').UserConfig = {
  plugins: [
    reactPlugin({
      jsxRuntime: 'automatic'
    })
  ],
  build: {
    // to make tests faster
    minify: false
  }
}

export default config
