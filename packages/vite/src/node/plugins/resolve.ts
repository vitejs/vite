import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import colors from 'picocolors'
import type { PartialResolvedId } from 'rollup'
import { exports, imports } from 'resolve.exports'
import { hasESMSyntax } from 'mlly'
import type { Plugin } from '../plugin'
import {
  CLIENT_ENTRY,
  DEP_VERSION_RE,
  DEV_PROD_CONDITION,
  ENV_ENTRY,
  FS_PREFIX,
  SPECIAL_QUERY_RE,
} from '../constants'
import {
  bareImportRE,
  createDebugger,
  deepImportRE,
  fsPathFromId,
  getNpmPackageName,
  injectQuery,
  isBuiltin,
  isDataUrl,
  isExternalUrl,
  isInNodeModules,
  isNodeLikeBuiltin,
  isNonDriveRelativeAbsolutePath,
  isObject,
  isOptimizable,
  normalizePath,
  safeRealpathSync,
  tryStatSync,
} from '../utils'
import { optimizedDepInfoFromFile, optimizedDepInfoFromId } from '../optimizer'
import type { DepsOptimizer } from '../optimizer'
import type { SSROptions } from '..'
import type { PackageCache, PackageData } from '../packages'
import { canExternalizeFile, shouldExternalize } from '../external'
import {
  findNearestMainPackageData,
  findNearestPackageData,
  loadPackageData,
  resolvePackageData,
} from '../packages'
import {
  cleanUrl,
  isWindows,
  slash,
  splitFileAndPostfix,
  withTrailingSlash,
} from '../../shared/utils'

const normalizedClientEntry = normalizePath(CLIENT_ENTRY)
const normalizedEnvEntry = normalizePath(ENV_ENTRY)

const ERR_RESOLVE_PACKAGE_ENTRY_FAIL = 'ERR_RESOLVE_PACKAGE_ENTRY_FAIL'

// special id for paths marked with browser: false
// https://github.com/defunctzombie/package-browser-field-spec#ignore-a-module
export const browserExternalId = '__vite-browser-external'
// special id for packages that are optional peer deps
export const optionalPeerDepId = '__vite-optional-peer-dep'

const subpathImportsPrefix = '#'

const startsWithWordCharRE = /^\w/

const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true,
})

export interface EnvironmentResolveOptions {
  /**
   * @default ['browser', 'module', 'jsnext:main', 'jsnext']
   */
  mainFields?: string[]
  conditions?: string[]
  externalConditions?: string[]
  /**
   * @default ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
   */
  extensions?: string[]
  dedupe?: string[]
  // TODO: better abstraction that works for the client environment too?
  /**
   * Prevent listed dependencies from being externalized and will get bundled in build.
   * Only works in server environments for now. Previously this was `ssr.noExternal`.
   * @experimental
   */
  noExternal?: string | RegExp | (string | RegExp)[] | true
  /**
   * Externalize the given dependencies and their transitive dependencies.
   * Only works in server environments for now. Previously this was `ssr.external`.
   * @experimental
   */
  external?: string[] | true
  /**
   * Array of strings or regular expressions that indicate what modules are builtin for the environment.
   */
  builtins?: (string | RegExp)[]
}

export interface ResolveOptions extends EnvironmentResolveOptions {
  /**
   * @default false
   */
  preserveSymlinks?: boolean
}

interface ResolvePluginOptions {
  root: string
  isBuild: boolean
  isProduction: boolean
  packageCache?: PackageCache
  /**
   * src code mode also attempts the following:
   * - resolving /xxx as URLs
   * - resolving bare imports from optimized deps
   */
  asSrc?: boolean
  tryIndex?: boolean
  tryPrefix?: string
  preferRelative?: boolean
  isRequire?: boolean
  /** @deprecated */
  isFromTsImporter?: boolean
  // True when resolving during the scan phase to discover dependencies
  scan?: boolean

  /**
   * Optimize deps during dev, defaults to false // TODO: Review default
   * @internal
   */
  optimizeDeps?: boolean

  /**
   * Externalize using `resolve.external` and `resolve.noExternal` when running a build in
   * a server environment. Defaults to false (only for createResolver)
   * @internal
   */
  externalize?: boolean

  /**
   * Previous deps optimizer logic
   * @internal
   * @deprecated
   */
  getDepsOptimizer?: (ssr: boolean) => DepsOptimizer | undefined

  /**
   * Externalize logic for SSR builds
   * @internal
   * @deprecated
   */
  shouldExternalize?: (id: string, importer?: string) => boolean | undefined

  /**
   * Set by createResolver, we only care about the resolved id. moduleSideEffects
   * and other fields are discarded so we can avoid computing them.
   * @internal
   */
  idOnly?: boolean

