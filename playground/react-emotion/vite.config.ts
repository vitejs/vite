import react from '@vitejs/plugin-react'

const config: import('vite').UserConfig = {
  plugins: [
    react({
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
