import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { findStaticImports } from 'mlly'
import { defineConfig } from 'rollup'
import type { Plugin, PluginContext, RenderedChunk } from 'rollup'
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
    'rollup/parseAst',
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
 * Replace specific identifiers with a more readable name, grouped by
 * the module that imports the identifer as a named import alias
 */
const identifierReplacements: Record<string, Record<string, string>> = {
  rollup: {
    Plugin$1: 'rollup.Plugin',
    TransformResult$2: 'rollup.TransformResult',
  },
  esbuild: {
    TransformResult$1: 'esbuild_TransformResult',
    TransformOptions$1: 'esbuild_TransformOptions',
    BuildOptions$1: 'esbuild_BuildOptions',
  },
  'node:https': {
    Server$1: 'HttpsServer',
    ServerOptions$1: 'HttpsServerOptions',
  },
}

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
      validateChunkImports.call(this, chunk)
      code = replaceConfusingTypeNames.call(this, code, chunk)
      code = cleanUnnecessaryComments(code)
      return code
    },
  }
}

/**
 * Validate that chunk imports do not import dev deps
 */
function validateChunkImports(this: PluginContext, chunk: RenderedChunk) {
  const deps = Object.keys(pkg.dependencies)
  for (const id of chunk.imports) {
    if (
      !id.startsWith('./') &&
      !id.startsWith('../') &&
      !id.startsWith('node:') &&
      !deps.includes(id) &&
      !deps.some((name) => id.startsWith(name + '/'))
    ) {
      // If validation failed, only warn and set exit code 1 so that files
      // are written to disk for inspection, but the build will fail
      this.warn(`${chunk.fileName} imports "${id}" which is not allowed`)
      process.exitCode = 1
    }
  }
}

/**
 * Rollup deduplicate type names with a trailing `$1` or `$2`, which can be
 * confusing when showed in autocompletions. Try to replace with a better name
 */
function replaceConfusingTypeNames(
  this: PluginContext,
  code: string,
  chunk: RenderedChunk,
) {
  const imports = findStaticImports(code)

  for (const modName in identifierReplacements) {
    const imp = imports.find(
      (imp) => imp.specifier === modName && imp.imports.includes('{'),
    )
    // Validate that `identifierReplacements` is not outdated if there's no match
    if (!imp) {
      this.warn(
        `${chunk.fileName} does not import "${modName}" for replacement`,
      )
      process.exitCode = 1
      continue
    }

    const replacements = identifierReplacements[modName]
    for (const id in replacements) {
      // Validate that `identifierReplacements` is not outdated if there's no match
      if (!imp.imports.includes(id)) {
        this.warn(
          `${chunk.fileName} does not import "${id}" from "${modName}" for replacement`,
        )
        process.exitCode = 1
        continue
      }

      const betterId = replacements[id]
      const regexEscapedId = escapeRegex(id)
      // If the better id accesses a namespace, the existing `Foo as Foo$1`
      // named import cannot be replaced with `Foo as Namespace.Foo`, so we
      // pre-emptively remove the whole named import
      if (betterId.includes('.')) {
        code = code.replace(
          new RegExp(`\\b\\w+\\b as ${regexEscapedId},?\\s?`),
          '',
        )
      }
      code = code.replace(new RegExp(`\\b${regexEscapedId}\\b`, 'g'), betterId)
    }
  }

  const unreplacedIds = unique(
    Array.from(code.matchAll(identifierWithTrailingDollarRE), (m) => m[0]),
  )
  if (unreplacedIds.length) {
    const unreplacedStr = unreplacedIds.map((id) => `\n- ${id}`).join('')
    this.warn(
      `${chunk.fileName} contains confusing identifier names${unreplacedStr}`,
    )
    process.exitCode = 1
  }

  return code
}

function cleanUnnecessaryComments(code: string) {
  return code
    .replace(singlelineCommentsRE, '')
    .replace(multilineCommentsRE, (m) => {
      return licenseCommentsRE.test(m) ? '' : m
    })
    .replace(consecutiveNewlinesRE, '\n\n')
}

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g
function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&')
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}
