import { ServerPlugin } from '.'
import path from 'path'
import LRUCache from 'lru-cache'
import MagicString from 'magic-string'
import {
  init as initLexer,
  parse as parseImports,
  ImportSpecifier
} from 'es-module-lexer'
import {
  InternalResolver,
  resolveBareModuleRequest,
  jsSrcRE
} from '../resolver'
import {
  debugHmr,
  importerMap,
  importeeMap,
  ensureMapEntry,
  rewriteFileWithHMR,
  hmrClientPublicPath,
  hmrDirtyFilesMap,
  latestVersionsMap
} from './serverPluginHmr'
import { readBody, cleanUrl, isExternalUrl } from '../utils'
import chalk from 'chalk'
import { isCSSRequest } from '../utils/cssUtils'
import { envPublicPath } from './serverPluginEnv'

const debug = require('debug')('vite:rewrite')

const rewriteCache = new LRUCache({ max: 1024 })

// Plugin for rewriting served js.
// - Rewrites named module imports to `/@modules/:id` requests, e.g.
//   "vue" => "/@modules/vue"
// - Rewrites files containing HMR code (reference to `import.meta.hot`) to
//   inject `import.meta.hot` and track HMR boundary accept whitelists.
// - Also tracks importer/importee relationship graph during the rewrite.
//   The graph is used by the HMR plugin to perform analysis on file change.
export const moduleRewritePlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver
}) => {
  app.use(async (ctx, next) => {
    await next()

    if (ctx.status === 304) {
      return
    }

    // we are doing the js rewrite after all other middlewares have finished;
    // this allows us to post-process javascript produced by user middlewares
    // regardless of the extension of the original files.
    if (
      ctx.body &&
      ctx.response.is('js') &&
      !isCSSRequest(ctx.path) &&
      !ctx.url.endsWith('.map') &&
      // skip internal client
      !ctx.path.startsWith(hmrClientPublicPath) &&
      // only need to rewrite for <script> part in vue files
      !((ctx.path.endsWith('.vue') || ctx.vue) && ctx.query.type != null)
    ) {
      const content = await readBody(ctx.body)
      if (!ctx.query.t && rewriteCache.has(content)) {
        debug(`(cached) ${ctx.url}`)
        ctx.body = rewriteCache.get(content)
      } else {
        await initLexer
        // dynamic import may contain extension-less path,
        // (.e.g import(runtimePathString))
        // so we need to normalize importer to ensure it contains extension
        // before we perform hmr analysis.
        // on the other hand, static import is guaranteed to have extension
        // because they must all have gone through module rewrite.
        const importer = resolver.normalizePublicPath(ctx.path)
        ctx.body = rewriteImports(
          root,
          content!,
          importer,
          resolver,
          ctx.query.t
        )
        rewriteCache.set(content, ctx.body)
      }
    } else {
      debug(`(skipped) ${ctx.url}`)
    }
  })

  // bust module rewrite cache on file change
  watcher.on('change', (file) => {
    const publicPath = resolver.fileToRequest(file)
    debug(`${publicPath}: cache busted`)
    rewriteCache.del(publicPath)
  })
}

