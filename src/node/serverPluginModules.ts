import { Plugin } from './server'
import { resolveVue } from './resolveVue'
import path from 'path'
import resolve from 'resolve-from'
import { Readable } from 'stream'
import { init as initLexer, parse as parseImports } from 'es-module-lexer'
import MagicString from 'magic-string'
import { cachedRead } from './utils'
import { promises as fs } from 'fs'
import { hmrClientPublicPath } from './serverPluginHmr'
import { parse } from '@babel/parser'
import { StringLiteral } from '@babel/types'
import LRUCache from 'lru-cache'
import chalk from 'chalk'

const debugImportRewrite = require('debug')('vite:rewrite')
const debugModuleResolution = require('debug')('vite:resolve')

const idToFileMap = new Map()
const fileToIdMap = new Map()
const webModulesMap = new Map()
const rewriteCache = new LRUCache({ max: 65535 })

export const modulesPlugin: Plugin = ({ root, app, watcher }) => {
  // bust module rewrite cache on file change
  watcher.on('change', (file) => {
    // TODO also need logic for reverse mapping file to servedPath
    const servedPath = '/' + path.relative(root, file)
    debugImportRewrite(`${servedPath}: cache busted`)
    rewriteCache.del(servedPath)
  })

  // rewrite named module imports to `/@modules/:id` requests
  app.use(async (ctx, next) => {
    await next()

    if (ctx.status === 304) {
      return
    }

    if (ctx.path === '/index.html') {
      if (rewriteCache.has('/index.html')) {
        debugImportRewrite('/index.html: serving from cache')
        ctx.body = rewriteCache.get('/index.html')
      } else if (ctx.body) {
        const html = await readBody(ctx.body)
        await initLexer
        ctx.body = html.replace(
          /(<script\b[^>]*>)([\s\S]*?)<\/script>/gm,
          (_, openTag, script) => {
            return `${openTag}${rewriteImports(script, '/index.html')}</script>`
          }
        )
        rewriteCache.set('/index.html', ctx.body)
      }
    }

    // we are doing the js rewrite after all other middlewares have finished;
    // this allows us to post-process javascript produced by user middlewares
    // regardless of the extension of the original files.
    if (
      ctx.response.is('js') &&
      !ctx.url.endsWith('.map') &&
      // skip internal client
      !ctx.path.startsWith(`/@hmr`) &&
      // only need to rewrite for <script> part in vue files
      !(ctx.path.endsWith('.vue') && ctx.query.type != null)
    ) {
      if (rewriteCache.has(ctx.path)) {
        debugImportRewrite(`${ctx.path}: serving from cache`)
        ctx.body = rewriteCache.get(ctx.path)
      } else {
        await initLexer
        ctx.body = rewriteImports(
          await readBody(ctx.body),
          ctx.url.replace(/(&|\?)t=\d+/, ''),
          ctx.query.t
        )
        rewriteCache.set(ctx.path, ctx.body)
      }
    }
  })

  // handle /@modules/:id requests
  const moduleRE = /^\/@modules\//
  const getDebugPath = (p: string) => {
    const relative = path.relative(root, p)
    return relative.startsWith('..') ? p : relative
  }

  app.use(async (ctx, next) => {
    if (!moduleRE.test(ctx.path)) {
      return next()
    }

    const id = ctx.path.replace(moduleRE, '')
    ctx.type = 'js'

    // special handling for vue's runtime.
    if (id === 'vue') {
      const vuePath = resolveVue(root).vue
      ctx.body = await cachedRead(vuePath)
      debugModuleResolution(`vue -> ${getDebugPath(vuePath)}`)
      return
    }

    // already resolved and cached
    const cachedPath = idToFileMap.get(id)
    if (cachedPath) {
      debugModuleResolution(`(cached) ${id} -> ${getDebugPath(cachedPath)}`)
      ctx.body = await cachedRead(cachedPath)
      return
    }

    // source map request
    if (id.endsWith('.map')) {
      // try to reverse-infer the original file that made the sourcemap request.
      // assumes the `.js` and `.js.map` files to have the same prefix.
      const sourceMapRequest = id
      const jsRequest = sourceMapRequest.replace(/\.map$/, '')
      const moduleId = fileToIdMap.get(path.basename(jsRequest))
      if (!moduleId) {
        console.error(
          chalk.red(
            `[vite] failed to infer original js file for source map request: ` +
              sourceMapRequest
          )
        )
        ctx.status = 404
        return
      } else {
        const modulePath = idToFileMap.get(moduleId)
        const sourceMapPath = path.join(
          path.dirname(modulePath),
          path.basename(sourceMapRequest)
        )
        idToFileMap.set(sourceMapRequest, sourceMapPath)
        ctx.type = 'application/json'
        ctx.body = await cachedRead(sourceMapPath)
        debugModuleResolution(
          `(source map) ${id} -> ${getDebugPath(sourceMapPath)}`
        )
        return
      }
    }

    try {
      const webModulePath = await resolveWebModule(root, id)
      if (webModulePath) {
        idToFileMap.set(id, webModulePath)
        fileToIdMap.set(path.basename(webModulePath), id)
        ctx.body = await cachedRead(webModulePath)
        debugModuleResolution(`${id} -> ${getDebugPath(webModulePath)}`)
        return
      }
    } catch (e) {
      console.error(
        chalk.red(`[vite] Error while resolving web_modules with id "${id}":`)
      )
      console.error(e)
      ctx.status = 404
    }

    // resolve from node_modules
    try {
      // get the module name in case of deep imports like 'foo/dist/bar.js'
      let moduleName = id
      const deepIndex = id.indexOf('/')
      if (deepIndex > 0) {
        moduleName = id.slice(0, deepIndex)
      }
      const pkgPath = resolve(root, `${moduleName}/package.json`)
      const pkg = require(pkgPath)
      const moduleRelativePath =
        deepIndex > 0
          ? id.slice(deepIndex + 1)
          : pkg.module || pkg.main || 'index.js'
      const modulePath = path.join(path.dirname(pkgPath), moduleRelativePath)
      idToFileMap.set(id, modulePath)
      fileToIdMap.set(path.basename(modulePath), id)
      debugModuleResolution(`${id} -> ${getDebugPath(modulePath)}`)
      ctx.body = await cachedRead(modulePath)
    } catch (e) {
      console.error(
        chalk.red(`[vite] Error while resolving node_modules with id "${id}":`)
      )
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
type HMRStateMap = Map<string, Set<string>>

export const importerMap: HMRStateMap = new Map()
export const importeeMap: HMRStateMap = new Map()
export const hmrBoundariesMap: HMRStateMap = new Map()

const ensureMapEntry = (map: HMRStateMap, key: string): Set<string> => {
  let entry = map.get(key)
  if (!entry) {
    entry = new Set<string>()
    map.set(key, entry)
  }
  return entry
}

function rewriteImports(source: string, importer: string, timestamp?: string) {
  if (typeof source !== 'string') {
    source = String(source)
  }
  try {
    const [imports] = parseImports(source)

    if (imports.length) {
      debugImportRewrite(`${importer}: rewriting`)
      const s = new MagicString(source)
      let hasReplaced = false

      const prevImportees = importeeMap.get(importer)
      const currentImportees = new Set<string>()
      importeeMap.set(importer, currentImportees)

      imports.forEach(({ s: start, e: end, d: dynamicIndex }) => {
        const id = source.substring(start, end)
        if (dynamicIndex === -1) {
          if (/^[^\/\.]/.test(id)) {
            const rewritten = `/@modules/${id}`
            s.overwrite(start, end, rewritten)
            hasReplaced = true
            debugImportRewrite(`    "${id}" --> "${rewritten}"`)
          } else if (id === hmrClientPublicPath) {
            if (!/.vue$|.vue\?type=/.test(importer)) {
              // the user explicit imports the HMR API in a js file
              // making the module hot.
              parseAcceptedDeps(source, importer, s)
              // we rewrite the hot.accept call
              hasReplaced = true
            }
          } else {
            // force re-fetch all imports by appending timestamp
            // if this is a hmr refresh request
            if (timestamp) {
              debugImportRewrite(`    appending hmr timestamp to "${id}"`)
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
            ensureMapEntry(importerMap, importee).add(importer)
          }
        } else if (dynamicIndex >= 0) {
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

      if (!hasReplaced) {
        debugImportRewrite(`    no imports rewritten.`)
      }

      return hasReplaced ? s.toString() : source
    } else {
      debugImportRewrite(`${importer}: no imports found.`)
    }

    return source
  } catch (e) {
    console.error(
      `[vite] Error: module imports rewrite failed for ${importer}.\n`,
      e
    )
    debugImportRewrite(source)
    return source
  }
}

function parseAcceptedDeps(source: string, importer: string, s: MagicString) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: [
      // by default we enable proposals slated for ES2020.
      // full list at https://babeljs.io/docs/en/next/babel-parser#plugins
      // this should be kept in async with @vue/compiler-core's support range
      'bigInt',
      'optionalChaining',
      'nullishCoalescingOperator'
    ]
  }).program.body

  const registerDep = (e: StringLiteral) => {
    const deps = ensureMapEntry(hmrBoundariesMap, importer)
    const depPublicPath = path.join(path.dirname(importer), e.value)
    deps.add(depPublicPath)
    s.overwrite(e.start!, e.end!, JSON.stringify(depPublicPath))
  }

  ast.forEach((node) => {
    if (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression' &&
      node.expression.callee.type === 'MemberExpression' &&
      node.expression.callee.object.type === 'Identifier' &&
      node.expression.callee.object.name === 'hot' &&
      node.expression.callee.property.name === 'accept'
    ) {
      const args = node.expression.arguments
      // inject the imports's own path so it becomes
      // hot.accept('/foo.js', ['./bar.js'], () => {})
      s.appendLeft(args[0].start!, JSON.stringify(importer) + ', ')
      // register the accepted deps
      if (args[0].type === 'ArrayExpression') {
        args[0].elements.forEach((e) => {
          if (e && e.type !== 'StringLiteral') {
            console.error(
              `[vite] HMR syntax error in ${importer}: hot.accept() deps list can only contain string literals.`
            )
          } else if (e) {
            registerDep(e)
          }
        })
      } else if (args[0].type === 'StringLiteral') {
        registerDep(args[0])
      } else {
        console.error(
          `[vite] HMR syntax error in ${importer}: hot.accept() expects a dep string or an array of deps.`
        )
      }
    }
  })
}
