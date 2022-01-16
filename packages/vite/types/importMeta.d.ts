// This file is an augmentation to the built-in ImportMeta interface
// Thus cannot contain any top-level imports
// <https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation>

/* eslint-disable @typescript-eslint/consistent-type-imports */

// Duplicate import('../src/node/importGlob').AssertOptions
// Avoid breaking the production client type because this file is referenced
// in vite/client.d.ts and in production src/node/importGlob.ts doesn't exist
interface AssertOptions {
  assert?: {
    type: string
  }
}

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

  glob(
    pattern: string,
    options?: AssertOptions
  ): Record<
    string,
    () => Promise<{
      [key: string]: any
    }>
  >

  globEager(
    pattern: string,
    options?: AssertOptions
  ): Record<
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
