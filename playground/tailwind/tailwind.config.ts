import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from 'tailwindcss'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  content: [
    // Before editing this section, make sure no paths are matching with `/src/main.js`
    // Look https://github.com/vitejs/vite/pull/6959 for more details
    __dirname + '/src/{components,views}/**/*.js',
    __dirname + '/src/main.js',
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
} satisfies Config
