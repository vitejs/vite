// import deepBar from '@vitejs/test-deep-import/bar'
import deepFoo from '@vitejs/test-deep-import/foo'
// no `exports` key, should resolve to entries/dir/index.js
import dirEntry from '@vitejs/test-entries/dir'
// no `exports` key, should resolve to entries/file.js
import fileEntry from '@vitejs/test-entries/file'
import moduleSync from '@vitejs/test-module-sync'
// has `exports` key, should resolve to pkg-exports/entry
import pkgExportsEntry from '@vitejs/test-resolve-pkg-exports/entry'
import { used } from './util'

export default `
  entries/dir: ${dirEntry}
  entries/file: ${fileEntry}
  pkg-exports/entry: ${pkgExportsEntry}
  deep-import/foo: ${deepFoo}
  ${/* `deep-import/bar: ${deepBar}` */ ''}
  module-sync: ${moduleSync}
  util: ${used(['[success]'])}
`
