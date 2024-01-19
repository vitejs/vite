import { pathToFileURL } from 'node:url'

export function used(s) {
  return s
}

// This is not used, so `node:url` should not be bundled
export function treeshaken(s) {
  return pathToFileURL(s)
}
