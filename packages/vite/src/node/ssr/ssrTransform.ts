import path from 'node:path'
import MagicString from 'magic-string'
import type { RollupAstNode, SourceMap } from 'rollup'
import type {
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Function as FunctionNode,
  Identifier,
  ImportDeclaration,
  Literal,
  Pattern,
  Property,
  VariableDeclaration,
  Node as _Node,
} from 'estree'
import { extract_names as extractNames } from 'periscopic'
import { walk as eswalk } from 'estree-walker'
import type { RawSourceMap } from '@ampproject/remapping'
import { parseAstAsync as rollupParseAstAsync } from 'rollup/parseAst'
import type { TransformResult } from '../server/transformRequest'
import {
  combineSourcemaps,
  generateCodeFrame,
  isDefined,
  numberToPos,
} from '../utils'
import { isJSONRequest } from '../plugins/json'
import type { DefineImportMetadata } from '../../shared/ssrTransform'

type Node = _Node & {
  start: number
  end: number
}

export interface ModuleRunnerTransformOptions {
  json?: {
    stringify?: boolean
  }
}

export const ssrModuleExportsKey = `__vite_ssr_exports__`
export const ssrImportKey = `__vite_ssr_import__`
export const ssrDynamicImportKey = `__vite_ssr_dynamic_import__`
export const ssrExportAllKey = `__vite_ssr_exportAll__`
export const ssrImportMetaKey = `__vite_ssr_import_meta__`

const hashbangRE = /^#!.*\n/

export async function ssrTransform(
  code: string,
  inMap: SourceMap | { mappings: '' } | null,
  url: string,
  originalCode: string,
  options?: ModuleRunnerTransformOptions,
): Promise<TransformResult | null> {
  if (options?.json?.stringify && isJSONRequest(url)) {
    return ssrTransformJSON(code, inMap)
  }
  return ssrTransformScript(code, inMap, url, originalCode)
}

async function ssrTransformJSON(
  code: string,
  inMap: SourceMap | { mappings: '' } | null,
): Promise<TransformResult> {
  return {
    code: code.replace('export default', `${ssrModuleExportsKey}.default =`),
    map: inMap,
    deps: [],
    dynamicDeps: [],
    ssr: true,
  }
}

