import type { InferCustomEventPayload } from './customEvent'

export interface ViteHotContext {
  readonly data: any

  accept(): void
  accept(cb: (mod: any) => void): void
  accept(dep: string, cb: (mod: any) => void): void
  accept(deps: readonly string[], cb: (mods: any[]) => void): void

  /**
   * @deprecated
   */
  acceptDeps(): never

  dispose(cb: (data: any) => void): void
  decline(): void
  invalidate(): void

  on<T extends string>(
    event: T,
    cb: (payload: InferCustomEventPayload<T>) => void
  ): void
  send<T extends string>(event: T, data?: InferCustomEventPayload<T>): void
}
