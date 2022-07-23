const { resolve } = require('path')

async function awaiting(timeout = 1000) {
  await new Promise((resolve) => setTimeout(resolve, timeout))
}

let called1 = false
let called2 = false
let called3 = false

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  plugins: [
    {
      name: 'pre-close-bundle-1',
      enforce: 'pre',
      apply: 'build',
      async preCloseBundle() {
        await awaiting(1200)
        called1 = true
      }
    },
    {
      name: 'pre-close-bundle-2',
      async preCloseBundle() {
        await awaiting(1100)
        called2 = true
      }
    },
    {
      name: 'pre-close-bundle-2',
      enforce: 'post',
      apply: 'build',
      async preCloseBundle() {
        await awaiting()
        called3 = true
      }
    },
    {
      name: 'close-bundle-pre',
      enforce: 'pre',
      apply: 'build',
      closeBundle() {
        if (!called1 || !called2 || !called3) {
          throw new Error('some pre-close-bundle not being called!')
        }
      }
    },
    {
      name: 'close-bundle-post',
      enforce: 'post',
      apply: 'build',
      closeBundle() {
        if (!called1 || !called2 || !called3) {
          throw new Error('some pre-close-bundle not being called!')
        }
      }
    }
  ]
}
