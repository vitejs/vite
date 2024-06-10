export interface DefineImportMetadata {
  /**
   * Imported names before being transformed to `ssrImportKey`
   *
   * import foo, { bar as baz, qux } from 'hello'
   * => ['default', 'bar', 'qux']
   *
   * import * as namespace from 'world
   * => undefined
   */
  importedNames?: string[]
}

export interface SSRImportBaseMetadata extends DefineImportMetadata {
  isDynamicImport?: boolean
}

/**
 * Vite converts `import { } from 'foo'` to `const _ = __vite_ssr_import__('foo')`.
 * Top-level imports and dynamic imports work slightly differently in Node.js.
 * This function normalizes the differences so it matches prod behaviour.
 */
export function analyzeImportedModDifference(
  mod: any,
  rawId: string,
  moduleType: string | undefined,
  metadata?: SSRImportBaseMetadata,
): void {
  // No normalization needed if the user already dynamic imports this module
  if (metadata?.isDynamicImport) return

  // If the user named imports a specifier that can't be analyzed, error.
  // If the module doesn't import anything explicitly, e.g. `import 'foo'` or
  // `import * as foo from 'foo'`, we can skip.
  if (metadata?.importedNames?.length) {
    const missingBindings = metadata.importedNames.filter((s) => !(s in mod))
    if (missingBindings.length) {
      const lastBinding = missingBindings[missingBindings.length - 1]

      // For invalid named exports only, similar to how Node.js errors for top-level imports.
      // But since we transform as dynamic imports, we need to emulate the error manually.
      if (moduleType === 'module') {
        throw new SyntaxError(
          `[vite] The requested module '${rawId}' does not provide an export named '${lastBinding}'`,
        )
      } else {
        // For non-ESM, named imports is done via static analysis with cjs-module-lexer in Node.js.
        // Copied from Node.js
        throw new SyntaxError(`\
[vite] Named export '${lastBinding}' not found. The requested module '${rawId}' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from '${rawId}';
const {${missingBindings.join(', ')}} = pkg;
`)
      }
    }
  }
}
