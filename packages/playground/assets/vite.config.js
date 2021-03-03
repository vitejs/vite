const path = require('path')

const execRoot = process.cwd()
const playgroundDir = execRoot.includes('playground')
  ? path.resolve(__dirname, '..') // Allow running vite locally inside the folder.
  : path.resolve(execRoot, 'packages/playground')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  base: '/foo/',
  publicDir: 'static',
  resolve: {
    alias: {
      '@playground': playgroundDir,
      '@': path.resolve(__dirname, 'nested')
    }
  },
  build: {
    outDir: 'dist/foo',
    manifest: true
  }
}
