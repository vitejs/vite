import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'test-plugin-error',
      transform(code, id, options) {
        testError()
      },
    },
    {
      name: 'virtual-entry',
      resolveId(source, importer, options) {
        if (source === 'virtual:entry') {
          return '\0' + source
        }
      },
      load(id, options) {
        if (id === '\0virtual:entry') {
          return `export default {}`
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: 'virtual:entry',
    },
  },
})

function testError() {
  throw new Error('Testing Error')
}
