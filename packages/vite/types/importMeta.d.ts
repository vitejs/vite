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
      (
        event: 'vite:beforeUpdate',
        cb: (payload: import('./hmrPayload').UpdatePayload) => void
      ): void
      (
        event: 'vite:beforePrune',
        cb: (payload: import('./hmrPayload').PrunePayload) => void
      ): void
      (
        event: 'vite:beforeFullReload',
        cb: (payload: import('./hmrPayload').FullReloadPayload) => void
      ): void
      (
        event: 'vite:error',
        cb: (payload: import('./hmrPayload').ErrorPayload) => void
      ): void
      <T extends string>(
        event: import('./customEvent').CustomEventName<T>,
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