async function ssrTransformScript(
  code: string,
  inMap: SourceMap | { mappings: '' } | null,
  url: string,
  originalCode: string,
): Promise<TransformResult | null> {
  const s = new MagicString(code)

  let ast: any
  try {
    ast = await rollupParseAstAsync(code)
  } catch (err) {
    // enhance known rollup errors
    // https://github.com/rollup/rollup/blob/42e587e0e37bc0661aa39fe7ad6f1d7fd33f825c/src/utils/bufferToAst.ts#L17-L22
    if (err.code === 'PARSE_ERROR') {
      err.message = `Parse failure: ${err.message}\n`
      err.id = url
      if (typeof err.pos === 'number') {
        err.loc = numberToPos(code, err.pos)
        err.loc.file = url
        err.frame = generateCodeFrame(code, err.pos)
        err.message += `At file: ${url}:${err.loc.line}:${err.loc.column}`
      } else {
        err.message += `At file: ${url}`
      }
    }
    throw err
  }

  let uid = 0
  const deps = new Set<string>()
  const dynamicDeps = new Set<string>()
  const idToImportMap = new Map<string, string>()
  const declaredConst = new Set<string>()

  // hoist at the start of the file, after the hashbang
  const fileStartIndex = hashbangRE.exec(code)?.[0].length ?? 0
  let hoistIndex = fileStartIndex

  function defineImport(
    index: number,
    importNode: (
      | ImportDeclaration
      | (ExportNamedDeclaration & { source: Literal })
      | ExportAllDeclaration
    ) & {
      start: number
      end: number
    },
    metadata?: DefineImportMetadata,
  ) {
    const source = importNode.source.value as string
    deps.add(source)

    // Reduce metadata to undefined if it's all default values
    const metadataArg =
      (metadata?.importedNames?.length ?? 0) > 0
        ? `, ${JSON.stringify(metadata)}`
        : ''

    const importId = `__vite_ssr_import_${uid++}__`
    const transformedImport = `const ${importId} = await ${ssrImportKey}(${JSON.stringify(
      source,
    )}${metadataArg});`

    s.update(importNode.start, importNode.end, transformedImport)

    // If there's only whitespace characters between the last import and the
    // current one, that means there's no statements between them and
    // hoisting is not needed.
    // FIXME: account for comments between imports
    const nonWhitespaceRegex = /\S/g
    nonWhitespaceRegex.lastIndex = index
    nonWhitespaceRegex.exec(code)
    if (importNode.start > nonWhitespaceRegex.lastIndex) {
      // Imports are moved to the top of the file (AKA “hoisting”) to ensure any
      // non-import statements before them are executed after the import. This
      // aligns SSR imports with native ESM import behavior.
      s.move(importNode.start, importNode.end, index)
    } else {
      // Only update hoistIndex when *not* hoisting the current import. This
      // ensures that once any import in this module has been hoisted, all
      // remaining imports will also be hoisted. This is inherently true because
      // we work from the top of the file downward.
      hoistIndex = importNode.end
    }

    // Track how many lines the original import statement spans, so we can
    // preserve the line offset.
    let linesSpanned = 1
    for (let i = importNode.start; i < importNode.end; i++) {
      if (code[i] === '\n') {
        linesSpanned++
      }
    }
    if (linesSpanned > 1) {
      // This leaves behind any extra newlines that were removed during
      // transformation, in the position of the original import statement
      // (before any hoisting).
      s.prependRight(importNode.end, '\n'.repeat(linesSpanned - 1))
    }

    return importId
  }

  function defineExport(position: number, name: string, local = name) {
    s.appendLeft(
      position,
      `\nObject.defineProperty(${ssrModuleExportsKey}, ${JSON.stringify(name)}, ` +
        `{ enumerable: true, configurable: true, get(){ return ${local} }});`,
    )
  }

  const imports: RollupAstNode<ImportDeclaration>[] = []
  const exports: (
    | RollupAstNode<ExportNamedDeclaration>
    | RollupAstNode<ExportDefaultDeclaration>
    | RollupAstNode<ExportAllDeclaration>
  )[] = []

  for (const node of ast.body as Node[]) {
    if (node.type === 'ImportDeclaration') {
      imports.push(node)
    } else if (
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportDefaultDeclaration' ||
      node.type === 'ExportAllDeclaration'
    ) {
      exports.push(node)
    }
  }

  // 1. check all import statements and record id -> importName map
  for (const node of imports) {
    // import foo from 'foo' --> foo -> __import_foo__.default
    // import { baz } from 'foo' --> baz -> __import_foo__.baz
    // import * as ok from 'foo' --> ok -> __import_foo__
    const importId = defineImport(hoistIndex, node, {
      importedNames: node.specifiers
        .map((s) => {
          if (s.type === 'ImportSpecifier')
            return getIdentifierNameOrLiteralValue(s.imported) as string
          else if (s.type === 'ImportDefaultSpecifier') return 'default'
        })
        .filter(isDefined),
    })
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier') {
        if (spec.imported.type === 'Identifier') {
          idToImportMap.set(
            spec.local.name,
            `${importId}.${spec.imported.name}`,
          )
        } else {
          idToImportMap.set(
            spec.local.name,
            `${importId}[${JSON.stringify(spec.imported.value as string)}]`,
          )
        }
      } else if (spec.type === 'ImportDefaultSpecifier') {
        idToImportMap.set(spec.local.name, `${importId}.default`)
      } else {
        // namespace specifier
        idToImportMap.set(spec.local.name, importId)
      }
    }
  }

  // 2. check all export statements and define exports
  for (const node of exports) {
    // named exports
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (
          node.declaration.type === 'FunctionDeclaration' ||
          node.declaration.type === 'ClassDeclaration'
        ) {
          // export function foo() {}
          defineExport(node.end, node.declaration.id!.name)
        } else {
          // export const foo = 1, bar = 2
          for (const declaration of node.declaration.declarations) {
            const names = extractNames(declaration.id as any)
            for (const name of names) {
              defineExport(node.end, name)
            }
          }
        }
        s.remove(node.start, (node.declaration as Node).start)
      } else {
        s.remove(node.start, node.end)
        if (node.source) {
          // export { foo, bar } from './foo'
          const importId = defineImport(
            node.start,
            node as RollupAstNode<ExportNamedDeclaration & { source: Literal }>,
            {
              importedNames: node.specifiers.map(
                (s) => getIdentifierNameOrLiteralValue(s.local) as string,
              ),
            },
          )
          for (const spec of node.specifiers) {
            const exportedAs = getIdentifierNameOrLiteralValue(
              spec.exported,
            ) as string

            if (spec.local.type === 'Identifier') {
              defineExport(
                node.end,
                exportedAs,
                `${importId}.${spec.local.name}`,
              )
            } else {
              defineExport(
                node.end,
                exportedAs,
                `${importId}[${JSON.stringify(spec.local.value as string)}]`,
              )
            }
          }
        } else {
          // export { foo, bar }
          for (const spec of node.specifiers) {
            // spec.local can be Literal only when it has "from 'something'"
            const local = (spec.local as Identifier).name
            const binding = idToImportMap.get(local)
            const exportedAs = getIdentifierNameOrLiteralValue(
              spec.exported,
            ) as string

            defineExport(node.end, exportedAs, binding || local)
          }
        }
      }
    }

    // default export
    if (node.type === 'ExportDefaultDeclaration') {
      const expressionTypes = ['FunctionExpression', 'ClassExpression']
      if (
        'id' in node.declaration &&
        node.declaration.id &&
        !expressionTypes.includes(node.declaration.type)
      ) {
        // named hoistable/class exports
        // export default function foo() {}
        // export default class A {}
        const { name } = node.declaration.id
        s.remove(node.start, node.start + 15 /* 'export default '.length */)
        s.append(
          `\nObject.defineProperty(${ssrModuleExportsKey}, "default", ` +
            `{ enumerable: true, configurable: true, value: ${name} });`,
        )
      } else {
        // anonymous default exports
        s.update(
          node.start,
          node.start + 14 /* 'export default'.length */,
          `${ssrModuleExportsKey}.default =`,
        )
      }
    }

    // export * from './foo'
    if (node.type === 'ExportAllDeclaration') {
      const importId = defineImport(node.start, node)
      if (node.exported) {
        const exportedAs = getIdentifierNameOrLiteralValue(
          node.exported,
        ) as string
        defineExport(node.end, exportedAs, `${importId}`)
      } else {
        s.appendLeft(node.end, `${ssrExportAllKey}(${importId});\n`)
      }
    }
  }

  // 3. convert references to import bindings & import.meta references
  walk(ast, {
    onStatements(statements) {
      // ensure ";" between statements
      for (let i = 0; i < statements.length - 1; i++) {
        const stmt = statements[i]
        if (
          code[stmt.end - 1] !== ';' &&
          stmt.type !== 'FunctionDeclaration' &&
          stmt.type !== 'ClassDeclaration' &&
          stmt.type !== 'BlockStatement' &&
          stmt.type !== 'ImportDeclaration'
        ) {
          s.appendRight(stmt.end, ';')
        }
      }
    },
    onIdentifier(id, parent, parentStack) {
      const grandparent = parentStack[1]
      const binding = idToImportMap.get(id.name)
      if (!binding) {
        return
      }
      if (isStaticProperty(parent) && parent.shorthand) {
        // let binding used in a property shorthand
        // { foo } -> { foo: __import_x__.foo }
        // skip for destructuring patterns
        if (
          !isNodeInPattern(parent) ||
          isInDestructuringAssignment(parent, parentStack)
        ) {
          s.appendLeft(id.end, `: ${binding}`)
        }
      } else if (
        (parent.type === 'PropertyDefinition' &&
          grandparent?.type === 'ClassBody') ||
        (parent.type === 'ClassDeclaration' && id === parent.superClass)
      ) {
        if (!declaredConst.has(id.name)) {
          declaredConst.add(id.name)
          // locate the top-most node containing the class declaration
          const topNode = parentStack[parentStack.length - 2]
          s.prependRight(topNode.start, `const ${id.name} = ${binding};\n`)
        }
      } else if (parent.type === 'CallExpression') {
        s.update(id.start, id.end, binding)
        // wrap with (0, ...) to avoid method binding `this`
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors#method_binding
        s.prependRight(id.start, `(0,`)
        s.appendLeft(id.end, `)`)
      } else if (
        // don't transform class name identifier
        !(parent.type === 'ClassExpression' && id === parent.id)
      ) {
        s.update(id.start, id.end, binding)
      }
    },
    onImportMeta(node) {
      s.update(node.start, node.end, ssrImportMetaKey)
    },
    onDynamicImport(node) {
      s.update(node.start, node.start + 6, ssrDynamicImportKey)
      if (node.type === 'ImportExpression' && node.source.type === 'Literal') {
        dynamicDeps.add(node.source.value as string)
      }
    },
  })

  let map = s.generateMap({ hires: 'boundary' })
  map.sources = [path.basename(url)]
  // needs to use originalCode instead of code
  // because code might be already transformed even if map is null
  map.sourcesContent = [originalCode]
  if (
    inMap &&
    inMap.mappings &&
    'sources' in inMap &&
    inMap.sources.length > 0
  ) {
    map = combineSourcemaps(url, [
      map as RawSourceMap,
      inMap as RawSourceMap,
    ]) as SourceMap
  }

  return {
    code: s.toString(),
    map,
    ssr: true,
    deps: [...deps],
    dynamicDeps: [...dynamicDeps],
  }
}

