import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const isSourceMapEnabled = process.argv[2] === 'true'
process.setSourceMapsEnabled(isSourceMapEnabled)
console.log('# sourcemaps enabled:', isSourceMapEnabled)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isTest = process.env.VITEST

const vite = await createServer({
  root: __dirname,
  logLevel: isTest ? 'error' : 'info',
  server: {
    middlewareMode: true,
  },
  appType: 'custom',
})

const mod = await vite.ssrLoadModule('/src/error.js')
try {
  mod.error()
} catch (e) {
  vite.ssrFixStacktrace(e)
  console.log(e)
}

await vite.close()
