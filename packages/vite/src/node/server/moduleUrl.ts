import fs from 'node:fs'
import path from 'node:path'
import { cleanUrl, unwrapId, withTrailingSlash } from '../../shared/utils'
import { FS_PREFIX } from '../constants'
import { fsPathFromId, normalizePath, stripBase } from '../utils'
import type { DevEnvironment } from './environment'

/** Map a normalized filesystem path to a ModuleURL. */
export function fileToModuleUrl(file: string, root: string): string {
  if (file === root) {
    return '/'
  }
  const rootWithSlash = withTrailingSlash(root)
  // file within root, create root-relative url
  if (file.startsWith(rootWithSlash)) {
    return '/' + file.slice(rootWithSlash.length)
  }
  // out of root, use /@fs/ prefix
  return path.posix.join(FS_PREFIX, file)
}

export function moduleUrlToFilePath(pathname: string, root: string): string {
  return pathname.startsWith(FS_PREFIX)
    ? fsPathFromId(pathname)
    : normalizePath(path.resolve(root, `.${pathname}`))
}

/**
 * Choose a ModuleURL for a resolved module. ModuleURLs have no base and keep
 * virtual IDs unwrapped, matching module graph and HMR identities.
 * This does not resolve the ID.
 *
 * e.g. `/project/src/main.js` -> `/src/main.js` for root `/project`.
 */
export function resolvedIdToModuleUrl(
  environment: DevEnvironment,
  id: string,
): string {
  const { root } = environment.config
  if (id.startsWith(withTrailingSlash(root))) {
    return fileToModuleUrl(id, root)
  }
  if (
    environment.depsOptimizer?.isOptimizedDepFile(id) ||
    // vite-plugin-react isn't following the leading \0 virtual module convention.
    // This is a temporary hack to avoid expensive fs checks for React apps.
    // We'll remove this as soon we're able to fix the react plugins.
    (id !== '/@react-refresh' &&
      path.isAbsolute(id) &&
      fs.existsSync(cleanUrl(id)))
  ) {
    // an optimized deps may not yet exists in the filesystem, or
    // a regular file exists but is out of root
    return fileToModuleUrl(id, root)
  }
  return id
}

/**
 * Recover the base-free, unwrapped ModuleURL from a decoded BrowserURL.
 * HTTP URI decoding and request query normalization belong to the caller.
 */
export function browserUrlToModuleUrl(
  browserUrl: string,
  base: string,
): string {
  return unwrapId(stripBase(browserUrl, base))
}
