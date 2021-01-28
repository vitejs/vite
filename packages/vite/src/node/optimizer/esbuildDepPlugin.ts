import fs from 'fs'
import path from 'path'
import { Loader, Plugin } from 'esbuild'
import { knownAssetTypes } from '../constants'
import { ResolvedConfig } from '..'
import { isRunningWithYarnPnp } from '../utils'
import { browserExternalId } from '../plugins/resolve'

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
  const _resolve = config.createResolver({ asSrc: false })
  const resolve = (id: string, importer: string) =>
    // map importer ids to file paths for correct resolution
    _resolve(id, importer in qualified ? qualified[importer] : importer)

  return {
    name: 'vite:dep-pre-bundle',
    setup(build) {
      // externalize assets and commonly known non-js file types
      build.onResolve(
        {
          filter: new RegExp(`\\.(` + externalTypes.join('|') + `)(\\?.*)?$`)
        },
        async ({ path: id, importer }) => {
          const resolved = await resolve(id, importer)
          if (resolved) {
            return {
              path: resolved,
              external: true
            }
          }
        }
      )

      build.onResolve(
        { filter: /^[\w@][^:]/ },
        async ({ path: id, importer }) => {
          // ensure esbuild uses our resolved entires of optimized deps in all
          // cases
          if (id in qualified) {
            // if is optimized entry, redirect to entry namespace
            return {
              path: id,
              namespace: 'entry'
            }
          } else {
            // use vite resolver
            const resolved = await resolve(id, importer)
            if (resolved) {
              if (resolved.startsWith(browserExternalId)) {
                return {
                  path: id,
                  namespace: 'browser-external'
                }
              }
              return {
                path: path.resolve(resolved)
              }
            }
          }
        }
      )

      // for entry files, we'll read it ourselves to retain the entry's raw id
      // instead of file path
      // so that esbuild outputs desired output file structure.
      build.onLoad({ filter: /.*/, namespace: 'entry' }, ({ path: id }) => {
        const entryFile = qualified[id]
        return {
          loader: path.extname(entryFile).slice(1) as Loader,
          contents: fs.readFileSync(entryFile, 'utf-8'),
          resolveDir: path.dirname(entryFile)
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
        build.onResolve({ filter: /.*/ }, async ({ path, importer }) => ({
          path: await resolve(path, importer)
        }))
        build.onLoad({ filter: /.*/ }, async (args) => ({
          contents: await require('fs').promises.readFile(args.path),
          loader: 'default'
        }))
      }
    }
  }
}
