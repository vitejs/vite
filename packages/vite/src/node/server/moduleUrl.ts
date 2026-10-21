import path from 'node:path'
import { unwrapId, withTrailingSlash } from '../../shared/utils'
import { FS_PREFIX } from '../constants'
import { stripBase } from '../utils'

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
