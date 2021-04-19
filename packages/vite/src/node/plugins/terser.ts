import { Plugin } from '../plugin'
import { Worker } from 'okie'
import { Terser } from 'types/terser'

export function terserPlugin(options: Terser.MinifyOptions): Plugin {
  const worker = new Worker(
    (basedir: string, code: string, options: Terser.MinifyOptions) => {
      // when vite is linked, the worker thread won't share the same resolve
      // root with vite itself, so we have to pass in the basedir and resolve
      // terser first.
      // eslint-disable-next-line node/no-restricted-require
      const terserPath = require.resolve('terser', {
        paths: [basedir]
      })
      return require(terserPath).minify(code, options) as Terser.MinifyOutput
    }
  )

  return {
    name: 'vite:terser',

    async renderChunk(code, _chunk, outputOptions) {
      const res = await worker.run(__dirname, code, {
        ...options,
        sourceMap: !!outputOptions.sourcemap,
        module: outputOptions.format.startsWith('es'),
        toplevel: outputOptions.format === 'cjs',
        safari10: true
      })
      return {
        code: res.code!,
        map: res.map as any
      }
    },

    closeBundle() {
      worker.stop()
    }
  }
}
