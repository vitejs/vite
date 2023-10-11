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
const identifierWithTrailingDollarRE = /\b(\w+)\$\d+\b/g

/**
 * Patch the types files before passing to dts plugin
 * 1. Resolve `dep-types/*` and `types/*` imports
 * 2. Validate unallowed dependency imports
 * 3. Replace confusing type names
 * 4. Clean unnecessary comments
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
      // Validate that chunk imports do not import dev deps
      const deps = new Set(Object.keys(pkg.dependencies))
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

      // Rollup deduplicate type names with a trailing `$1` or `$2`, which can be
      // confusing when showed in autocompletions. Try to replace with a better name
      const foundDollarNames = new Set<string>()
      for (const match of code.matchAll(identifierWithTrailingDollarRE)) {
        foundDollarNames.add(match[0])
      }
      for (const name of foundDollarNames) {
        const betterName = getBetterTypeName(name)
        if (!betterName) {
          this.warn(
            `${chunk.fileName} contains "${name}" which is a confusing type name`,
          )
          process.exitCode = 1
          continue
        }
        const regexEscapedName = escapeRegex(name)
        // If the better name accesses a namespace, the existing `Foo as Foo$1`
        // named import cannot be replaced with `Foo as Namespace.Foo`, so we
        // pre-emptively remove the whole named import
        if (betterName.includes('.')) {
          code = code.replace(
            new RegExp(`\\b\\w+\\b as ${regexEscapedName},?\\s?`),
            '',
          )
        }
        code = code.replace(
          new RegExp(`\\b${regexEscapedName}\\b`, 'g'),
          betterName,
        )
      }

      // Clean unnecessary comments
      code = code
        .replace(singlelineCommentsRE, '')
        .replace(multilineCommentsRE, (m) => {
          return licenseCommentsRE.test(m) ? '' : m
        })
        .replace(consecutiveNewlinesRE, '\n\n')

      return code
    },
  }
}

function getBetterTypeName(name: string) {
  // prettier-ignore
  switch (name) {
    case 'Plugin$1': return 'rollup.Plugin'
    case 'TransformResult$1': return 'esbuild_TransformResult'
    case 'TransformResult$2': return 'rollup.TransformResult'
    case 'TransformOptions$1': return 'esbuild_TransformOptions'
    case 'BuildOptions$1': return 'esbuild_BuildOptions'
    case 'Server$1': return 'HttpsServer'
    case 'ServerOptions$1': return 'HttpsServerOptions'
  }
}

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g
function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&')
}
