import fs from 'node:fs'
import module from 'node:module'
import { defineConfig } from 'vite'
const require = module.createRequire(import.meta.url)

export default defineConfig({
  resolve: {
    dedupe: ['react'],
    alias: {
      'node:url': 'url',
      '@vitejs/test-dep-alias-using-absolute-path': require.resolve(
        '@vitejs/test-dep-alias-using-absolute-path',
      ),
    },
  },
  optimizeDeps: {
    include: [
      '@vitejs/test-dep-linked-include',
      '@vitejs/test-nested-exclude > @vitejs/test-nested-include',
      // will throw if optimized (should log warning instead)
      '@vitejs/test-non-optimizable-include',
      '@vitejs/test-dep-optimize-exports-with-glob/**/*',
      '@vitejs/test-dep-optimize-exports-with-root-glob/**/*.js',
      '@vitejs/test-dep-optimize-with-glob/**/*.js',
    ],
    exclude: ['@vitejs/test-nested-exclude', '@vitejs/test-dep-non-optimized'],
    esbuildOptions: {
      plugins: [
        {
          name: 'replace-a-file',
          setup(build) {
            build.onLoad(
              { filter: /dep-esbuild-plugin-transform(\\|\/)index\.js$/ },
              () => ({
                contents: `export const hello = () => 'Hello from an esbuild plugin'`,
                loader: 'js',
              }),
            )
          },
        },
      ],
    },
    entries: ['index.html', 'unused-split-entry.js'],
  },

  build: {
    // to make tests faster
    minify: false,
    rollupOptions: {
      onwarn(msg, warn) {
        // filter `"Buffer" is not exported by "__vite-browser-external"` warning
        if (msg.message.includes('Buffer')) return
        warn(msg)
      },
    },
  },

  plugins: [
    testVue(),
    notjs(),
    // for axios request test
    {
      name: 'mock',
      configureServer({ middlewares }) {
        middlewares.use('/ping', (_, res) => {
          res.statusCode = 200
          res.end('pong')
        })
      },
      configurePreviewServer({ middlewares }) {
        middlewares.use('/ping', (_, res) => {
          res.statusCode = 200
          res.end('pong')
        })
      },
    },
    {
      name: 'test-astro',
      transform(code, id) {
        if (id.endsWith('.astro')) {
          code = `export default {}`
          return { code }
        }
      },
    },
    // TODO: Remove this one support for prebundling in build lands.
    // It is expected that named importing in build doesn't work
    // as it incurs a lot of overhead in build.
    {
      name: 'polyfill-named-fs-build',
      apply: 'build',
      enforce: 'pre',
      load(id) {
        if (id === '__vite-browser-external') {
          return `export default {}; export function readFileSync() {}`
        }
      },
    },
  ],
})

// Handles Test.vue in dep-linked-include package
function testVue() {
  return {
    name: 'testvue',
    transform(code, id) {
      if (id.includes('dep-linked-include/Test.vue')) {
        return {
          code: `
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Test',
  render() {
    return '[success] rendered from Vue'
  }
})
`.trim(),
        }
      }

      // fallback to empty module for other vue files
      if (id.endsWith('.vue')) {
        return { code: `export default {}` }
      }
    },
  }
}

// Handles .notjs file, basically remove wrapping <notjs> and </notjs> tags
function notjs() {
  return {
    name: 'notjs',
    config() {
      return {
        optimizeDeps: {
          extensions: ['.notjs'],
          esbuildOptions: {
            plugins: [
              {
                name: 'esbuild-notjs',
                setup(build) {
                  build.onLoad({ filter: /\.notjs$/ }, ({ path }) => {
                    let contents = fs.readFileSync(path, 'utf-8')
                    contents = contents
                      .replace('<notjs>', '')
                      .replace('</notjs>', '')
                    return { contents, loader: 'js' }
                  })
                },
              },
            ],
          },
        },
      }
    },
    transform(code, id) {
      if (id.endsWith('.notjs')) {
        code = code.replace('<notjs>', '').replace('</notjs>', '')
        return { code }
      }
    },
  }
}
