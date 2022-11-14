import fs from 'node:fs'
import path from 'node:path'
import { Module } from 'node:module'
import colors from 'picocolors'
import type { PartialResolvedId } from 'rollup'
import { resolveExports } from 'resolve.exports'
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
  SPECIAL_QUERY_RE
} from '../constants'
import {
  bareImportRE,
  cleanUrl,
  createDebugger,
  ensureVolumeInPath,
  fsPathFromId,
  getPotentialTsSrcPaths,
  injectQuery,
  isBuiltin,
  isDataUrl,
  isExternalUrl,
  isFileReadable,
  isNonDriveRelativeAbsolutePath,
  isObject,
  isOptimizable,
  isPossibleTsOutput,
  isTsRequest,
  isWindows,
  lookupFile,
  nestedResolveFrom,
  normalizePath,
  resolveFrom,
  slash
} from '../utils'
import { optimizedDepInfoFromFile, optimizedDepInfoFromId } from '../optimizer'
import type { DepsOptimizer } from '../optimizer'
import type { SSROptions } from '..'
import type { PackageCache, PackageData } from '../packages'
import {
  findPackageJson,
  isWorkspaceRoot,
  loadPackageData,
  resolvePackageData
} from '../packages'
import { isWorkerRequest } from './worker'

const normalizedClientEntry = normalizePath(CLIENT_ENTRY)
const normalizedEnvEntry = normalizePath(ENV_ENTRY)

// special id for paths marked with browser: false
// https://github.com/defunctzombie/package-browser-field-spec#ignore-a-module
export const browserExternalId = '__vite-browser-external'
// special id for packages that are optional peer deps
export const optionalPeerDepId = '__vite-optional-peer-dep'

const nodeModulesInPathRE = /(?:^|\/)node_modules\//

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

export interface ResolveOptions {
  mainFields?: string[]
  /**
   * @deprecated In future, `mainFields` should be used instead.
   * @default true
   */
  browserField?: boolean
  conditions?: string[]
  extensions?: string[]
  dedupe?: string[]
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
  skipPackageJson?: boolean
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
  // Check this resolve is called from `hookNodeResolve` in SSR
  isHookNodeResolve?: boolean
  overrideConditions?: string[]
}

