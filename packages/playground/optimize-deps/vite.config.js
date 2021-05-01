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
      // required since it isn't in node_modules and is ignored by the optimizer otherwise
      'dep-esbuild-plugin-transform'
    ],
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
    minify: false
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
