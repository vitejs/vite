// extend the descriptor so we can store the scopeId on it
declare module 'vue/compiler-sfc' {
  interface SFCDescriptor {
    id: string
  }
}

import type * as _compiler from 'vue/compiler-sfc'

export function resolveCompiler(root: string): typeof _compiler {
  // resolve from project root first, then fallback to peer dep (if any)
  const compiler =
    tryRequire('vue/compiler-sfc', root) || tryRequire('vue/compiler-sfc')

  if (!compiler) {
    throw new Error(
      `Failed to resolve vue/compiler-sfc.\n` +
        `@vitejs/plugin-vue requires vue (>=3.2.25) ` +
        `to be present in the dependency tree.`
    )
  }

  return compiler
}

function tryRequire(id: string, from?: string) {
  try {
    return from ? require(require.resolve(id, { paths: [from] })) : require(id)
  } catch (e) {}
}
