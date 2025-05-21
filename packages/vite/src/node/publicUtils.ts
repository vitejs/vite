// TODO: move contents of this file to src/node/index.ts
export {
  VERSION as version,
  DEFAULT_CLIENT_CONDITIONS as defaultClientConditions,
  DEFAULT_CLIENT_MAIN_FIELDS as defaultClientMainFields,
  DEFAULT_SERVER_CONDITIONS as defaultServerConditions,
  DEFAULT_SERVER_MAIN_FIELDS as defaultServerMainFields,
  defaultAllowedOrigins,
} from './constants'
export { version as esbuildVersion } from 'esbuild'
export {
  normalizePath,
  mergeConfig,
  mergeAlias,
  createFilter,
  isCSSRequest,
  rollupVersion,
} from './utils'
export { perEnvironmentPlugin } from './plugin'
export { perEnvironmentState } from './environment'
export { send } from './server/send'
export { createLogger } from './logger'
export { searchForWorkspaceRoot } from './server/searchRoot'

export {
  isFileServingAllowed,
  isFileLoadingAllowed,
} from './server/middlewares/static'
export { loadEnv, resolveEnvPrefix } from './env'
