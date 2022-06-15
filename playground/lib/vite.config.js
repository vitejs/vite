const fs = require('fs')
const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    rollupOptions: {
      output: [
        {
          format: 'es',
          banner: `/*!\nMayLib\n*/`,
          assetFileNames: `subdir/assets.[name].[ext]`,
          chunkFileNames: `subdir/chunk.[name].js`
        },
        {
          format: 'umd',
          banner: `/*!\nMayLib\n*/`,
          assetFileNames: `subdir2/assets.[name].[ext]`,
          chunkFileNames: `subdir2/chunk.[name].js`
        },
        {
          format: 'iife',
          banner: `/*!\nMayLib\n*/`,
          assetFileNames: `subdir3/assets.[name].[ext]`,
          chunkFileNames: `subdir3/chunk.[name].js`
        }
      ]
    },
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'MyLib',
      fileName: 'my-lib-custom-filename'
    }
  },
  plugins: [
    {
      name: 'emit-index',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: fs.readFileSync(
            path.resolve(__dirname, 'index.dist.html'),
            'utf-8'
          )
        })
      }
    }
  ]
}
