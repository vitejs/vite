import { Node } from '@babel/core'
import t = require('@babel/types')

export function isDefineComponentCall(node?: Node | null) {
  return (
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee) &&
    node.callee.name === 'defineComponent'
  )
}

export function parseComponentDecls(node: t.VariableDeclaration) {
  const names = []
  for (const decl of node.declarations) {
    if (t.isIdentifier(decl.id) && isDefineComponentCall(decl.init)) {
      names.push({
        name: decl.id.name
      })
    }
  }

  return names
}
