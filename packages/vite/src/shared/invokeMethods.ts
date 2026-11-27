export interface FetchFunctionOptions {
  cached?: boolean
  startOffset?: number
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
   * External import specifier: a file URL, network/data URL, or builtin ID.
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
   * File path or virtual ModuleID used for import.meta.url/filename.
   * The server derives this from the resolved ModuleID without query/hash.
   * If null, the runner falls back to id.
   */
  file: string | null
  /**
   * Resolved ModuleID in the server module graph.
   */
  id: string
  /**
   * Module URL of the module.
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
    moduleRunnerUrl: string,
    importerId?: string,
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
