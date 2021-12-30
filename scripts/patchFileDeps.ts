// pnpm treats file: protocols as link:, so it doesn't copy the actual files
// into node_modules, causing Vite to still consider those deps linked.
// This script is called from postinstall hooks in playground packages that
// uses the file: protocol, and copies the file: deps into node_modules.

import { copySync, removeSync } from 'fs-extra'
import { join, resolve } from 'path'

const root = process.cwd()
const pkg = require(join(root, 'package.json'))

let hasPatched: boolean = false
for (const [key, val] of Object.entries<string>(pkg.dependencies)) {
  if (val.startsWith('file:')) {
    hasPatched = true
    const src = resolve(root, val.slice('file:'.length))
    const dest = resolve(root, 'node_modules', key)
    removeSync(dest)
    copySync(src, dest, {
      dereference: true
    })
    console.log(`patched ${val}`)
  }
}

if (hasPatched) {
  // remove node_modules/.ignored as pnpm will think our patched files are
  // installed by another package manager and move them into this directory.
  // On further installs it will error out if this directory is not empty.
  removeSync(resolve(root, 'node_modules', '.ignored'))
}
