import type { InferCustomEventPayload } from './customEvent'

export type ModuleNamespace = Record<string, any> & {
  [Symbol.toStringTag]: 'Module'
}

export interface ViteHotContext {
  readonly data: any

  accept(): void
  accept(cb: (mod: ModuleNamespace | undefined) => void): void
  accept(dep: string, cb: (mod: ModuleNamespace | undefined) => void): void
  accept(
    deps: readonly string[],
    cb: (mods: Array<ModuleNamespace | undefined>) => void
  ): void

  acceptExports(exportNames: string | readonly string[]): void
  acceptExports(
    exportNames: string | readonly string[],
    cb: (mod: ModuleNamespace | undefined) => void
  ): void

  dispose(cb: (data: any) => void): void
  decline(): void
  invalidate(): void

  on<T extends string>(
    event: T,
    cb: (payload: InferCustomEventPayload<T>) => void
  ): void
  send<T extends string>(event: T, data?: InferCustomEventPayload<T>): void
}
