import type {
  ImportMeta as ViteImportMeta,
  ImportMetaEnv as ViteImportMetaEnv
  // eslint-disable-next-line node/no-missing-import -- use .js for `moduleResolution: "nodenext"`
} from './client/types.js'

declare global {
  interface ImportMeta extends ViteImportMeta {}
  interface ImportMetaEnv extends ViteImportMetaEnv {}
}
