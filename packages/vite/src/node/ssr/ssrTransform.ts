import MagicString from 'magic-string'
import { SourceMap } from 'rollup'
import { TransformResult } from '../server/transformRequest'
import { parser } from '../server/pluginContainer'
import {
  Identifier,
  Node as _Node,
  Property,
  Function as FunctionNode
} from 'estree'
import { extract_names as extractNames } from 'periscopic'
import { walk as eswalk } from 'estree-walker'
import merge from 'merge-source-map'

type Node = _Node & {
  start: number
  end: number
}

export const ssrModuleExportsKey = `__vite_ssr_exports__`
export const ssrImportKey = `__vite_ssr_import__`
export const ssrDynamicImportKey = `__vite_ssr_dynamic_import__`
export const ssrExportAllKey = `__vite_ssr_exportAll__`
export const ssrImportMetaKey = `__vite_ssr_import_meta__`

export async function ssrTransform(
  code: string,
  inMap: SourceMap | null
): Promise<TransformResult | null> {
  const s = new MagicString(code)

  const ast = parser.parse(code, {
    sourceType: 'module',
    ecmaVersion: 2020,
    locations: true
  }) as any

  let uid = 0
  const deps = new Set<string>()
  const idToImportMap = new Map<string, string>()

  function defineImport(node: Node, source: string) {
    deps.add(source)
    const importId = `__vite_ssr_import_${uid++}__`
    s.appendLeft(
      node.start,
      `const ${importId} = ${ssrImportKey}(${JSON.stringify(source)})\n`
    )
    return importId
  }

  function defineExport(name: string, local = name) {
    s.append(
      `\nObject.defineProperty(${ssrModuleExportsKey}, "${name}", ` +
        `{ get(){ return ${local} }})`
    )
  }

  // 1. check all import statements and record id -> importName map
  for (const node of ast.body as Node[]) {
    // import foo from 'foo' --> foo -> __import_foo__.default
    // import { baz } from 'foo' --> baz -> __import_foo__.baz
    // import * as ok from 'foo' --> ok -> __import_foo__
    if (node.type === 'ImportDeclaration') {
      const importId = defineImport(node, node.source.value as string)
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          idToImportMap.set(
            spec.local.name,
            `${importId}.${spec.imported.name}`
          )
        } else if (spec.type === 'ImportDefaultSpecifier') {
          idToImportMap.set(spec.local.name, `${importId}.default`)
        } else {
          // namespace specifier
          idToImportMap.set(spec.local.name, importId)
        }
      }
      s.remove(node.start, node.end)
    }
  }

  // 2. check all export statements and define exports
  for (const node of ast.body as Node[]) {
    // named exports
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (
          node.declaration.type === 'FunctionDeclaration' ||
          node.declaration.type === 'ClassDeclaration'
        ) {
          // export function foo() {}
          defineExport(node.declaration.id!.name)
        } else {
          // export const foo = 1, bar = 2
          for (const decl of node.declaration.declarations) {
            const names = extractNames(decl.id as any)
            for (const name of names) {
              defineExport(name)
            }
          }
        }
        s.remove(node.start, (node.declaration as Node).start)
      } else if (node.source) {
        // export { foo, bar } from './foo'
        const importId = defineImport(node, node.source.value as string)
        for (const spec of node.specifiers) {
          defineExport(spec.exported.name, `${importId}.${spec.local.name}`)
        }
        s.remove(node.start, node.end)
      } else {
        // export { foo, bar }
        for (const spec of node.specifiers) {
          const local = spec.local.name
          const binding = idToImportMap.get(local)
          defineExport(spec.exported.name, binding || local)
        }
        s.remove(node.start, node.end)
      }
    }

    // default export
    if (node.type === 'ExportDefaultDeclaration') {
      s.overwrite(
        node.start,
        node.start + 14,
        `${ssrModuleExportsKey}.default =`
      )
    }

    // export * from './foo'
    if (node.type === 'ExportAllDeclaration') {
      const importId = defineImport(node, node.source.value as string)
      s.remove(node.start, node.end)
      s.append(`\n${ssrExportAllKey}(${importId})`)
    }
  }

  // 2. convert references to import bindings & import.meta references
  walk(ast, {
    onIdentifier(id, parent, parentStack) {
      const binding = idToImportMap.get(id.name)
      if (!binding) {
        return
      }
      if (isStaticProperty(parent) && parent.shorthand) {
        // let binding used in a property shorthand
        // { foo } -> { foo: __import_x__.foo }
        // skip for destructure patterns
        if (
          !(parent as any).inPattern ||
          isInDestructureAssignment(parent, parentStack)
        ) {
          s.appendLeft(id.end, `: ${binding}`)
        }
      } else {
        s.overwrite(id.start, id.end, binding)
      }
    },
    onImportMeta(node) {
      s.overwrite(node.start, node.end, ssrImportMetaKey)
    },
    onDynamicImport(node) {
      s.overwrite(node.start, node.start + 6, ssrDynamicImportKey)
    }
  })

  let map = s.generateMap({ hires: true })
  if (inMap && inMap.mappings) {
    map = merge(inMap, {
      ...map,
      sources: inMap.sources,
      sourcesContent: inMap.sourcesContent
    }) as SourceMap
  }

  return {
    code: s.toString(),
    map,
    deps: [...deps]
  }
}

