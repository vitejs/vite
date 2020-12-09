import _debug from 'debug'
import etag from 'etag'
import fs, { promises as fsp } from 'fs'
import { SourceMap } from 'rollup'
import { ServerContext } from '..'
import { NextHandleFunction } from 'connect'
import { isCSSRequest } from '../../plugins/css'
import chalk from 'chalk'
import { cleanUrl } from '../../utils'
import { init, parse, ImportSpecifier } from 'es-module-lexer'
import MagicString from 'magic-string'
import { MODULE_PREFIX } from '../../plugins/resolve'

const debug = _debug('vite:transform')
const isDebug = !!process.env.DEBUG

export interface TransformResult {
  code: string
  map: SourceMap | null
}

/**
 * Store file -> url mapping information
 * One file may map to multiple urls, e.g. different parts of the Vue SFC
 * maps to the same file after stripping the query params.
 */
const fileToUrlMap = new Map<string, Set<string>>()

export async function transformFile(
  url: string,
  { container }: ServerContext
): Promise<TransformResult | null> {
  // resolve
  let id = await container.resolveId(url)
  if (!id) {
    isDebug && debug(`no resolveId result: ${chalk.cyan(url)}`)
    return null
  }
  if (typeof id !== 'string') {
    id = id.id
  }
  isDebug && debug(`resolve: ${chalk.yellow(url)} -> ${chalk.cyan(id)}`)

  // load
  const cleanId = cleanUrl(id)
  let loadResult = await container.load(id)
  if (loadResult == null) {
    // try fallback loading it from fs
    if (fs.existsSync(cleanId) && fs.statSync(cleanId).isFile()) {
      loadResult = await fsp.readFile(cleanId, 'utf-8')
    }
  }
  if (loadResult == null) {
    isDebug && debug(`no load result: ${chalk.cyan(url)}`)
    return null
  }
  if (typeof loadResult !== 'string') {
    loadResult = loadResult.code
  }
  isDebug && debug(`loaded: ${chalk.yellow(url)}`)

  // record file -> url relationships after successful load
  let urls = fileToUrlMap.get(cleanId)
  if (!urls) {
    urls = new Set<string>()
    fileToUrlMap.set(cleanId, urls)
  }
  urls.add(url)

  // transform
  let transformResult = await container.transform(loadResult, id)
  if (transformResult == null) {
    return null
  } else {
    isDebug && debug(`transformed: ${chalk.yellow(url)}`)
  }

  return typeof transformResult === 'string'
    ? { code: transformResult, map: null }
    : (transformResult as TransformResult)
}

export function transformMiddleware(
  context: ServerContext
): NextHandleFunction {
  const etagCache = new Map<string, string>()

  context.watcher.on('change', (file) => {
    const urls = fileToUrlMap.get(file)
    if (urls) {
      urls.forEach((url) => {
        debug(`busting etag cache for ${url}`)
        etagCache.delete(url)
      })
    }
  })

  return async (req, res, next) => {
    const ifNoneMatch = req.headers['if-none-match']
    if (ifNoneMatch && ifNoneMatch === etagCache.get(req.url!)) {
      debug(`etag cache hit for ${req.url}`)
      res.statusCode = 304
      return res.end()
    }

    const fetchDest = req.headers['sec-fetch-dest']
    const accept = req.headers['accept']
    let isCSS = false

    if (
      accept === '*/*' || // <-- esm imports accept */* in most browsers
      fetchDest === 'script' ||
      (isCSS =
        fetchDest === 'style' ||
        accept?.includes('text/css') ||
        isCSSRequest(req.url!))
    ) {
      try {
        const result = await transformFile(req.url!, context)
        if (result) {
          if (!isCSS) {
            // TODO merge source map?
            result.code = await rewriteImports(result.code, req.url!)
          }

          const Etag = etag(result.code, { weak: true })
          etagCache.set(req.url!, Etag)
          if (req.headers['if-none-match'] === Etag) {
            res.statusCode = 304
            return res.end()
          }

          res.setHeader(
            'Content-Type',
            isCSS ? 'text/css' : 'application/javascript'
          )
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Etag', Etag)
          // TODO handle source map
          return res.end(result.code)
        }
      } catch (e) {
        return next(e)
      }
    }

    next()
  }
}

async function rewriteImports(source: string, importer: string) {
  await init
  let imports: ImportSpecifier[] = []
  try {
    imports = parse(source)[0]
  } catch (e) {
    console.warn(
      chalk.yellow(
        `[vite] failed to parse ${chalk.cyan(
          importer
        )} for import rewrite.\nIf you are using ` +
          `JSX, make sure to named the file with the .jsx extension.`
      )
    )
    return source
  }

  if (!imports.length) {
    debug(`${importer}: no imports found.`)
    return source
  }

  const s = new MagicString(source)
  let hasReplaced = false

  for (let i = 0; i < imports.length; i++) {
    const { s: start, e: end, d: dynamicIndex } = imports[i]
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
      if (id[0] !== '/' && id[0] !== '.') {
        const prefixed = MODULE_PREFIX + id
        s.overwrite(
          start,
          end,
          hasLiteralDynamicId ? `'${prefixed}'` : prefixed
        )
        hasReplaced = true
      }
    } else if (id !== 'import.meta' && !hasViteIgnore) {
      console.warn(
        chalk.yellow(`[vite] ignored dynamic import(${id}) in ${importer}.`)
      )
    }
  }

  // TODO env?
  // if (hasEnv) {
  //   debug(`    injecting import.meta.env for ${importer}`)
  //   s.prepend(
  //     `import __VITE_ENV__ from "${envPublicPath}"; ` +
  //       `import.meta.env = __VITE_ENV__; `
  //   )
  //   hasReplaced = true
  // }

  if (!hasReplaced) {
    debug(`nothing needs rewriting.`)
  }

  return hasReplaced ? s.toString() : source
}
