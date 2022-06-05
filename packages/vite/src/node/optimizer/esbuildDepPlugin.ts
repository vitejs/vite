import path from 'path'
import { promises as fs } from 'fs'
import type { ImportKind, Plugin } from 'esbuild'
import { KNOWN_ASSET_TYPES } from '../constants'
import type { ResolvedConfig } from '..'
import {
  flattenId,
  isExternalUrl,
  isRunningWithYarnPnp,
  moduleListContains,
  normalizePath
} from '../utils'
import { browserExternalId } from '../plugins/resolve'
import type { ExportsData } from '.'

const externalWithConversionNamespace =
  'vite:dep-pre-bundle:external-conversion'
const convertedExternalPrefix = 'vite-dep-pre-bundle-external:'

const externalTypes = [
  'css',
  // supported pre-processor types
  'less',
  'sass',
  'scss',
  'styl',
  'stylus',
  'pcss',
  'postcss',
  // known SFC types
  'vue',
  'svelte',
  'marko',
  'astro',
  // JSX/TSX may be configured to be compiled differently from how esbuild
  // handles it by default, so exclude them as well
  'jsx',
  'tsx',
  ...KNOWN_ASSET_TYPES
]

export function esbuildDepPlugin(
  qualified: Record<string, string>,
  exportsData: Record<string, ExportsData>,
  config: ResolvedConfig
): Plugin {
  // remove optimizable extensions from `externalTypes` list
  const allExternalTypes = config.optimizeDeps.extensions
    ? externalTypes.filter(
        (type) => !config.optimizeDeps.extensions?.includes('.' + type)
      )
    : externalTypes

  // default resolver which prefers ESM
  const _resolve = config.createResolver({ asSrc: false, scan: true })

  // cjs resolver that prefers Node
  const _resolveRequire = config.createResolver({
    asSrc: false,
    isRequire: true,
    scan: true
  })

  const resolve = (
    id: string,
    importer: string,
    kind: ImportKind,
    resolveDir?: string
  ): Promise<string | undefined> => {
    let _importer: string
    // explicit resolveDir - this is passed only during yarn pnp resolve for
    // entries
    if (resolveDir) {
      _importer = normalizePath(path.join(resolveDir, '*'))
    } else {
      // map importer ids to file paths for correct resolution
      _importer = importer in qualified ? qualified[importer] : importer
    }
    const resolver = kind.startsWith('require') ? _resolveRequire : _resolve
    return resolver(id, _importer, undefined)
  }

  return {
    name: 'vite:dep-pre-bundle',
    setup(build) {
      // externalize assets and commonly known non-js file types
      // See #8459 for more details about this require-import conversion
      build.onResolve(
        {
          filter: new RegExp(`\\.(` + allExternalTypes.join('|') + `)(\\?.*)?$`)
        },
        async ({ path: id, importer, kind }) => {
          // if the prefix exist, it is already converted to `import`, so set `external: true`
          if (id.startsWith(convertedExternalPrefix)) {
            return {
              path: id.slice(convertedExternalPrefix.length),
              external: true
            }
          }

          const resolved = await resolve(id, importer, kind)
          if (resolved) {
            // here it is not set to `external: true` to convert `require` to `import`
            return {
              path: resolved,
              namespace: externalWithConversionNamespace
            }
          }
        }
      )
      build.onLoad(
        { filter: /./, namespace: externalWithConversionNamespace },
        (args) => {
          // import itself with prefix (this is the actual part of require-import conversion)
          return {
            contents:
              `export { default } from "${convertedExternalPrefix}${args.path}";` +
              `export * from "${convertedExternalPrefix}${args.path}";`,
            loader: 'js'
          }
        }
      )

      function resolveEntry(id: string) {
        const flatId = flattenId(id)
        if (flatId in qualified) {
          return {
            path: flatId,
            namespace: 'dep'
          }
        }
      }

      build.onResolve(
        { filter: /^[\w@][^:]/ },
        async ({ path: id, importer, kind }) => {
          if (moduleListContains(config.optimizeDeps?.exclude, id)) {
            return {
              path: id,
              external: true
            }
          }

          // ensure esbuild uses our resolved entries
          let entry: { path: string; namespace: string } | undefined
          // if this is an entry, return entry namespace resolve result
          if (!importer) {
            if ((entry = resolveEntry(id))) return entry
            // check if this is aliased to an entry - also return entry namespace
            const aliased = await _resolve(id, undefined, true)
            if (aliased && (entry = resolveEntry(aliased))) {
              return entry
            }
          }

          // use vite's own resolver
          const resolved = await resolve(id, importer, kind)
          if (resolved) {
            if (resolved.startsWith(browserExternalId)) {
              return {
                path: id,
                namespace: 'browser-external'
              }
            }
            if (isExternalUrl(resolved)) {
              return {
                path: resolved,
                external: true
              }
            }
            return {
              path: path.resolve(resolved)
            }
          }
        }
      )

      // For entry files, we'll read it ourselves and construct a proxy module
      // to retain the entry's raw id instead of file path so that esbuild
      // outputs desired output file structure.
      // It is necessary to do the re-exporting to separate the virtual proxy
      // module from the actual module since the actual module may get
      // referenced via relative imports - if we don't separate the proxy and
      // the actual module, esbuild will create duplicated copies of the same
      // module!
      const root = path.resolve(config.root)
      build.onLoad({ filter: /.*/, namespace: 'dep' }, ({ path: id }) => {
        const entryFile = qualified[id]

        let relativePath = normalizePath(path.relative(root, entryFile))
        if (
          !relativePath.startsWith('./') &&
          !relativePath.startsWith('../') &&
          relativePath !== '.'
        ) {
          relativePath = `./${relativePath}`
        }

        let contents = ''
        const { hasImports, exports, hasReExports } = exportsData[id]
        if (!hasImports && !exports.length) {
          // cjs
          contents += `export default require("${relativePath}");`
        } else {
          if (exports.includes('default')) {
            contents += `import d from "${relativePath}";export default d;`
          }
          if (hasReExports || exports.length > 1 || exports[0] !== 'default') {
            contents += `\nexport * from "${relativePath}"`
          }
        }

        return {
          loader: 'js',
          contents,
          resolveDir: root
        }
      })

      build.onLoad(
        { filter: /.*/, namespace: 'browser-external' },
        ({ path }) => {
          return {
            // Return in CJS to intercept named imports. Use `Object.create` to
            // create the Proxy in the prototype to workaround esbuild issue. Why?
            //
            // In short, esbuild cjs->esm flow:
            // 1. Create empty object using `Object.create(Object.getPrototypeOf(module.exports))`.
            // 2. Assign props of `module.exports` to the object.
            // 3. Return object for ESM use.
            //
            // If we do `module.exports = new Proxy({}, {})`, step 1 returns empty object,
            // step 2 does nothing as there's no props for `module.exports`. The final object
            // is just an empty object.
            //
            // Creating the Proxy in the prototype satisfies step 1 immediately, which means
            // the returned object is a Proxy that we can intercept.
            //
            // Note: Skip keys that are accessed by esbuild and browser devtools.
            contents: `\
module.exports = Object.create(new Proxy({}, {
  get(_, key) {
    if (
      key !== '__esModule' &&
      key !== '__proto__' &&
      key !== 'constructor' &&
      key !== 'splice'
    ) {
      throw new Error(\`Module "${path}" has been externalized for browser compatibility. Cannot access "${path}.\${key}" in client code.\`)
    }
  }
}))`
          }
        }
      )

      // yarn 2 pnp compat
      if (isRunningWithYarnPnp) {
        build.onResolve(
          { filter: /.*/ },
          async ({ path, importer, kind, resolveDir }) => ({
            // pass along resolveDir for entries
            path: await resolve(path, importer, kind, resolveDir)
          })
        )
        build.onLoad({ filter: /.*/ }, async (args) => ({
          contents: await fs.readFile(args.path),
          loader: 'default'
        }))
      }
    }
  }
}
