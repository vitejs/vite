import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'post-plugin',
      enforce: 'post',
      resolveId(id) {
        if (id.replace(/\?.*$/, '') === 'comma/foo') {
          return id
        }
      },
      load(id) {
        if (id.replace(/\?.*$/, '') === 'comma/foo') {
          return `export const comma = 'hi'`
        }
      },
    },
  ],
})
