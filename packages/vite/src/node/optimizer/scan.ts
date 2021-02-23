import fs from 'fs'
import path from 'path'
import glob from 'fast-glob'
import { ResolvedConfig } from '..'
import { Loader, Plugin } from 'esbuild'
import {
  KNOWN_ASSET_TYPES,
  JS_TYPES_RE,
  SPECIAL_QUERY_RE,
  OPTIMIZABLE_ENTRY_RE
} from '../constants'
import {
  createDebugger,
  emptyDir,
  normalizePath,
  isObject,
  cleanUrl,
  externalRE,
  dataUrlRE
} from '../utils'
import {
  createPluginContainer,
  PluginContainer
} from '../server/pluginContainer'
import { init, parse } from 'es-module-lexer'
import MagicString from 'magic-string'
import { transformImportGlob } from '../importGlob'
import { ensureService } from '../plugins/esbuild'

const debug = createDebugger('vite:deps')

const htmlTypesRE = /\.(html|vue|svelte)$/

export async function scanImports(
  config: ResolvedConfig
): Promise<{
  deps: Record<string, string>
  missing: Record<string, string>
}> {
  const s = Date.now()

  let entries: string[] = []

  const explicitEntryPatterns = config.optimizeDeps?.entries
  const buildInput = config.build.rollupOptions?.input

  if (explicitEntryPatterns) {
    entries = await globEntries(explicitEntryPatterns, config)
  } else if (buildInput) {
    const resolvePath = (p: string) => path.resolve(config.root, p)
    if (typeof buildInput === 'string') {
      entries = [resolvePath(buildInput)]
    } else if (Array.isArray(buildInput)) {
      entries = buildInput.map(resolvePath)
    } else if (isObject(buildInput)) {
      entries = Object.values(buildInput).map(resolvePath)
    } else {
      throw new Error('invalid rollupOptions.input value.')
    }
  } else {
    entries = await globEntries('**/*.html', config)
  }

  // Non-supported entry file types and virtual files should not be scanned for
  // dependencies.
  entries = entries.filter(
    (entry) =>
      (JS_TYPES_RE.test(entry) || htmlTypesRE.test(entry)) &&
      fs.existsSync(entry)
  )

  if (!entries.length) {
    debug(`No entry HTML files detected`)
    return { deps: {}, missing: {} }
  } else {
    debug(`Crawling dependencies using entries:\n  ${entries.join('\n  ')}`)
  }

  const tempDir = path.join(config.optimizeCacheDir!, 'temp')
  const deps: Record<string, string> = {}
  const missing: Record<string, string> = {}
  const container = await createPluginContainer(config)
  const plugin = esbuildScanPlugin(config, container, deps, missing, entries)

  const esbuildService = await ensureService()
  await Promise.all(
    entries.map((entry) =>
      esbuildService.build({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        logLevel: 'error',
        outdir: tempDir,
        plugins: [plugin]
      })
    )
  )

  emptyDir(tempDir)
  fs.rmdirSync(tempDir)

  debug(`Scan completed in ${Date.now() - s}ms:`, deps)

  return {
    deps,
    missing
  }
}

function globEntries(pattern: string | string[], config: ResolvedConfig) {
  return glob(pattern, {
    cwd: config.root,
    ignore: [
      '**/node_modules/**',
      `**/${config.build.outDir}/**`,
      `**/__tests__/**`
    ],
    absolute: true
  })
}

const scriptModuleRE = /(<script\b[^>]*type\s*=\s*(?:"module"|'module')[^>]*>)(.*?)<\/script>/gims
const scriptRE = /(<script\b[^>]*>)(.*?)<\/script>/gims
const srcRE = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/im
const langRE = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/im

