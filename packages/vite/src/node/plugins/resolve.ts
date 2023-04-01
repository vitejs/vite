import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import type { PartialResolvedId } from 'rollup'
import { exports, imports } from 'resolve.exports'
import { hasESMSyntax } from 'mlly'
import type { Plugin } from '../plugin'
import {
  CLIENT_ENTRY,
  DEFAULT_EXTENSIONS,
  DEFAULT_MAIN_FIELDS,
  DEP_VERSION_RE,
  ENV_ENTRY,
  FS_PREFIX,
  OPTIMIZABLE_ENTRY_RE,
  SPECIAL_QUERY_RE,
} from '../constants'
import {
  bareImportRE,
  cleanUrl,
  createDebugger,
  deepImportRE,
  fsPathFromId,
  injectQuery,
  isBuiltin,
  isDataUrl,
  isExternalUrl,
  isInNodeModules,
  isNonDriveRelativeAbsolutePath,
  isObject,
  isOptimizable,
  isTsRequest,
  isWindows,
  normalizePath,
  resolveFrom,
  safeRealpathSync,
  slash,
  tryStatSync,
} from '../utils'
import { optimizedDepInfoFromFile, optimizedDepInfoFromId } from '../optimizer'
import type { DepsOptimizer } from '../optimizer'
import type { SSROptions } from '..'
import type { PackageCache, PackageData } from '../packages'
import {
  findNearestMainPackageData,
  findNearestPackageData,
  loadPackageData,
  resolvePackageData,
} from '../packages'

const normalizedClientEntry = normalizePath(CLIENT_ENTRY)
const normalizedEnvEntry = normalizePath(ENV_ENTRY)

// special id for paths marked with browser: false
// https://github.com/defunctzombie/package-browser-field-spec#ignore-a-module
export const browserExternalId = '__vite-browser-external'
// special id for packages that are optional peer deps
export const optionalPeerDepId = '__vite-optional-peer-dep'

const subpathImportsPrefix = '#'

const startsWithWordCharRE = /^\w/

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true,
})

export interface ResolveOptions {
  /**
   * @default ['module', 'jsnext:main', 'jsnext']
   */
  mainFields?: string[]
  /**
   * @deprecated In future, `mainFields` should be used instead.
   * @default true
   */
  browserField?: boolean
  conditions?: string[]
  /**
   * @default ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
   */
  extensions?: string[]
  dedupe?: string[]
  /**
   * @default false
   */
  preserveSymlinks?: boolean
}

export interface InternalResolveOptions extends Required<ResolveOptions> {
  root: string
  isBuild: boolean
  isProduction: boolean
  ssrConfig?: SSROptions
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
  // #3040
  // when the importer is a ts module,
  // if the specifier requests a non-existent `.js/jsx/mjs/cjs` file,
  // should also try import from `.ts/tsx/mts/cts` source file as fallback.
  isFromTsImporter?: boolean
  tryEsmOnly?: boolean
  // True when resolving during the scan phase to discover dependencies
  scan?: boolean
  // Appends ?__vite_skip_optimization to the resolved id if shouldn't be optimized
  ssrOptimizeCheck?: boolean
  // Resolve using esbuild deps optimization
  getDepsOptimizer?: (ssr: boolean) => DepsOptimizer | undefined
  shouldExternalize?: (id: string) => boolean | undefined
}

