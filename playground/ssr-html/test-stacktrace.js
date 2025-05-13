import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const isSourceMapEnabled = process.argv[2] === 'true'
const ext = process.argv[3]
process.setSourceMapsEnabled(isSourceMapEnabled)
console.log('# sourcemaps enabled:', isSourceMapEnabled)
console.log('# source file extension:', ext)

const version = (() => {
  const m = process.version.match(/^v(\d+)\.(\d+)\.\d+$/)
  if (!m) throw new Error(`Failed to parse version: ${process.version}`)

  return { major: +m[1], minor: +m[2] }
})()

// https://github.com/nodejs/node/pull/43428
const isFunctionSourceMapSupported =
  (version.major === 16 && version.minor >= 17) ||
  (version.major === 18 && version.minor >= 6) ||
  version.major >= 19

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isTest = process.env.VITEST

const vite = await createServer({
  root: __dirname,
  logLevel: isTest ? 'error' : 'info',
  server: {
    middlewareMode: true,
    ws: false,
  },
  appType: 'custom',
})

const dir = path.dirname(fileURLToPath(import.meta.url))

const abs1 = await vite.ssrLoadModule(`/src/error-${ext}.${ext}`)
const abs2 = await vite.ssrLoadModule(
  path.resolve(dir, `./src/error-${ext}.${ext}`),
)
const relative = await vite.ssrLoadModule(`./src/error-${ext}.${ext}`)

for (const mod of [abs1, abs2, relative]) {
  try {
    mod.error()
  } catch (e) {
    // this should not be called
    // when sourcemap support for `new Function` is supported and sourcemap is enabled
    // because the stacktrace is already rewritten by Node.js
    if (!(isSourceMapEnabled && isFunctionSourceMapSupported)) {
      vite.ssrFixStacktrace(e)
    }
    console.log(e)
  }
}

await vite.close()
