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
import type { DecodedMap } from './sourcemap/decoder'
import type { InterceptorOptions } from './sourcemap/interceptor'

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
  /**
   * Configure how HMR is handled when this connection triggers an update.
   * This method expects that connection will start listening for HMR updates and call this callback when it's received.
   */
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
  /**
   * Run code that was transformed by Vite.
   * @param context Function context
   * @param code Transformed code
   * @param id ID that was used to fetch the module
   */
  runViteModule(
    context: ViteRuntimeModuleContext,
    code: string,
    id: string,
  ): Promise<any>
  /**
   * Run externalized module.
   * @param file File URL to the external module
   */
  runExternalModule(file: string): Promise<any>
}

export interface ModuleCache {
  promise?: Promise<any>
  exports?: any
  evaluated?: boolean
  map?: DecodedMap
  meta?: FetchResult
  /**
   * Module ids that imports this module
   */
  importers?: Set<string>
  imports?: Set<string>
}

export type FetchResult = ExternalFetchResult | ViteFetchResult

export interface ExternalFetchResult {
  /**
   * The path to the externalized module starting with file://,
   * by default this will be imported via a dynamic "import"
   * instead of being transformed by vite and loaded with vite runtime
   */
  externalize: string
  /**
   * Type of the module. Will be used to determine if import statement is correct.
   * For example, if Vite needs to throw an error if variable is not actually exported
   */
  type?: 'module' | 'commonjs' | 'builtin' | 'network'
}

export interface ViteFetchResult {
  /**
   * Code that will be evaluated by vite runtime
   * by default this will be wrapped in an async function
   */
  code: string
  /**
   * File path of the module on disk.
   * This will be resolved as import.meta.url/filename
   */
  file: string | null
}

export type ResolvedResult = (ExternalFetchResult | ViteFetchResult) & {
  id: string
}

/**
 * @experimental
 */
export type FetchFunction = (
  id: string,
  importer?: string,
) => Promise<FetchResult>

export interface ViteRuntimeOptions {
  /**
   * Root of the project
   */
  root: string
  /**
   * A method to get the information about the module.
   * For SSR, Vite exposes `server.ssrFetchModule` function that you can use here.
   * For other runtime use cases, Vite also exposes `fetchModule` from its main entry point.
   */
  fetchModule: FetchFunction
  /**
   * Custom environment variables available on `import.meta.env`. This doesn't modify the actual `process.env`.
   */
  environmentVariables?: Record<string, any>
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
  hmr?:
    | false
    | {
        /**
         * Configure how HMR communicates between the client and the server.
         */
        connection: HMRRuntimeConnection
        /**
         * Configure HMR logger.
         */
        logger?: false | HMRLogger
      }
  /**
   * Custom module cache. If not provided, creates a separate module cache for each ViteRuntime instance.
   */
  moduleCache?: ModuleCacheMap
}

export interface ImportMetaEnv {
  [key: string]: any
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}
