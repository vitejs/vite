import path from 'node:path'
import type { OutputBundle, OutputChunk, RenderedChunk } from 'rolldown'
import { viteManifestPlugin as nativeManifestPlugin } from 'rolldown/experimental'
import type { Plugin } from '../plugin'
import { normalizePath, sortObjectKeys } from '../utils'
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
          const cssEntries = cssEntriesMap.get(envs[environment.name])
          return Object.fromEntries(
            [...(cssEntries?.values() ?? [])].map(({ name, referenceId }) => {
              return [referenceId, name]
            }),
          )
        },
      }),
      {
        name: 'native:manifest-compatible',
        generateBundle(_, bundle) {
          const asset = bundle[outPath]
          const assetSource =
            asset?.type === 'asset' ? asset.source.toString() : undefined
          let manifest: Manifest | undefined = assetSource
            ? undefined
            : createManifestFromBundle(
                bundle,
                root,
                this.environment,
                (referenceId) => this.getFileName(referenceId),
              )
          for (const output of Object.values(bundle)) {
            const importedCss = output.viteMetadata?.importedCss
            const importedAssets = output.viteMetadata?.importedAssets
            if (!importedCss?.size && !importedAssets?.size) continue
            manifest ??= JSON.parse(assetSource!) as Manifest
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
          if (manifest && outputLength === 1) {
            const source = JSON.stringify(
              sortObjectKeys(manifest),
              undefined,
              2,
            )
            if (asset?.type === 'asset') {
              asset.source = source
            } else {
              this.emitFile({ fileName: outPath, type: 'asset', source })
            }
            return
          }

          const state = getState(this)
          state.outputCount++
          state.manifest = Object.assign(
            state.manifest,
            manifest ?? JSON.parse(assetSource!),
          )
          if (state.outputCount >= outputLength) {
            const source = JSON.stringify(
              sortObjectKeys(state.manifest),
              undefined,
              2,
            )
            if (asset?.type === 'asset') {
              asset.source = source
            } else {
              this.emitFile({ fileName: outPath, type: 'asset', source })
            }
            state.reset()
          } else if (asset?.type === 'asset') {
            delete bundle[outPath]
          }
        },
      },
    ]
  })
}

function createManifestFromBundle(
  bundle: OutputBundle,
  root: string,
  environment: Environment,
  getFileName: (referenceId: string) => string,
): Manifest {
  const manifest: Manifest = {}
  const entryCssAssetFileNames = new Map<string, string>()

  for (const { name, referenceId } of cssEntriesMap
    .get(environment)
    ?.values() ?? []) {
    try {
      entryCssAssetFileNames.set(getFileName(referenceId), name)
    } catch {}
  }

  function getChunkName(chunk: OutputChunk) {
    return (
      getChunkOriginalFileName(chunk, root, false) ??
      `_${path.basename(chunk.fileName)}`
    )
  }

  function getInternalImports(imports: readonly string[]) {
    const filteredImports: string[] = []
    for (const file of imports) {
      const importee = bundle[file]
      if (importee?.type === 'chunk') {
        filteredImports.push(getChunkName(importee))
      }
    }
    return filteredImports
  }

  for (const output of Object.values(bundle)) {
    if (output.type === 'chunk') {
      const manifestChunk: ManifestChunk = {
        file: output.fileName,
        name: output.name,
      }
      const src = getChunkOriginalFileName(output, root, false)
      if (src) manifestChunk.src = src
      if (output.isEntry) manifestChunk.isEntry = true
      if (output.isDynamicEntry) manifestChunk.isDynamicEntry = true
      if (output.imports.length) {
        const internalImports = getInternalImports(output.imports)
        if (internalImports.length > 0) manifestChunk.imports = internalImports
      }
      if (output.dynamicImports.length) {
        const internalImports = getInternalImports(output.dynamicImports)
        if (internalImports.length > 0) {
          manifestChunk.dynamicImports = internalImports
        }
      }
      if (output.viteMetadata?.importedCss.size) {
        manifestChunk.css = [...output.viteMetadata.importedCss]
      }
      if (output.viteMetadata?.importedAssets.size) {
        manifestChunk.assets = [...output.viteMetadata.importedAssets]
      }
      manifest[getChunkName(output)] = manifestChunk
    } else if (output.names.length > 0) {
      const src =
        output.originalFileNames.length > 0
          ? output.originalFileNames[0]
          : `_${path.basename(output.fileName)}`
      const manifestChunk: ManifestChunk = {
        file: output.fileName,
        src,
      }
      const cssEntryName = entryCssAssetFileNames.get(output.fileName)
      if (cssEntryName) {
        manifestChunk.isEntry = true
        manifestChunk.name = cssEntryName
      }
      const file = manifest[src]?.file
      if (!(file && endsWithJSRE.test(file))) {
        manifest[src] = manifestChunk
      }
      for (const originalFileName of output.originalFileNames.slice(1)) {
        const file = manifest[originalFileName]?.file
        if (!(file && endsWithJSRE.test(file))) {
          manifest[originalFileName] = manifestChunk
        }
      }
    }
  }

  return manifest
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
