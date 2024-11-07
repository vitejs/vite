import type { ViteHotContext } from 'types/hot'
import type { HMRLogger } from '../shared/hmr'
import type {
  DefineImportMetadata,
  SSRImportMetadata,
} from '../shared/ssrTransform'
import type {
  ExternalFetchResult,
  FetchFunctionOptions,
  FetchResult,
  ViteFetchResult,
} from '../shared/invokeMethods'
import type { ModuleRunnerTransport } from '../shared/moduleRunnerTransport'
import type { EvaluatedModuleNode, EvaluatedModules } from './evaluatedModules'
import type {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
import type { InterceptorOptions } from './sourcemap/interceptor'

export type { DefineImportMetadata, SSRImportMetadata }

export interface ModuleRunnerImportMeta extends ImportMeta {
  url: string
  env: ImportMetaEnv
  hot?: ViteHotContext
  [key: string]: any
}

export interface ModuleRunnerContext {
  [ssrModuleExportsKey]: Record<string, any>
  [ssrImportKey]: (id: string, metadata?: DefineImportMetadata) => Promise<any>
  [ssrDynamicImportKey]: (
    id: string,
    options?: ImportCallOptions,
  ) => Promise<any>
  [ssrExportAllKey]: (obj: any) => void
  [ssrImportMetaKey]: ModuleRunnerImportMeta
}

export interface ModuleEvaluator {
  /**
   * Number of prefixed lines in the transformed code.
   */
  startOffset?: number
  /**
   * Run code that was transformed by Vite.
   * @param context Function context
   * @param code Transformed code
   * @param module The module node
   */
  runInlinedModule(
    context: ModuleRunnerContext,
    code: string,
    module: Readonly<EvaluatedModuleNode>,
  ): Promise<any>
  /**
   * Run externalized module.
   * @param file File URL to the external module
   */
  runExternalModule(file: string): Promise<any>
}

export type ResolvedResult = (ExternalFetchResult | ViteFetchResult) & {
  url: string
  id: string
}

export type FetchFunction = (
  id: string,
  importer?: string,
  options?: FetchFunctionOptions,
) => Promise<FetchResult>

export interface ModuleRunnerHmr {
  /**
   * Configure HMR logger.
   */
  logger?: false | HMRLogger
}

export interface ModuleRunnerOptions {
  /**
   * Root of the project
   */
  root: string
  /**
   * A set of methods to communicate with the server.
   */
  transport: ModuleRunnerTransport
  /**
   * Configure how source maps are resolved. Prefers `node` if `process.setSourceMapsEnabled` is available.
   * Otherwise it will use `prepareStackTrace` by default which overrides `Error.prepareStackTrace` method.
   * You can provide an object to configure how file contents and source maps are resolved for files that were not processed by Vite.
   */
  sourcemapInterceptor?:
    | false
    | 'node'
    | 'prepareStackTrace'
    | InterceptorOptions
  /**
   * Disable HMR or configure HMR options.
   */
  hmr?: boolean | ModuleRunnerHmr
  /**
   * Custom module cache. If not provided, creates a separate module cache for each ModuleRunner instance.
   */
  evaluatedModules?: EvaluatedModules
}

export interface ImportMetaEnv {
  [key: string]: any
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}
