import path from 'node:path'
import type { ImportKind, Plugin } from 'esbuild'
import { CSS_LANGS_RE, KNOWN_ASSET_TYPES } from '../constants'
import { getDepOptimizationConfig } from '..'
import type { ResolvedConfig } from '..'
import {
  flattenId,
  isBuiltin,
  isExternalUrl,
  moduleListContains,
  normalizePath,
} from '../utils'
import { browserExternalId, optionalPeerDepId } from '../plugins/resolve'

const externalWithConversionNamespace =
  'vite:dep-pre-bundle:external-conversion'
const convertedExternalPrefix = 'vite-dep-pre-bundle-external:'

const cjsExternalFacadeNamespace = 'vite:cjs-external-facade'
const nonFacadePrefix = 'vite-cjs-external-facade:'

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
  // wasm
  'wasm',
  // known SFC types
  'vue',
  'svelte',
  'marko',
  'astro',
  'imba',
  // JSX/TSX may be configured to be compiled differently from how esbuild
  // handles it by default, so exclude them as well
  'jsx',
  'tsx',
  ...KNOWN_ASSET_TYPES,
]

export function esbuildDepPlugin(
  qualified: Record<string, string>,
  external: string[],
  config: ResolvedConfig,
  ssr: boolean,
): Plugin {
  const { extensions } = getDepOptimizationConfig(config, ssr)

  // remove optimizable extensions from `externalTypes` list
  const allExternalTypes = extensions
    ? externalTypes.filter((type) => !extensions?.includes('.' + type))
    : externalTypes

  // default resolver which prefers ESM
  const _resolve = config.createResolver({ asSrc: false, scan: true })

  // cjs resolver that prefers Node
  const _resolveRequire = config.createResolver({
    asSrc: false,
    isRequire: true,
    scan: true,
  })

  const resolve = (
    id: string,
    importer: string,
    kind: ImportKind,
    resolveDir?: string,
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
    return resolver(id, _importer, undefined, ssr)
  }

  const resolveResult = (id: string, resolved: string) => {
    if (resolved.startsWith(browserExternalId)) {
      return {
        path: id,
        namespace: 'browser-external',
      }
    }
    if (resolved.startsWith(optionalPeerDepId)) {
      return {
        path: resolved,
        namespace: 'optional-peer-dep',
      }
    }
    if (ssr && isBuiltin(resolved)) {
      return
    }
    if (isExternalUrl(resolved)) {
      return {
        path: resolved,
        external: true,
      }
    }
    return {
      path: path.resolve(resolved),
    }
  }

  return {
    name: 'vite:dep-pre-bundle',
    setup(build) {
      // externalize assets and commonly known non-js file types
      // See #8459 for more details about this require-import conversion
      build.onResolve(
        {
          filter: new RegExp(
            `\\.(` + allExternalTypes.join('|') + `)(\\?.*)?$`,
          ),
        },
        async ({ path: id, importer, kind }) => {
          // if the prefix exist, it is already converted to `import`, so set `external: true`
          if (id.startsWith(convertedExternalPrefix)) {
            return {
              path: id.slice(convertedExternalPrefix.length),
              external: true,
            }
          }

          const resolved = await resolve(id, importer, kind)
          if (resolved) {
            if (kind === 'require-call') {
              // here it is not set to `external: true` to convert `require` to `import`
              return {
                path: resolved,
                namespace: externalWithConversionNamespace,
              }
            }
            return {
              path: resolved,
              external: true,
            }
          }
        },
      )
      build.onLoad(
        { filter: /./, namespace: externalWithConversionNamespace },
        (args) => {
          // import itself with prefix (this is the actual part of require-import conversion)
          const modulePath = `"${convertedExternalPrefix}${args.path}"`
          return {
            contents: CSS_LANGS_RE.test(args.path)
              ? `import ${modulePath};`
              : `export { default } from ${modulePath};` +
                `export * from ${modulePath};`,
            loader: 'js',
          }
        },
      )

      function resolveEntry(id: string) {
        const flatId = flattenId(id)
        if (flatId in qualified) {
          return {
            path: qualified[flatId],
          }
        }
      }

      build.onResolve(
        { filter: /^[\w@][^:]/ },
        async ({ path: id, importer, kind }) => {
          if (moduleListContains(external, id)) {
            return {
              path: id,
              external: true,
            }
          }

          // ensure esbuild uses our resolved entries
          let entry: { path: string } | undefined
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
            return resolveResult(id, resolved)
          }
        },
      )

      build.onLoad(
        { filter: /.*/, namespace: 'browser-external' },
        ({ path }) => {
          if (config.isProduction) {
            return {
              contents: 'module.exports = {}',
            }
          } else {
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
      console.warn(\`Module "${path}" has been externalized for browser compatibility. Cannot access "${path}.\${key}" in client code. See http://vitejs.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.\`)
    }
  }
}))`,
            }
          }
        },
      )

      build.onLoad(
        { filter: /.*/, namespace: 'optional-peer-dep' },
        ({ path }) => {
          if (config.isProduction) {
            return {
              contents: 'module.exports = {}',
            }
          } else {
            const [, peerDep, parentDep] = path.split(':')
            return {
              contents: `throw new Error(\`Could not resolve "${peerDep}" imported by "${parentDep}". Is it installed?\`)`,
            }
          }
        },
      )
    },
  }
}

// esbuild doesn't transpile `require('foo')` into `import` statements if 'foo' is externalized
// https://github.com/evanw/esbuild/issues/566#issuecomment-735551834
export function esbuildCjsExternalPlugin(
  externals: string[],
  platform: 'node' | 'browser',
): Plugin {
  return {
    name: 'cjs-external',
    setup(build) {
      const escape = (text: string) =>
        `^${text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`
      const filter = new RegExp(externals.map(escape).join('|'))

      build.onResolve({ filter: new RegExp(`^${nonFacadePrefix}`) }, (args) => {
        return {
          path: args.path.slice(nonFacadePrefix.length),
          external: true,
        }
      })

      build.onResolve({ filter }, (args) => {
        // preserve `require` for node because it's more accurate than converting it to import
        if (args.kind === 'require-call' && platform !== 'node') {
          return {
            path: args.path,
            namespace: cjsExternalFacadeNamespace,
          }
        }

        return {
          path: args.path,
          external: true,
        }
      })

      build.onLoad(
        { filter: /.*/, namespace: cjsExternalFacadeNamespace },
        (args) => ({
          contents:
            `import * as m from ${JSON.stringify(
              nonFacadePrefix + args.path,
            )};` + `module.exports = m;`,
        }),
      )
    },
  }
}
