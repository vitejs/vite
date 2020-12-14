import path from 'path'

/**
 * Prefix for resolved fs paths, since windows paths may not be valid as URLs.
 */
export const FILE_PREFIX = `/@fs/`
export const CLIENT_PUBLIC_PATH = '/@vite/client'
// eslint-disable-next-line
export const CLIENT_ENTRY = require.resolve('vite/dist/client/client.js')
export const CLIENT_DIR = path.dirname(CLIENT_ENTRY)
