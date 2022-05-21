import path, { resolve } from 'path'
import { fileURLToPath } from 'url'
// @ts-expect-error
import { version } from '../../package.json'

export const VERSION = version as string

export const DEFAULT_MAIN_FIELDS = [
  'module',
  'jsnext:main', // moment still uses this...
  'jsnext'
]

export const DEFAULT_EXTENSIONS = [
  '.mjs',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.json'
]

export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/

export const OPTIMIZABLE_ENTRY_RE = /\.(?:m?js|ts)$/

export const SPECIAL_QUERY_RE = /[\?&](?:worker|sharedworker|raw|url)\b/

/**
 * Prefix for resolved fs paths, since windows paths may not be valid as URLs.
 */
export const FS_PREFIX = `/@fs/`

/**
 * Prefix for resolved Ids that are not valid browser import specifiers
 */
export const VALID_ID_PREFIX = `/@id/`

/**
 * Plugins that use 'virtual modules' (e.g. for helper functions), prefix the
 * module ID with `\0`, a convention from the rollup ecosystem.
 * This prevents other plugins from trying to process the id (like node resolution),
 * and core features like sourcemaps can use this info to differentiate between
 * virtual modules and regular files.
 * `\0` is not a permitted char in import URLs so we have to replace them during
 * import analysis. The id will be decoded back before entering the plugins pipeline.
 * These encoded virtual ids are also prefixed by the VALID_ID_PREFIX, so virtual
 * modules in the browser end up encoded as `/@id/__x00__{id}`
 */
export const NULL_BYTE_PLACEHOLDER = `__x00__`

export const CLIENT_PUBLIC_PATH = `/@vite/client`
export const ENV_PUBLIC_PATH = `/@vite/env`
export const VITE_PACKAGE_DIR = resolve(
  fileURLToPath(import.meta.url),
  '../../..'
)

export const CLIENT_ENTRY = resolve(VITE_PACKAGE_DIR, 'dist/client/client.mjs')
export const ENV_ENTRY = resolve(VITE_PACKAGE_DIR, 'dist/client/env.mjs')
export const CLIENT_DIR = path.dirname(CLIENT_ENTRY)

// ** READ THIS ** before editing `KNOWN_ASSET_TYPES`.
//   If you add an asset to `KNOWN_ASSET_TYPES`, make sure to also add it
//   to the TypeScript declaration file `packages/vite/client.d.ts`.
export const KNOWN_ASSET_TYPES = [
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
  'webmanifest',
  'pdf',
  'txt'
]

export const DEFAULT_ASSETS_RE = new RegExp(
  `\\.(` + KNOWN_ASSET_TYPES.join('|') + `)(\\?.*)?$`
)

export const DEP_VERSION_RE = /[\?&](v=[\w\.-]+)\b/
