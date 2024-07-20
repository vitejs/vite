import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: `$injectedColor: orange;`,
      },
      sass: {
        api: 'modern',
        additionalData: `$injectedColor: orange\n`,
      },
    },
  },
})
