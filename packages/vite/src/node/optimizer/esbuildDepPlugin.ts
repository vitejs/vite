import path from 'path'
import { Plugin } from 'esbuild'
import { knownAssetTypes } from '../constants'
import { ResolvedConfig } from '..'
import chalk from 'chalk'
import { isBuiltin, isRunningWithYarnPnp } from '../utils'

const externalTypes = [
  'css',
  // supported pre-processor types
  'less',
  'sass',
  'scss',
  'style',
  'stylus',
  'postcss',
  // known SFC types
  'vue',
  'svelte',
  ...knownAssetTypes
]

export function esbuildDepPlugin(
  qualified: Record<string, string>,
  config: ResolvedConfig
): Plugin {
  const resolve = config.createResolver({ asSrc: false })

  return {
    name: 'vite:dep-pre-bundle',
    setup(build) {
      // externalize assets and commonly known non-js file types
      build.onResolve(
        {
          filter: new RegExp(`\\.(` + externalTypes.join('|') + `)(\\?.*)?$`)
        },
        async ({ path: id, importer }) => {
          if (id.startsWith('.')) {
            const dir = path.dirname(importer)
            return {
              path: path.resolve(dir, id),
              external: true
            }
          } else {
            const resolved = await resolve(id, importer)
            if (resolved) {
              return {
                path: resolved,
                external: true
              }
            }
          }
        }
      )

      build.onResolve({ filter: /^[\w@]/ }, async ({ path: id, importer }) => {
        // ensure esbuild uses our resolved entires of optimized deps in all
        // cases
        if (id in qualified) {
          return {
            path: path.resolve(qualified[id])
          }
        } else if (!isBuiltin(id)) {
          // use vite resolver
          const resolved = await resolve(id, importer)
          if (resolved) {
            return {
              path: resolved
            }
          }
        } else {
          // redirect node-builtins to empty module for browser
          config.logger.warn(
            chalk.yellow(
              `externalized node built-in "${id}" to empty module. ` +
                `(imported by: ${chalk.white.dim(importer)})`
            )
          )
          return {
            path: id,
            namespace: 'browser-external'
          }
        }
      })

      build.onLoad(
        { filter: /.*/, namespace: 'browser-external' },
        ({ path: id }) => {
          return {
            contents:
              `export default new Proxy({}, {
  get() {
    throw new Error('Module "${id}" has been externalized for ` +
              `browser compatibility and cannot be accessed in client code.')
  }
})`
          }
        }
      )

      // yarn 2 pnp compat
      if (isRunningWithYarnPnp) {
        build.onResolve({ filter: /.*/ }, (args) => ({
          path: require.resolve(args.path, { paths: [args.resolveDir] })
        }))
        build.onLoad({ filter: /.*/ }, async (args) => ({
          contents: await require('fs').promises.readFile(args.path),
          loader: 'default'
        }))
      }
    }
  }
}
