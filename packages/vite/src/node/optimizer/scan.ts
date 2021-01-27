import fs from 'fs'
import path from 'path'
import glob from 'fast-glob'
import { ResolvedConfig } from '..'
import { build, Loader, Plugin } from 'esbuild'
import { knownAssetTypes } from '../constants'
import { createDebugger, emptyDir, isDataUrl, isExternalUrl } from '../utils'
import { browserExternalId } from '../plugins/resolve'
import { isCSSRequest } from '../plugins/css'
import chalk from 'chalk'
import {
  createPluginContainer,
  PluginContainer
} from '../server/pluginContainer'

const debug = createDebugger('vite:scan')

export async function scanImports(
  config: ResolvedConfig
): Promise<Record<string, string>> {
  const s = Date.now()
  const htmlEntries = await glob('**/index.html', {
    cwd: config.root,
    ignore: [
      '**/node_modules/**',
      `**/${config.build.outDir}/**`,
      `**/__tests__/**`
    ],
    absolute: true
  })

  const tempDir = path.join(config.optimizeCacheDir!, 'scan')
  const depImports: Record<string, string> = {}
  const missing = new Set<string>()
  const plugin = esbuildScanPlugin(config, depImports, missing)

  await Promise.all(
    htmlEntries.map((entry) =>
      build({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        logLevel: 'error',
        outdir: tempDir,
        outbase: config.root,
        plugins: [plugin]
      })
    )
  )

  emptyDir(tempDir)
  fs.rmdirSync(tempDir)

  debug(`scan completed in ${Date.now() - s}ms:`, depImports)

  if (missing.size) {
    config.logger.error(
      `The following dependencies are imported but couldn't be resolved: ${[
        ...missing
      ].join(', ')}`
    )
  }

  return depImports
}

const scriptModuleRE = /(<script\b[^>]*type\s*=\s*(?:"module"|'module')[^>]*>)(.*?)<\/script>/gims
const scriptRE = /(<script\b[^>]*>)(.*?)<\/script>/gims
const srcRE = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/im
const langRE = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/im

function esbuildScanPlugin(
  config: ResolvedConfig,
  depImports: Record<string, string>,
  missing: Set<string>
): Plugin {
  let container: PluginContainer

  const seen = new Map<string, string | undefined>()

  const resolve = async (id: string, importer?: string) => {
    const key = id + importer
    if (seen.has(key)) {
      return seen.get(key)
    }
    container = container || (container = await createPluginContainer(config))
    const resolved = await container.resolveId(id, importer)
    const res = resolved?.id
    seen.set(key, res)
    return res
  }

  const include = config.optimizeDeps?.include
  const exclude = config.optimizeDeps?.exclude

  return {
    name: 'vite:dep-scan',
    setup(build) {
      // bare imports: record and externalize
      build.onResolve(
        {
          filter: /^[\w@]/
        },
        async ({ path: id, importer }) => {
          if (depImports[id]) {
            return {
              path: id,
              external: true
            }
          }

          if (
            isExternalUrl(id) ||
            isDataUrl(id) ||
            isCSSRequest(id) ||
            config.assetsInclude(id)
          ) {
            return {
              path: id,
              external: true
            }
          }

          const resolved = await resolve(id, importer)
          if (resolved) {
            // virtual id or browser external
            if (id === resolved || resolved.startsWith(browserExternalId)) {
              return { path: id, external: true }
            }
            // dep or force included, externalize and stop crawling
            if (resolved.includes('node_modules') || include?.includes(id)) {
              if (!exclude?.includes(id)) {
                depImports[id] = resolved
              }
              return {
                path: id,
                external: true
              }
            } else {
              // linked package, keep crawling
              return {
                path: path.resolve(resolved)
              }
            }
          } else {
            config.logger.error(
              chalk.red(
                `Dependency ${id} not found. Is it installed? (imported by ${importer})`
              )
            )
            missing.add(id)
          }
        }
      )

      const htmlTypesRe = /\.(html|vue|svelte)$/
      // html types: extract script contents
      build.onResolve({ filter: htmlTypesRe }, async ({ path, importer }) => {
        return {
          path: await resolve(path, importer),
          namespace: 'html'
        }
      })
      build.onLoad(
        { filter: htmlTypesRe, namespace: 'html' },
        async ({ path }) => {
          const raw = await fs.promises.readFile(path, 'utf-8')
          const regex = path.endsWith('.html') ? scriptModuleRE : scriptRE
          regex.lastIndex = 0
          let js = ''
          let loader: Loader = 'js'
          for (const [_, openTag, content] of raw.matchAll(regex)) {
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
          return {
            loader,
            contents: js
          }
        }
      )

      // css: externalize
      build.onResolve(
        {
          filter: /\.(css|less|sass|scss|styl|stylus|postcss)$/
        },
        ({ path }) => ({ path, external: true })
      )

      // known asset types: externalize
      build.onResolve(
        {
          filter: new RegExp(`\\.(${knownAssetTypes.join('|')})$`)
        },
        ({ path }) => ({ path, external: true })
      )

      // catch all
      build.onResolve(
        {
          filter: /.*/
        },
        async ({ path: id, importer }) => {
          if (id.includes(`?worker`)) {
            return { path: id, external: true }
          }
          // use vite resolver to support urls
          const resolved = await resolve(id, importer)
          if (resolved && resolved !== id) {
            return {
              path: path.resolve(resolved)
            }
          } else {
            // resolve failed... probably usupported type
            return {
              path: id,
              external: true
            }
          }
        }
      )
    }
  }
}
