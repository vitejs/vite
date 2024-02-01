// this file should re-export only things that don't rely on Node.js or other runtime features

export { ModuleCacheMap } from './moduleCache'
export { ViteRuntime } from './runtime'
export { ESModulesRunner } from './esmRunner'

export type { HMRLogger, HMRConnection } from '../../../shared/hmr'
export type {
  ViteModuleRunner,
  ViteRuntimeModuleContext,
  ModuleCache,
  FetchResult,
  FetchFunction,
  ResolvedResult,
  SSRImportMetadata,
  HMRRuntimeConnection,
  ViteRuntimeImportMeta,
  ViteRuntimeOptions,
} from './types'
export {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
