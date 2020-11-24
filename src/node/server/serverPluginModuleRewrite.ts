import { ServerPlugin } from '.'
import path from 'path'
import * as fs from 'fs-extra'
import LRUCache from 'lru-cache'
import MagicString from 'magic-string'
import {
  init as initLexer,
  parse as parseImports,
  ImportSpecifier
} from 'es-module-lexer'
import { ImportDeclaration } from '@babel/types'
import { makeLegalIdentifier } from '@rollup/pluginutils'

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
  hmrDirtyFilesMap,
  latestVersionsMap
} from './serverPluginHmr'
import { clientPublicPath } from './serverPluginClient'
import {
  readBody,
  cleanUrl,
  isExternalUrl,
  bareImportRE,
  removeUnRelatedHmrQuery,
  isPlainObject
} from '../utils'
import chalk from 'chalk'
import { isCSSRequest } from '../utils/cssUtils'
import { envPublicPath } from './serverPluginEnv'
import { resolveOptimizedCacheDir } from '../optimizer'
import { parse } from '../utils/babelParse'
import { OptimizeAnalysisResult } from '../optimizer/entryAnalysisPlugin'

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
    const publicPath = ctx.path
    if (
      ctx.body &&
      ctx.response.is('js') &&
      !isCSSRequest(ctx.path) &&
      !ctx.url.endsWith('.map') &&
      !resolver.isPublicRequest(ctx.path) &&
      // skip internal client
      publicPath !== clientPublicPath &&
      // need to rewrite for <script>\<template> part in vue files
      !((ctx.path.endsWith('.vue') || ctx.vue) && ctx.query.type === 'style')
    ) {
      const content = await readBody(ctx.body)
      const cacheKey = publicPath + content
      const isHmrRequest = !!ctx.query.t
      if (!isHmrRequest && rewriteCache.has(cacheKey)) {
        debug(`(cached) ${ctx.url}`)
        ctx.body = rewriteCache.get(cacheKey)
      } else {
        await initLexer
        // dynamic import may contain extension-less path,
        // (.e.g import(runtimePathString))
        // so we need to normalize importer to ensure it contains extension
        // before we perform hmr analysis.
        // on the other hand, static import is guaranteed to have extension
        // because they must all have gone through module rewrite.
        const importer = removeUnRelatedHmrQuery(
          resolver.normalizePublicPath(ctx.url)
        )
        ctx.body = rewriteImports(
          root,
          content!,
          importer,
          resolver,
          ctx.query.t
        )
        if (!isHmrRequest) {
          rewriteCache.set(cacheKey, ctx.body)
        }
      }
    } else {
      debug(`(skipped) ${ctx.url}`)
    }
  })

  // bust module rewrite cache on file change
  watcher.on('change', async (filePath) => {
    const publicPath = resolver.fileToRequest(filePath)
    // #662 use fs.read instead of cacheRead, avoid cache hit when request file
    // and caused pass `notModified` into transform is always true
    const cacheKey = publicPath + (await fs.readFile(filePath)).toString()
    debug(`${publicPath}: cache busted`)
    rewriteCache.del(cacheKey)
  })
}

