import type * as babelCore from '@babel/core'

/**
 * Replace this:
 *
 *     import { jsx as _jsx } from "react/jsx-runtime"
 *
 * with this:
 *
 *     var _jsx = require("react/jsx-runtime").jsx
 */
export function babelImportToRequire({ types: t }: typeof babelCore): {
  visitor: babelCore.Visitor
} {
  return {
    visitor: {
      ImportDeclaration(path) {
        const decl = path.node
        const spec = decl.specifiers[0] as babelCore.types.ImportSpecifier

        path.replaceWith(
          t.variableDeclaration('var', [
            t.variableDeclarator(
              spec.local,
              t.memberExpression(
                t.callExpression(t.identifier('require'), [decl.source]),
                spec.imported
              )
            )
          ])
        )
      }
    }
  }
}
