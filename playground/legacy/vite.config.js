import fs from 'node:fs'
import path from 'node:path'
import legacy, { cspHashes } from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

function isCorrectCspHashesInReadme() {
  const readme = fs
    .readFileSync(
      path.resolve(__dirname, 'node_modules/@vitejs/plugin-legacy/README.md'),
    )
    .toString()
  const hashesInDoc = [...readme.matchAll(/`sha256-(.+)`/g)].map(
    (match) => match[1],
  )

  return cspHashes.every((hash, index) => hash === hashesInDoc[index])
}

export default defineConfig({
  base: './',
  plugins: [
    legacy({
      targets: 'IE 11',
      modernPolyfills: true,
    }),
  ],
  define: {
    __CORRECT_CSP_HASHES_IN_README__: JSON.stringify(
      isCorrectCspHashesInReadme(),
    ),
  },

  build: {
    cssCodeSplit: false,
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        nested: path.resolve(__dirname, 'nested/index.html'),
      },
      output: {
        chunkFileNames(chunkInfo) {
          if (chunkInfo.name === 'immutable-chunk') {
            return `assets/${chunkInfo.name}.js`
          }
          return `assets/chunk-[name].[hash].js`
        },
      },
    },
  },

  // for tests, remove `<script type="module">` tags and remove `nomodule`
  // attrs so that we run the legacy bundle instead.
  __test__() {
    const indexPath = path.resolve(__dirname, './dist/index.html')
    let index = fs.readFileSync(indexPath, 'utf-8')
    index = index
      .replace(/<script type="module".*?<\/script>/g, '')
      .replace(/<script nomodule/g, '<script')
    fs.writeFileSync(indexPath, index)
  },
})