export function resolvePlugin(resolveOptions: InternalResolveOptions): Plugin {
  const {
    root,
    isProduction,
    asSrc,
    ssrConfig,
    preferRelative = false,
  } = resolveOptions

  const { target: ssrTarget, noExternal: ssrNoExternal } = ssrConfig ?? {}

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

      const ssr = resolveOpts?.ssr === true

      // We need to delay depsOptimizer until here instead of passing it as an option
      // the resolvePlugin because the optimizer is created on server listen during dev
      const depsOptimizer = resolveOptions.getDepsOptimizer?.(ssr)

      if (id.startsWith(browserExternalId)) {
        return id
      }

      const targetWeb = !ssr || ssrTarget === 'webworker'

      // this is passed by @rollup/plugin-commonjs
      const isRequire: boolean =
        resolveOpts?.custom?.['node-resolve']?.isRequire ?? false

      const options: InternalResolveOptions = {
        isRequire,
        ...resolveOptions,
        scan: resolveOpts?.scan ?? resolveOptions.scan,
      }

      const resolvedImports = resolveSubpathImports(
        id,
        importer,
        options,
        targetWeb,
      )
      if (resolvedImports) {
        id = resolvedImports
      }

      if (importer) {
        if (
          isTsRequest(importer) ||
          resolveOpts.custom?.depScan?.loader?.startsWith('ts')
        ) {
          options.isFromTsImporter = true
        } else {
          const moduleLang = this.getModuleInfo(importer)?.meta?.vite?.lang
          options.isFromTsImporter = moduleLang && isTsRequest(`.${moduleLang}`)
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
        const fsPath = fsPathFromId(id)
        res = tryFsResolve(fsPath, options)
        isDebug && debug(`[@fs] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404
        return ensureVersionQuery(res || fsPath, id, options, depsOptimizer)
      }

      // URL
      // /foo -> /fs-root/foo
      if (asSrc && id[0] === '/' && (rootInRoot || !id.startsWith(root))) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath, options))) {
          isDebug && debug(`[url] ${colors.cyan(id)} -> ${colors.dim(res)}`)
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
          if (!normalizedFsPath.match(DEP_VERSION_RE)) {
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
          targetWeb &&
          options.browserField &&
          (res = tryResolveBrowserMapping(fsPath, importer, options, true))
        ) {
          return res
        }

        if ((res = tryFsResolve(fsPath, options))) {
          const resPkg = findNearestPackageData(
            path.dirname(res),
            options.packageCache,
          )
          res = ensureVersionQuery(res, id, options, depsOptimizer)
          isDebug &&
            debug(`[relative] ${colors.cyan(id)} -> ${colors.dim(res)}`)

          return resPkg
            ? {
                id: res,
                moduleSideEffects: resPkg.hasSideEffects(res),
              }
            : res
        }
      }

      // drive relative fs paths (only windows)
      if (isWindows && id[0] === '/') {
        const basedir = importer ? path.dirname(importer) : process.cwd()
        const fsPath = path.resolve(basedir, id)
        if ((res = tryFsResolve(fsPath, options))) {
          isDebug &&
            debug(`[drive-relative] ${colors.cyan(id)} -> ${colors.dim(res)}`)
          return ensureVersionQuery(res, id, options, depsOptimizer)
        }
      }

      // absolute fs paths
      if (
        isNonDriveRelativeAbsolutePath(id) &&
        (res = tryFsResolve(id, options))
      ) {
        isDebug && debug(`[fs] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        return ensureVersionQuery(res, id, options, depsOptimizer)
      }

      // external
      if (isExternalUrl(id)) {
        return {
          id,
          external: true,
        }
      }

      // data uri: pass through (this only happens during build and will be
      // handled by dedicated plugin)
      if (isDataUrl(id)) {
        return null
      }

      // bare package imports, perform node resolve
      if (bareImportRE.test(id)) {
        const external = options.shouldExternalize?.(id)
        if (
          !external &&
          asSrc &&
          depsOptimizer &&
          !options.scan &&
          (res = await tryOptimizedResolve(depsOptimizer, id, importer))
        ) {
          return res
        }

        if (
          targetWeb &&
          options.browserField &&
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
          (res = tryNodeResolve(
            id,
            importer,
            options,
            targetWeb,
            depsOptimizer,
            ssr,
            external,
          ))
        ) {
          return res
        }

        // node built-ins.
        // externalize if building for SSR, otherwise redirect to empty module
        if (isBuiltin(id)) {
          if (ssr) {
            if (ssrNoExternal === true) {
              let message = `Cannot bundle Node.js built-in "${id}"`
              if (importer) {
                message += ` imported from "${path.relative(
                  process.cwd(),
                  importer,
                )}"`
              }
              message += `. Consider disabling ssr.noExternal or remove the built-in dependency.`
              this.error(message)
            }

            return {
              id,
              external: true,
            }
          } else {
            if (!asSrc) {
              debug(
                `externalized node built-in "${id}" to empty module. ` +
                  `(imported by: ${colors.white(colors.dim(importer))})`,
              )
            }
            return isProduction
              ? browserExternalId
              : `${browserExternalId}:${id}`
          }
        }
      }

      isDebug && debug(`[fallthrough] ${colors.dim(id)}`)
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
    throw new Error(\`Module "${id}" has been externalized for browser compatibility. Cannot access "${id}.\${key}" in client code.  See http://vitejs.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.\`)
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
  targetWeb: boolean,
) {
  if (!importer || !id.startsWith(subpathImportsPrefix)) return
  const basedir = path.dirname(importer)
  const pkgData = findNearestPackageData(basedir, options.packageCache)
  if (!pkgData) return

  let importsPath = resolveExportsOrImports(
    pkgData.data,
    id,
    options,
    targetWeb,
    'imports',
  )

  if (importsPath?.[0] === '.') {
    importsPath = path.relative(basedir, path.join(pkgData.dir, importsPath))

    if (importsPath[0] !== '.') {
      importsPath = `./${importsPath}`
    }
  }

  return importsPath
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

    if (isNodeModule && !resolved.match(DEP_VERSION_RE)) {
      const versionHash = depsOptimizer.metadata.browserHash
      if (versionHash && isOptimizable(resolved, depsOptimizer.options)) {
        resolved = injectQuery(resolved, `v=${versionHash}`)
      }
    }
  }
  return resolved
}

function splitFileAndPostfix(path: string) {
  const file = cleanUrl(path)
  return { file, postfix: path.slice(file.length) }
}

function tryFsResolve(
  fsPath: string,
  options: InternalResolveOptions,
  tryIndex = true,
  targetWeb = true,
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
      const res = tryCleanFsResolve(
        file,
        options,
        tryIndex,
        targetWeb,
        skipPackageJson,
      )
      if (res) return res + fsPath.slice(file.length)
    }
  }

  const { file, postfix } = splitFileAndPostfix(fsPath)
  const res = tryCleanFsResolve(
    file,
    options,
    tryIndex,
    targetWeb,
    skipPackageJson,
  )
  if (res) return res + postfix
}

const knownTsOutputRE = /\.(?:js|mjs|cjs|jsx)$/
const isPossibleTsOutput = (url: string): boolean => knownTsOutputRE.test(url)

function tryCleanFsResolve(
  file: string,
  options: InternalResolveOptions,
  tryIndex = true,
  targetWeb = true,
  skipPackageJson = false,
): string | undefined {
  const { tryPrefix, extensions, preserveSymlinks } = options

  const fileStat = tryStatSync(file)

  // Try direct match first
  if (fileStat?.isFile()) return getRealPath(file, options.preserveSymlinks)

  let res: string | undefined

  // If path.dirname is a valid directory, try extensions and ts resolution logic
  const possibleJsToTs = options.isFromTsImporter && isPossibleTsOutput(file)
  if (possibleJsToTs || extensions.length || tryPrefix) {
    const dirPath = path.dirname(file)
    const dirStat = tryStatSync(dirPath)
    if (dirStat?.isDirectory()) {
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

  if (tryIndex && fileStat) {
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
          return resolvePackageEntry(dirPath, pkg, targetWeb, options)
        }
      } catch (e) {
        if (e.code !== 'ENOENT') throw e
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

function tryResolveRealFile(
  file: string,
  preserveSymlinks: boolean,
): string | undefined {
  const stat = tryStatSync(file)
  if (stat?.isFile()) return getRealPath(file, preserveSymlinks)
}

function tryResolveRealFileWithExtensions(
  filePath: string,
  extensions: string[],
  preserveSymlinks: boolean,
): string | undefined {
  for (const ext of extensions) {
    const res = tryResolveRealFile(filePath + ext, preserveSymlinks)
    if (res) return res
  }
}

export type InternalResolveOptionsWithOverrideConditions =
  InternalResolveOptions & {
    /**
     * @deprecated In future, `conditions` will work like this.
     * @internal
     */
    overrideConditions?: string[]
  }

export function tryNodeResolve(
  id: string,
  importer: string | null | undefined,
  options: InternalResolveOptionsWithOverrideConditions,
  targetWeb: boolean,
  depsOptimizer?: DepsOptimizer,
  ssr: boolean = false,
  externalize?: boolean,
  allowLinkedExternal: boolean = true,
): PartialResolvedId | undefined {
  const { root, dedupe, isBuild, preserveSymlinks, packageCache } = options

  // check for deep import, e.g. "my-lib/foo"
  const deepMatch = id.match(deepImportRE)
  const pkgId = deepMatch ? deepMatch[1] || deepMatch[2] : id

  let basedir: string
  if (dedupe?.includes(pkgId)) {
    basedir = root
  } else if (
    importer &&
    path.isAbsolute(importer) &&
    fs.existsSync(cleanUrl(importer))
  ) {
    basedir = path.dirname(importer)
  } else {
    basedir = root
  }

  const pkg = resolvePackageData(pkgId, basedir, preserveSymlinks, packageCache)
  if (!pkg) {
    // if import can't be found, check if it's an optional peer dep.
    // if so, we can resolve to a special id that errors only when imported.
    if (
      basedir !== root && // root has no peer dep
      !isBuiltin(id) &&
      !id.includes('\0') &&
      bareImportRE.test(id)
    ) {
      const mainPkg = findNearestMainPackageData(basedir, packageCache)?.data
      if (mainPkg) {
        if (
          mainPkg.peerDependencies?.[id] &&
          mainPkg.peerDependenciesMeta?.[id]?.optional
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
  const unresolvedId = deepMatch ? '.' + id.slice(pkgId.length) : pkgId

  let resolved: string | undefined
  try {
    resolved = resolveId(unresolvedId, pkg, targetWeb, options)
  } catch (err) {
    if (!options.tryEsmOnly) {
      throw err
    }
  }
  if (!resolved && options.tryEsmOnly) {
    resolved = resolveId(unresolvedId, pkg, targetWeb, {
      ...options,
      isRequire: false,
      mainFields: DEFAULT_MAIN_FIELDS,
      extensions: DEFAULT_EXTENSIONS,
    })
  }
  if (!resolved) {
    return
  }

  const processResult = (resolved: PartialResolvedId) => {
    if (!externalize) {
      return resolved
    }
    // don't external symlink packages
    if (!allowLinkedExternal && !isInNodeModules(resolved.id)) {
      return resolved
    }
    const resolvedExt = path.extname(resolved.id)
    // don't external non-js imports
    if (
      resolvedExt &&
      resolvedExt !== '.js' &&
      resolvedExt !== '.mjs' &&
      resolvedExt !== '.cjs'
    ) {
      return resolved
    }
    let resolvedId = id
    if (deepMatch && !pkg?.data.exports && path.extname(id) !== resolvedExt) {
      resolvedId = resolved.id.slice(resolved.id.indexOf(id))
      isDebug &&
        debug(`[processResult] ${colors.cyan(id)} -> ${colors.dim(resolvedId)}`)
    }
    return { ...resolved, id: resolvedId, external: true }
  }

  if ((isBuild && !depsOptimizer) || externalize) {
    // Resolve package side effects for build so that rollup can better
    // perform tree-shaking
    return processResult({
      id: resolved,
      moduleSideEffects: pkg.hasSideEffects(resolved),
    })
  }

  const ext = path.extname(resolved)

  if (
    !options.ssrOptimizeCheck &&
    (!isInNodeModules(resolved) || // linked
      !depsOptimizer || // resolving before listening to the server
      options.scan) // initial esbuild scan phase
  ) {
    return { id: resolved }
  }

  // if we reach here, it's a valid dep import that hasn't been optimized.
  const isJsType = depsOptimizer
    ? isOptimizable(resolved, depsOptimizer.options)
    : OPTIMIZABLE_ENTRY_RE.test(resolved)

  let exclude = depsOptimizer?.options.exclude
  let include = depsOptimizer?.options.include
  if (options.ssrOptimizeCheck) {
    // we don't have the depsOptimizer
    exclude = options.ssrConfig?.optimizeDeps?.exclude
    include = options.ssrConfig?.optimizeDeps?.include
  }

  const skipOptimization =
    !isJsType ||
    (importer && isInNodeModules(importer)) ||
    exclude?.includes(pkgId) ||
    exclude?.includes(id) ||
    SPECIAL_QUERY_RE.test(resolved) ||
    // During dev SSR, we don't have a way to reload the module graph if
    // a non-optimized dep is found. So we need to skip optimization here.
    // The only optimized deps are the ones explicitly listed in the config.
    (!options.ssrOptimizeCheck && !isBuild && ssr) ||
    // Only optimize non-external CJS deps during SSR by default
    (ssr &&
      !(
        ext === '.cjs' ||
        (ext === '.js' &&
          findNearestPackageData(path.dirname(resolved), options.packageCache)
            ?.data.type !== 'module')
      ) &&
      !(include?.includes(pkgId) || include?.includes(id)))

  if (options.ssrOptimizeCheck) {
    return {
      id: skipOptimization
        ? injectQuery(resolved, `__vite_skip_optimization`)
        : resolved,
    }
  }

  if (skipOptimization) {
    // excluded from optimization
    // Inject a version query to npm deps so that the browser
    // can cache it without re-validation, but only do so for known js types.
    // otherwise we may introduce duplicated modules for externalized files
    // from pre-bundled deps.
    if (!isBuild) {
      const versionHash = depsOptimizer!.metadata.browserHash
      if (versionHash && isJsType) {
        resolved = injectQuery(resolved, `v=${versionHash}`)
      }
    }
  } else {
    // this is a missing import, queue optimize-deps re-run and
    // get a resolved its optimized info
    const optimizedInfo = depsOptimizer!.registerMissingImport(id, resolved)
    resolved = depsOptimizer!.getOptimizedDepId(optimizedInfo)
  }

  if (isBuild) {
    // Resolve package side effects for build so that rollup can better
    // perform tree-shaking
    return {
      id: resolved,
      moduleSideEffects: pkg.hasSideEffects(resolved),
    }
  } else {
    return { id: resolved! }
  }
}

export async function tryOptimizedResolve(
  depsOptimizer: DepsOptimizer,
  id: string,
  importer?: string,
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
  let resolvedSrc: string | undefined

  for (const optimizedData of metadata.depInfoList) {
    if (!optimizedData.src) continue // Ignore chunks

    const pkgPath = optimizedData.id
    // check for scenarios, e.g.
    //   pkgPath  => "my-lib > foo"
    //   id       => "foo"
    // this narrows the need to do a full resolve
    if (!pkgPath.endsWith(id)) continue

    // lazily initialize resolvedSrc
    if (resolvedSrc == null) {
      try {
        // this may throw errors if unable to resolve, e.g. aliased id
        resolvedSrc = normalizePath(resolveFrom(id, path.dirname(importer)))
      } catch {
        // this is best-effort only so swallow errors
        break
      }
    }

    // match by src to correctly identify if id belongs to nested dependency
    if (optimizedData.src === resolvedSrc) {
      return depsOptimizer.getOptimizedDepId(optimizedData)
    }
  }
}

export function resolvePackageEntry(
  id: string,
  { dir, data, setResolvedCache, getResolvedCache }: PackageData,
  targetWeb: boolean,
  options: InternalResolveOptions,
): string | undefined {
  const cached = getResolvedCache('.', targetWeb)
  if (cached) {
    return cached
  }
  try {
    let entryPoint: string | undefined

    // resolve exports field with highest priority
    // using https://github.com/lukeed/resolve.exports
    if (data.exports) {
      entryPoint = resolveExportsOrImports(
        data,
        '.',
        options,
        targetWeb,
        'exports',
      )
    }

    const resolvedFromExports = !!entryPoint

    // if exports resolved to .mjs, still resolve other fields.
    // This is because .mjs files can technically import .cjs files which would
    // make them invalid for pure ESM environments - so if other module/browser
    // fields are present, prioritize those instead.
    if (
      targetWeb &&
      options.browserField &&
      (!entryPoint || entryPoint.endsWith('.mjs'))
    ) {
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
              entryPoint = browserEntry
            } else {
              // non-ESM, UMD or IIFE or CJS(!!! e.g. firebase 7.x), prefer module
              entryPoint = data.module
            }
          }
        } else {
          entryPoint = browserEntry
        }
      }
    }

    // fallback to mainFields if still not resolved
    // TODO: review if `.mjs` check is still needed
    if (!resolvedFromExports && (!entryPoint || entryPoint.endsWith('.mjs'))) {
      for (const field of options.mainFields) {
        if (field === 'browser') continue // already checked above
        if (typeof data[field] === 'string') {
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
        if (targetWeb && options.browserField && isObject(browserField)) {
          entry = mapWithBrowserField(entry, browserField) || entry
        }
      }

      const entryPointPath = path.join(dir, entry)
      const resolvedEntryPoint = tryFsResolve(
        entryPointPath,
        options,
        true,
        true,
        skipPackageJson,
      )
      if (resolvedEntryPoint) {
        isDebug &&
          debug(
            `[package entry] ${colors.cyan(id)} -> ${colors.dim(
              resolvedEntryPoint,
            )}`,
          )
        setResolvedCache('.', resolvedEntryPoint, targetWeb)
        return resolvedEntryPoint
      }
    }
  } catch (e) {
    packageEntryFailure(id, e.message)
  }
  packageEntryFailure(id)
}

function packageEntryFailure(id: string, details?: string) {
  throw new Error(
    `Failed to resolve entry for package "${id}". ` +
      `The package may have incorrect main/module/exports specified in its package.json` +
      (details ? ': ' + details : '.'),
  )
}

const conditionalConditions = new Set(['production', 'development', 'module'])

function resolveExportsOrImports(
  pkg: PackageData['data'],
  key: string,
  options: InternalResolveOptionsWithOverrideConditions,
  targetWeb: boolean,
  type: 'imports' | 'exports',
) {
  const overrideConditions = options.overrideConditions
    ? new Set(options.overrideConditions)
    : undefined

  const conditions = []
  if (
    (!overrideConditions || overrideConditions.has('production')) &&
    options.isProduction
  ) {
    conditions.push('production')
  }
  if (
    (!overrideConditions || overrideConditions.has('development')) &&
    !options.isProduction
  ) {
    conditions.push('development')
  }
  if (
    (!overrideConditions || overrideConditions.has('module')) &&
    !options.isRequire
  ) {
    conditions.push('module')
  }
  if (options.overrideConditions) {
    conditions.push(
      ...options.overrideConditions.filter((condition) =>
        conditionalConditions.has(condition),
      ),
    )
  } else if (options.conditions.length > 0) {
    conditions.push(...options.conditions)
  }

  const fn = type === 'imports' ? imports : exports
  const result = fn(pkg, key, {
    browser: targetWeb && !conditions.includes('node'),
    require: options.isRequire && !conditions.includes('import'),
    conditions,
  })

  return result ? result[0] : undefined
}

function resolveDeepImport(
  id: string,
  {
    webResolvedImports,
    setResolvedCache,
    getResolvedCache,
    dir,
    data,
  }: PackageData,
  targetWeb: boolean,
  options: InternalResolveOptions,
): string | undefined {
  const cache = getResolvedCache(id, targetWeb)
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
      const exportsId = resolveExportsOrImports(
        data,
        file,
        options,
        targetWeb,
        'exports',
      )
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
  } else if (targetWeb && options.browserField && isObject(browserField)) {
    // resolve without postfix (see #7098)
    const { file, postfix } = splitFileAndPostfix(relativeId)
    const mapped = mapWithBrowserField(file, browserField)
    if (mapped) {
      relativeId = mapped + postfix
    } else if (mapped === false) {
      return (webResolvedImports[id] = browserExternalId)
    }
  }

  if (relativeId) {
    const resolved = tryFsResolve(
      path.join(dir, relativeId),
      options,
      !exportsField, // try index only if no exports field
      targetWeb,
    )
    if (resolved) {
      isDebug &&
        debug(
          `[node/deep-import] ${colors.cyan(id)} -> ${colors.dim(resolved)}`,
        )
      setResolvedCache(id, resolved, targetWeb)
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
          ? tryNodeResolve(browserMappedPath, importer, options, true)?.id
          : tryFsResolve(path.join(pkg.dir, browserMappedPath), options))
      ) {
        isDebug &&
          debug(`[browser mapped] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        const resPkg = findNearestPackageData(
          path.dirname(res),
          options.packageCache,
        )
        const result = resPkg
          ? {
              id: res,
              moduleSideEffects: resPkg.hasSideEffects(res),
            }
          : { id: res }
        return externalize ? { ...result, external: true } : result
      }
    } else if (browserMappedPath === false) {
      return browserExternalId
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

function getRealPath(resolved: string, preserveSymlinks?: boolean): string {
  if (!preserveSymlinks && browserExternalId !== resolved) {
    resolved = safeRealpathSync(resolved)
  }
  return normalizePath(resolved)
}
