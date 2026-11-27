export interface FetchFunctionOptions {
  cached?: boolean
  startOffset?: number
  /**
   * Return the source map in `sourceMap` instead of inlining it in `code`
   * when the environment's `dev.sourcemapForDebugger` is disabled. Servers
   * that don't support this option ignore it and inline the map.
   */
  separateSourceMap?: boolean
}

export type FetchResult =
  | CachedFetchResult
  | ExternalFetchResult
  | ViteFetchResult

export interface CachedFetchResult {
  /**
   * If the module is cached in the runner, this confirms
   * it was not invalidated on the server side.
   */
  cache: true
}

export interface ExternalFetchResult {
  /**
   * The path to the externalized module starting with file://.
   * By default this will be imported via a dynamic "import"
   * instead of being transformed by Vite and loaded with the Vite runner.
   */
  externalize: string
  /**
   * Type of the module. Used to determine if the import statement is correct.
   * For example, if Vite needs to throw an error if a variable is not actually exported.
   */
  type: 'module' | 'commonjs' | 'builtin' | 'network'
}

export interface ViteFetchResult {
  /**
   * Code that will be evaluated by the Vite runner.
   * By default this will be wrapped in an async function.
   */
  code: string
  /**
   * File path of the module on disk.
   * This will be resolved as import.meta.url/filename.
   * Will be `null` for virtual modules.
   */
  file: string | null
  /**
   * Module ID in the server module graph.
   */
  id: string
  /**
   * Module URL used in the import.
   */
  url: string
  /**
   * Invalidate module on the client side.
   */
  invalidate: boolean
  /**
   * Original entry module ID in Rolldown's runtime.
   * Used to retrieve updated exports after HMR.
   * @experimental
   */
  rolldownModuleId?: string
  /**
   * Source map of `code` as a JSON string. Set when the runner asked for
   * `separateSourceMap` and the environment's `dev.sourcemapForDebugger` is
   * disabled, in which case `code` has no inline source map.
   */
  sourceMap?: string
}

export type InvokeSendData<
  T extends keyof InvokeMethods = keyof InvokeMethods,
> = {
  name: T
  /** 'send' is for requests without an id */
  id: 'send' | `send:${string}`
  data: Parameters<InvokeMethods[T]>
}

export type InvokeResponseData<
  T extends keyof InvokeMethods = keyof InvokeMethods,
> = {
  name: T
  /** 'response' is for responses without an id */
  id: 'response' | `response:${string}`
  data:
    | { result: Awaited<ReturnType<InvokeMethods[T]>>; error?: undefined }
    | { result?: undefined; error: any }
}

export type InvokeMethods = {
  fetchModule: (
    id: string,
    importer?: string,
    options?: FetchFunctionOptions,
  ) => Promise<FetchResult>

  getBuiltins: () => Promise<
    Array<
      | { type: 'string'; value: string }
      | { type: 'RegExp'; source: string; flags: string }
    >
  >

  resetBundledDevClient: (
    oldClientId: string,
    newClientId: string,
  ) => Promise<void>
}
