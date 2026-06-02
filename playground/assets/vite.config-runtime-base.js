import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

const dynamicBaseAssetsCode = `
globalThis.__toAssetUrl = url => '/' + url
globalThis.__publicBase = '/'
`

export default defineConfig({
  ...baseConfig,
  base: './', // overwrite the original base: '/foo/'
  build: {
    ...baseConfig.build,
    outDir: 'dist/runtime-base',
    watch: null,
    minify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'entries/[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'other-assets/[name]-[hash][extname]',
      },
    },
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
              children: dynamicBaseAssetsCode,
            },
          ]
        }
      },
    },
  ],
  experimental: {
    renderBuiltUrl(filename, { hostType, type }) {
      if (type === 'asset') {
        if (hostType === 'js') {
          return {
            runtime: `globalThis.__toAssetUrl(${JSON.stringify(filename)})`,
          }
        }
      } else if (type === 'public') {
        if (hostType === 'js') {
          return {
            runtime: `globalThis.__publicBase+${JSON.stringify(filename)}`,
          }
        }
      }
    },
  },
  cacheDir: 'node_modules/.vite-runtime-base',
})
