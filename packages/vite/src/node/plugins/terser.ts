import { Plugin } from '../plugin'
import { Worker } from 'okie'
import { Terser } from 'types/terser'
import { ResolvedConfig } from '..'

export function terserPlugin(config: ResolvedConfig): Plugin {
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
      // Do not minify ES lib output since that would remove pure annotations
      // and break tree-shaking
      if (config.build.lib && outputOptions.format === 'es') {
        return null
      }

      const res = await worker.run(__dirname, code, {
        safari10: true,
        ...config.build.terserOptions,
        sourceMap: !!outputOptions.sourcemap,
        module: outputOptions.format.startsWith('es'),
        toplevel: outputOptions.format === 'cjs'
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
