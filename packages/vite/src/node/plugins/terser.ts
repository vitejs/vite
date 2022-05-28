import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { Worker } from 'okie'
import type { Terser } from 'types/terser'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '..'

// TODO: use import()
const _dirname = dirname(fileURLToPath(import.meta.url))

export function terserPlugin(config: ResolvedConfig): Plugin {
  const makeWorker = () =>
    new Worker(
      async (basedir: string, code: string, options: Terser.MinifyOptions) => {
        // when vite is linked, the worker thread won't share the same resolve
        // root with vite itself, so we have to pass in the basedir and resolve
        // terser first.
        // eslint-disable-next-line node/no-restricted-require, no-restricted-globals
        const terserPath = require.resolve('terser', {
          paths: [basedir]
        })
        // eslint-disable-next-line no-restricted-globals
        return require(terserPath).minify(code, options) as Terser.MinifyOutput
      }
    )

  let worker: ReturnType<typeof makeWorker>

  return {
    name: 'vite:terser',

    async renderChunk(code, _chunk, outputOptions) {
      // This plugin is included for any non-false value of config.build.minify,
      // so that normal chunks can use the preferred minifier, and legacy chunks
      // can use terser.
      if (
        config.build.minify !== 'terser' &&
        // @ts-ignore injected by @vitejs/plugin-legacy
        !outputOptions.__vite_force_terser__
      ) {
        return null
      }

      // Do not minify ES lib output since that would remove pure annotations
      // and break tree-shaking.
      if (config.build.lib && outputOptions.format === 'es') {
        return null
      }

      // Lazy load worker.
      worker ||= makeWorker()

      const res = await worker.run(_dirname, code, {
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
      worker?.stop()
    }
  }
}