interface Visitors {
  onIdentifier: (
    node: Identifier & {
      start: number
      end: number
    },
    parent: Node,
    parentStack: Node[]
  ) => void
  onImportMeta: (node: Node) => void
  onDynamicImport: (node: Node) => void
}

/**
 * Same logic from \@vue/compiler-core & \@vue/compiler-sfc
 * Except this is using acorn AST
 */
function walk(
  root: Node,
  { onIdentifier, onImportMeta, onDynamicImport }: Visitors
) {
  const parentStack: Node[] = []
  const scope: Record<string, number> = Object.create(null)
  const scopeMap = new WeakMap<_Node, Set<string>>()

  ;(eswalk as any)(root, {
    enter(node: Node, parent: Node | null) {
      parent && parentStack.push(parent)

      if (node.type === 'ImportDeclaration') {
        return this.skip()
      }

      if (node.type === 'MetaProperty' && node.meta.name === 'import') {
        onImportMeta(node)
      } else if (node.type === 'ImportExpression') {
        onDynamicImport(node)
      }

      if (node.type === 'Identifier') {
        if (!scope[node.name] && isRefIdentifier(node, parent!, parentStack)) {
          onIdentifier(node, parent!, parentStack)
        }
      } else if (isFunction(node)) {
        // walk function expressions and add its arguments to known identifiers
        // so that we don't prefix them
        node.params.forEach((p) =>
          (eswalk as any)(p, {
            enter(child: Node, parent: Node) {
              if (
                child.type === 'Identifier' &&
                // do not record as scope variable if is a destructured key
                !isStaticPropertyKey(child, parent) &&
                // do not record if this is a default value
                // assignment of a destructured variable
                !(
                  parent &&
                  parent.type === 'AssignmentPattern' &&
                  parent.right === child
                )
              ) {
                const { name } = child
                let scopeIds = scopeMap.get(node)
                if (scopeIds && scopeIds.has(name)) {
                  return
                }
                if (name in scope) {
                  scope[name]++
                } else {
                  scope[name] = 1
                }
                if (!scopeIds) {
                  scopeIds = new Set()
                  scopeMap.set(node, scopeIds)
                }
                scopeIds.add(name)
              }
            }
          })
        )
      } else if (node.type === 'Property' && parent!.type === 'ObjectPattern') {
        // mark property in destructure pattern
        ;(node as any).inPattern = true
      }
    },

    leave(node: Node, parent: Node | null) {
      parent && parentStack.pop()
      const scopeIds = scopeMap.get(node)
      if (scopeIds) {
        scopeIds.forEach((id: string) => {
          scope[id]--
          if (scope[id] === 0) {
            delete scope[id]
          }
        })
      }
    }
  })
}

function isRefIdentifier(id: Identifier, parent: _Node, parentStack: _Node[]) {
  // declaration id
  if (
    (parent.type === 'VariableDeclarator' ||
      parent.type === 'ClassDeclaration') &&
    parent.id === id
  ) {
    return false
  }

  if (isFunction(parent)) {
    // function decalration/expression id
    if ((parent as any).id === id) {
      return false
    }
    // params list
    if (parent.params.includes(id)) {
      return false
    }
  }

  // property key
  // this also covers object destructure pattern
  if (isStaticPropertyKey(id, parent)) {
    return false
  }

  // non-assignment array destructure pattern
  if (
    parent.type === 'ArrayPattern' &&
    !isInDestructureAssignment(parent, parentStack)
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
  node && node.type === 'Property' && !node.computed

const isStaticPropertyKey = (node: _Node, parent: _Node) =>
  isStaticProperty(parent) && parent.key === node

function isFunction(node: _Node): node is FunctionNode {
  return /Function(?:Expression|Declaration)$|Method$/.test(node.type)
}

function isInDestructureAssignment(
  parent: _Node,
  parentStack: _Node[]
): boolean {
  if (
    parent &&
    (parent.type === 'Property' || parent.type === 'ArrayPattern')
  ) {
    let i = parentStack.length
    while (i--) {
      const p = parentStack[i]
      if (p.type === 'AssignmentExpression') {
        return true
      } else if (p.type !== 'Property' && !p.type.endsWith('Pattern')) {
        break
      }
    }
  }
  return false
}
