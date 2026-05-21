import path from 'node:path'
import type { OutputAsset, OutputChunk, RenderedChunk } from 'rolldown'
import { viteManifestPlugin as nativeManifestPlugin } from 'rolldown/experimental'
import type { Plugin } from '../plugin'
import { normalizePath } from '../utils'
import { perEnvironmentState } from '../environment'
import { type Environment, perEnvironmentPlugin } from '..'
import { cssEntriesMap } from './asset'

const endsWithJSRE = /\.[cm]?js$/

export type Manifest = Record<string, ManifestChunk>

export interface ManifestChunk {
  /**
   * The input file name of this chunk / asset if known
   */
  src?: string
  /**
   * The output file name of this chunk / asset
   */
  file: string
  /**
   * The list of CSS files imported by this chunk
   */
  css?: string[]
  /**
   * The list of asset files imported by this chunk, excluding CSS files
   */
  assets?: string[]
  /**
   * Whether this chunk or asset is an entry point
   */
  isEntry?: boolean
  /**
   * The name of this chunk / asset if known
   */
  name?: string
  // names field is deprecated (removed from types, but still emitted for backward compatibility)
  /**
   * Whether this chunk is a dynamic entry point
   *
   * This field is only present in JS chunks.
   */
  isDynamicEntry?: boolean
  /**
   * The list of statically imported chunks by this chunk
   *
   * The values are the keys of the manifest. This field is only present in JS chunks.
   */
  imports?: string[]
  /**
   * The list of dynamically imported chunks by this chunk
   *
   * The values are the keys of the manifest. This field is only present in JS chunks.
   */
  dynamicImports?: string[]
}

