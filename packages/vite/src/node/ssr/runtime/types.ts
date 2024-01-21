import type { ViteHotContext } from 'types/hot'
import type { HMRPayload } from 'types/hmrPayload'
import type { HMRConnection, HMRLogger } from '../../../shared/hmr'
import type { ModuleCacheMap } from './moduleCache'
import type {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'

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

export interface HMRRuntimeConnection extends HMRConnection {
  onUpdate(callback: (payload: HMRPayload) => void): void
}

export interface SSRImportMetadata extends DefineImportMetadata {
  isDynamicImport?: boolean
  entrypoint?: boolean
}

export interface ViteRuntimeImportMeta extends ImportMeta {
  url: string
  env: ImportMetaEnv
  hot?: ViteHotContext
  [key: string]: any
}

export interface ViteRuntimeModuleContext {
  [ssrModuleExportsKey]: Record<string, any>
  [ssrImportKey]: (id: string, metadata?: DefineImportMetadata) => Promise<any>
  [ssrDynamicImportKey]: (
    id: string,
    options?: ImportCallOptions,
  ) => Promise<any>
  [ssrExportAllKey]: (obj: any) => void
  [ssrImportMetaKey]: ViteRuntimeImportMeta
}

export interface ViteModuleRunner {
  runViteModule(
    context: ViteRuntimeModuleContext,
    code: string,
    id: string,
    metadata?: SSRImportMetadata,
  ): Promise<any>
  runExternalModule(file: string, metadata?: SSRImportMetadata): Promise<any>
  /**
   * This is called for every "import" (dynamic and static) statement and is not cached
   */
  processImport?(
    exports: Record<string, any>,
    fetchResult: ResolvedResult,
    metadata?: SSRImportMetadata,
  ): Record<string, any>
}

export interface ModuleCache {
  promise?: Promise<any>
  exports?: any
  evaluated?: boolean
  resolving?: boolean
  meta?: FetchResult
  /**
   * Module ids that imports this module
   */
  importers?: Set<string>
  imports?: Set<string>
}

export interface FetchResult {
  id?: string
  code?: string
  file?: string | null
  externalize?: string
  type?: 'module' | 'commonjs' | 'builtin'
}

export interface ResolvedResult extends Omit<FetchResult, 'id'> {
  id: string
}

export type FetchFunction = (
  id: string,
  importer?: string,
) => Promise<FetchResult>

export interface ViteServerClientOptions {
  root: string
  fetchModule: FetchFunction
  environmentVariables?: Record<string, any>
  hmr?:
    | false
    | {
        connection: HMRRuntimeConnection
        logger?: false | HMRLogger
      }
  moduleCache?: ModuleCacheMap
  requestStubs?: Record<string, any>
}

export interface ImportMetaEnv {
  [key: string]: any
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}