export function rewriteImports(
  root: string,
  source: string,
  importer: string,
  resolver: InternalResolver,
  timestamp?: string
) {
  // #806 strip UTF-8 BOM
  if (source.charCodeAt(0) === 0xfeff) {
    source = source.slice(1)
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

    const hasHMR = source.includes('import.meta.hot')
    const hasEnv = source.includes('import.meta.env')

    if (imports.length || hasHMR || hasEnv) {
      debug(`${importer}: rewriting`)
      const s = new MagicString(source)
      let hasReplaced = false

      const prevImportees = importeeMap.get(importer)
      const currentImportees = new Set<string>()
      importeeMap.set(importer, currentImportees)

      for (let i = 0; i < imports.length; i++) {
        const {
          s: start,
          e: end,
          d: dynamicIndex,
          ss: expStart,
          se: expEnd
        } = imports[i]
        let id = source.substring(start, end)
        const hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(id)
        let hasLiteralDynamicId = false
        if (dynamicIndex >= 0) {
          // #998 remove comment
          id = id.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
          const literalIdMatch = id.match(/^\s*(?:'([^']+)'|"([^"]+)")\s*$/)
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
            if (isOptimizedCjs(root, id)) {
              if (dynamicIndex === -1) {
                const exp = source.substring(expStart, expEnd)
                const replacement = transformCjsImport(exp, id, resolved, i)
                s.overwrite(expStart, expEnd, replacement)
              } else if (hasLiteralDynamicId) {
                // rewrite `import('package')`
                s.overwrite(
                  dynamicIndex,
                  end + 1,
                  `import('${resolved}').then(m=>m.default)`
                )
              }
            } else {
              s.overwrite(
                start,
                end,
                hasLiteralDynamicId ? `'${resolved}'` : resolved
              )
            }
            hasReplaced = true
          }

          // save the import chain for hmr analysis
          const importee = cleanUrl(resolved)
          if (
            importee !== importer &&
            // no need to track hmr client or module dependencies
            importee !== clientPublicPath
          ) {
            currentImportees.add(importee)
            debugHmr(`        ${importer} imports ${importee}`)
            ensureMapEntry(importerMap, importee).add(importer)
          }
        } else if (id !== 'import.meta' && !hasViteIgnore) {
          console.warn(
            chalk.yellow(`[vite] ignored dynamic import(${id}) in ${importer}.`)
          )
        }
      }

      if (hasHMR) {
        debugHmr(`rewriting ${importer} for HMR.`)
        rewriteFileWithHMR(root, source, importer, resolver, s)
        hasReplaced = true
      }

      if (hasEnv) {
        debug(`    injecting import.meta.env for ${importer}`)
        s.prepend(
          `import __VITE_ENV__ from "${envPublicPath}"; ` +
            `import.meta.env = __VITE_ENV__; `
        )
        hasReplaced = true
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
        debug(`    nothing needs rewriting.`)
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

const analysisCache = new Map<string, OptimizeAnalysisResult | null>()

/**
 * read analysis result from optimize step
 * If we can't find analysis result, return null
 * (maybe because user set optimizeDeps.auto to false)
 */
function getAnalysis(root: string): OptimizeAnalysisResult | null {
  if (analysisCache.has(root)) return analysisCache.get(root)!
  let analysis: OptimizeAnalysisResult | null
  try {
    const cacheDir = resolveOptimizedCacheDir(root)
    analysis = fs.readJsonSync(path.join(cacheDir!, '_analysis.json'))
  } catch (error) {
    analysis = null
  }
  if (analysis && !isPlainObject(analysis.isCommonjs)) {
    throw new Error(`[vite] invalid _analysis.json`)
  }
  analysisCache.set(root, analysis)
  return analysis
}

function isOptimizedCjs(root: string, id: string) {
  const analysis = getAnalysis(root)
  if (!analysis) return false
  return !!analysis.isCommonjs[id]
}

function transformCjsImport(
  exp: string,
  id: string,
  resolvedPath: string,
  importIndex: number
): string {
  const ast = parse(exp)[0] as ImportDeclaration
  const importNames: { importedName: string; localName: string }[] = []

  ast.specifiers.forEach((obj) => {
    if (obj.type === 'ImportSpecifier' && obj.imported.type === 'Identifier') {
      const importedName = obj.imported.name
      const localName = obj.local.name
      importNames.push({ importedName, localName })
    } else if (obj.type === 'ImportDefaultSpecifier') {
      importNames.push({ importedName: 'default', localName: obj.local.name })
    } else if (obj.type === 'ImportNamespaceSpecifier') {
      importNames.push({ importedName: '*', localName: obj.local.name })
    }
  })

  return generateCjsImport(importNames, id, resolvedPath, importIndex)
}

function generateCjsImport(
  importNames: { importedName: string; localName: string }[],
  id: string,
  resolvedPath: string,
  importIndex: number
): string {
  // If there is multiple import for same id in one file,
  // importIndex will prevent the cjsModuleName to be duplicate
  const cjsModuleName = makeLegalIdentifier(
    `$viteCjsImport${importIndex}_${id}`
  )
  const lines: string[] = [`import ${cjsModuleName} from "${resolvedPath}";`]
  importNames.forEach(({ importedName, localName }) => {
    if (importedName === '*' || importedName === 'default') {
      lines.push(`const ${localName} = ${cjsModuleName};`)
    } else {
      lines.push(`const ${localName} = ${cjsModuleName}["${importedName}"];`)
    }
  })
  return lines.join('\n')
}
