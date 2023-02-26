const path = require('node:path')
const glob = require('fast-glob')
const normalizePath = require('vite').normalizePath

/**
 * @returns {import('vite').Plugin}
 */
function BackendIntegrationExample() {
  return {
    name: 'backend-integration',
    config() {
      const projectRoot = __dirname
      const sourceCodeDir = path.join(projectRoot, 'frontend')
      const root = path.join(sourceCodeDir, 'entrypoints')
      const outDir = path.relative(root, path.join(projectRoot, 'dist/dev'))

      const entrypoints = glob
        .sync(`${normalizePath(root)}/**/*`, { onlyFiles: true })
        .map((filename) => [path.relative(root, filename), filename])

      entrypoints.push(['tailwindcss-colors', 'tailwindcss/colors.js'])
      entrypoints.push(['foo.css', path.resolve(__dirname, './dir/foo.css')])

      return {
        build: {
          manifest: true,
          outDir,
          rollupOptions: {
            input: Object.fromEntries(entrypoints),
          },
        },
        root,
        resolve: {
          alias: {
            '~': sourceCodeDir,
          },
        },
      }
    },
  }
}

/**
 * @returns {import('vite').UserConfig}
 */
module.exports = {
  base: '/dev/',
  plugins: [BackendIntegrationExample()],
}
