import { pathToFileURL } from 'node:url'
import type {
  TerserMinifyOptions,
  TerserMinifyOutput,
} from 'types/internal/terserOptions'
import { WorkerWithFallback } from 'artichokie'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '..'
import { _dirname, generateCodeFrame } from '../utils'
import { nodeResolveWithVite } from '../nodeResolve'

export interface TerserOptions extends TerserMinifyOptions {
  /**
   * Vite-specific option to specify the max number of workers to spawn
   * when minifying files with terser.
   *
   * @default number of CPUs minus 1
   */
  maxWorkers?: number
}

let terserPath: string | Promise<string> | undefined
const loadTerserPath = (root: string) => {
  if (!terserPath) {
    terserPath = (async () => {
      // Try resolve from project root first, then the current vite installation path
      const resolved =
        nodeResolveWithVite('terser', undefined, { root }) ??
        nodeResolveWithVite('terser', _dirname, { root })
      if (resolved) return resolved

      throw new Error(
        'terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.',
      )
    })()

    terserPath
      // Set the result directly to avoid needing to resolve the promise again
      .then((p) => (terserPath = p))
      // Set undefined so next retry work if the package is installed later
      .catch(() => (terserPath = undefined))
  }
  return terserPath
}

export function terserPlugin(config: ResolvedConfig): Plugin {
  const { maxWorkers, ...terserOptions } = config.build.terserOptions

  const makeWorker = () =>
    new WorkerWithFallback(
      () =>
        async (
          terserPath: string,
          code: string,
          options: TerserMinifyOptions,
        ) => {
          const terser: typeof import('terser') = await import(terserPath)
          try {
            return (await terser.minify(code, options)) as TerserMinifyOutput
          } catch (e) {
            // convert to a plain object as additional properties of Error instances are not
            // sent back to the main thread
            throw { stack: e.stack /* stack is non-enumerable */, ...e }
          }
        },
      {
        shouldUseFake(_terserPath, _code, options) {
          return !!(
            (typeof options.mangle === 'object' &&
              (options.mangle.nth_identifier?.get ||
                (typeof options.mangle.properties === 'object' &&
                  options.mangle.properties.nth_identifier?.get))) ||
            typeof options.format?.comments === 'function' ||
            typeof options.output?.comments === 'function' ||
            options.nameCache
          )
        },
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

    async renderChunk(code, chunk, outputOptions) {
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

      const terserPath = pathToFileURL(await loadTerserPath(config.root)).href
      try {
        const res = await worker.run(terserPath, code, {
          safari10: true,
          ...terserOptions,
          sourceMap: !!outputOptions.sourcemap,
          module: outputOptions.format.startsWith('es'),
          toplevel: outputOptions.format === 'cjs',
        })
        return {
          code: res.code!,
          map: res.map as any,
        }
      } catch (e) {
        if (e.line !== undefined && e.col !== undefined) {
          e.loc = {
            file: chunk.fileName,
            line: e.line,
            column: e.col,
          }
        }
        if (e.pos !== undefined) {
          e.frame = generateCodeFrame(code, e.pos)
        }
        throw e
      }
    },

    closeBundle() {
      worker?.stop()
    },
  }
}
