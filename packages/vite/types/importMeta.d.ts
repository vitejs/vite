import type { CustomEventName } from './customEvent'
import type {
  ErrorPayload,
  FullReloadPayload,
  PrunePayload,
  UpdatePayload
} from './hmrPayload'

interface ImportMeta {
  url: string

  readonly hot?: {
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
      <T extends string>(
        event: CustomEventName<T>,
        cb: (data: any) => void
      ): void
    }
  }

  readonly env: ImportMetaEnv

  glob(pattern: string): Record<
    string,
    () => Promise<{
      [key: string]: any
    }>
  >

  globEager(pattern: string): Record<
    string,
    {
      [key: string]: any
    }
  >
}

interface ImportMetaEnv {
  [key: string]: string | boolean | undefined
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}
