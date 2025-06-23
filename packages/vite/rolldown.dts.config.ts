import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'rolldown'
import type {
  OutputChunk,
  Plugin,
  PluginContext,
  RenderedChunk,
} from 'rolldown'
import { parseAst } from 'rolldown/parseAst'
import { dts } from 'rolldown-plugin-dts'
import { parse as parseWithBabel } from '@babel/parser'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import type {
  Directive,
  ModuleExportName,
  Program,
  Statement,
} from '@oxc-project/types'

const depTypesDir = new URL('./src/types/', import.meta.url)
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString(),
)

const external = [
  /^node:*/,
  /^vite\//,
  'rollup/parseAst',
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.devDependencies),
]

export default defineConfig({
  input: {
    index: './src/node/index.ts',
    'module-runner': './src/module-runner/index.ts',
  },
  output: {
    dir: './dist/node',
    format: 'esm',
  },
  treeshake: {
    moduleSideEffects: 'no-external',
  },
  external,
  plugins: [
    patchTypes(),
    dts({ tsconfig: './src/node/tsconfig.build.json', emitDtsOnly: true }),
  ],
})

// Taken from https://stackoverflow.com/a/36328890
const multilineCommentsRE = /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g
const licenseCommentsRE = /MIT License|MIT license|BSD license/
const consecutiveNewlinesRE = /\n{2,}/g
const identifierWithTrailingDollarRE = /\b(\w+)\$\d+\b/g

/**
 * Replace specific identifiers with a more readable name, grouped by
 * the module that imports the identifier as a named import alias
 */
const identifierReplacements: Record<string, Record<string, string>> = {
  rollup: {
    Plugin$2: 'Rollup.Plugin',
    TransformResult$1: 'Rollup.TransformResult',
  },
  esbuild: {
    TransformResult$2: 'esbuild_TransformResult',
    TransformOptions$1: 'esbuild_TransformOptions',
    BuildOptions$1: 'esbuild_BuildOptions',
  },
  'node:http': {
    Server$1: 'http.Server',
    IncomingMessage$1: 'http.IncomingMessage',
  },
  'node:https': {
    Server$2: 'HttpsServer',
    ServerOptions$2: 'HttpsServerOptions',
  },
  'vite/module-runner': {
    FetchResult$1: 'moduleRunner_FetchResult',
  },
  '../../types/hmrPayload.js': {
    CustomPayload$1: 'hmrPayload_CustomPayload',
    HotPayload$1: 'hmrPayload_HotPayload',
  },
  '../../types/customEvent.js': {
    InferCustomEventPayload$1: 'hmrPayload_InferCustomEventPayload',
  },
  '../../types/internal/lightningcssOptions.js': {
    LightningCSSOptions$1: 'lightningcssOptions_LightningCSSOptions',
  },
}

// type names that are declared
const ignoreConfusingTypeNames = [
  'Plugin$1',
  'MinimalPluginContext$1',
  'ServerOptions$1',
]

/**
 * Patch the types files before passing to dts plugin
 * 1. Resolve `dep-types/*` and `types/*` imports
 * 2. Validate unallowed dependency imports
 * 3. Replace confusing type names
 * 4. Strip leftover internal types
 * 5. Clean unnecessary comments
 */
function patchTypes(): Plugin {
  return {
    name: 'patch-types',
    resolveId: {
      order: 'pre',
      filter: {
        id: /^(dep-)?types\//,
      },
      handler(id) {
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
    },
    generateBundle: {
      order: 'post',
      handler(_opts, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue

          const ast = parseAst(chunk.code, { lang: 'ts', sourceType: 'module' })
          const importBindings = getAllImportBindings(ast)
          if (
            chunk.fileName.startsWith('module-runner') ||
            // index and moduleRunner have a common chunk "moduleRunnerTransport"
            chunk.fileName.startsWith('moduleRunnerTransport') ||
            chunk.fileName.startsWith('types.d-')
          ) {
            validateRunnerChunk.call(this, chunk, importBindings)
          } else {
            validateChunkImports.call(this, chunk, importBindings)
            replaceConfusingTypeNames.call(this, chunk, importBindings)
            stripInternalTypes.call(this, chunk)
            cleanUnnecessaryComments(chunk)
          }
        }
      },
    },
  }
}

function stringifyModuleExportName(node: ModuleExportName): string {
  if (node.type === 'Identifier') {
    return node.name
  }
  return node.value
}

type ImportBindings = { id: string; bindings: string[]; locals: string[] }

function getImportBindings(
  node: Directive | Statement,
): ImportBindings | undefined {
  if (node.type === 'ImportDeclaration') {
    return {
      id: node.source.value,
      bindings: node.specifiers.map((s) =>
        s.type === 'ImportDefaultSpecifier'
          ? 'default'
          : s.type === 'ImportNamespaceSpecifier'
            ? '*'
            : stringifyModuleExportName(s.imported),
      ),
      locals: node.specifiers.map((s) => s.local.name),
    }
  }
  if (node.type === 'ExportNamedDeclaration') {
    if (!node.source) return undefined
    return {
      id: node.source.value,
      bindings: node.specifiers.map((s) => stringifyModuleExportName(s.local)),
      locals: [],
    }
  }
  if (node.type === 'ExportAllDeclaration') {
    if (!node.source) return undefined
    return { id: node.source.value, bindings: ['*'], locals: [] }
  }
}

function getAllImportBindings(ast: Program): ImportBindings[] {
  return ast.body.flatMap((node) => getImportBindings(node) ?? [])
}

