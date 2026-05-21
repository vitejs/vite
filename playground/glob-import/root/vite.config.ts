import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const escapeAliases = fs
  .readdirSync(path.join(import.meta.dirname, 'escape'), {
    withFileTypes: true,
  })
  .filter((f) => f.isDirectory())
  .map((f) => f.name)
  .reduce((aliases: Record<string, string>, dir) => {
    aliases[`@escape_${dir}_mod`] = path.resolve(
      import.meta.dirname,
      `./escape/${dir}/mod`,
    )
    return aliases
  }, {})

const transformVisibilityPlugin = {
  name: 'test:transform-visibility',
  enforce: 'post',
  transform(code: string, id: string) {
    if (id.endsWith('transform-visibility.js')) {
      const globTransformed = !code.includes('import.meta.glob')
      const dynamicImportTransformed = code.includes(
        '__variableDynamicImportRuntimeHelper',
      )
      return `export default ${JSON.stringify({ globTransformed, dynamicImportTransformed })}`
    }
  },
}

// Ensure symlink exists before any file processing.
// We create it programmatically instead of storing it in git because
// of https://github.com/nodejs/node/issues/62653
const linked = path.resolve(
  import.meta.dirname,
  'follow-symlinks/linked/my-lib',
)
if (!fs.existsSync(linked) || !fs.lstatSync(linked).isSymbolicLink()) {
  fs.rmSync(linked, { recursive: true, force: true })
  fs.symlinkSync('../packages/my-lib', linked, 'dir')
}

export default defineConfig({
  plugins: [transformVisibilityPlugin],
  resolve: {
    alias: {
      ...escapeAliases,
      '@dir': path.resolve(import.meta.dirname, './dir/'),
      '~dir': path.resolve(import.meta.dirname, './dir') + '/',
      '#alias': path.resolve(import.meta.dirname, './imports-path/'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // manualChunks(id) {
        //   if (id.includes('foo.css')) {
        //     return 'foo_css'
        //   }
        // },
      },
    },
  },
})
