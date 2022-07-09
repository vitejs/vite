import react from '@vitejs/plugin-react'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  plugins: [react()],
  build: {
    sourcemap: true
  }
}

export default config
