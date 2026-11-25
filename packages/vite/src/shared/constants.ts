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

export let SOURCEMAPPING_URL = 'sourceMa'
SOURCEMAPPING_URL += 'ppingURL'

export const MODULE_RUNNER_SOURCEMAPPING_SOURCE =
  '//# sourceMappingSource=vite-generated'

export const ERR_OUTDATED_OPTIMIZED_DEP = 'ERR_OUTDATED_OPTIMIZED_DEP'

/**
 * Full bundle mode serves HMR patches at this path next to the output files,
 * so the relative imports in a patch resolve like those in the output chunks.
 */
export const BUNDLED_DEV_HMR_PATCH_FILENAME = '__rolldown_hmr_patch.js'

/**
 * Full bundle mode serves the sourcemap of a patch or lazy chunk at this path
 * plus an id and `.map`. The path is next to the output files, because the
 * map names its sources relative to the output dir.
 */
export const BUNDLED_DEV_PAYLOAD_MAP_PREFIX = '__rolldown_payload_map_'

/**
 * Full bundle mode puts the HMR generation of the output in the HTML it
 * serves, in a meta tag of this name. The output code does not carry it.
 */
export const BUNDLED_DEV_GENERATION_META_NAME = 'vite-bundled-dev-generation'
