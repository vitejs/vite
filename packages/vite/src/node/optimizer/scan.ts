import fs from 'fs'
import path from 'path'
import glob from 'fast-glob'
import { ResolvedConfig } from '..'
import { Loader, Plugin } from 'esbuild'
import { knownAssetTypes } from '../constants'
import {
  createDebugger,
  emptyDir,
  isDataUrl,
  isExternalUrl,
  normalizePath,
  isObject,
  cleanUrl
} from '../utils'
import { browserExternalId } from '../plugins/resolve'
import {
  createPluginContainer,
  PluginContainer
} from '../server/pluginContainer'
import { init, parse } from 'es-module-lexer'
import MagicString from 'magic-string'
import { transformImportGlob } from '../importGlob'
import { isCSSRequest } from '../plugins/css'
import { ensureService } from '../plugins/esbuild'

const debug = createDebugger('vite:deps')

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

  // CSS/Asset entrypoints should not be scanned for dependencies.
  entries = entries.filter(
    (entry) => !(isCSSRequest(entry) || config.assetsInclude(entry))
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
  const plugin = esbuildScanPlugin(config, deps, missing, entries)

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
  depImports: Record<string, string>,
  missing: Record<string, string>,
  entries: string[]
): Plugin {
  let container: PluginContainer

  const seen = new Map<string, string | undefined>()

  const resolve = async (id: string, importer?: string) => {
    const key = id + importer
    if (seen.has(key)) {
      return seen.get(key)
    }
    container = container || (container = await createPluginContainer(config))
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
      const htmlTypesRe = /\.(html|vue|svelte)$/
      // html types: extract script contents
      build.onResolve({ filter: htmlTypesRe }, async ({ path, importer }) => {
        return {
          path: await resolve(path, importer),
          namespace: 'html'
        }
      })

      build.onLoad({ filter: htmlTypesRe, namespace: 'html' }, ({ path }) => {
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
          if (lang === 'ts') {
            loader = 'ts'
          }
          if (srcMatch) {
            const src = srcMatch[1] || srcMatch[2] || srcMatch[3]
            js += `import ${JSON.stringify(src)}\n`
          } else if (content.trim()) {
            js += content + '\n'
          }
        }
        if (!js.includes(`export default`)) {
          js += `export default {}`
        }

        if (js.includes('import.meta.glob')) {
          return transformGlob(js, path).then((contents) => ({
            loader,
            contents
          }))
        }

        return {
          loader,
          contents: js
        }
      })

      // css: externalize
      build.onResolve(
        {
          filter: /\.(css|less|sass|scss|styl|stylus|postcss)$/
        },
        externalUnlessEntry
      )

      // known asset types: externalize
      build.onResolve(
        {
          filter: new RegExp(`\\.(${[...knownAssetTypes, 'json'].join('|')})$`)
        },
        externalUnlessEntry
      )

      // known vite query types: ?worker, ?raw
      build.onResolve(
        {
          filter: /\?(worker|raw)\b/
        },
        externalUnlessEntry
      )

      // bare imports: record and externalize
      build.onResolve(
        {
          // avoid matching windows volume
          filter: /^[\w@][^:]/
        },
        async ({ path: id, importer }) => {
          if (depImports[id]) {
            return externalUnlessEntry({ path: id })
          }

          if (isExternalUrl(id) || isDataUrl(id)) {
            return { path: id, external: true }
          }

          const resolved = await resolve(id, importer)
          if (resolved) {
            // browser external
            if (resolved.startsWith(browserExternalId)) {
              return { path: id, external: true }
            }
            // virtual id
            if (id === resolved) {
              return { path: id, external: true }
            }
            // dep or force included, externalize and stop crawling
            if (resolved.includes('node_modules') || include?.includes(id)) {
              if (!exclude?.includes(id)) {
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

      // catch all
      build.onResolve(
        {
          filter: /.*/
        },
        async ({ path: id, importer }) => {
          // use vite resolver to support urls and omitted extensions
          const resolved = await resolve(id, importer)
          if (resolved && resolved !== id) {
            // in case user has configured to externalize additional assets
            if (config.assetsInclude(id)) {
              return { path: id, external: true }
            }
            return {
              path: path.resolve(cleanUrl(resolved))
            }
          } else {
            // resolve failed... probably usupported type
            // or file is already resolved because it's an entry
            return externalUnlessEntry({ path: id })
          }
        }
      )

      // for jsx/tsx, we need to access the content and check for
      // presence of import.meta.glob, since it results in import relationships
      // but isn't crawled by esbuild.
      build.onLoad({ filter: /\.(j|t)sx?$|\.mjs$/ }, ({ path: id }) => {
        let ext = path.extname(id).slice(1)
        if (ext === 'mjs') ext = 'js'
        const contents = fs.readFileSync(id, 'utf-8')
        if (contents.includes('import.meta.glob')) {
          return transformGlob(contents, id).then((contents) => ({
            loader: ext as Loader,
            contents
          }))
        }
        return {
          loader: ext as Loader,
          contents
        }
      })
    }
  }
}

async function transformGlob(source: string, importer: string) {
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
      index
    )
    s.prepend(importsString)
    s.overwrite(expStart, endIndex, exp)
  }
  return s.toString()
}
