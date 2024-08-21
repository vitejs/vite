import path from 'node:path'
import glob from 'fast-glob'
import { defineConfig, normalizePath } from 'vite'

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
      entrypoints.push(['bar.css', path.resolve(__dirname, './dir/foo.css')])

      return {
        server: {
          // same port in playground/test-utils.ts
          port: 5009,
          strictPort: true,
          origin: 'http://localhost:5009',
        },
        preview: {
          port: 5009,
        },
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

export default defineConfig({
  base: '/dev/',
  plugins: [BackendIntegrationExample()],
})
