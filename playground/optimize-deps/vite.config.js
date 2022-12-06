const fs = require('node:fs')
const vue = require('@vitejs/plugin-vue')

// Overriding the NODE_ENV set by vitest
process.env.NODE_ENV = ''

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    dedupe: ['react'],
    alias: {
      'node:url': 'url',
    },
  },
  optimizeDeps: {
    disabled: false,
    include: [
      '@vitejs/test-dep-linked-include',
      '@vitejs/test-nested-exclude > @vitejs/test-nested-include',
      // will throw if optimized (should log warning instead)
      '@vitejs/test-non-optimizable-include',
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
    entries: ['entry.js'],
  },

  build: {
    // to make tests faster
    minify: false,
    // Avoid @rollup/plugin-commonjs
    commonjsOptions: {
      include: [],
    },
  },

  plugins: [
    vue(),
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
