import path from 'node:path'
import type { ImportKind, Plugin, RolldownPlugin } from 'rolldown'
import { prefixRegex } from '@rolldown/pluginutils'
import { JS_TYPES_RE, KNOWN_ASSET_TYPES } from '../constants'
import type { PackageCache } from '../packages'
import {
  escapeRegex,
  flattenId,
  isBuiltin,
  isCSSRequest,
  isExternalUrl,
  isNodeBuiltin,
  moduleListContains,
} from '../utils'
import { browserExternalId, optionalPeerDepId } from '../plugins/resolve'
import { isModuleCSSRequest } from '../plugins/css'
import type { Environment } from '../environment'
import { createBackCompatIdResolver } from '../idResolver'
import { isWindows } from '../../shared/utils'

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

const optionalPeerDepNamespace = 'optional-peer-dep:'
const browserExternalNamespace = 'browser-external:'

export function rolldownDepPlugin(
  environment: Environment,
  qualified: Record<string, string>,
  external: string[],
): RolldownPlugin[] {
  const { isProduction } = environment.config
  const { extensions } = environment.config.optimizeDeps

  // remove optimizable extensions from `externalTypes` list
  const allExternalTypes = extensions
    ? externalTypes.filter((type) => !extensions.includes('.' + type))
    : externalTypes

  // use separate package cache for optimizer as it caches paths around node_modules
  // and it's unlikely for the core Vite process to traverse into node_modules again
  const esmPackageCache: PackageCache = new Map()
  const cjsPackageCache: PackageCache = new Map()

  // default resolver which prefers ESM
  const _resolve = createBackCompatIdResolver(environment.getTopLevelConfig(), {
    asSrc: false,
    scan: true,
    packageCache: esmPackageCache,
  })

  // cjs resolver that prefers Node
  const _resolveRequire = createBackCompatIdResolver(
    environment.getTopLevelConfig(),
    {
      asSrc: false,
      isRequire: true,
      scan: true,
      packageCache: cjsPackageCache,
    },
  )

  const resolve = (
    id: string,
    importer: string | undefined,
    kind: ImportKind,
  ): Promise<string | undefined> => {
    // map importer ids to file paths for correct resolution
    const _importer =
      importer && importer in qualified ? qualified[importer] : importer
    const resolver = kind.startsWith('require') ? _resolveRequire : _resolve
    return resolver(environment, id, _importer)
  }

  const resolveResult = (id: string, resolved: string) => {
    if (resolved.startsWith(browserExternalId)) {
      return {
        id: browserExternalNamespace + id,
      }
    }
    if (resolved.startsWith(optionalPeerDepId)) {
      return {
        id: optionalPeerDepNamespace + resolved,
      }
    }
    if (isBuiltin(environment.config.resolve.builtins, resolved)) {
      return
    }
    if (isExternalUrl(resolved)) {
      return {
        id: resolved,
        external: 'absolute',
      }
    }
    return {
      id: path.resolve(resolved),
    }
  }

  const allExternalTypesReg = new RegExp(
    `\\.(` + allExternalTypes.join('|') + `)(\\?.*)?$`,
  )

  function resolveEntry(id: string) {
    const flatId = flattenId(id)
    if (flatId in qualified) {
      return {
        id: qualified[flatId],
      }
    }
  }

  return [
    {
      name: 'vite:dep-pre-bundle-assets',
      // externalize assets and commonly known non-js file types
      // See #8459 for more details about this require-import conversion
      resolveId: {
        filter: { id: allExternalTypesReg },
        async handler(id, importer, options) {
          const kind = options.kind
          // if the prefix exist, it is already converted to `import`, so set `external: true`
          if (id.startsWith(convertedExternalPrefix)) {
            return {
              id: id.slice(convertedExternalPrefix.length),
              external: 'absolute',
            }
          }

          const resolved = await resolve(id, importer, kind)
          if (resolved) {
            // `resolved` can be javascript even when `id` matches `allExternalTypes`
            // due to cjs resolution (e.g. require("./test.pdf") for "./test.pdf.js")
            // or package name (e.g. import "some-package.pdf")
            if (JS_TYPES_RE.test(resolved)) {
              return {
                // normalize to \\ on windows for esbuild/rolldown behavior difference: https://github.com/sapphi-red-repros/rolldown-esbuild-path-normalization
                id: isWindows ? resolved.replaceAll('/', '\\') : resolved,
                external: false,
              }
            }

            if (kind === 'require-call') {
              // here it is not set to `external: true` to convert `require` to `import`
              return {
                id: externalWithConversionNamespace + resolved,
              }
            }
            return {
              id: resolved,
              external: 'absolute',
            }
          }
        },
      },
      load: {
        filter: {
          id: prefixRegex(externalWithConversionNamespace),
        },
        handler(id) {
          const path = id.slice(externalWithConversionNamespace.length)
          // import itself with prefix (this is the actual part of require-import conversion)
          const modulePath = `"${convertedExternalPrefix}${path}"`
          return {
            code:
              isCSSRequest(path) && !isModuleCSSRequest(path)
                ? `import ${modulePath};`
                : `export { default } from ${modulePath};` +
                  `export * from ${modulePath};`,
          }
        },
      },
    },
    {
      name: 'vite:dep-pre-bundle',
      // clear package cache when build is finished
      buildEnd() {
        esmPackageCache.clear()
        cjsPackageCache.clear()
      },
      resolveId: {
        filter: { id: /^[\w@][^:]/ },
        async handler(id, importer, options) {
          const kind = options.kind

          if (moduleListContains(external, id)) {
            return {
              id: id,
              external: 'absolute',
            }
          }

          // ensure rolldown uses our resolved entries
          let entry: { id: string } | undefined
          // if this is an entry, return entry namespace resolve result
          if (!importer) {
            if ((entry = resolveEntry(id))) return entry
            // check if this is aliased to an entry - also return entry namespace
            const aliased = await _resolve(environment, id, undefined, true)
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
      },
      load: {
        filter: {
          id: [
            prefixRegex(browserExternalNamespace),
            prefixRegex(optionalPeerDepNamespace),
          ],
        },
        handler(id) {
          if (id.startsWith(browserExternalNamespace)) {
            const path = id.slice(browserExternalNamespace.length)
            if (isProduction) {
              return {
                code: 'module.exports = {}',
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
                code: `\
    module.exports = Object.create(new Proxy({}, {
        get(_, key) {
        if (
            key !== '__esModule' &&
            key !== '__proto__' &&
            key !== 'constructor' &&
            key !== 'splice'
        ) {
            console.warn(\`Module "${path}" has been externalized for browser compatibility. Cannot access "${path}.\${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.\`)
        }
        }
    }))`,
              }
            }
          }

          if (id.startsWith(optionalPeerDepNamespace)) {
            const path = id.slice(optionalPeerDepNamespace.length)
            const [, peerDep, parentDep] = path.split(':')
            return {
              code:
                'module.exports = {};' +
                `throw new Error(\`Could not resolve "${peerDep}" imported by "${parentDep}". Is it installed?\`)`,
            }
          }
        },
      },
    },
  ]
}

const matchesEntireLine = (text: string) => `^${escapeRegex(text)}$`

// rolldown (and esbuild) doesn't transpile `require('foo')` into `import` statements if 'foo' is externalized
// https://github.com/evanw/esbuild/issues/566#issuecomment-735551834
export function rolldownCjsExternalPlugin(
  externals: string[],
  platform: 'node' | 'browser' | 'neutral',
): Plugin {
  const filter = new RegExp(externals.map(matchesEntireLine).join('|'))

  return {
    name: 'cjs-external',
    resolveId: {
      filter: { id: [prefixRegex(nonFacadePrefix), filter] },
      handler(id, _importer, options) {
        if (id.startsWith(nonFacadePrefix)) {
          return {
            id: id.slice(nonFacadePrefix.length),
            external: 'absolute',
          }
        }

        if (filter.test(id)) {
          const kind = options.kind
          // preserve `require` for node because it's more accurate than converting it to import
          if (kind === 'require-call' && platform !== 'node') {
            return {
              id: cjsExternalFacadeNamespace + id,
            }
          }

          return {
            id,
            external: 'absolute',
          }
        }
      },
    },
    load: {
      filter: { id: prefixRegex(cjsExternalFacadeNamespace) },
      handler(id) {
        if (id.startsWith(cjsExternalFacadeNamespace)) {
          const idWithoutNamespace = id.slice(cjsExternalFacadeNamespace.length)
          return {
            code: `\
import * as m from ${JSON.stringify(nonFacadePrefix + idWithoutNamespace)};
module.exports = ${isNodeBuiltin(idWithoutNamespace) ? 'm.default' : '{ ...m }'};
`,
          }
        }
      },
    },
  }
}