function esbuildScanPlugin(
  config: ResolvedConfig,
  container: PluginContainer,
  depImports: Record<string, string>,
  missing: Record<string, string>,
  entries: string[]
): Plugin {
  const seen = new Map<string, string | undefined>()

  const resolve = async (id: string, importer?: string) => {
    const key = id + (importer && path.dirname(importer))
    if (seen.has(key)) {
      return seen.get(key)
    }
    const resolved = await container.resolveId(
      id,
      importer && normalizePath(importer)
    )
    const res = resolved?.id
    seen.set(key, res)
    return res
  }

  const include = config.optimizeDeps?.include
  const exclude = config.optimizeDeps?.exclude

  const externalUnlessEntry = ({ path }: { path: string }) => ({
    path,
    external: !entries.includes(path)
  })

  return {
    name: 'vite:dep-scan',
    setup(build) {
      // external urls
      build.onResolve({ filter: externalRE }, ({ path }) => ({
        path,
        external: true
      }))

      // data urls
      build.onResolve({ filter: dataUrlRE }, ({ path }) => ({
        path,
        external: true
      }))

      // html types: extract script contents -----------------------------------
      build.onResolve({ filter: htmlTypesRE }, async ({ path, importer }) => {
        return {
          path: await resolve(path, importer),
          namespace: 'html'
        }
      })

      // extract scripts inside HTML-like files and treat it as a js module
      build.onLoad({ filter: htmlTypesRE, namespace: 'html' }, ({ path }) => {
        const raw = fs.readFileSync(path, 'utf-8')
        const regex = path.endsWith('.html') ? scriptModuleRE : scriptRE
        regex.lastIndex = 0
        let js = ''
        let loader: Loader = 'js'
        let match
        while ((match = regex.exec(raw))) {
          const [, openTag, content] = match
          const srcMatch = openTag.match(srcRE)
          const langMatch = openTag.match(langRE)
          const lang =
            langMatch && (langMatch[1] || langMatch[2] || langMatch[3])
          if (lang === 'ts' || lang === 'tsx' || lang === 'jsx') {
            loader = lang
          }
          if (srcMatch) {
            const src = srcMatch[1] || srcMatch[2] || srcMatch[3]
            js += `import ${JSON.stringify(src)}\n`
          } else if (content.trim()) {
            js += content + '\n'
          }
        }

        if (js.includes('import.meta.glob')) {
          return transformGlob(js, path, config.root, loader).then(
            (contents) => ({
              loader,
              contents
            })
          )
        }

        // <script setup> may contain TLA which is not true TLA but esbuild
        // will error on it, so replace it with another operator.
        if (js.includes('await')) {
          js = js.replace(/\bawait\b/g, 'void')
        }

        if (!js.includes(`export default`)) {
          js += `export default {}`
        }

        return {
          loader,
          contents: js
        }
      })

      // bare imports: record and externalize ----------------------------------
      build.onResolve(
        {
          // avoid matching windows volume
          filter: /^[\w@][^:]/
        },
        async ({ path: id, importer }) => {
          if (exclude?.some((e) => e === id || id.startsWith(e + '/'))) {
            return externalUnlessEntry({ path: id })
          }
          if (depImports[id]) {
            return externalUnlessEntry({ path: id })
          }
          const resolved = await resolve(id, importer)
          if (resolved) {
            if (shouldExternalizeDep(resolved, id)) {
              return externalUnlessEntry({ path: id })
            }
            if (resolved.includes('node_modules') || include?.includes(id)) {
              // dep or fordce included, externalize and stop crawling
              if (OPTIMIZABLE_ENTRY_RE.test(resolved)) {
                depImports[id] = resolved
              }
              return externalUnlessEntry({ path: id })
            } else {
              // linked package, keep crawling
              return {
                path: path.resolve(resolved)
              }
            }
          } else {
            missing[id] = normalizePath(importer)
          }
        }
      )

      // Externalized file types -----------------------------------------------
      // these are done on raw ids using esbuild's native regex filter so it
      // snould be faster than doing it in the catch-all via js
      // they are done after the bare import resolve because a package name
      // may end with these extensions

      // css & json
      build.onResolve(
        {
          filter: /\.(css|less|sass|scss|styl|stylus|postcss|json)$/
        },
        externalUnlessEntry
      )

      // known asset types
      build.onResolve(
        {
          filter: new RegExp(`\\.(${KNOWN_ASSET_TYPES.join('|')})$`)
        },
        externalUnlessEntry
      )

      // known vite query types: ?worker, ?raw
      build.onResolve({ filter: SPECIAL_QUERY_RE }, ({ path }) => ({
        path,
        external: true
      }))

      // catch all -------------------------------------------------------------

      build.onResolve(
        {
          filter: /.*/
        },
        async ({ path: id, importer }) => {
          // use vite resolver to support urls and omitted extensions
          const resolved = await resolve(id, importer)
          if (resolved) {
            if (shouldExternalizeDep(resolved, id)) {
              return externalUnlessEntry({ path: id })
            }

            const namespace = htmlTypesRE.test(resolved) ? 'html' : undefined

            return {
              path: path.resolve(cleanUrl(resolved)),
              namespace
            }
          } else {
            // resolve failed... probably usupported type
            return externalUnlessEntry({ path: id })
          }
        }
      )

      // for jsx/tsx, we need to access the content and check for
      // presence of import.meta.glob, since it results in import relationships
      // but isn't crawled by esbuild.
      build.onLoad({ filter: JS_TYPES_RE }, ({ path: id }) => {
        let ext = path.extname(id).slice(1)
        if (ext === 'mjs') ext = 'js'

        let contents = fs.readFileSync(id, 'utf-8')
        if (ext.endsWith('x') && config.esbuild && config.esbuild.jsxInject) {
          contents = config.esbuild.jsxInject + `\n` + contents
        }

        if (contents.includes('import.meta.glob')) {
          return transformGlob(contents, id, config.root, ext as Loader).then(
            (contents) => ({
              loader: ext as Loader,
              contents
            })
          )
        }
        return {
          loader: ext as Loader,
          contents
        }
      })
    }
  }
}

async function transformGlob(
  source: string,
  importer: string,
  root: string,
  loader: Loader
) {
  // transform the content first since es-module-lexer can't handle non-js
  if (loader !== 'js') {
    source = (await (await ensureService()).transform(source, { loader })).code
  }

  await init
  const imports = parse(source)[0]
  const s = new MagicString(source)
  for (let index = 0; index < imports.length; index++) {
    const { s: start, e: end, ss: expStart } = imports[index]
    const url = source.slice(start, end)
    if (url !== 'import.meta') continue
    if (source.slice(end, end + 5) !== '.glob') continue
    const { importsString, exp, endIndex } = await transformImportGlob(
      source,
      start,
      normalizePath(importer),
      index,
      root
    )
    s.prepend(importsString)
    s.overwrite(expStart, endIndex, exp)
  }
  return s.toString()
}

export function shouldExternalizeDep(resolvedId: string, rawId: string) {
  // not a valid file path
  if (!path.isAbsolute(resolvedId)) {
    return true
  }
  // virtual id
  if (resolvedId === rawId || resolvedId.includes('\0')) {
    return true
  }
  // resovled is not a scannable type
  if (!JS_TYPES_RE.test(resolvedId) && !htmlTypesRE.test(resolvedId)) {
    return true
  }
}
