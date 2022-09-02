import type {
  ImportMeta as ViteImportMeta,
  ImportMetaEnv as ViteImportMetaEnv
} from '../client/types'

declare global {
  interface GlobOptions {
    as?: string
  }

  interface ImportMeta extends ViteImportMeta {}
  interface ImportMetaEnv extends ViteImportMetaEnv {}
}
