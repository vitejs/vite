import path from 'path'
import { Plugin } from '../../node/plugin'
import chalk from 'chalk'
import {
  FS_PREFIX,
  DEFAULT_EXTENSIONS,
} from '../../node/constants'
import {
  bareImportRE,
  createDebugger,
  isExternalUrl,
  fsPathFromId,
  isDataUrl,
  flattenId
} from '../../node/utils'
import { ViteDevServer, InternalResolveOptions } from '../../node'
import { PartialResolvedId, PluginContext } from 'rollup'
import { resolve as _resolveExports } from 'resolve.exports'

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

export function resolvePlugin(baseOptions: InternalResolveOptions): Plugin {
  const {
    root,
    asSrc,
    ssrTarget,
    preferRelative = false
  } = baseOptions
  const requireOptions: InternalResolveOptions = {
    ...baseOptions,
    isRequire: true
  }
  let server: ViteDevServer | undefined

  return {
    name: 'vite:resolve',

    configureServer(_server) {
      server = _server
    },

    resolveId(id, importer, resolveOpts, ssr) {
      const targetWeb = !ssr || ssrTarget === 'webworker'

      // this is passed by @rollup/plugin-commonjs
      const isRequire =
        resolveOpts &&
        resolveOpts.custom &&
        resolveOpts.custom['node-resolve'] &&
        resolveOpts.custom['node-resolve'].isRequire

      const options = isRequire ? requireOptions : baseOptions

      let res

      // explicit fs paths that starts with /@fs/*
      if (asSrc && id.startsWith(FS_PREFIX)) {
        const fsPath = fsPathFromId(id)
        res = tryFsResolve(fsPath, options, this)
        isDebug && debug(`[@fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404
        return res || fsPath
      }

      // URL
      // /foo -> /fs-root/foo
      if (asSrc && id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath, options, this))) {
          isDebug && debug(`[url] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return res
        }
      }

      if (id.startsWith(root)) {
        return id; // direct import
      }

      // relative
      if (id.startsWith('.') || (preferRelative && /^\w/.test(id))) {
        const basedir = importer ? path.dirname(importer) : process.cwd()
        const fsPath = path.resolve(basedir, id)
        // handle browser field mapping for relative imports

        const normalizedFsPath = fsPath
        const pathFromBasedir = normalizedFsPath.slice(basedir.length)
        if (pathFromBasedir.startsWith('/node_modules/')) {
          // normalize direct imports from node_modules to bare imports, so the
          // hashing logic is shared and we avoid duplicated modules #2503
          const bareImport = pathFromBasedir.slice('/node_modules/'.length)
          if (
            (res = tryNodeResolve(
              bareImport,
              importer,
              options,
              targetWeb,
              server
            )) &&
            res.id.startsWith(normalizedFsPath)
          ) {
            return res
          }
        }

        // if (
        //   targetWeb &&
        //   (res = tryResolveBrowserMapping(fsPath, importer, options, true))
        // ) {
        //   return res;
        // }

        if ((res = tryFsResolve(fsPath, options, this))) {
          // const pkg = importer != null && idToPkgMap.get(importer);
          // if (pkg) {
          //   idToPkgMap.set(res, pkg);
          //   return {
          //     id: res,
          //     moduleSideEffects: pkg.hasSideEffects(res),
          //   };
          // }
          return res;
        }
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id, options, this))) {
        isDebug && debug(`[fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        return res
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
        if (
          asSrc &&
          server &&
          !ssr &&
          (res = tryOptimizedResolve(id, server))
        ) {
          return res
        }
        // TODO BROWSER SUPPORT
        // re-trigger optimize (if not running optimize already)
        if ((res = tryNodeResolve(id, importer, options, targetWeb, server))) {
          return res
        }
      }
    },

    load(id) {
        // @ts-ignore
        if (id.startsWith(root) && this.$fs$.existsSync(id)) {
        // @ts-ignore
        return this.$fs$.readFileSync(id, 'utf-8');
      }
    }
  }
}

function tryFsResolve(
  fsPath: string,
  options: InternalResolveOptions,
  context: PluginContext,
  tryIndex = true,
  targetWeb = true
): string | undefined {
  let file = fsPath
  let postfix = ''

  let postfixIndex = fsPath.indexOf('?')
  if (postfixIndex < 0) {
    postfixIndex = fsPath.indexOf('#')
  }
  if (postfixIndex > 0) {
    file = fsPath.slice(0, postfixIndex)
    postfix = fsPath.slice(postfixIndex)
  }

  let res: string | undefined
  if (
    (res = tryResolveFile(
      file,
      postfix,
      options,
      context,
      false,
      targetWeb,
      options.tryPrefix
    ))
  ) {
    return res
  }

  for (const ext of options.extensions || DEFAULT_EXTENSIONS) {
    if (
      (res = tryResolveFile(
        file + ext,
        postfix,
        options,
        context,
        false,
        targetWeb,
        options.tryPrefix
      ))
    ) {
      return res
    }
  }

  if (
    (res = tryResolveFile(
      file,
      postfix,
      options,
      context,
      tryIndex,
      targetWeb,
      options.tryPrefix
    ))
  ) {
    return res
  }
}

function tryResolveFile(
  file: string,
  postfix: string,
  options: InternalResolveOptions,
  context: PluginContext,
  tryIndex: boolean,
  targetWeb: boolean,
  tryPrefix?: string
): string | undefined {
  if (!file.startsWith(options.root)) return undefined;
  // @ts-ignore
  if (context.$fs$.existsSync(file)) {
    return file + postfix
  } else if (tryIndex) {
    const index = tryFsResolve(file + '/index', options, context, false)
    if (index) return index + postfix
  }
  if (tryPrefix) {
    const prefixed = `${path.dirname(file)}/${tryPrefix}${path.basename(file)}`
    return tryResolveFile(prefixed, postfix, options, context, tryIndex, targetWeb)
  }
}

export function tryNodeResolve(
  id: string,
  importer: string | undefined,
  options: InternalResolveOptions,
  targetWeb: boolean,
  server?: ViteDevServer
): PartialResolvedId | undefined {
  return { id: '/@node_modules/' + flattenId(id) + '.js' };
}


export function tryOptimizedResolve(
  id: string,
  server: ViteDevServer
): string | undefined {
  const cacheDir = server.config.cacheDir
  const depData = server._optimizeDepsMetadata
  if (cacheDir && depData) {
    const isOptimized = depData.optimized[id]
    if (isOptimized) {
      return isOptimized.file /*+
        `?v=${depData.browserHash}${
          isOptimized.needsInterop ? `&es-interop` : ``
        }`*/
    }
  }
}
