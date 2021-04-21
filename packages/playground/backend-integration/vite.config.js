const path = require('path')
const glob = require('fast-glob')

/**
 * @returns {import('vite').Plugin}
 */
function BackendIntegrationExample() {
  return {
    name: 'backend-integration',
    config({ root: playgroundRoot }) {
      const projectRoot = playgroundRoot
      const sourceCodeDir = path.join(projectRoot, 'frontend')
      const root = path.join(sourceCodeDir, 'entrypoints')
      const outDir = path.relative(root, path.join(projectRoot, 'dist/dev'))

      const entrypoints = glob
        .sync(`${root}/**/*`, { onlyFiles: true })
        .map((filename) => [path.relative(root, filename), filename])

      return {
        build: {
          manifest: true,
          outDir,
          rollupOptions: {
            input: Object.fromEntries(entrypoints)
          }
        },
        root,
        resolve: {
          alias: {
            '~': sourceCodeDir
          }
        }
      }
    }
  }
}

/**
 * @returns {import('vite').UserConfig}
 */
module.exports = {
  base: '/dev/',
  plugins: [BackendIntegrationExample()]
}
