import { basename, dirname, join, relative } from 'node:path'
import { parse as parseImports } from 'es-module-lexer'
import type {
  ParseError as EsModuleLexerParseError,
  ImportSpecifier,
} from 'es-module-lexer'
import type { OutputChunk } from 'rollup'
import type { Plugin } from '../plugin'
import { preloadMethod } from '../plugins/importAnalysisBuild'
import {
  generateCodeFrame,
  joinUrlSegments,
  normalizePath,
  numberToPos,
  sortObjectKeys,
} from '../utils'
import { perEnvironmentState } from '../environment'

export function ssrManifestPlugin(): Plugin {
  // module id => preload assets mapping
  const getSsrManifest = perEnvironmentState(() => {
    return {} as Record<string, string[]>
  })

  return {
    name: 'vite:ssr-manifest',

    applyToEnvironment(environment) {
      return !!environment.config.build.ssrManifest
    },

    generateBundle(_options, bundle) {
      const config = this.environment.config
      const ssrManifest = getSsrManifest(this)
      const { base } = config
      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type !== 'chunk') {
          continue
        }

        for (const moduleId in chunk.modules) {
          const normalizedId = normalizePath(relative(config.root, moduleId))
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

        if (!chunk.code.includes(preloadMethod)) {
          continue
        }

        // generate css deps map
        const { code, fileName: parentChunkName } = chunk
        let dynamicImports: ImportSpecifier[] = []
        try {
          dynamicImports = parseImports(code)[0].filter((i) => i.n && i.d > -1)
        } catch (_e: unknown) {
          const e = _e as EsModuleLexerParseError
          const loc = numberToPos(code, e.idx)
          this.error({
            name: e.name,
            message: e.message,
            stack: e.stack,
            cause: e.cause,
            pos: e.idx,
            loc: {
              ...loc,
              file: parentChunkName,
            },
            frame: generateCodeFrame(code, loc),
          })
        }

        for (const dynamicImport of dynamicImports) {
          const { s: start, e: end, n: name } = dynamicImport

          // check the chunk being imported
          const url = code.slice(start, end)
          const urlResolved = normalizePath(
            join(dirname(parentChunkName), url.slice(1, -1)),
          )

          const dependencies: string[] = []

          // Track traversed to prevent loops
          const traversed = new Set<string>()
          ;(function traverseChunkDependencies(chunkName: string) {
            if (chunkName === parentChunkName) return
            if (traversed.has(chunkName)) return
            traversed.add(chunkName)
            const chunk = bundle[chunkName] as OutputChunk | undefined
            if (chunk) {
              chunk.viteMetadata!.importedCss.forEach((file) =>
                dependencies.push(joinUrlSegments(base, file)),
              )
              chunk.imports.forEach(traverseChunkDependencies)
            }
          })(urlResolved)
          ssrManifest[basename(name!)] = dependencies
        }
      }

      this.emitFile({
        fileName:
          typeof config.build.ssrManifest === 'string'
            ? config.build.ssrManifest
            : '.vite/ssr-manifest.json',
        type: 'asset',
        source: JSON.stringify(sortObjectKeys(ssrManifest), undefined, 2),
      })
    },
  }
}
