import {
  AsyncFunction,
  getAsyncFunctionDeclarationPaddingLineCount,
} from '../shared/utils'
import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
import type { ModuleEvaluator, ModuleRunnerContext } from './types'

export class ESModulesEvaluator implements ModuleEvaluator {
  public readonly startOffset = getAsyncFunctionDeclarationPaddingLineCount()

  async runInlinedModule(
    context: ModuleRunnerContext,
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

    Object.seal(context[ssrModuleExportsKey])
  }

  runExternalModule(filepath: string): Promise<any> {
    return import(filepath)
  }
}
