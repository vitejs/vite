/**
 * @type {import('vite').UserConfig}
 */

const dynamicBaseAssetsCode = `
globalThis.__toAssetUrl = url => '/' + url
globalThis.__publicBase = '/'
`

const baseConfig = require('./vite.config.js')
module.exports = {
  ...baseConfig,
  base: undefined, // overwrite the original base: '/foo/'
  build: {
    ...baseConfig.build,
    outDir: 'dist',
    watch: false,
    minify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'entries/[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'other-assets/[name].[hash][extname]'
      }
    },
    baseOptions: {
      relative: true,
      assets: {
        url: '/',
        dynamic: (url) => `globalThis.__toAssetUrl(${url})`
      },
      public: {
        url: '/',
        dynamic: (url) => `globalThis.__publicBase+${url}`
      }
    }
  },
  plugins: [
    {
      name: 'dynamic-base-assets-globals',
      transformIndexHtml(_, ctx) {
        if (ctx.bundle) {
          // Only inject during build
          return [
            {
              tag: 'script',
              attrs: { type: 'module' },
              children: dynamicBaseAssetsCode
            }
          ]
        }
      }
    }
  ]
}
