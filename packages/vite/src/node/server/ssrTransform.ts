import MagicString from 'magic-string'
import { SourceMap } from 'rollup'
import { TransformResult } from './transformRequest'
import { parser } from './pluginContainer'
import { Node as _Node } from 'estree'

type Node = _Node & {
  start: number
  end: number
}

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

  for (const node of ast.body as Node[]) {
    // import foo from 'foo' --> foo -> __import_foo__.default
    // import { baz } from 'foo' --> baz -> __import_foo__.baz
    // import * as ok from 'foo' --> ok -> __import_foo__
    if (node.type === 'ImportDeclaration') {
      const importId = `__vite_import_${uid++}__`
      deps.add(node.source.value as string)
      s.appendLeft(
        node.start,
        `const ${importId} = __import__(${JSON.stringify(node.source.value)})\n`
      )
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          s.appendLeft(
            node.start,
            `const ${spec.local.name} = ${importId}.${spec.imported.name}\n`
          )
        } else if (spec.type === 'ImportDefaultSpecifier') {
          s.appendLeft(
            node.start,
            `const ${spec.local.name} = ${importId}.default\n`
          )
        }
      }
      s.remove(node.start, node.end)
    }
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (node.declaration.type === 'FunctionDeclaration') {
          s.overwrite(
            node.start,
            node.start + 7,
            `__exports__.${node.declaration.id!.name} = `
          )
        }
        // TODO Class / Var
      } else {
        for (const spec of node.specifiers) {
          s.append(`\n__exports__.${spec.exported.name} = ${spec.local.name}`)
        }
        s.remove(node.start, node.end)
      }
    }
    if (node.type === 'ExportDefaultDeclaration') {
      s.overwrite(node.start, node.start + 14, '__exports__.default =')
    }
    if (node.type === 'ExportAllDeclaration') {
    }
  }

  return {
    code: s.toString(),
    // TODO handle inMap
    map: s.generateMap({ hires: true }),
    deps: [...deps]
  }
}
