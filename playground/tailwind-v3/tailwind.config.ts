import type { Config } from 'tailwindcss'

export default {
  content: [
    // Before editing this section, make sure no paths are matching with `/src/main.js`
    // Look https://github.com/vitejs/vite/pull/6959 for more details
    import.meta.dirname + '/src/{components,views}/**/*.js',
    import.meta.dirname + '/src/main.js',
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
} satisfies Config
