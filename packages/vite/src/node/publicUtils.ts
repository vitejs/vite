/**
 * Exported sync utils should go here.
 * This file will be bundled to ESM and CJS and redirected by ../index.cjs
 * Please control the side-effects by checking the ./dist/node-cjs/publicUtils.cjs bundle
 */
export { VERSION as version } from './constants'
export {
  splitVendorChunkPlugin,
  splitVendorChunk
} from './plugins/splitVendorChunk'
export { normalizePath, mergeConfig, mergeAlias } from './utils'
export { send } from './server/send'
export { createLogger } from './logger'
export { searchForWorkspaceRoot } from './server/searchRoot'
export { loadEnv, resolveEnvPrefix } from './env'
