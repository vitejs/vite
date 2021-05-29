import react from '@vitejs/plugin-react'

const config: import('vite').UserConfig = {
  plugins: [react()],
  build: {
    // to make tests faster
    minify: false
  }
}

export default config