export function manifestPlugin(): Plugin {
  const getState = perEnvironmentState(() => {
    return {
      manifest: {} as Manifest,
      outputCount: 0,
      reset() {
        this.manifest = {}
        this.outputCount = 0
      },
    }
  })

  return perEnvironmentPlugin('native:manifest', (environment) => {
    if (!environment.config.build.manifest) return false

    const root = environment.config.root
    const outPath =
      environment.config.build.manifest === true
        ? '.vite/manifest.json'
        : environment.config.build.manifest

    const envs: Record<string, Environment> = {}
    function getChunkName(chunk: OutputChunk) {
      return (
        getChunkOriginalFileName(chunk, root, false) ??
        `_${path.basename(chunk.fileName)}`
      )
    }

    return [
      {
        name: 'native:manifest-envs',
        buildStart() {
          envs[environment.name] = this.environment
        },
      },
      nativeManifestPlugin({
        root,
        outPath,
        isOutputOptionsForLegacyChunks:
          environment.config.isOutputOptionsForLegacyChunks,
        cssEntries() {
          return Object.fromEntries(
            [...cssEntriesMap.get(envs[environment.name])!.values()].map(
              ({ name, referenceId }) => {
                return [referenceId, name]
              },
            ),
          )
        },
      }),
      {
        name: 'native:manifest-compatible',
        generateBundle(_, bundle) {
          const createFallbackManifest = (): Manifest => {
            const manifest: Manifest = {}
            const entryCssReferenceIds = cssEntriesMap.get(this.environment)
            const entryCssAssetFileNames = new Set(entryCssReferenceIds?.keys())
            for (const { referenceId } of entryCssReferenceIds?.values() ??
              []) {
              try {
                entryCssAssetFileNames.add(this.getFileName(referenceId))
              } catch {
                // The asset was generated as part of a different output option.
              }
            }

            for (const file in bundle) {
              const output = bundle[file]
              if (output.type === 'chunk') {
                manifest[getChunkName(output)] = createChunk(output)
              } else if (output.type === 'asset' && output.names.length > 0) {
                const src =
                  output.originalFileNames.length > 0
                    ? output.originalFileNames[0]
                    : `_${path.basename(output.fileName)}`
                const isEntry = entryCssAssetFileNames.has(output.fileName)
                const asset = createAsset(output, src, isEntry)

                const file = manifest[src]?.file
                if (!(file && endsWithJSRE.test(file))) {
                  manifest[src] = asset
                }

                for (const originalFileName of output.originalFileNames.slice(
                  1,
                )) {
                  const file = manifest[originalFileName]?.file
                  if (!(file && endsWithJSRE.test(file))) {
                    manifest[originalFileName] = asset
                  }
                }
              }
            }

            return manifest
          }

          const asset = bundle[outPath]
          if (asset && asset.type !== 'asset') return
          const manifest = asset
            ? (JSON.parse(asset.source.toString()) as Manifest)
            : createFallbackManifest()
          for (const output of Object.values(bundle)) {
            const importedCss = output.viteMetadata?.importedCss
            const importedAssets = output.viteMetadata?.importedAssets
            if (!importedCss?.size && !importedAssets?.size) continue
            if (output.type === 'chunk') {
              const item = manifest[getChunkName(output)]
              if (!item) continue
              if (importedCss?.size) {
                item.css = [...importedCss]
              }
              if (importedAssets?.size) {
                item.assets = [...importedAssets]
              }
            } else if (output.type === 'asset' && output.names.length > 0) {
              // Add every unique asset to the manifest, keyed by its original name
              const keys =
                output.originalFileNames.length > 0
                  ? output.originalFileNames
                  : [`_${path.basename(output.fileName)}`]

              for (const key of keys) {
                const item = manifest[key]
                if (!item) continue
                if (!(item.file && endsWithJSRE.test(item.file))) {
                  if (importedCss?.size) {
                    item.css = [...importedCss]
                  }
                  if (importedAssets?.size) {
                    item.assets = [...importedAssets]
                  }
                }
              }
            }
          }
          const output = this.environment.config.build.rolldownOptions.output
          const outputLength = Array.isArray(output) ? output.length : 1
          if (outputLength === 1) {
            const source = JSON.stringify(manifest, undefined, 2)
            if (asset) {
              asset.source = source
            } else {
              this.emitFile({
                fileName: outPath,
                type: 'asset',
                source,
              })
            }
            return
          }

          const state = getState(this)
          state.outputCount++
          state.manifest = Object.assign(state.manifest, manifest)
          if (state.outputCount >= outputLength) {
            const source = JSON.stringify(state.manifest, undefined, 2)
            if (asset) {
              asset.source = source
            } else {
              this.emitFile({
                fileName: outPath,
                type: 'asset',
                source,
              })
            }
            state.reset()
          } else {
            if (asset) {
              delete bundle[outPath]
            }
          }

          function getInternalImports(imports: string[]): string[] {
            const filteredImports: string[] = []

            for (const file of imports) {
              const output = bundle[file]
              if (output?.type !== 'chunk') continue
              filteredImports.push(getChunkName(output))
            }

            return filteredImports
          }

          function createChunk(chunk: OutputChunk): ManifestChunk {
            const manifestChunk: ManifestChunk = {
              file: chunk.fileName,
              name: chunk.name,
            }

            if (chunk.facadeModuleId) {
              manifestChunk.src = getChunkName(chunk)
            }
            if (chunk.isEntry) {
              manifestChunk.isEntry = true
            }
            if (chunk.isDynamicEntry) {
              manifestChunk.isDynamicEntry = true
            }

            if (chunk.imports.length) {
              const internalImports = getInternalImports(chunk.imports)
              if (internalImports.length > 0) {
                manifestChunk.imports = internalImports
              }
            }

            if (chunk.dynamicImports.length) {
              const internalImports = getInternalImports(chunk.dynamicImports)
              if (internalImports.length > 0) {
                manifestChunk.dynamicImports = internalImports
              }
            }

            if (chunk.viteMetadata?.importedCss.size) {
              manifestChunk.css = [...chunk.viteMetadata.importedCss]
            }
            if (chunk.viteMetadata?.importedAssets.size) {
              manifestChunk.assets = [...chunk.viteMetadata.importedAssets]
            }

            return manifestChunk
          }

          function createAsset(
            asset: OutputAsset,
            src: string,
            isEntry?: boolean,
          ): ManifestChunk {
            const manifestChunk: ManifestChunk = {
              file: asset.fileName,
              src,
            }
            if (isEntry) manifestChunk.isEntry = true
            return manifestChunk
          }
        },
      },
    ]
  })
}

export function getChunkOriginalFileName(
  chunk: OutputChunk | RenderedChunk,
  root: string,
  isLegacy: boolean,
): string | undefined {
  if (chunk.facadeModuleId) {
    let name = normalizePath(path.relative(root, chunk.facadeModuleId))
    if (isLegacy && !chunk.name.includes('-legacy')) {
      const ext = path.extname(name)
      const endPos = ext.length !== 0 ? -ext.length : undefined
      name = `${name.slice(0, endPos)}-legacy${ext}`
    }
    return name.replace(/\0/g, '')
  }
}
