import reactPlugin from '@vitejs/plugin-react'

const config: import('vite').UserConfig = {
  plugins: [
    reactPlugin({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          ['@babel/plugin-proposal-pipeline-operator', { proposal: 'fsharp' }]
        ]
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
