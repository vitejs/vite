import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
import type {
  ResolvedResult,
  SSRImportMetadata,
  ViteModuleRunner,
  ViteRuntimeModuleContext,
} from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = async function () {}.constructor as typeof Function

export class ESModulesRunner implements ViteModuleRunner {
  async runViteModule(
    context: ViteRuntimeModuleContext,
    code: string,
  ): Promise<any> {
    // use AsyncFunction instead of vm module to support broader array of environments out of the box
    const initModule = new AsyncFunction(
      ssrModuleExportsKey,
      ssrImportMetaKey,
      ssrImportKey,
      ssrDynamicImportKey,
      ssrExportAllKey,
      // source map should already be inlined by Vite
      '"use strict";' + code,
    )

    await initModule(
      context[ssrModuleExportsKey],
      context[ssrImportMetaKey],
      context[ssrImportKey],
      context[ssrDynamicImportKey],
      context[ssrExportAllKey],
    )

    Object.freeze(context[ssrModuleExportsKey])
  }

  runExternalModule(filepath: string): Promise<any> {
    return import(filepath)
  }

  processImport(
    mod: Record<string, any>,
    fetchResult: ResolvedResult,
    metadata?: SSRImportMetadata | undefined,
  ): Record<string, any> {
    if (!fetchResult.externalize) {
      return mod
    }
    const { id, type } = fetchResult
    if (type === 'builtin') return mod
    analyzeImportedModDifference(mod, id, type, metadata)
    return proxyGuardOnlyEsm(mod, id, metadata)
  }
}

/**
 * Vite converts `import { } from 'foo'` to `const _ = __vite_ssr_import__('foo')`.
 * Top-level imports and dynamic imports work slightly differently in Node.js.
 * This function normalizes the differences so it matches prod behaviour.
 */
function analyzeImportedModDifference(
  mod: any,
  rawId: string,
  moduleType: string | undefined,
  metadata?: SSRImportMetadata,
) {
  // No normalization needed if the user already dynamic imports this module
  if (metadata?.isDynamicImport) return
  // If file path is ESM, everything should be fine
  if (moduleType === 'module') return

  // For non-ESM, named imports is done via static analysis with cjs-module-lexer in Node.js.
  // If the user named imports a specifier that can't be analyzed, error.
  if (metadata?.importedNames?.length) {
    const missingBindings = metadata.importedNames.filter((s) => !(s in mod))
    if (missingBindings.length) {
      const lastBinding = missingBindings[missingBindings.length - 1]
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

/**
 * Guard invalid named exports only, similar to how Node.js errors for top-level imports.
 * But since we transform as dynamic imports, we need to emulate the error manually.
 */
function proxyGuardOnlyEsm(
  mod: any,
  rawId: string,
  metadata?: SSRImportMetadata,
) {
  // If the module doesn't import anything explicitly, e.g. `import 'foo'` or
  // `import * as foo from 'foo'`, we can skip the proxy guard.
  if (!metadata?.importedNames?.length) return mod

  return new Proxy(mod, {
    get(mod, prop) {
      if (prop !== 'then' && !(prop in mod)) {
        throw new SyntaxError(
          `[vite] The requested module '${rawId}' does not provide an export named '${prop.toString()}'`,
        )
      }
      return mod[prop]
    },
  })
}
