import path from 'node:path'
import colors from 'picocolors'
import type { Plugin } from 'rolldown'
import { walk as eswalk } from 'estree-walker'
import { parseSync, type ESTree } from 'rolldown/utils'
import { analyze } from 'periscopic'
import { isFilePathESM, normalizePath, numberToPos } from './utils'

export type NativeConfigIncompatibilityType =
  | 'dirname'
  | 'filename'
  | 'extensionless-import'
  | 'directory-index-import'
  | 'json-without-attributes'
  | 'esm-syntax-in-cjs'

export interface NativeConfigIncompatibility {
  type: NativeConfigIncompatibilityType
  /** absolute path of the module the issue was found in */
  file: string
  /** 1-based line */
  line: number
  /** 0-based column */
  column: number
  /** import specifier, for the import-based types */
  specifier?: string
}

export interface ConfigImportRef {
  specifier: string
  line: number
  column: number
  hasTypeJsonAttribute: boolean
}

const jsTsExtRE = /\.[cm]?[jt]sx?$/
const indexFileRE = /^index\.[cm]?[jt]sx?$/

const lastSegmentOf = (specifier: string) =>
  specifier.slice(specifier.lastIndexOf('/') + 1)

/**
 * A specifier that already carries a JS/TS extension resolves as-is under the
 * native loader, so it can never be extension-less or a directory index and
 * needs no resolution to classify.
 */
const specifierHasJsExtension = (specifier: string) =>
  jsTsExtRE.test(lastSegmentOf(specifier))

export function classifyImportRef(
  ref: ConfigImportRef,
  resolvedId: string | null,
  file: string,
): NativeConfigIncompatibility | undefined {
  const { specifier, line, column } = ref
  const base = { file, line, column, specifier }

  if (specifier.endsWith('.json')) {
    if (ref.hasTypeJsonAttribute) return undefined
    return { type: 'json-without-attributes', ...base }
  }

  if (!resolvedId) return undefined

  if (resolvedId.endsWith('.json') && !ref.hasTypeJsonAttribute) {
    return { type: 'json-without-attributes', ...base }
  }

  const lastSegment = lastSegmentOf(specifier)
  const specifierNamesIndex =
    lastSegment === 'index' || indexFileRE.test(lastSegment)

  if (indexFileRE.test(path.basename(resolvedId)) && !specifierNamesIndex) {
    return { type: 'directory-index-import', ...base }
  }
  if (!jsTsExtRE.test(lastSegment)) {
    return { type: 'extensionless-import', ...base }
  }
  return undefined
}

const isPathSpecifier = (s: string) => s.startsWith('.') || path.isAbsolute(s)

const hasTypeJson = (
  attributes: ESTree.ImportAttribute[] | undefined,
): boolean =>
  !!attributes?.some((attr) => {
    const key = attr.key.type === 'Identifier' ? attr.key.name : attr.key.value
    return key === 'type' && attr.value?.value === 'json'
  })

const DIRNAME_FILENAME = {
  __dirname: 'dirname',
  __filename: 'filename',
} as const

export function analyzeConfigModuleReferences(
  code: string,
  ast: ESTree.Program,
  file: string,
): { globals: NativeConfigIncompatibility[]; imports: ConfigImportRef[] } {
  const imports: ConfigImportRef[] = []

  const addImportRef = (
    source: ESTree.StringLiteral,
    hasTypeJsonAttribute: boolean,
  ): void => {
    if (!isPathSpecifier(source.value)) return
    const { line, column } = numberToPos(code, source.start)
    imports.push({
      specifier: source.value,
      line,
      column,
      hasTypeJsonAttribute,
    })
  }

  eswalk(ast as any, {
    enter(_node) {
      const node = _node as ESTree.Node
      switch (node.type) {
        case 'ImportDeclaration':
          addImportRef(node.source, hasTypeJson(node.attributes))
          break
        case 'ExportNamedDeclaration':
        case 'ExportAllDeclaration':
          if (node.source)
            addImportRef(node.source, hasTypeJson(node.attributes))
          break
        case 'ImportExpression':
          if (
            node.source.type === 'Literal' &&
            typeof node.source.value === 'string'
          ) {
            // if a second (options) arg is present, assume the required attributes is set
            addImportRef(node.source, node.options != null)
          }
          break
      }
    },
  })

  const globals: NativeConfigIncompatibility[] = []
  if (code.includes('__dirname') || code.includes('__filename')) {
    const { globals: freeReferences } = analyze(ast as any)
    for (const [name, type] of Object.entries(DIRNAME_FILENAME)) {
      const node = freeReferences.get(name) as ESTree.Node | undefined
      if (!node) continue
      const { line, column } = numberToPos(code, node.start)
      globals.push({ type, file, line, column })
    }
  }

  return { globals, imports }
}

