import { fileURLToPath } from 'node:url'
import type { Config } from 'tailwindcss'

export default {
  content: [
    // Before editing this section, make sure no paths are matching with `/src/main.js`
    // Look https://github.com/vitejs/vite/pull/6959 for more details
    fileURLToPath(new URL('./src/{components,views}/**/*.js', import.meta.url)),
    fileURLToPath(new URL('./src/main.js', import.meta.url)),
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
} satisfies Config
