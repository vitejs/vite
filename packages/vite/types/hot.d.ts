import type {
  ErrorPayload,
  FullReloadPayload,
  PrunePayload,
  UpdatePayload
} from './hmrPayload'

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

  on: {
    (event: 'vite:beforeUpdate', cb: (payload: UpdatePayload) => void): void
    (event: 'vite:beforePrune', cb: (payload: PrunePayload) => void): void
    (
      event: 'vite:beforeFullReload',
      cb: (payload: FullReloadPayload) => void
    ): void
    (event: 'vite:error', cb: (payload: ErrorPayload) => void): void
    (event: string, cb: (data: any) => void): void
  }

  send(event: string, data?: any): void
}

// See https://stackoverflow.com/a/63549561.
export type CustomEventName<T extends string> = (T extends `vite:${T}`
  ? never
  : T) &
  (`vite:${T}` extends T ? never : T)
