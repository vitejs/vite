import { builtinModules } from 'node:module'
import { parse as parseWithBabel } from '@babel/parser'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import { defineConfig } from 'rolldown'
import type {
  OutputChunk,
  Plugin,
  PluginContext,
  RenderedChunk,
} from 'rolldown'
import { dts } from 'rolldown-plugin-dts'
import { parseAst } from 'rolldown/parseAst'
import type { ESTree } from 'rolldown/utils'
import pkg from './package.json' with { type: 'json' }

type Directive = ESTree.Directive
type ModuleExportName = ESTree.ModuleExportName
type Program = ESTree.Program
type Statement = ESTree.Statement

const external = [
  /^node:*/,
  /^vite\//,
  /^rolldown\//,
  /^#types\//,
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
]

export default defineConfig({
  input: {
    index: './src/node/index.ts',
    'module-runner': './src/module-runner/index.ts',
    internal: './src/node/internalIndex.ts',
  },
  output: {
    dir: './dist/node',
    chunkFileNames: 'chunks/[name].d.ts',
    format: 'esm',
  },
  treeshake: {
    moduleSideEffects: 'no-external',
  },
  external,
  plugins: [
    esmifyPostcssLoadConfigDts(),
    patchTypes(),
    addNodePrefix(),
    dts({
      tsconfig: './tsconfig.base.json',
      compilerOptions: {
        noEmit: false,
        skipLibCheck: true, // lib check is done on final types
        stripInternal: true,
        paths: {
          'vite/module-runner': ['./src/module-runner'],
        },
      },
      dtsOnly: true,
    }),
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
  'vite/module-runner': {
    FetchResult: 'moduleRunner_FetchResult',
  },
  rolldown: {
    Plugin: 'Rolldown.Plugin',
    TransformResult: 'Rolldown.TransformResult',
  },
  'rolldown/utils': {
    TransformOptions: 'rolldown_utils_TransformOptions',
    TransformResult: 'rolldown_utils_TransformResult',
  },
  'node:http': {
    Server: 'http.Server',
    IncomingMessage: 'http.IncomingMessage',
  },
  'node:https': {
    Server: 'HttpsServer',
    ServerOptions: 'HttpsServerOptions',
  },
  'node:url': {
    URL: 'url_URL',
  },
  '#types/hmrPayload': {
    CustomPayload: 'hmrPayload_CustomPayload',
    HotPayload: 'hmrPayload_HotPayload',
  },
  '#types/customEvent': {
    InferCustomEventPayload: 'hmrPayload_InferCustomEventPayload',
  },
  '#types/internal/esbuildOptions': {
    EsbuildTransformOptions: 'esbuildOptions_EsbuildTransformOptions',
  },
  '#types/internal/lightningcssOptions': {
    LightningCSSOptions: 'lightningcssOptions_LightningCSSOptions',
  },
  postcss: {
    Plugin: 'PostCSS.Plugin',
  },
}

const ignoreConfusingTypeNames = [
  // type names that are declared
  'MinimalPluginContext',
  'ServerOptions',
  // temporary variables for types
  'parseAst',
  'parseAstAsync',
]

/**
 * Patch the types files before passing to dts plugin
 * 1. Validate unallowed dependency imports
 * 2. Replace confusing type names
 * 3. Strip leftover internal types
 * 4. Clean unnecessary comments
 */
function patchTypes(): Plugin {
  return {
    name: 'patch-types',
    generateBundle: {
      order: 'post',
      handler(_opts, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue

          const ast = parseAst(chunk.code, { lang: 'ts', sourceType: 'module' })
          const importBindings = getAllImportBindings(ast)
          if (
            chunk.fileName.startsWith('module-runner') ||
            // index and moduleRunner have a common chunk
            chunk.fileName.startsWith('chunks/') ||
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
      !id.startsWith('#') &&
      // index and moduleRunner have a common chunk
      !id.startsWith('chunks/') &&
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
      !id.startsWith('#') &&
      !id.startsWith('node:') &&
      !id.startsWith('types.d') &&
      !id.startsWith('vite/') &&
      // index and moduleRunner have a common chunk
      !id.startsWith('chunks/') &&
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
  const isInternalEntry = chunk.fileName.startsWith('internal.')
  if (!isInternalEntry) {
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
      for (const name in replacements) {
        const id = imp
          .flatMap((i) => i.locals.filter((_, j) => i.bindings[j] === name))
          .find((local) => local !== name)
        // Validate that `identifierReplacements` is not outdated if there's no match
        if (!id) {
          this.warn(
            `${chunk.fileName} does not import "${name}" from "${modName}" for replacement`,
          )
          process.exitCode = 1
          continue
        }

        const betterId = replacements[name]
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
  }

  const matches = Array.from(
    chunk.code.matchAll(identifierWithTrailingDollarRE),
  )
  const unreplacedIds = unique(
    matches
      .filter((m) => !ignoreConfusingTypeNames.includes(m[1]))
      .map((m) => m[0]),
  )
  if (unreplacedIds.length) {
    const unreplacedStr = unreplacedIds.map((id) => `\n- ${id}`).join('')
    this.warn(
      `${chunk.fileName} contains confusing identifier names${unreplacedStr}`,
    )
    process.exitCode = 1
  }

  if (!isInternalEntry) {
    const notUsedConfusingTypeNames = ignoreConfusingTypeNames.filter(
      (name) => !matches.some((m) => m[1] === name),
    )
    // Validate that `identifierReplacements` is not outdated if there's no match
    if (notUsedConfusingTypeNames.length) {
      const notUsedStr = notUsedConfusingTypeNames
        .map((id) => `\n- ${id}`)
        .join('')
      this.warn(
        `${chunk.fileName} contains unused identifier names${notUsedStr}`,
      )
      process.exitCode = 1
    }
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
  return [...new Set(arr)]
}

const postcssLoadConfigDeepImport =
  "import Processor from 'postcss/lib/processor'"
const postcssLoadConfigNamespaceRE =
  /declare namespace postcssrc \{([\s\S]*?)\n\}\s*\nexport = postcssrc/

/**
 * `postcss-load-config` declares its types with CommonJS `export =` syntax,
 * which `rolldown-plugin-dts` cannot re-export named types from, and reaches
 * `Processor` through the deep `postcss/lib/processor` import, whose `export =`
 * declarations cannot be bundled either. Rewrite its dts to plain ESM: redirect
 * the deep import to the `postcss` package entry (an external dependency),
 * hoist the namespace members to top-level named exports, and replace
 * `export = postcssrc` with `export default postcssrc`. This lets `Config` be
 * re-exported (as `PostcssUserConfig`) while everything unused is tree-shaken.
 */
function esmifyPostcssLoadConfigDts(): Plugin {
  return {
    name: 'esmify-postcss-load-config-dts',
    transform: {
      filter: { id: /postcss-load-config[\\/].*\.d\.ts$/ },
      handler(code, id) {
        if (
          !code.includes(postcssLoadConfigDeepImport) ||
          !postcssLoadConfigNamespaceRE.test(code)
        ) {
          this.error(
            `The shape of the postcss-load-config dts changed and this plugin needs to be updated: ${id}`,
          )
        }
        return code
          .replace(
            postcssLoadConfigDeepImport,
            "import type { Processor } from 'postcss'",
          )
          .replace(
            postcssLoadConfigNamespaceRE,
            (_, body) => `${body}\nexport default postcssrc`,
          )
          .replace(/\bpostcssrc\.(\w+)/g, '$1')
      },
    },
  }
}

function addNodePrefix(): Plugin {
  return {
    name: 'add-node-prefix',
    resolveId: {
      order: 'pre',
      filter: {
        id: new RegExp(`^(?:${builtinModules.join('|')})$`),
      },
      handler(id) {
        return { id: `node:${id}`, external: true }
      },
    },
  }
}