/**
 * Runner chunk should only import local dependencies to stay lightweight
 */
function validateRunnerChunk(
  this: PluginContext,
  chunk: RenderedChunk,
  importBindings: ImportBindings[],
) {
  for (const { id, bindings } of importBindings) {
    if (
      !id.startsWith('./') &&
      !id.startsWith('../') &&
      // index and moduleRunner have a common chunk "moduleRunnerTransport"
      !id.startsWith('moduleRunnerTransport.d') &&
      !id.startsWith('types.d')
    ) {
      this.warn(
        `${chunk.fileName} imports "${bindings.join(', ')}" from "${id}" which is not allowed`,
      )
      process.exitCode = 1
    }
  }
}

/**
 * Validate that chunk imports do not import dev deps
 */
function validateChunkImports(
  this: PluginContext,
  chunk: RenderedChunk,
  importBindings: ImportBindings[],
) {
  const deps = Object.keys(pkg.dependencies)
  for (const { id, bindings } of importBindings) {
    if (
      !id.startsWith('./') &&
      !id.startsWith('../') &&
      !id.startsWith('node:') &&
      !id.startsWith('types.d') &&
      !id.startsWith('vite/') &&
      // index and moduleRunner have a common chunk "moduleRunnerTransport"
      !id.startsWith('moduleRunnerTransport.d') &&
      !deps.includes(id) &&
      !deps.some((name) => id.startsWith(name + '/'))
    ) {
      // If validation failed, only warn and set exit code 1 so that files
      // are written to disk for inspection, but the build will fail
      this.warn(
        `${chunk.fileName} imports "${bindings.join(', ')}" from "${id}" which is not allowed`,
      )
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
  chunk: OutputChunk,
  importBindings: ImportBindings[],
) {
  for (const modName in identifierReplacements) {
    const imp = importBindings.filter((imp) => imp.id === modName)
    // Validate that `identifierReplacements` is not outdated if there's no match
    if (imp.length === 0) {
      this.warn(
        `${chunk.fileName} does not import "${modName}" for replacement`,
      )
      process.exitCode = 1
      continue
    }

    const replacements = identifierReplacements[modName]
    for (const id in replacements) {
      // Validate that `identifierReplacements` is not outdated if there's no match
      if (!imp.some((i) => i.locals.includes(id))) {
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
        chunk.code = chunk.code.replace(
          new RegExp(`\\b\\w+\\b as ${regexEscapedId},?\\s?`),
          '',
        )
      }
      chunk.code = chunk.code.replace(
        new RegExp(`\\b${regexEscapedId}\\b`, 'g'),
        betterId,
      )
    }
  }

  const identifiers = unique(
    Array.from(
      chunk.code.matchAll(identifierWithTrailingDollarRE),
      (m) => m[0],
    ),
  )
  const unreplacedIds = identifiers.filter(
    (id) => !ignoreConfusingTypeNames.includes(id),
  )
  if (unreplacedIds.length) {
    const unreplacedStr = unreplacedIds.map((id) => `\n- ${id}`).join('')
    this.warn(
      `${chunk.fileName} contains confusing identifier names${unreplacedStr}`,
    )
    process.exitCode = 1
  }
  const notUsedConfusingTypeNames = ignoreConfusingTypeNames.filter(
    (id) => !identifiers.includes(id),
  )
  // Validate that `identifierReplacements` is not outdated if there's no match
  if (notUsedConfusingTypeNames.length) {
    const notUsedStr = notUsedConfusingTypeNames
      .map((id) => `\n- ${id}`)
      .join('')
    this.warn(`${chunk.fileName} contains unused identifier names${notUsedStr}`)
    process.exitCode = 1
  }
}

/**
 * While we already enable `compilerOptions.stripInternal`, some internal comments
 * like internal parameters are still not stripped by TypeScript, so we run another
 * pass here.
 */
function stripInternalTypes(this: PluginContext, chunk: OutputChunk) {
  if (chunk.code.includes('@internal')) {
    const s = new MagicString(chunk.code)
    // need to parse with babel to get the comments
    const ast = parseWithBabel(chunk.code, {
      plugins: ['typescript'],
      sourceType: 'module',
    })

    walk(ast as any, {
      enter(node: any) {
        if (removeInternal(s, node)) {
          this.skip()
        }
      },
    })

    chunk.code = s.toString()

    if (chunk.code.includes('@internal')) {
      this.warn(`${chunk.fileName} has unhandled @internal declarations`)
      process.exitCode = 1
    }
  }
}

/**
 * Remove `@internal` comments not handled by `compilerOptions.stripInternal`
 * Reference: https://github.com/vuejs/core/blob/main/rollup.dts.config.js
 */
function removeInternal(s: MagicString, node: any): boolean {
  if (
    node.leadingComments &&
    node.leadingComments.some((c: any) => {
      return c.type === 'CommentBlock' && c.value.includes('@internal')
    })
  ) {
    // Examples:
    // function a(foo: string, /* @internal */ bar: number, baz: boolean)
    //                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // type Enum = Foo | /* @internal */ Bar | Baz
    //                   ^^^^^^^^^^^^^^^^^^^^^
    // strip trailing comma or pipe
    const trailingRe = /\s*[,|]/y
    trailingRe.lastIndex = node.end
    const trailingStr = trailingRe.exec(s.original)?.[0] ?? ''
    s.remove(node.leadingComments[0].start, node.end + trailingStr.length)
    return true
  }
  return false
}

function cleanUnnecessaryComments(chunk: OutputChunk) {
  chunk.code = chunk.code
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
