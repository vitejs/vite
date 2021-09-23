const vue = require('@vitejs/plugin-vue')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    dedupe: ['react']
  },

  optimizeDeps: {
    include: [
      'dep-linked-include',
      'nested-exclude > nested-include',
      // required since it isn't in node_modules and is ignored by the optimizer otherwise
      'dep-esbuild-plugin-transform',
      'dep-cjs-compiled-from-cjs',
      'dep-cjs-compiled-from-esm'
    ],
    exclude: ['nested-exclude'],
    esbuildOptions: {
      plugins: [
        {
          name: 'replace-a-file',
          setup(build) {
            build.onLoad(
              { filter: /dep-esbuild-plugin-transform(\\|\/)index\.js$/ },
              () => ({
                contents: `export const hello = () => 'Hello from an esbuild plugin'`,
                loader: 'js'
              })
            )
          }
        }
      ]
    }
  },

  build: {
    // to make tests faster
    minify: false,
    // force CommonJS handling on nested-exclude > nested-include since it's
    // linked and not in node_modules
    commonjsOptions: {
      include: [
        /node_modules/,
        /nested-include/,
        /dep-cjs-compiled-from-cjs/,
        /dep-cjs-compiled-from-esm/
      ]
    }
  },

  plugins: [
    vue(),
    // for axios request test
    {
      name: 'mock',
      configureServer({ middlewares }) {
        middlewares.use('/ping', (_, res) => {
          res.statusCode = 200
          res.end('pong')
        })
      }
    }
  ]
}
