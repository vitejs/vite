import vite from 'vite'
import workerPluginTestPlugin from './worker-plugin-test-plugin'

/** @param {boolean | 'inline' | 'hidden' | 'sourcemap'} sourcemap */
export default (sourcemap) => {
  sourcemap =
    /** @type {'inline' | 'hidden' | 'sourcemap'} */ (
      process.env.WORKER_MODE
    ) || sourcemap

  if (sourcemap === 'sourcemap') {
    sourcemap = true
  }

  return vite.defineConfig({
    base: `/iife-${
      typeof sourcemap === 'boolean' ? 'sourcemap' : 'sourcemap-' + sourcemap
    }/`,
    resolve: {
      alias: {
        '@': __dirname,
      },
    },
    worker: {
      format: 'iife',
      plugins: [workerPluginTestPlugin()],
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-worker_asset[hash].[ext]',
          chunkFileNames: 'assets/[name]-worker_chunk[hash].js',
          entryFileNames: 'assets/[name]-worker_entry[hash].js',
        },
      },
    },
    build: {
      outDir: `dist/iife-${
        typeof sourcemap === 'boolean' ? 'sourcemap' : 'sourcemap-' + sourcemap
      }/`,
      sourcemap: sourcemap,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash].[ext]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
    plugins: [workerPluginTestPlugin()],
  })
}
