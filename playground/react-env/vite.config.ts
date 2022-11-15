import react from '@vitejs/plugin-react'
import type { UserConfig } from 'vite'

// Overriding the NODE_ENV set by vitest
process.env.NODE_ENV = ''

const config: UserConfig = {
  plugins: [react()],
  mode: 'staging',
  build: {
    // to make tests faster
    minify: false
  }
}

export default config
