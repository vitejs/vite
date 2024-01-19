// this file should re-export only things that don't rely on Node.js or other runtime features

export { ModuleCacheMap } from './moduleCache'
export { ViteRuntime } from './runtime'
export { ESModulesRunner } from './esmRunner'

export { handleHMRUpdate, createHMRHandler } from './hmrHandler'

export type { HMRLogger } from '../../../shared/hmr'
export type {
  ViteModuleRunner,
  ViteRuntimeModuleContext,
  ModuleCache,
  FetchResult,
  FetchFunction,
  ViteServerClientOptions,
} from './types'
export {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
