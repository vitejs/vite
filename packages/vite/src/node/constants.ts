import path from 'path'

export const SUPPORTED_EXTS = ['.mjs', '.js', '.ts', '.jsx', '.tsx']

export const DEP_CACHE_DIR = `.vite`

/**
 * Prefix for resolved fs paths, since windows paths may not be valid as URLs.
 */
export const FS_PREFIX = `/@fs/`

/**
 * Prefix for resolved Ids that are not valid browser import specifiers
 */
export const VALID_ID_PREFIX = `/@id/`
/**
 * Some Rollup plugins use ids that starts with the null byte \0 to avoid
 * collisions, but it is not permitted in import URLs so we have to replace
 * them.
 */
export const NULL_BYTE_PLACEHOLDER = `__x00__`

export const CLIENT_PUBLIC_PATH = `/@vite/client`
// eslint-disable-next-line
export const CLIENT_ENTRY = require.resolve('vite/dist/client/client.js')
export const CLIENT_DIR = path.dirname(CLIENT_ENTRY)

const knownAssetTypes = [
  // images
  'png',
  'jpe?g',
  'gif',
  'svg',
  'ico',
  'webp',
  'avif',

  // media
  'mp4',
  'webm',
  'ogg',
  'mp3',
  'wav',
  'flac',
  'aac',

  // fonts
  'woff2?',
  'eot',
  'ttf',
  'otf',

  // other
  'wasm'
]

export const DEFAULT_ASSETS_RE = new RegExp(
  `\\.(` + knownAssetTypes.join('|') + `)(\\?.*)?$`
)

export const DEP_VERSION_RE = /[\?&](v=[\w\.-]+)\b/
