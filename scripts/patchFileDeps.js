// pnpm treats file: protocols as link:, so it doesn't copy the actual files
// into node_modules, causing Vite to still consider those deps linked.
// This script is called from postinstall hooks in playground packages that
// uses the file: protocol, and copies the file: deps into node_modules.

const fs = require('fs-extra')
const path = require('path')
const root = process.cwd()
const pkg = require(path.join(root, 'package.json'))

let hasPatched
for (const [key, val] of Object.entries(pkg.dependencies)) {
  if (val.startsWith('file:')) {
    hasPatched = true
    const src = path.resolve(root, val.slice('file:'.length))
    const dest = path.resolve(root, 'node_modules', key)
    fs.removeSync(dest)
    fs.copySync(src, dest, {
      dereference: true
    })
    console.log(`patched ${val}`)
  }
}

if (hasPatched) {
  // remove node_modules/.ignored as pnpm will think our patched files are
  // installed by another package manager and move them into this directory.
  // On further installs it will error out if this directory is not empty.
  fs.removeSync(path.resolve(root, 'node_modules', '.ignored'))
}