function getIdentifierNameOrLiteralValue(node: Identifier | Literal) {
  return node.type === 'Identifier' ? node.name : node.value
}

interface Visitors {
  onIdentifier: (
    node: Identifier & {
      start: number
      end: number
    },
    parent: Node,
    parentStack: Node[],
  ) => void
  onImportMeta: (node: Node) => void
  onDynamicImport: (node: Node) => void
  onStatements: (statements: Node[]) => void
}

const isNodeInPatternWeakSet = new WeakSet<_Node>()
const setIsNodeInPattern = (node: Property) => isNodeInPatternWeakSet.add(node)
const isNodeInPattern = (node: _Node): node is Property =>
  isNodeInPatternWeakSet.has(node)

/**
 * Same logic from \@vue/compiler-core & \@vue/compiler-sfc
 * Except this is using acorn AST
 */
function walk(
  root: Node,
  { onIdentifier, onImportMeta, onDynamicImport, onStatements }: Visitors,
) {
  const parentStack: Node[] = []
  const varKindStack: VariableDeclaration['kind'][] = []
  const scopeMap = new WeakMap<_Node, Set<string>>()
  const identifiers: [id: any, stack: Node[]][] = []

  const setScope = (node: _Node, name: string) => {
    let scopeIds = scopeMap.get(node)
    if (scopeIds && scopeIds.has(name)) {
      return
    }
    if (!scopeIds) {
      scopeIds = new Set()
      scopeMap.set(node, scopeIds)
    }
    scopeIds.add(name)
  }

  function isInScope(name: string, parents: Node[]) {
    return parents.some((node) => scopeMap.get(node)?.has(name))
  }
  function handlePattern(p: Pattern, parentScope: _Node) {
    if (p.type === 'Identifier') {
      setScope(parentScope, p.name)
    } else if (p.type === 'RestElement') {
      handlePattern(p.argument, parentScope)
    } else if (p.type === 'ObjectPattern') {
      p.properties.forEach((property) => {
        if (property.type === 'RestElement') {
          setScope(parentScope, (property.argument as Identifier).name)
        } else {
          handlePattern(property.value, parentScope)
        }
      })
    } else if (p.type === 'ArrayPattern') {
      p.elements.forEach((element) => {
        if (element) {
          handlePattern(element, parentScope)
        }
      })
    } else if (p.type === 'AssignmentPattern') {
      handlePattern(p.left, parentScope)
    } else {
      setScope(parentScope, (p as any).name)
    }
  }

  ;(eswalk as any)(root, {
    enter(node: Node, parent: Node | null) {
      if (node.type === 'ImportDeclaration') {
        return this.skip()
      }

      // for nodes that can contain multiple statements
      if (
        node.type === 'Program' ||
        node.type === 'BlockStatement' ||
        node.type === 'StaticBlock'
      ) {
        onStatements(node.body as Node[])
      } else if (node.type === 'SwitchCase') {
        onStatements(node.consequent as Node[])
      }

      // track parent stack, skip for "else-if"/"else" branches as acorn nests
      // the ast within "if" nodes instead of flattening them
      if (
        parent &&
        !(parent.type === 'IfStatement' && node === parent.alternate)
      ) {
        parentStack.unshift(parent)
      }

      // track variable declaration kind stack used by VariableDeclarator
      if (node.type === 'VariableDeclaration') {
        varKindStack.unshift(node.kind)
      }

      if (node.type === 'MetaProperty' && node.meta.name === 'import') {
        onImportMeta(node)
      } else if (node.type === 'ImportExpression') {
        onDynamicImport(node)
      }

      if (node.type === 'Identifier') {
        if (
          !isInScope(node.name, parentStack) &&
          isRefIdentifier(node, parent!, parentStack)
        ) {
          // record the identifier, for DFS -> BFS
          identifiers.push([node, parentStack.slice(0)])
        }
      } else if (isFunction(node)) {
        // If it is a function declaration, it could be shadowing an import
        // Add its name to the scope so it won't get replaced
        if (node.type === 'FunctionDeclaration') {
          const parentScope = findParentScope(parentStack)
          if (parentScope) {
            setScope(parentScope, node.id.name)
          }
        }
        // If it is a function expression, its name (if exist) could also be
        // shadowing an import. So add its own name to the scope
        if (node.type === 'FunctionExpression' && node.id) {
          setScope(node, node.id.name)
        }
        // walk function expressions and add its arguments to known identifiers
        // so that we don't prefix them
        node.params.forEach((p) => {
          if (p.type === 'ObjectPattern' || p.type === 'ArrayPattern') {
            handlePattern(p, node)
            return
          }
          ;(eswalk as any)(p.type === 'AssignmentPattern' ? p.left : p, {
            enter(child: Node, parent: Node | undefined) {
              // skip params default value of destructure
              if (
                parent?.type === 'AssignmentPattern' &&
                parent.right === child
              ) {
                return this.skip()
              }
              if (child.type !== 'Identifier') return
              // do not record as scope variable if is a destructuring keyword
              if (isStaticPropertyKey(child, parent)) return
              // do not record if this is a default value
              // assignment of a destructuring variable
              if (
                (parent?.type === 'TemplateLiteral' &&
                  parent.expressions.includes(child)) ||
                (parent?.type === 'CallExpression' && parent.callee === child)
              ) {
                return
              }
              setScope(node, child.name)
            },
          })
        })
      } else if (node.type === 'ClassDeclaration') {
        // A class declaration name could shadow an import, so add its name to the parent scope
        const parentScope = findParentScope(parentStack)
        if (parentScope) {
          setScope(parentScope, node.id.name)
        }
      } else if (node.type === 'ClassExpression' && node.id) {
        // A class expression name could shadow an import, so add its name to the scope
        setScope(node, node.id.name)
      } else if (node.type === 'Property' && parent!.type === 'ObjectPattern') {
        // mark property in destructuring pattern
        setIsNodeInPattern(node)
      } else if (node.type === 'VariableDeclarator') {
        const parentFunction = findParentScope(
          parentStack,
          varKindStack[0] === 'var',
        )
        if (parentFunction) {
          handlePattern(node.id, parentFunction)
        }
      } else if (node.type === 'CatchClause' && node.param) {
        handlePattern(node.param, node)
      }
    },

    leave(node: Node, parent: Node | null) {
      // untrack parent stack from above
      if (
        parent &&
        !(parent.type === 'IfStatement' && node === parent.alternate)
      ) {
        parentStack.shift()
      }

      if (node.type === 'VariableDeclaration') {
        varKindStack.shift()
      }
    },
  })

  // emit the identifier events in BFS so the hoisted declarations
  // can be captured correctly
  identifiers.forEach(([node, stack]) => {
    if (!isInScope(node.name, stack)) onIdentifier(node, stack[0], stack)
  })
}

