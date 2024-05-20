/**
 * Exported sync utils should go here.
 * This file will be bundled to ESM and CJS and redirected by ../index.cjs
 * Please control the side-effects by checking the ./dist/node-cjs/publicUtils.cjs bundle
 */
export { VERSION as version } from './constants'
export { version as esbuildVersion } from 'esbuild'
export {
  splitVendorChunkPlugin,
  splitVendorChunk,
  isCSSRequest,
} from './plugins/splitVendorChunk'
export {
  normalizePath,
  mergeConfig,
  mergeAlias,
  createFilter,
  rollupVersion,
} from './utils'
export { send } from './server/send'
export { createLogger } from './logger'
export { searchForWorkspaceRoot } from './server/searchRoot'

export {
  isFileServingAllowed,
  isFileLoadingAllowed,
} from './server/middlewares/static'
export { loadEnv, resolveEnvPrefix } from './env'
