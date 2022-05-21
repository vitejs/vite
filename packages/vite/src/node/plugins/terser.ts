import { pathToFileURL } from 'url'
import { Worker } from 'okie'
import type { Terser } from 'types/terser'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '..'
import { requireResolveFromRootWithFallback } from '../utils'

let terserFileUrl: URL | undefined
const loadTerserFileUrl = (root: string) => {
  if (terserFileUrl) return terserFileUrl
  try {
    terserFileUrl = pathToFileURL(
      requireResolveFromRootWithFallback(root, 'terser')
    )
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.'
      )
    } else {
      const message = new Error(`terser failed to load:\n${e.message}`)
      message.stack = e.stack + '\n' + message.stack
      throw message
    }
  }
  return terserFileUrl
}

export function terserPlugin(config: ResolvedConfig): Plugin {
  const makeWorker = () =>
    new Worker(
      async (
        terserFileUrl: string,
        code: string,
        options: Terser.MinifyOptions
      ) => {
        const terser = await import(terserFileUrl)
        return terser.minify(code, options) as Terser.MinifyOutput
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

      const terserFileUrl = loadTerserFileUrl(config.root)
      const res = await worker.run(terserFileUrl.href, code, {
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
