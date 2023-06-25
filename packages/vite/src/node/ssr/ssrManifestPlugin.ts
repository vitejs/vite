import { basename, dirname, join, relative } from 'node:path'
import { parse as parseImports } from 'es-module-lexer'
import type { ImportSpecifier } from 'es-module-lexer'
import type { OutputChunk } from 'rollup'
import jsonStableStringify from 'json-stable-stringify'
import type { ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { preloadMethod } from '../plugins/importAnalysisBuild'
import {
  generateCodeFrame,
  joinUrlSegments,
  normalizePath,
  numberToPos,
} from '../utils'

export function ssrManifestPlugin(config: ResolvedConfig): Plugin {
  // module id => preload assets mapping
  const ssrManifest: Record<string, string[]> = {}
  const base = config.base // TODO:base

  return {
    name: 'vite:ssr-manifest',
    generateBundle(_options, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk') {
          for (const id in chunk.modules) {
            const normalizedId = normalizePath(relative(config.root, id))
            const mappedChunks =
              ssrManifest[normalizedId] ?? (ssrManifest[normalizedId] = [])
            if (!chunk.isEntry) {
              mappedChunks.push(joinUrlSegments(base, chunk.fileName))
              // <link> tags for entry chunks are already generated in static HTML,
              // so we only need to record info for non-entry chunks.
              chunk.viteMetadata!.importedCss.forEach((file) => {
                mappedChunks.push(joinUrlSegments(base, file))
              })
            }
            chunk.viteMetadata!.importedAssets.forEach((file) => {
              mappedChunks.push(joinUrlSegments(base, file))
            })
          }
          if (chunk.code.includes(preloadMethod)) {
            // generate css deps map
            const code = chunk.code
            let imports: ImportSpecifier[]
            try {
              imports = parseImports(code)[0].filter((i) => i.n && i.d > -1)
            } catch (e: any) {
              const loc = numberToPos(code, e.idx)
              this.error({
                name: e.name,
                message: e.message,
                stack: e.stack,
                cause: e.cause,
                pos: e.idx,
                loc: { ...loc, file: chunk.fileName },
                frame: generateCodeFrame(code, loc),
              })
            }
            if (imports.length) {
              for (let index = 0; index < imports.length; index++) {
                const { s: start, e: end, n: name } = imports[index]
                // check the chunk being imported
                const url = code.slice(start, end)
                const deps: string[] = []
                const ownerFilename = chunk.fileName
                // literal import - trace direct imports and add to deps
                const analyzed: Set<string> = new Set<string>()
                const addDeps = (filename: string) => {
                  if (filename === ownerFilename) return
                  if (analyzed.has(filename)) return
                  analyzed.add(filename)
                  const chunk = bundle[filename] as OutputChunk | undefined
                  if (chunk) {
                    chunk.viteMetadata!.importedCss.forEach((file) => {
                      deps.push(joinUrlSegments(base, file)) // TODO:base
                    })
                    chunk.imports.forEach(addDeps)
                  }
                }
                const normalizedFile = normalizePath(
                  join(dirname(chunk.fileName), url.slice(1, -1)),
                )
                addDeps(normalizedFile)
                ssrManifest[basename(name!)] = deps
              }
            }
          }
        }
      }

      this.emitFile({
        fileName:
          typeof config.build.ssrManifest === 'string'
            ? config.build.ssrManifest
            : 'ssr-manifest.json',
        type: 'asset',
        source: jsonStableStringify(ssrManifest, { space: 2 }),
      })
    },
  }
}
