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
  plugins: [
    {
      name: 'emitted-worker-url',
      resolveId(id) {
        if (id === 'virtual:emitted-worker-url') {
          return '\0virtual:emitted-worker-url'
        }
      },
      load(id) {
        if (id !== '\0virtual:emitted-worker-url') return
        if (this.environment.mode !== 'build') return 'export default undefined'

        const referenceId = this.emitFile({
          type: 'chunk',
          id: path.resolve(import.meta.dirname, 'asset/emitted-worker.js'),
        })
        return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`
      },
    },
  ],
  build: {
    outDir: 'dist/foo',
    assetsInlineLimit: 8000, // 8 kB
    manifest: true,
    watch: {},
  },
})