  /**
   * @deprecated environment.config are used instead
   */
  ssrConfig?: SSROptions
}

export interface InternalResolveOptions
  extends Required<ResolveOptions>,
    ResolvePluginOptions {}

// Defined ResolveOptions are used to overwrite the values for all environments
// It is used when creating custom resolvers (for CSS, scanning, etc)
export interface ResolvePluginOptionsWithOverrides
  extends ResolveOptions,
    ResolvePluginOptions {}

export function resolvePlugin(
  resolveOptions: ResolvePluginOptionsWithOverrides,
): Plugin {
  const { root, isProduction, asSrc, preferRelative = false } = resolveOptions

  // In unix systems, absolute paths inside root first needs to be checked as an
  // absolute URL (/root/root/path-to-file) resulting in failed checks before falling
  // back to checking the path as absolute. If /root/root isn't a valid path, we can
  // avoid these checks. Absolute paths inside root are common in user code as many
  // paths are resolved by the user. For example for an alias.
  const rootInRoot = tryStatSync(path.join(root, root))?.isDirectory() ?? false

  return {
    name: 'vite:resolve',

    async resolveId(id, importer, resolveOpts) {
      if (
        id[0] === '\0' ||
        id.startsWith('virtual:') ||
        // When injected directly in html/client code
        id.startsWith('/virtual:')
      ) {
        return
      }

      // The resolve plugin is used for createIdResolver and the depsOptimizer should be
      // disabled in that case, so deps optimization is opt-in when creating the plugin.
      const depsOptimizer =
        resolveOptions.optimizeDeps && this.environment.mode === 'dev'
          ? this.environment.depsOptimizer
          : undefined

      if (id.startsWith(browserExternalId)) {
        return id
      }

      // this is passed by @rollup/plugin-commonjs
      const isRequire: boolean =
        resolveOpts.custom?.['node-resolve']?.isRequire ?? false

      const currentEnvironmentOptions = this.environment.config

      const options: InternalResolveOptions = {
        isRequire,
        ...currentEnvironmentOptions.resolve,
        ...resolveOptions, // plugin options + resolve options overrides
        scan: resolveOpts.scan ?? resolveOptions.scan,
      }

      const resolvedImports = resolveSubpathImports(id, importer, options)
      if (resolvedImports) {
        id = resolvedImports

        if (resolveOpts.custom?.['vite:import-glob']?.isSubImportsPattern) {
          return normalizePath(path.join(root, id))
        }
      }

      let res: string | PartialResolvedId | undefined

      // resolve pre-bundled deps requests, these could be resolved by
      // tryFileResolve or /fs/ resolution but these files may not yet
      // exists if we are in the middle of a deps re-processing
      if (asSrc && depsOptimizer?.isOptimizedDepUrl(id)) {
        const optimizedPath = id.startsWith(FS_PREFIX)
          ? fsPathFromId(id)
          : normalizePath(path.resolve(root, id.slice(1)))
        return optimizedPath
      }

      // explicit fs paths that starts with /@fs/*
      if (asSrc && id.startsWith(FS_PREFIX)) {
        res = fsPathFromId(id)
        // We don't need to resolve these paths since they are already resolved
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404.
        debug?.(`[@fs] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        return ensureVersionQuery(res, id, options, depsOptimizer)
      }

      // URL
      // /foo -> /fs-root/foo
      if (
        asSrc &&
        id[0] === '/' &&
        (rootInRoot || !id.startsWith(withTrailingSlash(root)))
      ) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath, options))) {
          debug?.(`[url] ${colors.cyan(id)} -> ${colors.dim(res)}`)
          return ensureVersionQuery(res, id, options, depsOptimizer)
        }
      }

      // relative
      if (
        id[0] === '.' ||
        ((preferRelative || importer?.endsWith('.html')) &&
          startsWithWordCharRE.test(id))
      ) {
        const basedir = importer ? path.dirname(importer) : process.cwd()
        const fsPath = path.resolve(basedir, id)
        // handle browser field mapping for relative imports

        const normalizedFsPath = normalizePath(fsPath)

        if (depsOptimizer?.isOptimizedDepFile(normalizedFsPath)) {
          // Optimized files could not yet exist in disk, resolve to the full path
          // Inject the current browserHash version if the path doesn't have one
          if (!options.isBuild && !DEP_VERSION_RE.test(normalizedFsPath)) {
            const browserHash = optimizedDepInfoFromFile(
              depsOptimizer.metadata,
              normalizedFsPath,
            )?.browserHash
            if (browserHash) {
              return injectQuery(normalizedFsPath, `v=${browserHash}`)
            }
          }
          return normalizedFsPath
        }

        if (
          options.mainFields.includes('browser') &&
          (res = tryResolveBrowserMapping(fsPath, importer, options, true))
        ) {
          return res
        }

        if ((res = tryFsResolve(fsPath, options))) {
          res = ensureVersionQuery(res, id, options, depsOptimizer)
          debug?.(`[relative] ${colors.cyan(id)} -> ${colors.dim(res)}`)

          if (!options.idOnly && !options.scan && options.isBuild) {
            const resPkg = findNearestPackageData(
              path.dirname(res),
              options.packageCache,
            )
            if (resPkg) {
              return {
                id: res,
                moduleSideEffects: resPkg.hasSideEffects(res),
              }
            }
          }
          return res
        }
      }

      // file url to path with preserving hash/search
      if (id.startsWith('file://')) {
        const { file, postfix } = splitFileAndPostfix(id)
        id = fileURLToPath(file) + postfix
      }

      // drive relative fs paths (only windows)
      if (isWindows && id[0] === '/') {
        const basedir = importer ? path.dirname(importer) : process.cwd()
        const fsPath = path.resolve(basedir, id)
        if ((res = tryFsResolve(fsPath, options))) {
          debug?.(`[drive-relative] ${colors.cyan(id)} -> ${colors.dim(res)}`)
          return ensureVersionQuery(res, id, options, depsOptimizer)
        }
      }

      // absolute fs paths
      if (
        isNonDriveRelativeAbsolutePath(id) &&
        (res = tryFsResolve(id, options))
      ) {
        debug?.(`[fs] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        return ensureVersionQuery(res, id, options, depsOptimizer)
      }

      // external
      if (isExternalUrl(id)) {
        return options.idOnly ? id : { id, external: true }
      }

      // data uri: pass through (this only happens during build and will be
      // handled by dedicated plugin)
      if (isDataUrl(id)) {
        return null
      }

      // bare package imports, perform node resolve
      if (bareImportRE.test(id)) {
        const external =
          options.externalize &&
          options.isBuild &&
          currentEnvironmentOptions.consumer === 'server' &&
          shouldExternalize(this.environment, id, importer)
        if (
          !external &&
          asSrc &&
          depsOptimizer &&
          !options.scan &&
          (res = await tryOptimizedResolve(
            depsOptimizer,
            id,
            importer,
            options.preserveSymlinks,
            options.packageCache,
          ))
        ) {
          return res
        }

        if (
          options.mainFields.includes('browser') &&
          (res = tryResolveBrowserMapping(
            id,
            importer,
            options,
            false,
            external,
          ))
        ) {
          return res
        }

        if (
          (res = tryNodeResolve(id, importer, options, depsOptimizer, external))
        ) {
          return res
        }

        // built-ins
        // externalize if building for a server environment, otherwise redirect to an empty module
        if (
          currentEnvironmentOptions.consumer === 'server' &&
          isBuiltin(options.builtins, id)
        ) {
          return options.idOnly
            ? id
            : { id, external: true, moduleSideEffects: false }
        } else if (
          currentEnvironmentOptions.consumer === 'server' &&
          isNodeLikeBuiltin(id)
        ) {
          if (!(options.external === true || options.external.includes(id))) {
            let message = `Automatically externalized node built-in module "${id}"`
            if (importer) {
              message += ` imported from "${path.relative(
                process.cwd(),
                importer,
              )}"`
            }
            message += `. Consider adding it to environments.${this.environment.name}.external if it is intended.`
            this.warn(message)
          }

          return options.idOnly
            ? id
            : { id, external: true, moduleSideEffects: false }
        } else if (
          currentEnvironmentOptions.consumer === 'client' &&
          isNodeLikeBuiltin(id)
        ) {
          if (
            options.noExternal === true &&
            // if both noExternal and external are true, noExternal will take the higher priority and bundle it.
            // only if the id is explicitly listed in external, we will externalize it and skip this error.
            (options.external === true || !options.external.includes(id))
          ) {
            let message = `Cannot bundle built-in module "${id}"`
            if (importer) {
              message += ` imported from "${path.relative(
                process.cwd(),
                importer,
              )}"`
            }
            message += `. Consider disabling environments.${this.environment.name}.noExternal or remove the built-in dependency.`
            this.error(message)
          }

          if (!asSrc) {
            debug?.(
              `externalized node built-in "${id}" to empty module. ` +
                `(imported by: ${colors.white(colors.dim(importer))})`,
            )
          } else if (isProduction) {
            this.warn(
              `Module "${id}" has been externalized for browser compatibility, imported by "${importer}". ` +
                `See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`,
            )
          }
          return isProduction ? browserExternalId : `${browserExternalId}:${id}`
        }
      }

      debug?.(`[fallthrough] ${colors.dim(id)}`)
    },

    load(id) {
      if (id.startsWith(browserExternalId)) {
        if (isProduction) {
          return `export default {}`
        } else {
          id = id.slice(browserExternalId.length + 1)
          return `\
export default new Proxy({}, {
  get(_, key) {
    throw new Error(\`Module "${id}" has been externalized for browser compatibility. Cannot access "${id}.\${key}" in client code.  See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.\`)
  }
})`
        }
      }
      if (id.startsWith(optionalPeerDepId)) {
        if (isProduction) {
          return `export default {}`
        } else {
          const [, peerDep, parentDep] = id.split(':')
          return `throw new Error(\`Could not resolve "${peerDep}" imported by "${parentDep}". Is it installed?\`)`
        }
      }
    },
  }
}

function resolveSubpathImports(
  id: string,
  importer: string | undefined,
  options: InternalResolveOptions,
) {
  if (!importer || !id.startsWith(subpathImportsPrefix)) return
  const basedir = path.dirname(importer)
  const pkgData = findNearestPackageData(basedir, options.packageCache)
  if (!pkgData) return

  let { file: idWithoutPostfix, postfix } = splitFileAndPostfix(id.slice(1))
  idWithoutPostfix = '#' + idWithoutPostfix

  let importsPath = resolveExportsOrImports(
    pkgData.data,
    idWithoutPostfix,
    options,
    'imports',
  )

  if (importsPath?.[0] === '.') {
    importsPath = path.relative(basedir, path.join(pkgData.dir, importsPath))

    if (importsPath[0] !== '.') {
      importsPath = `./${importsPath}`
    }
  }

  return importsPath + postfix
}

function ensureVersionQuery(
  resolved: string,
  id: string,
  options: InternalResolveOptions,
  depsOptimizer?: DepsOptimizer,
): string {
  if (
    !options.isBuild &&
    !options.scan &&
    depsOptimizer &&
    !(resolved === normalizedClientEntry || resolved === normalizedEnvEntry)
  ) {
    // Ensure that direct imports of node_modules have the same version query
    // as if they would have been imported through a bare import
    // Use the original id to do the check as the resolved id may be the real
    // file path after symlinks resolution
    const isNodeModule = isInNodeModules(id) || isInNodeModules(resolved)

    if (isNodeModule && !DEP_VERSION_RE.test(resolved)) {
      const versionHash = depsOptimizer.metadata.browserHash
      if (versionHash && isOptimizable(resolved, depsOptimizer.options)) {
        resolved = injectQuery(resolved, `v=${versionHash}`)
      }
    }
  }
  return resolved
}

export function tryFsResolve(
  fsPath: string,
  options: InternalResolveOptions,
  tryIndex = true,
  skipPackageJson = false,
): string | undefined {
  // Dependencies like es5-ext use `#` in their paths. We don't support `#` in user
  // source code so we only need to perform the check for dependencies.
  // We don't support `?` in node_modules paths, so we only need to check in this branch.
  const hashIndex = fsPath.indexOf('#')
  if (hashIndex >= 0 && isInNodeModules(fsPath)) {
    const queryIndex = fsPath.indexOf('?')
    // We only need to check foo#bar?baz and foo#bar, ignore foo?bar#baz
    if (queryIndex < 0 || queryIndex > hashIndex) {
      const file = queryIndex > hashIndex ? fsPath.slice(0, queryIndex) : fsPath
      const res = tryCleanFsResolve(file, options, tryIndex, skipPackageJson)
      if (res) return res + fsPath.slice(file.length)
    }
  }

  const { file, postfix } = splitFileAndPostfix(fsPath)
  const res = tryCleanFsResolve(file, options, tryIndex, skipPackageJson)
  if (res) return res + postfix
}

const knownTsOutputRE = /\.(?:js|mjs|cjs|jsx)$/
const isPossibleTsOutput = (url: string): boolean => knownTsOutputRE.test(url)

function tryCleanFsResolve(
  file: string,
  options: InternalResolveOptions,
  tryIndex = true,
  skipPackageJson = false,
): string | undefined {
  const { tryPrefix, extensions, preserveSymlinks } = options

  // Optimization to get the real type or file type (directory, file, other)
  const fileResult = tryResolveRealFileOrType(file, options.preserveSymlinks)

  if (fileResult?.path) return fileResult.path

  let res: string | undefined

  // If path.dirname is a valid directory, try extensions and ts resolution logic
  const possibleJsToTs = isPossibleTsOutput(file)
  if (possibleJsToTs || options.extensions.length || tryPrefix) {
    const dirPath = path.dirname(file)
    if (isDirectory(dirPath)) {
      if (possibleJsToTs) {
        // try resolve .js, .mjs, .cjs or .jsx import to typescript file
        const fileExt = path.extname(file)
        const fileName = file.slice(0, -fileExt.length)
        if (
          (res = tryResolveRealFile(
            fileName + fileExt.replace('js', 'ts'),
            preserveSymlinks,
          ))
        )
          return res
        // for .js, also try .tsx
        if (
          fileExt === '.js' &&
          (res = tryResolveRealFile(fileName + '.tsx', preserveSymlinks))
        )
          return res
      }

      if (
        (res = tryResolveRealFileWithExtensions(
          file,
          extensions,
          preserveSymlinks,
        ))
      )
        return res

      if (tryPrefix) {
        const prefixed = `${dirPath}/${options.tryPrefix}${path.basename(file)}`

        if ((res = tryResolveRealFile(prefixed, preserveSymlinks))) return res

        if (
          (res = tryResolveRealFileWithExtensions(
            prefixed,
            extensions,
            preserveSymlinks,
          ))
        )
          return res
      }
    }
  }

  if (tryIndex && fileResult?.type === 'directory') {
    // Path points to a directory, check for package.json and entry and /index file
    const dirPath = file

    if (!skipPackageJson) {
      let pkgPath = `${dirPath}/package.json`
      try {
        if (fs.existsSync(pkgPath)) {
          if (!options.preserveSymlinks) {
            pkgPath = safeRealpathSync(pkgPath)
          }
          // path points to a node package
          const pkg = loadPackageData(pkgPath)
          return resolvePackageEntry(dirPath, pkg, options)
        }
      } catch (e) {
        // This check is best effort, so if an entry is not found, skip error for now
        if (e.code !== ERR_RESOLVE_PACKAGE_ENTRY_FAIL && e.code !== 'ENOENT')
          throw e
      }
    }

    if (
      (res = tryResolveRealFileWithExtensions(
        `${dirPath}/index`,
        extensions,
        preserveSymlinks,
      ))
    )
      return res

    if (tryPrefix) {
      if (
        (res = tryResolveRealFileWithExtensions(
          `${dirPath}/${options.tryPrefix}index`,
          extensions,
          preserveSymlinks,
        ))
      )
        return res
    }
  }
}

export function tryNodeResolve(
  id: string,
  importer: string | null | undefined,
  options: InternalResolveOptions,
  depsOptimizer?: DepsOptimizer,
  externalize?: boolean,
): PartialResolvedId | undefined {
  const { root, dedupe, isBuild, preserveSymlinks, packageCache } = options

  // check for deep import, e.g. "my-lib/foo"
  const deepMatch = deepImportRE.exec(id)
  // package name doesn't include postfixes
  // trim them to support importing package with queries (e.g. `import css from 'normalize.css?inline'`)
  const pkgId = deepMatch ? deepMatch[1] || deepMatch[2] : cleanUrl(id)

  let basedir: string
  if (dedupe.includes(pkgId)) {
    basedir = root
  } else if (
    importer &&
    path.isAbsolute(importer) &&
    // css processing appends `*` for importer
    (importer.endsWith('*') || fs.existsSync(cleanUrl(importer)))
  ) {
    basedir = path.dirname(importer)
  } else {
    basedir = root
  }

  const isModuleBuiltin = (id: string) => isBuiltin(options.builtins, id)

  let selfPkg = null
  if (!isModuleBuiltin(id) && !id.includes('\0') && bareImportRE.test(id)) {
    // check if it's a self reference dep.
    const selfPackageData = findNearestPackageData(basedir, packageCache)
    selfPkg =
      selfPackageData?.data.exports && selfPackageData.data.name === pkgId
        ? selfPackageData
        : null
  }

  const pkg =
    selfPkg ||
    resolvePackageData(pkgId, basedir, preserveSymlinks, packageCache)
  if (!pkg) {
    // if import can't be found, check if it's an optional peer dep.
    // if so, we can resolve to a special id that errors only when imported.
    if (
      basedir !== root && // root has no peer dep
      !isModuleBuiltin(id) &&
      !id.includes('\0') &&
      bareImportRE.test(id)
    ) {
      const mainPkg = findNearestMainPackageData(basedir, packageCache)?.data
      if (mainPkg) {
        const pkgName = getNpmPackageName(id)
        if (
          pkgName != null &&
          mainPkg.peerDependencies?.[pkgName] &&
          mainPkg.peerDependenciesMeta?.[pkgName]?.optional
        ) {
          return {
            id: `${optionalPeerDepId}:${id}:${mainPkg.name}`,
          }
        }
      }
    }
    return
  }

  const resolveId = deepMatch ? resolveDeepImport : resolvePackageEntry
  const unresolvedId = deepMatch ? '.' + id.slice(pkgId.length) : id

  let resolved = resolveId(unresolvedId, pkg, options)
  if (!resolved) {
    return
  }

  const processResult = (resolved: PartialResolvedId) => {
    if (!externalize) {
      return resolved
    }
    if (!canExternalizeFile(resolved.id)) {
      return resolved
    }

    let resolvedId = id
    if (
      deepMatch &&
      !pkg.data.exports &&
      path.extname(id) !== path.extname(resolved.id)
    ) {
      // id date-fns/locale
      // resolve.id ...date-fns/esm/locale/index.js
      const index = resolved.id.indexOf(id)
      if (index > -1) {
        resolvedId = resolved.id.slice(index)
        debug?.(
          `[processResult] ${colors.cyan(id)} -> ${colors.dim(resolvedId)}`,
        )
      }
    }
    return { ...resolved, id: resolvedId, external: true }
  }

  if (!options.idOnly && ((!options.scan && isBuild) || externalize)) {
    // Resolve package side effects for build so that rollup can better
    // perform tree-shaking
    return processResult({
      id: resolved,
      moduleSideEffects: pkg.hasSideEffects(resolved),
    })
  }

  if (
    !isInNodeModules(resolved) || // linked
    !depsOptimizer || // resolving before listening to the server
    options.scan // initial esbuild scan phase
  ) {
    return { id: resolved }
  }

  // if we reach here, it's a valid dep import that hasn't been optimized.
  const isJsType = isOptimizable(resolved, depsOptimizer.options)
  const exclude = depsOptimizer.options.exclude

  const skipOptimization =
    depsOptimizer.options.noDiscovery ||
    !isJsType ||
    (importer && isInNodeModules(importer)) ||
    exclude?.includes(pkgId) ||
    exclude?.includes(id) ||
    SPECIAL_QUERY_RE.test(resolved)

  if (skipOptimization) {
    // excluded from optimization
    // Inject a version query to npm deps so that the browser
    // can cache it without re-validation, but only do so for known js types.
    // otherwise we may introduce duplicated modules for externalized files
    // from pre-bundled deps.
    const versionHash = depsOptimizer.metadata.browserHash
    if (versionHash && isJsType) {
      resolved = injectQuery(resolved, `v=${versionHash}`)
    }
  } else {
    // this is a missing import, queue optimize-deps re-run and
    // get a resolved its optimized info
    const optimizedInfo = depsOptimizer.registerMissingImport(id, resolved)
    resolved = depsOptimizer.getOptimizedDepId(optimizedInfo)
  }

  return { id: resolved }
}

export async function tryOptimizedResolve(
  depsOptimizer: DepsOptimizer,
  id: string,
  importer?: string,
  preserveSymlinks?: boolean,
  packageCache?: PackageCache,
): Promise<string | undefined> {
  // TODO: we need to wait until scanning is done here as this function
  // is used in the preAliasPlugin to decide if an aliased dep is optimized,
  // and avoid replacing the bare import with the resolved path.
  // We should be able to remove this in the future
  await depsOptimizer.scanProcessing

  const metadata = depsOptimizer.metadata

  const depInfo = optimizedDepInfoFromId(metadata, id)
  if (depInfo) {
    return depsOptimizer.getOptimizedDepId(depInfo)
  }

  if (!importer) return

  // further check if id is imported by nested dependency
  let idPkgDir: string | undefined
  const nestedIdMatch = `> ${id}`

  for (const optimizedData of metadata.depInfoList) {
    if (!optimizedData.src) continue // Ignore chunks

    // check where "foo" is nested in "my-lib > foo"
    if (!optimizedData.id.endsWith(nestedIdMatch)) continue

    // lazily initialize idPkgDir
    if (idPkgDir == null) {
      const pkgName = getNpmPackageName(id)
      if (!pkgName) break
      idPkgDir = resolvePackageData(
        pkgName,
        importer,
        preserveSymlinks,
        packageCache,
      )?.dir
      // if still null, it likely means that this id isn't a dep for importer.
      // break to bail early
      if (idPkgDir == null) break
      idPkgDir = normalizePath(idPkgDir)
    }

    // match by src to correctly identify if id belongs to nested dependency
    if (optimizedData.src.startsWith(withTrailingSlash(idPkgDir))) {
      return depsOptimizer.getOptimizedDepId(optimizedData)
    }
  }
}

export function resolvePackageEntry(
  id: string,
  { dir, data, setResolvedCache, getResolvedCache }: PackageData,
  options: InternalResolveOptions,
): string | undefined {
  const { file: idWithoutPostfix, postfix } = splitFileAndPostfix(id)

  const cached = getResolvedCache('.', options)
  if (cached) {
    return cached + postfix
  }

  try {
    let entryPoint: string | undefined

    // resolve exports field with highest priority
    // using https://github.com/lukeed/resolve.exports
    if (data.exports) {
      entryPoint = resolveExportsOrImports(data, '.', options, 'exports')
    }

    // fallback to mainFields if still not resolved
    if (!entryPoint) {
      for (const field of options.mainFields) {
        if (field === 'browser') {
          entryPoint = tryResolveBrowserEntry(dir, data, options)
          if (entryPoint) {
            break
          }
        } else if (typeof data[field] === 'string') {
          entryPoint = data[field]
          break
        }
      }
    }
    entryPoint ||= data.main

    // try default entry when entry is not define
    // https://nodejs.org/api/modules.html#all-together
    const entryPoints = entryPoint
      ? [entryPoint]
      : ['index.js', 'index.json', 'index.node']

    for (let entry of entryPoints) {
      // make sure we don't get scripts when looking for sass
      let skipPackageJson = false
      if (
        options.mainFields[0] === 'sass' &&
        !options.extensions.includes(path.extname(entry))
      ) {
        entry = ''
        skipPackageJson = true
      } else {
        // resolve object browser field in package.json
        const { browser: browserField } = data
        if (options.mainFields.includes('browser') && isObject(browserField)) {
          entry = mapWithBrowserField(entry, browserField) || entry
        }
      }

      const entryPointPath = path.join(dir, entry)
      const resolvedEntryPoint = tryFsResolve(
        entryPointPath,
        options,
        true,
        skipPackageJson,
      )
      if (resolvedEntryPoint) {
        debug?.(
          `[package entry] ${colors.cyan(idWithoutPostfix)} -> ${colors.dim(
            resolvedEntryPoint,
          )}${postfix !== '' ? ` (postfix: ${postfix})` : ''}`,
        )
        setResolvedCache('.', resolvedEntryPoint, options)
        return resolvedEntryPoint + postfix
      }
    }
  } catch (e) {
    packageEntryFailure(id, e.message)
  }
  packageEntryFailure(id)
}

function packageEntryFailure(id: string, details?: string) {
  const err: any = new Error(
    `Failed to resolve entry for package "${id}". ` +
      `The package may have incorrect main/module/exports specified in its package.json` +
      (details ? ': ' + details : '.'),
  )
  err.code = ERR_RESOLVE_PACKAGE_ENTRY_FAIL
  throw err
}

function resolveExportsOrImports(
  pkg: PackageData['data'],
  key: string,
  options: InternalResolveOptions,
  type: 'imports' | 'exports',
) {
  const conditions = options.conditions.map((condition) => {
    if (condition === DEV_PROD_CONDITION) {
      return options.isProduction ? 'production' : 'development'
    }
    return condition
  })

  if (options.isRequire) {
    conditions.push('require')
  } else {
    conditions.push('import')
  }

  const fn = type === 'imports' ? imports : exports
  const result = fn(pkg, key, { conditions, unsafe: true })
  return result ? result[0] : undefined
}

function resolveDeepImport(
  id: string,
  { setResolvedCache, getResolvedCache, dir, data }: PackageData,
  options: InternalResolveOptions,
): string | undefined {
  const cache = getResolvedCache(id, options)
  if (cache) {
    return cache
  }

  let relativeId: string | undefined | void = id
  const { exports: exportsField, browser: browserField } = data

  // map relative based on exports data
  if (exportsField) {
    if (isObject(exportsField) && !Array.isArray(exportsField)) {
      // resolve without postfix (see #7098)
      const { file, postfix } = splitFileAndPostfix(relativeId)
      const exportsId = resolveExportsOrImports(data, file, options, 'exports')
      if (exportsId !== undefined) {
        relativeId = exportsId + postfix
      } else {
        relativeId = undefined
      }
    } else {
      // not exposed
      relativeId = undefined
    }
    if (!relativeId) {
      throw new Error(
        `Package subpath '${relativeId}' is not defined by "exports" in ` +
          `${path.join(dir, 'package.json')}.`,
      )
    }
  } else if (options.mainFields.includes('browser') && isObject(browserField)) {
    // resolve without postfix (see #7098)
    const { file, postfix } = splitFileAndPostfix(relativeId)
    const mapped = mapWithBrowserField(file, browserField)
    if (mapped) {
      relativeId = mapped + postfix
    } else if (mapped === false) {
      setResolvedCache(id, browserExternalId, options)
      return browserExternalId
    }
  }

  if (relativeId) {
    const resolved = tryFsResolve(
      path.join(dir, relativeId),
      options,
      !exportsField, // try index only if no exports field
    )
    if (resolved) {
      debug?.(
        `[node/deep-import] ${colors.cyan(id)} -> ${colors.dim(resolved)}`,
      )
      setResolvedCache(id, resolved, options)
      return resolved
    }
  }
}

function tryResolveBrowserMapping(
  id: string,
  importer: string | undefined,
  options: InternalResolveOptions,
  isFilePath: boolean,
  externalize?: boolean,
) {
  let res: string | undefined
  const pkg =
    importer &&
    findNearestPackageData(path.dirname(importer), options.packageCache)
  if (pkg && isObject(pkg.data.browser)) {
    const mapId = isFilePath ? './' + slash(path.relative(pkg.dir, id)) : id
    const browserMappedPath = mapWithBrowserField(mapId, pkg.data.browser)
    if (browserMappedPath) {
      if (
        (res = bareImportRE.test(browserMappedPath)
          ? tryNodeResolve(
              browserMappedPath,
              importer,
              options,
              undefined,
              undefined,
            )?.id
          : tryFsResolve(path.join(pkg.dir, browserMappedPath), options))
      ) {
        debug?.(`[browser mapped] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        let result: PartialResolvedId = { id: res }
        if (options.idOnly) {
          return result
        }
        if (!options.scan && options.isBuild) {
          const resPkg = findNearestPackageData(
            path.dirname(res),
            options.packageCache,
          )
          if (resPkg) {
            result = {
              id: res,
              moduleSideEffects: resPkg.hasSideEffects(res),
            }
          }
        }
        return externalize ? { ...result, external: true } : result
      }
    } else if (browserMappedPath === false) {
      return browserExternalId
    }
  }
}

function tryResolveBrowserEntry(
  dir: string,
  data: PackageData['data'],
  options: InternalResolveOptions,
) {
  // handle edge case with browser and module field semantics

  // check browser field
  // https://github.com/defunctzombie/package-browser-field-spec
  const browserEntry =
    typeof data.browser === 'string'
      ? data.browser
      : isObject(data.browser) && data.browser['.']
  if (browserEntry) {
    // check if the package also has a "module" field.
    if (
      !options.isRequire &&
      options.mainFields.includes('module') &&
      typeof data.module === 'string' &&
      data.module !== browserEntry
    ) {
      // if both are present, we may have a problem: some package points both
      // to ESM, with "module" targeting Node.js, while some packages points
      // "module" to browser ESM and "browser" to UMD/IIFE.
      // the heuristics here is to actually read the browser entry when
      // possible and check for hints of ESM. If it is not ESM, prefer "module"
      // instead; Otherwise, assume it's ESM and use it.
      const resolvedBrowserEntry = tryFsResolve(
        path.join(dir, browserEntry),
        options,
      )
      if (resolvedBrowserEntry) {
        const content = fs.readFileSync(resolvedBrowserEntry, 'utf-8')
        if (hasESMSyntax(content)) {
          // likely ESM, prefer browser
          return browserEntry
        } else {
          // non-ESM, UMD or IIFE or CJS(!!! e.g. firebase 7.x), prefer module
          return data.module
        }
      }
    } else {
      return browserEntry
    }
  }
}

/**
 * given a relative path in pkg dir,
 * return a relative path in pkg dir,
 * mapped with the "map" object
 *
 * - Returning `undefined` means there is no browser mapping for this id
 * - Returning `false` means this id is explicitly externalized for browser
 */
function mapWithBrowserField(
  relativePathInPkgDir: string,
  map: Record<string, string | false>,
): string | false | undefined {
  const normalizedPath = path.posix.normalize(relativePathInPkgDir)

  for (const key in map) {
    const normalizedKey = path.posix.normalize(key)
    if (
      normalizedPath === normalizedKey ||
      equalWithoutSuffix(normalizedPath, normalizedKey, '.js') ||
      equalWithoutSuffix(normalizedPath, normalizedKey, '/index.js')
    ) {
      return map[key]
    }
  }
}

function equalWithoutSuffix(path: string, key: string, suffix: string) {
  return key.endsWith(suffix) && key.slice(0, -suffix.length) === path
}

function tryResolveRealFile(
  file: string,
  preserveSymlinks?: boolean,
): string | undefined {
  const stat = tryStatSync(file)
  if (stat?.isFile()) return getRealPath(file, preserveSymlinks)
}

function tryResolveRealFileWithExtensions(
  filePath: string,
  extensions: string[],
  preserveSymlinks?: boolean,
): string | undefined {
  for (const ext of extensions) {
    const res = tryResolveRealFile(filePath + ext, preserveSymlinks)
    if (res) return res
  }
}

function tryResolveRealFileOrType(
  file: string,
  preserveSymlinks?: boolean,
): { path?: string; type: 'directory' | 'file' } | undefined {
  const fileStat = tryStatSync(file)
  if (fileStat?.isFile()) {
    return { path: getRealPath(file, preserveSymlinks), type: 'file' }
  }
  if (fileStat?.isDirectory()) {
    return { type: 'directory' }
  }
  return
}

function getRealPath(resolved: string, preserveSymlinks?: boolean): string {
  if (!preserveSymlinks) {
    resolved = safeRealpathSync(resolved)
  }
  return normalizePath(resolved)
}

function isDirectory(path: string): boolean {
  const stat = tryStatSync(path)
  return stat?.isDirectory() ?? false
}
