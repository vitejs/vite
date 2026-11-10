import { readFileSync } from 'node:fs'

// Plain dev turns the import above into
// `const readFileSync = stub['readFileSync']`, which throws right away.
// Bundled dev and build read it only here, when `read()` is called.
export function read() {
  return readFileSync
}

document.querySelector('.node-builtin-named-import').textContent = '[success]'

let readResult
try {
  readResult = String(read())
} catch (e) {
  readResult = e.message
}
document.querySelector('.node-builtin-named-import-read').textContent =
  readResult
