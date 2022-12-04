// no `exports` key, should resolve to entries/dir/index.js
import dirEntry from '@vitejs/test-entries/dir'
// no `exports` key, should resolve to entries/file.js
import fileEntry from '@vitejs/test-entries/file'
// has `exports` key, should resolve to pkg-exports/entry
import pkgExportsEntry from '@vitejs/test-pkg-exports/entry'

export default `
  entries/dir: ${dirEntry}
  entries/file: ${fileEntry}
  pkg-exports/entry: ${pkgExportsEntry}
`
