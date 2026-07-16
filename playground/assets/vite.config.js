import path from 'node:path'
import { defineConfig } from 'vite'

// relative paths in `assetsInclude` are resolved against the current working
// directory. The tests run with a different cwd, so change it to the config
// directory to align with running Vite from the project root.
process.chdir(import.meta.dirname)

export default defineConfig({
  base: '/foo/bar',
  publicDir: 'static',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'nested'),
      fragment: path.resolve(import.meta.dirname, 'nested/fragment-bg.svg'),
    },
  },
  assetsInclude: ['**/*.unknown', './nested/*.custom'],
  build: {
    outDir: 'dist/foo',
    assetsInlineLimit: 8000, // 8 kB
    manifest: true,
    watch: {},
  },
})
