import { Plugin } from '../plugin'
import { Worker } from 'okie'
import { Terser } from 'types/terser'

export function terserPlugin(options: Terser.MinifyOptions): Plugin {
  const worker = new Worker((code: string, options: Terser.MinifyOptions) => {
    // eslint-disable-next-line
    return require('terser').minify(code, options) as Terser.MinifyOutput
  })

  return {
    name: 'vite:terser',

    async renderChunk(code, _chunk, outputOptions) {
      const res = await worker.run(code, {
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
