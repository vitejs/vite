import react from '@vitejs/plugin-react'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  mode: 'development',
  plugins: [react()],
  build: {
    // to make tests faster
    minify: false
  }
}

export default config