export function resolvePlugin(resolveOptions: InternalResolveOptions): Plugin {
  const {
    root,
    isProduction,
    asSrc,
    ssrConfig,
    preferRelative = false
  } = resolveOptions

  const { target: ssrTarget, noExternal: ssrNoExternal } = ssrConfig ?? {}

  return {
    name: 'vite:resolve',

    async resolveId(id, importer, resolveOpts) {
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
        scan: resolveOpts?.scan ?? resolveOptions.scan
      }

      if (importer) {
        const _importer = isWorkerRequest(importer)
          ? splitFileAndPostfix(importer).file
          : importer
        if (
          isTsRequest(_importer) ||
          resolveOpts.custom?.depScan?.loader?.startsWith('ts')
        ) {
          options.isFromTsImporter = true
        } else {
          const moduleLang = this.getModuleInfo(_importer)?.meta?.vite?.lang
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
          : normalizePath(ensureVolumeInPath(path.resolve(root, id.slice(1))))
        return optimizedPath
      }

      const ensureVersionQuery = (resolved: string): string => {
        if (
          !options.isBuild &&
          depsOptimizer &&
          !(
            resolved === normalizedClientEntry ||
            resolved === normalizedEnvEntry
          )
        ) {
          // Ensure that direct imports of node_modules have the same version query
          // as if they would have been imported through a bare import
          // Use the original id to do the check as the resolved id may be the real
          // file path after symlinks resolution
          const isNodeModule =
            nodeModulesInPathRE.test(normalizePath(id)) ||
            nodeModulesInPathRE.test(normalizePath(resolved))

          if (isNodeModule && !resolved.match(DEP_VERSION_RE)) {
            const versionHash = depsOptimizer.metadata.browserHash
            if (versionHash && isOptimizable(resolved, depsOptimizer.options)) {
              resolved = injectQuery(resolved, `v=${versionHash}`)
            }
          }
        }
        return resolved
      }

      // explicit fs paths that starts with /@fs/*
      if (asSrc && id.startsWith(FS_PREFIX)) {
        const fsPath = fsPathFromId(id)
        res = tryFsResolve(fsPath, options)
        isDebug && debug(`[@fs] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404
        return ensureVersionQuery(res || fsPath)
      }

      // URL
      // /foo -> /fs-root/foo
      if (asSrc && id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath, options))) {
          isDebug && debug(`[url] ${colors.cyan(id)} -> ${colors.dim(res)}`)
          return ensureVersionQuery(res)
        }
      }

      // relative
      if (
        id.startsWith('.') ||
        ((preferRelative || importer?.endsWith('.html')) && /^\w/.test(id))
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
              normalizedFsPath
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
          res = ensureVersionQuery(res)
          isDebug &&
            debug(`[relative] ${colors.cyan(id)} -> ${colors.dim(res)}`)
          const pkg = importer != null && idToPkgMap.get(importer)
          if (pkg) {
            idToPkgMap.set(res, pkg)
            return {
              id: res,
              moduleSideEffects: pkg.hasSideEffects(res)
            }
          }
          return res
        }
      }

      // drive relative fs paths (only windows)
      if (isWindows && id.startsWith('/')) {
        const basedir = importer ? path.dirname(importer) : process.cwd()
        const fsPath = path.resolve(basedir, id)
        if ((res = tryFsResolve(fsPath, options))) {
          isDebug &&
            debug(`[drive-relative] ${colors.cyan(id)} -> ${colors.dim(res)}`)
          return ensureVersionQuery(res)
        }
      }

      // absolute fs paths
      if (
        isNonDriveRelativeAbsolutePath(id) &&
        (res = tryFsResolve(id, options))
      ) {
        isDebug && debug(`[fs] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        return ensureVersionQuery(res)
      }

      // external
      if (isExternalUrl(id)) {
        return {
          id,
          external: true
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
            external
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
            external
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
                  importer
                )}"`
              }
              message += `. Consider disabling ssr.noExternal or remove the built-in dependency.`
              this.error(message)
            }

            return {
              id,
              external: true
            }
          } else {
            if (!asSrc) {
              debug(
                `externalized node built-in "${id}" to empty module. ` +
                  `(imported by: ${colors.white(colors.dim(importer))})`
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
    throw new Error(\`Module "${id}" has been externalized for browser compatibility. Cannot access "${id}.\${key}" in client code.\`)
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
    }
  }
}

function splitFileAndPostfix(path: string) {
  let file = path
  let postfix = ''

  let postfixIndex = path.indexOf('?')
  if (postfixIndex < 0) {
    postfixIndex = path.indexOf('#')
  }
  if (postfixIndex > 0) {
    file = path.slice(0, postfixIndex)
    postfix = path.slice(postfixIndex)
  }
  return { file, postfix }
}

function tryFsResolve(
  fsPath: string,
  options: InternalResolveOptions,
  tryIndex = true,
  targetWeb = true
): string | undefined {
  const { file, postfix } = splitFileAndPostfix(fsPath)

  let res: string | undefined

  // if there is a postfix, try resolving it as a complete path first (#4703)
  if (
    postfix &&
    (res = tryResolveFile(
      fsPath,
      '',
      options,
      false,
      targetWeb,
      options.tryPrefix,
      options.skipPackageJson
    ))
  ) {
    return res
  }

  if (
    (res = tryResolveFile(
      file,
      postfix,
      options,
      false,
      targetWeb,
      options.tryPrefix,
      options.skipPackageJson
    ))
  ) {
    return res
  }

  for (const ext of options.extensions) {
    if (
      postfix &&
      (res = tryResolveFile(
        fsPath + ext,
        '',
        options,
        false,
        targetWeb,
        options.tryPrefix,
        options.skipPackageJson
      ))
    ) {
      return res
    }

    if (
      (res = tryResolveFile(
        file + ext,
        postfix,
        options,
        false,
        targetWeb,
        options.tryPrefix,
        options.skipPackageJson
      ))
    ) {
      return res
    }
  }

  if (!tryIndex) {
    return
  }

  if (
    postfix &&
    (res = tryResolveFile(
      fsPath,
      '',
      options,
      true,
      targetWeb,
      options.tryPrefix,
      options.skipPackageJson
    ))
  ) {
    return res
  }

  if (
    (res = tryResolveFile(
      file,
      postfix,
      options,
      true,
      targetWeb,
      options.tryPrefix,
      options.skipPackageJson
    ))
  ) {
    return res
  }
}

function tryResolveFile(
  file: string,
  postfix: string,
  options: InternalResolveOptions,
  tryIndex: boolean,
  targetWeb: boolean,
  tryPrefix?: string,
  skipPackageJson?: boolean
): string | undefined {
  if (isFileReadable(file)) {
    if (!fs.statSync(file).isDirectory()) {
      return getRealPath(file, options.preserveSymlinks) + postfix
    } else if (tryIndex) {
      if (!skipPackageJson) {
        const pkgPath = file + '/package.json'
        try {
          // path points to a node package
          const pkg = loadPackageData(pkgPath, options.preserveSymlinks)
          const resolved = resolvePackageEntry(file, pkg, targetWeb, options)
          return resolved
        } catch (e) {
          if (e.code !== 'ENOENT') {
            throw e
          }
        }
      }
      const indexFile = tryIndexFile(file, targetWeb, options)
      if (indexFile) {
        return indexFile + postfix
      }
    }
  }

  const tryTsExtension = options.isFromTsImporter && isPossibleTsOutput(file)
  if (tryTsExtension) {
    const tsSrcPaths = getPotentialTsSrcPaths(file)
    for (const srcPath of tsSrcPaths) {
      const res = tryResolveFile(
        srcPath,
        postfix,
        options,
        tryIndex,
        targetWeb,
        tryPrefix,
        skipPackageJson
      )
      if (res) return res
    }
    return
  }

  if (tryPrefix) {
    const prefixed = `${path.dirname(file)}/${tryPrefix}${path.basename(file)}`
    return tryResolveFile(prefixed, postfix, options, tryIndex, targetWeb)
  }
}

function tryIndexFile(
  dir: string,
  targetWeb: boolean,
  options: InternalResolveOptions
) {
  if (!options.skipPackageJson) {
    options = { ...options, skipPackageJson: true }
  }
  return tryFsResolve(dir + '/index', options, false, targetWeb)
}

export const idToPkgMap = new Map<string, PackageData>()

const lookupNodeModules = (Module as any)._nodeModulePaths as {
  (cwd: string): string[]
}

export function tryNodeResolve(
  id: string,
  importer: string | null | undefined,
  options: InternalResolveOptions,
  targetWeb: boolean,
  depsOptimizer?: DepsOptimizer,
  ssr?: boolean,
  externalize?: boolean,
  allowLinkedExternal: boolean = true
): PartialResolvedId | undefined {
  const { root, dedupe, isBuild, preserveSymlinks, packageCache } = options

  ssr ??= false

  // split id by last '>' for nested selected packages, for example:
  // 'foo > bar > baz' => 'foo > bar' & 'baz'
  // 'foo'             => ''          & 'foo'
  const lastArrowIndex = id.lastIndexOf('>')
  const nestedRoot = id.substring(0, lastArrowIndex).trim()

  if (lastArrowIndex !== -1) {
    id = id.substring(lastArrowIndex + 1).trim()
  }

  const basePkgId = id.split('/', id[0] === '@' ? 2 : 1).join('/')

  let basedir: string
  if (dedupe?.includes(basePkgId)) {
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

  // resolve a chain of packages notated by '>' in the id
  if (nestedRoot) {
    basedir = nestedResolveFrom(nestedRoot, basedir, preserveSymlinks)
  }

  let resolvedPkg: PackageData | undefined
  let resolvedPkgId: string | undefined
  let resolvedPkgType: string | undefined
  let resolvedId: string | undefined
  let resolver: typeof resolvePackageEntry

  const nodeModules = lookupNodeModules(basedir)
  for (const nodeModulesDir of nodeModules) {
    if (!fs.existsSync(nodeModulesDir)) {
      continue
    }

    const entryPath = path.join(nodeModulesDir, id)
    const nearestPkgPath = findPackageJson(entryPath)
    if (nearestPkgPath) {
      resolvedPkg = loadPackageData(
        nearestPkgPath,
        preserveSymlinks,
        packageCache
      )
      resolvedPkgId = path.dirname(
        path.relative(nodeModulesDir, nearestPkgPath)
      )

      // Always use the nearest package.json to determine whether a
      // ".js" module is ESM or CJS.
      resolvedPkgType = resolvedPkg.data.type

      // If the nearest package.json has no "exports" field, then we
      // need to check the dependency's root directory for an exports
      // field, since that should take precedence (see #10371).
      if (resolvedPkgId !== basePkgId) {
        try {
          const basePkgPath = path.join(
            nodeModulesDir,
            basePkgId,
            'package.json'
          )
          const basePkg = loadPackageData(
            basePkgPath,
            preserveSymlinks,
            packageCache
          )
          if (basePkg.data.exports) {
            resolvedPkg = basePkg
            resolvedPkgId = path.dirname(
              path.relative(nodeModulesDir, basePkgPath)
            )
          }
        } catch (e) {
          if (e.code !== 'ENOENT') {
            throw e
          }
        }
      }

      let usedId: string
      if (resolvedPkgId === id) {
        // Use the main entry point
        resolver = resolvePackageEntry
        usedId = id
      } else {
        // Use a deep entry point
        resolver = resolveDeepImport
        usedId = '.' + id.slice(resolvedPkgId.length)
      }

      try {
        resolvedId = resolver(usedId, resolvedPkg, targetWeb, options)
        if (resolvedId) {
          break
        }
      } catch (err) {
        if (!options.tryEsmOnly) {
          throw err
        }
      }
      if (options.tryEsmOnly) {
        resolvedId = resolver(usedId, resolvedPkg, targetWeb, {
          ...options,
          isRequire: false,
          mainFields: DEFAULT_MAIN_FIELDS,
          extensions: DEFAULT_EXTENSIONS
        })
        if (resolvedId) {
          break
        }
      }

      // Reset the resolvedPkg variables to avoid false positives as we
      // continue our search.
      resolvedPkg = undefined
      resolvedPkgId = undefined
      resolvedPkgType = undefined
      continue
    }

    // No package.json was found, but there could still be a module
    // here. To match Node's behavior, we must be able to resolve a
    // module without a package.json file helping us out.
    try {
      const stat = fs.statSync(entryPath)
      if (stat.isFile()) {
        resolvedId = entryPath
        break
      }
      resolvedId = tryIndexFile(entryPath, targetWeb, options)
      if (resolvedId) {
        break
      }
    } catch {}

    const entryDir = path.dirname(entryPath)
    let entryDirExists = false
    if (entryDir === nodeModulesDir) {
      entryDirExists = true
    } else {
      try {
        const stat = fs.statSync(entryDir)
        entryDirExists = stat.isDirectory()
      } catch {}
    }

    if (entryDirExists) {
      // In case a file extension is missing, we need to try calling the
      // `tryFsResolve` function.
      resolvedId = tryFsResolve(
        entryPath,
        { ...options, skipPackageJson: true },
        false,
        targetWeb
      )
      if (resolvedId) {
        break
      }
    }

    // Stop looking if we're at the workspace root directory.
    if (
      isWorkspaceRoot(
        path.dirname(nodeModulesDir),
        preserveSymlinks,
        packageCache
      )
    )
      break
  }

  if (!resolvedId) {
    const mayBeOptionalPeerDep =
      !options.isHookNodeResolve &&
      basedir !== root &&
      !isBuiltin(basePkgId) &&
      !basePkgId.includes('\0') &&
      bareImportRE.test(basePkgId)

    if (!mayBeOptionalPeerDep) {
      return // Module not found.
    }

    // Find the importer's nearest package.json with a "name" field.
    // Some projects (like Svelte) have nameless package.json files to
    // appease older Node.js versions and they don't have the list of
    // optional peer dependencies like the root package.json does.
    let basePkg: PackageData | undefined
    lookupFile(basedir, ['package.json'], {
      pathOnly: true,
      predicate(pkgPath) {
        basePkg = loadPackageData(pkgPath, preserveSymlinks, packageCache)
        return !!basePkg.data.name
      }
    })

    if (!basePkg) {
      return // Module not found.
    }

    const { peerDependencies, peerDependenciesMeta } = basePkg.data
    const optionalPeerDep =
      peerDependenciesMeta?.[basePkgId]?.optional &&
      peerDependencies?.[basePkgId]

    if (!optionalPeerDep) {
      return // Module not found.
    }

    return {
      id: `${optionalPeerDepId}:${basePkgId}:${basePkg.data.name}`
    }
  }

  if (!resolvedPkg) {
    const pkgPath = lookupFile(path.dirname(resolvedId), ['package.json'], {
      pathOnly: true
    })
    if (!pkgPath) {
      return { id: resolvedId }
    }
    resolvedPkg = loadPackageData(pkgPath, preserveSymlinks, packageCache)
  }

  const processResult = (resolved: PartialResolvedId) => {
    if (!externalize) {
      return resolved
    }
    // don't external symlink packages
    if (!allowLinkedExternal && !resolved.id.includes('node_modules')) {
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
    if (resolver === resolveDeepImport) {
      if (!resolvedPkg?.data.exports && path.extname(id) !== resolvedExt) {
        resolvedId = resolved.id.slice(resolved.id.indexOf(id))
        isDebug &&
          debug(
            `[processResult] ${colors.cyan(id)} -> ${colors.dim(resolvedId)}`
          )
      }
    }
    return { ...resolved, id: resolvedId, external: true }
  }

  // link id to pkg for browser field mapping check
  idToPkgMap.set(resolvedId, resolvedPkg)
  if ((isBuild && !depsOptimizer) || externalize) {
    // Resolve package side effects for build so that rollup can better
    // perform tree-shaking
    return processResult({
      id: resolvedId,
      moduleSideEffects: resolvedPkg.hasSideEffects(resolvedId)
    })
  }

  const ext = path.extname(resolvedId)
  const isCJS =
    ext === '.cjs' || (ext === '.js' && resolvedPkgType !== 'module')

  if (
    !options.ssrOptimizeCheck &&
    (!resolvedId.includes('node_modules') || // linked
      !depsOptimizer || // resolving before listening to the server
      options.scan) // initial esbuild scan phase
  ) {
    return { id: resolvedId }
  }

  // if we reach here, it's a valid dep import that hasn't been optimized.
  const isJsType = depsOptimizer
    ? isOptimizable(resolvedId, depsOptimizer.options)
    : OPTIMIZABLE_ENTRY_RE.test(resolvedId)

  let exclude = depsOptimizer?.options.exclude
  let include = depsOptimizer?.options.exclude
  if (options.ssrOptimizeCheck) {
    // we don't have the depsOptimizer
    exclude = options.ssrConfig?.optimizeDeps?.exclude
    include = options.ssrConfig?.optimizeDeps?.exclude
  }

  const skipOptimization =
    !resolvedPkgId ||
    !isJsType ||
    importer?.includes('node_modules') ||
    exclude?.includes(resolvedPkgId) ||
    exclude?.includes(basePkgId) ||
    exclude?.includes(id) ||
    SPECIAL_QUERY_RE.test(resolvedId) ||
    (!isBuild && ssr) ||
    // Only optimize non-external CJS deps during SSR by default
    (ssr &&
      !isCJS &&
      !(
        include?.includes(resolvedPkgId) ||
        include?.includes(basePkgId) ||
        include?.includes(id)
      ))

  if (options.ssrOptimizeCheck) {
    return {
      id: skipOptimization
        ? injectQuery(resolvedId, `__vite_skip_optimization`)
        : resolvedId
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
        resolvedId = injectQuery(resolvedId, `v=${versionHash}`)
      }
    }
  } else {
    // this is a missing import, queue optimize-deps re-run and
    // get a resolved its optimized info
    const optimizedInfo = depsOptimizer!.registerMissingImport(id, resolvedId)
    resolvedId = depsOptimizer!.getOptimizedDepId(optimizedInfo)
  }

  if (isBuild) {
    // Resolve package side effects for build so that rollup can better
    // perform tree-shaking
    return {
      id: resolvedId,
      moduleSideEffects: resolvedPkg.hasSideEffects(resolvedId)
    }
  } else {
    return { id: resolvedId }
  }
}

export async function tryOptimizedResolve(
  depsOptimizer: DepsOptimizer,
  id: string,
  importer?: string
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
  options: InternalResolveOptions
): string | undefined {
  const cached = getResolvedCache('.', targetWeb)
  if (cached) {
    return cached
  }
  try {
    let entryPoints: string[] = []

    // the exports field takes highest priority as described in
    // https://nodejs.org/api/packages.html#package-entry-points
    if (data.exports) {
      entryPoints = resolveExports(
        data,
        '.',
        options,
        getInlineConditions(options, targetWeb),
        options.overrideConditions
      )
      if (!entryPoints.length) {
        packageEntryFailure(id)
      }
    } else if (targetWeb && options.browserField) {
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
            options
          )
          if (resolvedBrowserEntry) {
            const content = fs.readFileSync(resolvedBrowserEntry, 'utf-8')
            if (hasESMSyntax(content)) {
              // likely ESM, prefer browser
              entryPoints[0] = browserEntry
            } else {
              // non-ESM, UMD or IIFE or CJS(!!! e.g. firebase 7.x), prefer module
              entryPoints[0] = data.module
            }
          }
        } else {
          entryPoints[0] = browserEntry
        }
      }
    }

    if (!entryPoints[0]) {
      for (const field of options.mainFields) {
        if (field === 'browser') continue // already checked above
        if (typeof data[field] === 'string') {
          entryPoints[0] = data[field]
          break
        }
      }
      entryPoints[0] ||= data.main
    }

    // try default entry when entry is not define
    // https://nodejs.org/api/modules.html#all-together
    if (!entryPoints[0]) {
      entryPoints = ['index.js', 'index.json', 'index.node']
    }

    for (let entry of entryPoints) {
      // make sure we don't get scripts when looking for sass
      if (
        options.mainFields[0] === 'sass' &&
        !options.extensions.includes(path.extname(entry))
      ) {
        entry = ''
        options.skipPackageJson = true
      }

      // resolve object browser field in package.json
      const { browser: browserField } = data
      if (targetWeb && options.browserField && isObject(browserField)) {
        entry = mapWithBrowserField(entry, browserField) || entry
      }

      const entryPointPath = path.join(dir, entry)
      const resolvedEntryPoint = tryFsResolve(entryPointPath, options)
      if (resolvedEntryPoint) {
        isDebug &&
          debug(
            `[package entry] ${colors.cyan(id)} -> ${colors.dim(
              resolvedEntryPoint
            )}`
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
      (details ? ': ' + details : '.')
  )
}

/**
 * This generates conditions that aren't inferred by `resolveExports`
 * from the `options` object.
 */
function getInlineConditions(
  options: InternalResolveOptions,
  targetWeb: boolean
) {
  const inlineConditions: string[] = []

  const conditions: readonly string[] =
    options.overrideConditions || options.conditions

  if (targetWeb) {
    if (!conditions.includes('node')) {
      inlineConditions.push('browser')
    }
  } else if (!conditions.includes('browser')) {
    inlineConditions.push('node')
  }

  // The "module" condition is no longer recommended, but some older
  // packages may still use it.
  if (!options.isRequire && !conditions.includes('require')) {
    inlineConditions.push('module')
  }

  // The "overrideConditions" array can add arbitrary conditions.
  options.overrideConditions?.forEach((condition) => {
    if (!inlineConditions.includes(condition)) {
      inlineConditions.push(condition)
    }
  })

  return inlineConditions
}

function resolveDeepImport(
  id: string,
  {
    webResolvedImports,
    setResolvedCache,
    getResolvedCache,
    dir,
    data
  }: PackageData,
  targetWeb: boolean,
  options: InternalResolveOptions
): string | undefined {
  const cache = getResolvedCache(id, targetWeb)
  if (cache) {
    return cache
  }

  const { exports: exportsField, browser: browserField } = data
  const { file, postfix } = splitFileAndPostfix(id)

  let possibleFiles: string[] | undefined
  if (exportsField) {
    // map relative based on exports data
    possibleFiles = resolveExports(
      data,
      file,
      options,
      getInlineConditions(options, targetWeb),
      options.overrideConditions
    )
    if (postfix) {
      if (possibleFiles.length) {
        possibleFiles = possibleFiles.map((f) => f + postfix)
      } else {
        possibleFiles = resolveExports(
          data,
          file + postfix,
          options,
          getInlineConditions(options, targetWeb),
          options.overrideConditions
        )
      }
    }
    if (!possibleFiles.length) {
      throw new Error(
        `Package subpath '${file}' is not defined by "exports" in ` +
          `${path.join(dir, 'package.json')}.`
      )
    }
  } else if (targetWeb && options.browserField && isObject(browserField)) {
    const mapped = mapWithBrowserField(file, browserField)
    if (mapped) {
      possibleFiles = [mapped + postfix]
    } else if (mapped === false) {
      return (webResolvedImports[id] = browserExternalId)
    }
  }

  possibleFiles ||= [id]
  if (possibleFiles[0]) {
    let resolved: string | undefined
    possibleFiles.some(
      (file) =>
        (resolved = tryFsResolve(
          path.join(dir, file),
          options,
          !exportsField, // try index only if no exports field
          targetWeb
        ))
    )
    if (resolved) {
      isDebug &&
        debug(
          `[node/deep-import] ${colors.cyan(id)} -> ${colors.dim(resolved)}`
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
  externalize?: boolean
) {
  let res: string | undefined
  const pkg =
    importer && (idToPkgMap.get(importer) || resolvePkg(importer, options))
  if (pkg && isObject(pkg.data.browser)) {
    const mapId = isFilePath ? './' + slash(path.relative(pkg.dir, id)) : id
    const browserMappedPath = mapWithBrowserField(mapId, pkg.data.browser)
    if (browserMappedPath) {
      const fsPath = path.join(pkg.dir, browserMappedPath)
      if ((res = tryFsResolve(fsPath, options))) {
        isDebug &&
          debug(`[browser mapped] ${colors.cyan(id)} -> ${colors.dim(res)}`)
        idToPkgMap.set(res, pkg)
        const result = {
          id: res,
          moduleSideEffects: pkg.hasSideEffects(res)
        }
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
  map: Record<string, string | false>
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
  resolved = ensureVolumeInPath(resolved)
  if (!preserveSymlinks && browserExternalId !== resolved) {
    resolved = fs.realpathSync(resolved)
  }
  return normalizePath(resolved)
}

/**
 * if importer was not resolved by vite's resolver previously
 * (when esbuild resolved it)
 * resolve importer's pkg and add to idToPkgMap
 */
function resolvePkg(importer: string, options: InternalResolveOptions) {
  const { root, preserveSymlinks, packageCache } = options

  if (importer.includes('\x00')) {
    return null
  }

  const possiblePkgIds: string[] = []
  for (let prevSlashIndex = -1; ; ) {
    const slashIndex = importer.indexOf(isWindows ? '\\' : '/', prevSlashIndex)
    if (slashIndex < 0) {
      break
    }

    prevSlashIndex = slashIndex + 1

    const possiblePkgId = importer.slice(0, slashIndex)
    possiblePkgIds.push(possiblePkgId)
  }

  let pkg: PackageData | undefined
  possiblePkgIds.reverse().find((pkgId) => {
    pkg = resolvePackageData(pkgId, root, preserveSymlinks, packageCache)!
    return pkg
  })!

  if (pkg) {
    idToPkgMap.set(importer, pkg)
  }
  return pkg
}