const esmStatementTypes = new Set([
  'ImportDeclaration',
  'ExportNamedDeclaration',
  'ExportDefaultDeclaration',
  'ExportAllDeclaration',
])

export function findEsmSyntaxInCjs(
  code: string,
  ast: ESTree.Program,
  file: string,
): NativeConfigIncompatibility | undefined {
  for (const node of ast.body) {
    if (esmStatementTypes.has(node.type)) {
      const { line, column } = numberToPos(code, (node as ESTree.Node).start)
      return { type: 'esm-syntax-in-cjs', file, line, column }
    }
  }
  return undefined
}

function describeIncompatibility(
  item: NativeConfigIncompatibility,
  root: string,
): string {
  const loc = `${normalizePath(path.relative(root, item.file))}:${item.line}`
  switch (item.type) {
    case 'dirname':
      return `\`__dirname\` (${loc}). Use \`import.meta.dirname\` instead`
    case 'filename':
      return `\`__filename\` (${loc}). Use \`import.meta.filename\` instead`
    case 'extensionless-import':
      return `import "${item.specifier}" without a file extension (${loc}). Add the file extension`
    case 'directory-index-import':
      return `import "${item.specifier}" resolves to a directory index (${loc}). Import the index file directly`
    case 'json-without-attributes':
      return item.specifier?.endsWith('.json')
        ? `JSON import "${item.specifier}" without import attributes (${loc}). Add \`with { type: 'json' }\``
        : `import "${item.specifier}" resolves to a JSON file (${loc}). Import it with a \`.json\` extension and \`with { type: 'json' }\``
    case 'esm-syntax-in-cjs':
      return `ESM syntax in a file loaded as CommonJS (${loc}). Use a \`.mjs\` extension or set \`"type": "module"\` in the closest package.json`
  }
}

export function formatNativeConfigIncompatWarning(
  items: NativeConfigIncompatibility[],
  root: string,
): string {
  const header =
    `Your Vite config uses features that are unsupported by ` +
    `\`configLoader: 'native'\`, which is planned to become the default in a ` +
    `future major version of Vite:`
  const lines = items.map((it) => `  - ${describeIncompatibility(it, root)}`)
  const footer = `Set \`VITE_CONFIG_NATIVE_IGNORE_WARNING=true\` to suppress this warning.`
  return colors.yellow([`(!) ${header}`, ...lines, footer].join('\n'))
}

export function createNativeConfigCompatPlugin(
  collector: NativeConfigIncompatibility[],
): Plugin {
  return {
    name: 'vite:native-config-compat-check',
    transform: {
      filter: { id: /\.[cm]?[jt]sx?$/ },
      async handler(code, id) {
        const isESM =
          typeof process.versions.deno === 'string' || isFilePathESM(id)

        let program: ESTree.Program
        try {
          const result = parseSync(id, code)
          if (result.errors.length > 0) return null
          program = result.program
        } catch {
          return null
        }

        // Node loads this file as CommonJS. ESM-only checks (`__dirname`,
        // import resolution) don't apply, but ESM syntax itself would throw
        // under the native loader.
        if (!isESM) {
          const finding = findEsmSyntaxInCjs(code, program, id)
          if (finding) collector.push(finding)
          return null
        }

        const { globals, imports } = analyzeConfigModuleReferences(
          code,
          program,
          id,
        )
        for (const g of globals) collector.push(g)
        for (const ref of imports) {
          let resolvedId: string | null = null
          if (
            !ref.specifier.endsWith('.json') &&
            !specifierHasJsExtension(ref.specifier)
          ) {
            const resolved = await this.resolve(ref.specifier, id)
            resolvedId = resolved?.id ?? null
          }
          const finding = classifyImportRef(ref, resolvedId, id)
          if (finding) collector.push(finding)
        }
        return null
      },
    },
  }
}
