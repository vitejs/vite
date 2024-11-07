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
   * If module cached in the runner, we can just confirm
   * it wasn't invalidated on the server side.
   */
  cache: true
}

export interface ExternalFetchResult {
  /**
   * The path to the externalized module starting with file://,
   * by default this will be imported via a dynamic "import"
   * instead of being transformed by vite and loaded with vite runner
   */
  externalize: string
  /**
   * Type of the module. Will be used to determine if import statement is correct.
   * For example, if Vite needs to throw an error if variable is not actually exported
   */
  type: 'module' | 'commonjs' | 'builtin' | 'network'
}

export interface ViteFetchResult {
  /**
   * Code that will be evaluated by vite runner
   * by default this will be wrapped in an async function
   */
  code: string
  /**
   * File path of the module on disk.
   * This will be resolved as import.meta.url/filename
   * Will be equal to `null` for virtual modules
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
    | { r: Awaited<ReturnType<InvokeMethods[T]>>; e?: undefined }
    | { r?: undefined; e: any }
}

export type InvokeMethods = {
  fetchModule: (
    id: string,
    importer?: string,
    options?: FetchFunctionOptions,
  ) => Promise<FetchResult>
}
