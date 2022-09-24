import type { ViteHotContext } from './hot'
import type { ImportGlobEagerFunction, ImportGlobFunction } from './importGlob'

export interface ImportMetaEnv {
  [key: string]: any
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}

export interface ImportMeta {
  url: string

  readonly hot?: ViteHotContext

  readonly env: ImportMetaEnv

  glob: ImportGlobFunction
  /**
   * @deprecated Use `import.meta.glob('*', { eager: true })` instead
   */
  globEager: ImportGlobEagerFunction
}
