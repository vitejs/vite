import type { Terser } from 'dep-types/terser'
import { Worker } from 'artichokie'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '..'
import { requireResolveFromRootWithFallback } from '../utils'

export interface TerserOptions extends Terser.MinifyOptions {
  /**
   * Vite-specific option to specify the max number of workers to spawn
   * when minifying files with terser.
   *
   * @default number of CPUs minus 1
   */
  maxWorkers?: number
}

let terserPath: string | undefined
const loadTerserPath = (root: string) => {
  if (terserPath) return terserPath
  try {
    terserPath = requireResolveFromRootWithFallback(root, 'terser')
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.',
      )
    } else {
      const message = new Error(`terser failed to load:\n${e.message}`)
      message.stack = e.stack + '\n' + message.stack
      throw message
    }
  }
  return terserPath
}

const toString = (obj: Record<string, any>, name: string) => {
  if (name in obj && typeof obj[name] === 'function') {
    obj[name] = obj[name].toString()
  }
}

export function terserPlugin(config: ResolvedConfig): Plugin {
  const { maxWorkers, ...terserOptions } = config.build.terserOptions

  const makeWorker = () =>
    new Worker(
      () =>
        async (
          terserPath: string,
          code: string,
          options: Terser.MinifyOptions,
        ) => {
          // test fails when using `import`. maybe related: https://github.com/nodejs/node/issues/43205
          // eslint-disable-next-line no-restricted-globals -- this function runs inside cjs
          const terser = require(terserPath)
          const nth:
            | Terser.SimpleIdentifierMangler
            | Terser.WeightedIdentifierMangler
            | undefined = (options.mangle as any)?.nth_identifier
          if (nth && typeof nth === 'object') {
            const toFunction = (obj: Record<string, any>, name: string) => {
              if (name in obj && typeof obj[name] === 'string') {
                const fn = eval(obj[name])
                if (typeof fn !== 'function') {
                  throw new Error(
                    `Failed to eval nth_identifier.${name}: not a function`,
                  )
                }
                obj[name] = fn
              }
            }
            toFunction(nth, 'get')
            toFunction(nth, 'consider')
            toFunction(nth, 'sort')
          }

          return terser.minify(code, options) as Terser.MinifyOutput
        },
      {
        max: maxWorkers,
      },
    )

  let worker: ReturnType<typeof makeWorker>

  return {
    name: 'vite:terser',

    applyToEnvironment(environment) {
      // We also need the plugin even if minify isn't 'terser' as we force
      // terser in plugin-legacy
      return !!environment.config.build.minify
    },

    async renderChunk(code, _chunk, outputOptions) {
      // This plugin is included for any non-false value of config.build.minify,
      // so that normal chunks can use the preferred minifier, and legacy chunks
      // can use terser.
      if (
        config.build.minify !== 'terser' &&
        // @ts-expect-error injected by @vitejs/plugin-legacy
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

      const terserPath = loadTerserPath(config.root)
      const nth =
        typeof terserOptions.mangle === 'object'
          ? { ...terserOptions.mangle.nth_identifier }
          : undefined
      if (nth) {
        toString(nth, 'get')
        toString(nth, 'consider')
        toString(nth, 'sort')
      }
      const res = await worker.run(terserPath, code, {
        safari10: true,
        ...terserOptions,
        sourceMap: !!outputOptions.sourcemap,
        module: outputOptions.format.startsWith('es'),
        toplevel: outputOptions.format === 'cjs',
        mangle:
          typeof terserOptions.mangle === 'object'
            ? { ...terserOptions.mangle, nth_identifier: nth as any }
            : terserOptions.mangle,
      })
      return {
        code: res.code!,
        map: res.map as any,
      }
    },

    closeBundle() {
      worker?.stop()
    },
  }
}