function isRefIdentifier(id: Identifier, parent: _Node, parentStack: _Node[]) {
  // declaration id
  if (
    parent.type === 'CatchClause' ||
    ((parent.type === 'VariableDeclarator' ||
      parent.type === 'ClassDeclaration') &&
      parent.id === id)
  ) {
    return false
  }

  if (isFunction(parent)) {
    // function declaration/expression id
    if ((parent as any).id === id) {
      return false
    }
    // params list
    if (parent.params.includes(id)) {
      return false
    }
  }

  // class method name
  if (parent.type === 'MethodDefinition' && !parent.computed) {
    return false
  }

  // property key
  if (isStaticPropertyKey(id, parent)) {
    return false
  }

  // object destructuring pattern
  if (isNodeInPattern(parent) && parent.value === id) {
    return false
  }

  // non-assignment array destructuring pattern
  if (
    parent.type === 'ArrayPattern' &&
    !isInDestructuringAssignment(parent, parentStack)
  ) {
    return false
  }

  // member expression property
  if (
    parent.type === 'MemberExpression' &&
    parent.property === id &&
    !parent.computed
  ) {
    return false
  }

  if (parent.type === 'ExportSpecifier') {
    return false
  }

  // is a special keyword but parsed as identifier
  if (id.name === 'arguments') {
    return false
  }

  return true
}

const isStaticProperty = (node: _Node): node is Property =>
  node.type === 'Property' && !node.computed

const isStaticPropertyKey = (node: _Node, parent: _Node | undefined) =>
  parent && isStaticProperty(parent) && parent.key === node

const functionNodeTypeRE = /Function(?:Expression|Declaration)$|Method$/
function isFunction(node: _Node): node is FunctionNode {
  return functionNodeTypeRE.test(node.type)
}

const blockNodeTypeRE = /^BlockStatement$|^For(?:In|Of)?Statement$/
function isBlock(node: _Node) {
  return blockNodeTypeRE.test(node.type)
}

function findParentScope(
  parentStack: _Node[],
  isVar = false,
): _Node | undefined {
  return parentStack.find(isVar ? isFunction : isBlock)
}

function isInDestructuringAssignment(
  parent: _Node,
  parentStack: _Node[],
): boolean {
  if (parent.type === 'Property' || parent.type === 'ArrayPattern') {
    return parentStack.some((i) => i.type === 'AssignmentExpression')
  }
  return false
}
