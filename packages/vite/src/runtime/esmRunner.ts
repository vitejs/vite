import { AsyncFunction } from '../shared/utils'
import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
import type { ViteModuleRunner, ViteRuntimeModuleContext } from './types'

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

    Object.seal(context[ssrModuleExportsKey])
  }

  runExternalModule(filepath: string): Promise<any> {
    return import(filepath)
  }
}
