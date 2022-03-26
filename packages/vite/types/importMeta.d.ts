// This file is an augmentation to the built-in ImportMeta interface
// Thus cannot contain any top-level imports
// <https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation>

/* eslint-disable @typescript-eslint/consistent-type-imports */

// Duplicate of import('../src/node/importGlob').GlobOptions in order to
// avoid breaking the production client type. Because this file is referenced
// in vite/client.d.ts and in production src/node/importGlob.ts doesn't exist.
interface GlobOptions {
  as?: string
  /**
   * @deprecated
   */
  assert?: {
    type: string
  }
}

interface ImportMeta {
  url: string

  readonly hot?: import('./hot').ViteHotContext

  readonly env: ImportMetaEnv

  glob<Module = { [key: string]: any }>(
    pattern: string,
    options?: GlobOptions
  ): Record<string, () => Promise<Module>>

  globEager<Module = { [key: string]: any }>(
    pattern: string,
    options?: GlobOptions
  ): Record<string, Module>
}

interface ImportMetaEnv {
  [key: string]: string | boolean | undefined
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}
