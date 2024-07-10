import type { Update } from 'types/hmrPayload'
import type { ModuleNamespace, ViteHotContext } from 'types/hot'
import type { InferCustomEventPayload } from 'types/customEvent'
type CustomListenersMap = Map<string, ((data: any) => void)[]>
interface HotModule {
  id: string
  callbacks: HotCallback[]
}
interface HotCallback {
  deps: string[]
  fn: (modules: Array<ModuleNamespace | undefined>) => void
}
export interface HMRLogger {
  error(msg: string | Error): void
  debug(...msg: unknown[]): void
}
export interface HMRConnection {
  /**
   * Checked before sending messages to the client.
   */
  isReady(): boolean
  /**
   * Send message to the client.
   */
  send(messages: string): void
}
export declare class HMRContext implements ViteHotContext {
  private hmrClient
  private ownerPath
  private newListeners
  constructor(hmrClient: HMRClient, ownerPath: string)
  get data(): any
  accept(deps?: any, callback?: any): void
  acceptExports(
    _: string | readonly string[],
    callback: (data: any) => void,
  ): void
  dispose(cb: (data: any) => void): void
  prune(cb: (data: any) => void): void
  decline(): void
  invalidate(message: string): void
  on<T extends string>(
    event: T,
    cb: (payload: InferCustomEventPayload<T>) => void,
  ): void
  off<T extends string>(
    event: T,
    cb: (payload: InferCustomEventPayload<T>) => void,
  ): void
  send<T extends string>(event: T, data?: InferCustomEventPayload<T>): void
  private acceptDeps
}
declare class HMRMessenger {
  private connection
  constructor(connection: HMRConnection)
  private queue
  send(message: string): void
  flush(): void
}
export declare class HMRClient {
  logger: HMRLogger
  private importUpdatedModule
  hotModulesMap: Map<string, HotModule>
  disposeMap: Map<string, (data: any) => void | Promise<void>>
  pruneMap: Map<string, (data: any) => void | Promise<void>>
  dataMap: Map<string, any>
  customListenersMap: CustomListenersMap
  ctxToListenersMap: Map<string, CustomListenersMap>
  messenger: HMRMessenger
  constructor(
    logger: HMRLogger,
    connection: HMRConnection,
    importUpdatedModule: (update: Update) => Promise<ModuleNamespace>,
  )
  notifyListeners<T extends string>(
    event: T,
    data: InferCustomEventPayload<T>,
  ): Promise<void>
  clear(): void
  prunePaths(paths: string[]): Promise<void>
  protected warnFailedUpdate(err: Error, path: string | string[]): void
  private updateQueue
  private pendingUpdateQueue
  /**
   * buffer multiple hot updates triggered by the same src change
   * so that they are invoked in the same order they were sent.
   * (otherwise the order may be inconsistent because of the http request round trip)
   */
  queueUpdate(payload: Update): Promise<void>
  private fetchUpdate
}
export {}
