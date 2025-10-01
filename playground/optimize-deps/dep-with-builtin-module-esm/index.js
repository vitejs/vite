// no node: protocol intentionally
// eslint-disable-next-line n/prefer-node-protocol
import { readFileSync } from 'fs'
// eslint-disable-next-line n/prefer-node-protocol
import path from 'path'

// access from named import
try {
  readFileSync()
} catch (e) {
  console.log('dep-with-builtin-module-esm', e)
}

// access from default import
try {
  path.join()
} catch (e) {
  console.log('dep-with-builtin-module-esm', e)
}

// access from function
export function read() {
  return readFileSync('test')
}
