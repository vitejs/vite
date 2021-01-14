import MagicString from 'magic-string'
import { SourceMap } from 'rollup'
import { TransformResult } from './transformRequest'
import { parser } from './pluginContainer'
import { Node } from 'estree'

export async function transformForSSR(
  code: string,
  map: SourceMap | null
): Promise<TransformResult | null> {
  const s = new MagicString(code)

  const ast = parser.parse(code, {
    sourceType: 'module',
    ecmaVersion: 2020,
    locations: true
  }) as any

  for (const node of ast.body as Node[]) {
    // import foo from 'foo' --> foo -> __import_foo__.default
    // import { baz } from 'foo' --> baz -> __import_foo__.baz
    // import * as ok from 'foo' --> ok -> __import_foo__
    if (node.type === 'ImportDeclaration') {
      if (node.specifiers.length) {
      }
    }
    if (node.type === 'ExportNamedDeclaration') {
    }
    if (node.type === 'ExportDefaultDeclaration') {
    }
    if (node.type === 'ExportAllDeclaration') {
    }
  }

  return {
    code,
    map
  }
}