export function rewriteImports(
  root: string,
  source: string,
  importer: string,
  resolver: InternalResolver,
  timestamp?: string
) {
  try {
    let imports: ImportSpecifier[] = []
    try {
      imports = parseImports(source)[0]
    } catch (e) {
      console.error(
        chalk.yellow(
          `[vite] failed to parse ${chalk.cyan(
            importer
          )} for import rewrite.\nIf you are using ` +
            `JSX, make sure to named the file with the .jsx extension.`
        )
      )
    }

    if (imports.length) {
      debug(`${importer}: rewriting`)
      const s = new MagicString(source)
      let hasReplaced = false
      let hasInjectedEnv = false
      let hasRewrittenForHMR = false

      const prevImportees = importeeMap.get(importer)
      const currentImportees = new Set<string>()
      importeeMap.set(importer, currentImportees)

      for (let i = 0; i < imports.length; i++) {
        const { s: start, e: end, d: dynamicIndex } = imports[i]
        let id = source.substring(start, end)
        let hasLiteralDynamicId = false
        if (dynamicIndex >= 0) {
          const literalIdMatch = id.match(/^(?:'([^']+)'|"([^"]+)")$/)
          if (literalIdMatch) {
            hasLiteralDynamicId = true
            id = literalIdMatch[1] || literalIdMatch[2]
          }
        }
        if (dynamicIndex === -1 || hasLiteralDynamicId) {
          // do not rewrite external imports
          if (isExternalUrl(id)) {
            continue
          }

          const resolved = resolveImport(
            root,
            importer,
            id,
            resolver,
            timestamp
          )

          if (resolved !== id) {
            debug(`    "${id}" --> "${resolved}"`)
            s.overwrite(
              start,
              end,
              hasLiteralDynamicId ? `'${resolved}'` : resolved
            )
            hasReplaced = true
          }

          // save the import chain for hmr analysis
          const importee = cleanUrl(resolved)
          if (
            importee !== importer &&
            // no need to track hmr client or module dependencies
            importee !== hmrClientPublicPath
          ) {
            currentImportees.add(importee)
            debugHmr(`        ${importer} imports ${importee}`)
            ensureMapEntry(importerMap, importee).add(importer)
          }
        } else {
          if (id === 'import.meta') {
            if (!hasRewrittenForHMR && source.slice(end, end + 4) === '.hot') {
              debugHmr(`rewriting ${importer} for HMR.`)
              rewriteFileWithHMR(root, source, importer, resolver, s)
              hasRewrittenForHMR = true
              hasReplaced = true
            }

            if (!hasInjectedEnv && source.slice(end, end + 4) === '.env') {
              s.prepend(
                `import __VITE_ENV__ from "${envPublicPath}";\n` +
                  `import.meta.env = __VITE_ENV__;\n`
              )
              hasInjectedEnv = true
              hasReplaced = true
            }
          } else {
            debug(`[vite] ignored dynamic import(${id})`)
          }
        }
      }

      // since the importees may have changed due to edits,
      // check if we need to remove this importer from certain importees
      if (prevImportees) {
        prevImportees.forEach((importee) => {
          if (!currentImportees.has(importee)) {
            const importers = importerMap.get(importee)
            if (importers) {
              importers.delete(importer)
            }
          }
        })
      }

      if (!hasReplaced) {
        debug(`    no imports rewritten.`)
      }

      return hasReplaced ? s.toString() : source
    } else {
      debug(`${importer}: no imports found.`)
    }

    return source
  } catch (e) {
    console.error(
      `[vite] Error: module imports rewrite failed for ${importer}.\n`,
      e
    )
    debug(source)
    return source
  }
}

const bareImportRE = /^[^\/\.]/

export const resolveImport = (
  root: string,
  importer: string,
  id: string,
  resolver: InternalResolver,
  timestamp?: string
): string => {
  id = resolver.alias(id) || id

  if (bareImportRE.test(id)) {
    // directly resolve bare module names to its entry path so that relative
    // imports from it (including source map urls) can work correctly
    id = `/@modules/${resolveBareModuleRequest(root, id, importer, resolver)}`
  } else {
    // 1. relative to absolute
    //    ./foo -> /some/path/foo
    let { pathname, query } = resolver.resolveRelativeRequest(importer, id)

    // 2. resolve dir index and extensions.
    pathname = resolver.normalizePublicPath(pathname)

    // 3. mark non-src imports
    if (!query && path.extname(pathname) && !jsSrcRE.test(pathname)) {
      query += `?import`
    }

    id = pathname + query
  }

  // 4. force re-fetch dirty imports by appending timestamp
  if (timestamp) {
    const dirtyFiles = hmrDirtyFilesMap.get(timestamp)
    const cleanId = cleanUrl(id)
    // only rewrite if:
    if (dirtyFiles && dirtyFiles.has(cleanId)) {
      // 1. this is a marked dirty file (in the import chain of the changed file)
      id += `${id.includes(`?`) ? `&` : `?`}t=${timestamp}`
    } else if (latestVersionsMap.has(cleanId)) {
      // 2. this file was previously hot-updated and has an updated version
      id += `${id.includes(`?`) ? `&` : `?`}t=${latestVersionsMap.get(cleanId)}`
    }
  }
  return id
}
