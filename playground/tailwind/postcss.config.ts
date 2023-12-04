// postcss.config.ts
import { fileURLToPath } from 'node:url'

export default {
  plugins: {
    tailwindcss: {
      config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)),
    },
    autoprefixer: {},
  },
}
