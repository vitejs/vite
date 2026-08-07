import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const dirname = import.meta.dirname

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(dirname, './index.html'),
        entry2: resolve(dirname, './entry2/index.html'),
      },
      output: {
        // Force vendor.css into its own chunk so it is absorbed into the
        // shared chunk's importedCss - this is the configuration that
        // historically reversed the cascade order (#4890).
        manualChunks(id) {
          if (id.endsWith('/vendor.css')) return 'vendor'
        },
      },
    },
  },
})
