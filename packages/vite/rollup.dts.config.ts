import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'

const depTypesDir = new URL('./src/types/', import.meta.url)
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString(),
)

export default defineConfig({
  input: './temp/node/index.d.ts',
  output: {
    file: './dist/node/index.d.ts',
    format: 'es',
  },
  external: [
    /^node:*/,
    ...Object.keys(pkg.dependencies),
    // lightningcss types are bundled
    ...Object.keys(pkg.devDependencies).filter((d) => d !== 'lightningcss'),
  ],
  plugins: [patchTypes(), dts({ respectExternal: true })],
})

// Taken from https://stackoverflow.com/a/36328890
const multilineCommentsRE = /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g
const singlelineCommentsRE = /\/\/[^/].*/g
const licenseCommentsRE = /MIT License|MIT license|BSD license/
const consecutiveNewlinesRE = /\n{2,}/g

/**
 * Patch the types files before passing to dts plugin
 * 1. Resolve `dep-types/*` and `types/*` imports
 * 2. Validate unallowed dependency imports
 * 3. Clean unnecessary comments
 */
function patchTypes(): Plugin {
  return {
    name: 'patch-types',
    resolveId(id) {
      // Dep types should be bundled
      if (id.startsWith('dep-types/')) {
        const fileUrl = new URL(
          `./${id.slice('dep-types/'.length)}.d.ts`,
          depTypesDir,
        )
        return fileURLToPath(fileUrl)
      }
      // Ambient types are unbundled and externalized
      if (id.startsWith('types/')) {
        return {
          id: '../../' + (id.endsWith('.js') ? id : id + '.js'),
          external: true,
        }
      }
    },
    renderChunk(code, chunk) {
      const deps = new Set(Object.keys(pkg.dependencies))
      // Validate that chunk imports do not import dev deps
      for (const id of chunk.imports) {
        if (
          !id.startsWith('./') &&
          !id.startsWith('../') &&
          !id.startsWith('node:') &&
          !deps.has(id)
        ) {
          // If validation failed, only warn and set exit code 1 so that files
          // are written to disk for inspection, but the build will fail
          this.warn(`${chunk.fileName} imports "${id}" which is not allowed`)
          process.exitCode = 1
        }
      }

      // Clean unnecessary comments
      return code
        .replace(singlelineCommentsRE, '')
        .replace(multilineCommentsRE, (m) => {
          return licenseCommentsRE.test(m) ? '' : m
        })
        .replace(consecutiveNewlinesRE, '\n\n')
    },
  }
}
