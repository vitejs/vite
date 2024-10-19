/*
 * You can rebuild this with:
 * - rm -f ./dist.js ./dist.js.map
 * - npx esbuild --bundle entrypoint.js --outfile=dist.js --sourcemap --format=esm
 */

import nested from './nested-directory/nested-file'

export function entrypoint() {
  console.log(nested)
  throw new Error('Hello world')
}
