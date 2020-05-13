import { ServerPlugin } from '.'
import path from 'path'
import slash from 'slash'
import LRUCache from 'lru-cache'
import MagicString from 'magic-string'
import {
  init as initLexer,
  parse as parseImports,
  ImportSpecifier
} from 'es-module-lexer'
import { InternalResolver } from '../resolver'
import {
  debugHmr,
  importerMap,
  importeeMap,
  ensureMapEntry,
  rewriteFileWithHMR,
  hmrClientPublicPath,
  hmrClientId,
  hmrDirtyFilesMap
} from './serverPluginHmr'
import {
  readBody,
  cleanUrl,
  isExternalUrl,
  resolveRelativeRequest
} from '../utils'
import chalk from 'chalk'
import { resolveBareModule } from './serverPluginModuleResolve'

const debug = require('debug')('vite:rewrite')

const rewriteCache = new LRUCache({ max: 1024 })

// Plugin for rewriting served js.
// - Rewrites named module imports to `/@modules/:id` requests, e.g.
//   "vue" => "/@modules/vue"
// - Rewrites HMR `hot.accept` calls to inject the file's own path. e.g.
//   `hot.accept('./dep.js', cb)` -> `hot.accept('/importer.js', './dep.js', cb)`
// - Also tracks importer/importee relationship graph during the rewrite.
//   The graph is used by the HMR plugin to perform analysis on file change.
export const moduleRewritePlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver,
  config
}) => {
  // inject __DEV__ and process.env.NODE_ENV flags
  // since some ESM builds expect these to be replaced by the bundler
  const devInjectionCode =
    `\n<script>\n` +
    `window.__DEV__ = true\n` +
    `window.__BASE__ = '/'\n` +
    `window.__SW_ENABLED__ = ${!!config.serviceWorker}\n` +
    `window.process = { env: { NODE_ENV: 'development' }}\n` +
    `</script>` +
    `\n<script type="module" src="${hmrClientPublicPath}"></script>\n`

  const scriptRE = /(<script\b[^>]*>)([\s\S]*?)<\/script>/gm
  const srcRE = /\bsrc=(?:"([^"]+)"|'([^']+)'|([^'"\s]+)\b)/

  async function rewriteIndex(html: string) {
    await initLexer
    let hasInjectedDevFlag = false
    const importer = '/index.html'
    return html!.replace(scriptRE, (matched, openTag, script) => {
      const devFlag = hasInjectedDevFlag ? `` : devInjectionCode
      hasInjectedDevFlag = true
      if (script) {
        return `${devFlag}${openTag}${rewriteImports(
          root,
          script,
          importer,
          resolver
        )}</script>`
      } else {
        const srcAttr = openTag.match(srcRE)
        if (srcAttr) {
          // register script as a import dep for hmr
          const importee = cleanUrl(
            slash(path.resolve('/', srcAttr[1] || srcAttr[2]))
          )
          debugHmr(`        ${importer} imports ${importee}`)
          ensureMapEntry(importerMap, importee).add(importer)
        }
        return `${devFlag}${matched}`
      }
    })
  }

  app.use(async (ctx, next) => {
    await next()

    if (ctx.status === 304) {
      return
    }

    if (ctx.path === '/index.html') {
      let html = await readBody(ctx.body)
      if (html && rewriteCache.has(html)) {
        debug('/index.html: serving from cache')
        ctx.body = rewriteCache.get(html)
      } else if (html) {
        ctx.body = await rewriteIndex(html)
        rewriteCache.set(html, ctx.body)
        return
      }
    }

    // we are doing the js rewrite after all other middlewares have finished;
    // this allows us to post-process javascript produced by user middlewares
    // regardless of the extension of the original files.
    if (
      ctx.body &&
      ctx.response.is('js') &&
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
        ctx.body = rewriteImports(
          root,
          content!,
          ctx.path,
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
  if (typeof source !== 'string') {
    source = String(source)
  }
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

          let resolved
          if (id === hmrClientId) {
            resolved = hmrClientPublicPath
            if (!/.vue$|.vue\?type=/.test(importer)) {
              // the user explicit imports the HMR API in a js file
              // making the module hot.
              rewriteFileWithHMR(root, source, importer, resolver, s)
              // we rewrite the hot.accept call
              hasReplaced = true
            }
          } else {
            resolved = resolveImport(root, importer, id, resolver, timestamp)
          }

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
          console.log(`[vite] ignored dynamic import(${id})`)
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
const jsSrcRE = /\.(?:(?:j|t)sx?|vue)$/

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
    return `/@modules/${resolveBareModule(root, id)}`
  } else {
    let { pathname, query } = resolveRelativeRequest(importer, id)
    // append an extension to extension-less imports
    if (!path.extname(pathname)) {
      const file = resolver.requestToFile(pathname)
      const indexMatch = file.match(/\/index\.\w+$/)
      if (indexMatch) {
        pathname = pathname.replace(/\/(index)?$/, '') + indexMatch[0]
      } else {
        pathname += path.extname(file)
      }
    }

    // mark non-src imports
    if (!jsSrcRE.test(pathname)) {
      query += `${query ? `&` : `?`}import`
    }

    // force re-fetch dirty imports by appending timestamp
    if (timestamp) {
      const dirtyFiles = hmrDirtyFilesMap.get(timestamp)
      // only force re-fetch if this is a marked dirty file (in the import
      // chain of the changed file) or a vue part request (made by a dirty
      // vue main request)
      if ((dirtyFiles && dirtyFiles.has(pathname)) || /\.vue\?type/.test(id)) {
        query += `${query ? `&` : `?`}t=${timestamp}`
      }
    }
    return pathname + query
  }
}
