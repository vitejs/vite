import { Plugin } from '../index'
import { resolveVue } from '../resolveVue'
import path from 'path'
import resolve from 'resolve-from'
import { Readable } from 'stream'
import { init as initLexer, parse } from 'es-module-lexer'
import MagicString from 'magic-string'
import { cachedRead } from '../utils'
import { promises as fs } from 'fs'

const idToFileMap = new Map()
const fileToIdMap = new Map()
const webModulesMap = new Map()

export const modulesPlugin: Plugin = ({ root, app }) => {
  // rewrite named module imports to `/__modules/:id` requests
  app.use(async (ctx, next) => {
    await next()

    if (ctx.status === 304) {
      return
    }

    if (ctx.url === '/index.html') {
      const html = await readBody(ctx.body)
      await initLexer
      ctx.body = html.replace(
        /(<script\b[^>]*>)([\s\S]*?)<\/script>/gm,
        (_, openTag, script) => {
          return `${openTag}${rewriteImports(script, '/index.html')}</script>`
        }
      )
    }

    // we are doing the js rewrite after all other middlewares have finished;
    // this allows us to post-process javascript produced by user middlewares
    // regardless of the extension of the original files.
    if (
      ctx.response.is('js') &&
      // skip dependency modules
      !ctx.path.startsWith(`/__`) &&
      // only need to rewrite for <script> part in vue files
      !(ctx.path.endsWith('.vue') && ctx.query.type != null)
    ) {
      await initLexer
      ctx.body = rewriteImports(
        await readBody(ctx.body),
        ctx.url.replace(/(&|\?)t=\d+/, ''),
        ctx.query.t
      )
    }
  })

  // handle /__modules/:id requests
  const moduleRE = /^\/__modules\//
  app.use(async (ctx, next) => {
    if (!moduleRE.test(ctx.path)) {
      return next()
    }

    const id = ctx.path.replace(moduleRE, '')
    ctx.type = 'js'

    // special handling for vue's runtime.
    if (id === 'vue') {
      ctx.body = await cachedRead(resolveVue(root).vue)
      return
    }

    // already resolved and cached
    const cachedPath = idToFileMap.get(id)
    if (cachedPath) {
      ctx.body = await cachedRead(cachedPath)
      return
    }

    // source map request
    if (id.endsWith('.map')) {
      // try to reverse-infer the original file that made the sourcemap request.
      // assumes the `.js` and `.js.map` files to have the same prefix.
      const sourceMapRequest = id
      const jsRequest = sourceMapRequest.replace(/\.map$/, '')
      const moduleId = fileToIdMap.get(jsRequest)
      if (!moduleId) {
        console.error(
          `[vite] failed to infer original js file for source map request ` +
            sourceMapRequest
        )
        ctx.status = 404
        return
      } else {
        const modulePath = idToFileMap.get(moduleId)
        const sourceMapPath = path.join(
          path.dirname(modulePath),
          sourceMapRequest
        )
        idToFileMap.set(sourceMapRequest, sourceMapPath)
        ctx.type = 'application/json'
        ctx.body = await cachedRead(sourceMapPath)
        return
      }
    }

    try {
      const webModulePath = await resolveWebModule(root, id)
      if (webModulePath) {
        idToFileMap.set(id, webModulePath)
        fileToIdMap.set(path.basename(webModulePath), id)
        ctx.body = await cachedRead(webModulePath)
        return
      }
    } catch (e) {
      console.error(e)
      ctx.status = 404
    }

    // resolve from node_modules
    try {
      const pkgPath = resolve(root, `${id}/package.json`)
      const pkg = require(pkgPath)
      const modulePath = path.join(
        path.dirname(pkgPath),
        pkg.module || pkg.main
      )
      idToFileMap.set(id, modulePath)
      fileToIdMap.set(path.basename(modulePath), id)
      ctx.body = await cachedRead(modulePath)
    } catch (e) {
      console.error(e)
      ctx.status = 404
    }
  })
}

async function readBody(stream: Readable | string): Promise<string> {
  if (stream instanceof Readable) {
    return new Promise((resolve, reject) => {
      let res = ''
      stream
        .on('data', (chunk) => (res += chunk))
        .on('error', reject)
        .on('end', () => {
          resolve(res)
        })
    })
  } else {
    return stream
  }
}

async function resolveWebModule(
  root: string,
  id: string
): Promise<string | undefined> {
  const webModulePath = webModulesMap.get(id)
  if (webModulePath) {
    return webModulePath
  }
  const importMapPath = path.join(root, 'web_modules', 'import-map.json')
  if (await fs.stat(importMapPath).catch((e) => false)) {
    const importMap = require(importMapPath)
    if (importMap.imports) {
      const webModulesDir = path.dirname(importMapPath)
      Object.entries(
        importMap.imports
      ).forEach(([key, val]: [string, string]) =>
        webModulesMap.set(key, path.join(webModulesDir, val))
      )
      return webModulesMap.get(id)
    }
  }
}

// while we lex the files for imports we also build a import graph
// so that we can determine what files to hot reload
export const importerMap = new Map<string, Set<string>>()
export const importeeMap = new Map<string, Set<string>>()

function rewriteImports(source: string, importer: string, timestamp?: string) {
  try {
    const [imports] = parse(source)

    if (imports.length) {
      const s = new MagicString(source)
      let hasReplaced = false

      const prevImportees = importeeMap.get(importer)
      const currentImportees = new Set<string>()
      importeeMap.set(importer, currentImportees)

      imports.forEach(({ s: start, e: end, d: dynamicIndex }) => {
        const id = source.substring(start, end)
        if (dynamicIndex < 0) {
          if (/^[^\/\.]/.test(id)) {
            s.overwrite(start, end, `/__modules/${id}`)
            hasReplaced = true
          } else if (importer && !id.startsWith(`/__`)) {
            // force re-fetch all imports by appending timestamp
            // if this is a hmr refresh request
            if (timestamp) {
              s.overwrite(
                start,
                end,
                `${id}${/\?/.test(id) ? `&` : `?`}t=${timestamp}`
              )
              hasReplaced = true
            }
            // save the import chain for hmr analysis
            const importee = path.join(path.dirname(importer), id)
            currentImportees.add(importee)
            let importers = importerMap.get(importee)
            if (!importers) {
              importers = new Set()
              importerMap.set(importee, importers)
            }
            importers.add(importer)
          }
        } else {
          // TODO dynamic import
        }
      })

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

      return hasReplaced ? s.toString() : source
    }

    return source
  } catch (e) {
    console.error(`Error: module imports rewrite failed for source:\n`, source)
    return source
  }
}
