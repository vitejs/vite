import path from 'node:path'
import type { OutputAsset, OutputChunk, RenderedChunk } from 'rolldown'
import { viteManifestPlugin as nativeManifestPlugin } from 'rolldown/experimental'
import type { Plugin } from '../plugin'
import { normalizePath, sortObjectKeys } from '../utils'
import { perEnvironmentState } from '../environment'
import { type Environment, type ResolvedConfig, perEnvironmentPlugin } from '..'
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
   *
   * This field is only present in JS chunks.
   */
  css?: string[]
  /**
   * The list of asset files imported by this chunk, excluding CSS files
   *
   * This field is only present in JS chunks.
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

export function manifestPlugin(config: ResolvedConfig): Plugin {
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
  if (config.build.manifest && config.nativePluginEnabledLevel >= 1) {
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
              cssEntriesMap.get(envs[environment.name])!.entries(),
            )
          },
        }),
        {
          name: 'native:manifest-compatible',
          generateBundle(_, bundle) {
            const asset = bundle[outPath]
            if (asset.type === 'asset') {
              let manifest: Manifest | undefined
              for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk') continue
                const importedCss = chunk.viteMetadata?.importedCss
                const importedAssets = chunk.viteMetadata?.importedAssets
                if (!importedCss?.size && !importedAssets?.size) continue
                manifest ??= JSON.parse(asset.source.toString()) as Manifest
                const name = getChunkName(chunk)
                const item = manifest[name]
                if (!item) continue
                if (importedCss?.size) {
                  item.css = [...importedCss]
                }
                if (importedAssets?.size) {
                  item.assets = [...importedAssets]
                }
              }

              // 2. THE FIX: Fallback check for native plugin
              const rawInput = environment.config.build.rollupOptions.input
              if (manifest && rawInput) {
                const inputList =
                  typeof rawInput === 'string'
                    ? [rawInput]
                    : Array.isArray(rawInput)
                      ? rawInput
                      : Object.values(rawInput)

                const inputEntries = new Set<string>()
                for (const input of inputList) {
                  const absoluteInput = path.resolve(root, input)
                  const relativeInput = normalizePath(
                    path.relative(root, absoluteInput),
                  )
                  inputEntries.add(relativeInput)
                }

                for (const key in manifest) {
                  const item = manifest[key]
                  if (!item.isEntry && item.src && inputEntries.has(item.src)) {
                    item.isEntry = true
                  }
                }
              }

              const output =
                this.environment.config.build.rolldownOptions.output
              const outputLength = Array.isArray(output) ? output.length : 1
              if (manifest && outputLength === 1) {
                asset.source = JSON.stringify(manifest, undefined, 2)
                return
              }

              const state = getState(this)
              state.outputCount++
              state.manifest = Object.assign(
                state.manifest,
                manifest ?? JSON.parse(asset.source.toString()),
              )
              if (state.outputCount >= outputLength) {
                asset.source = JSON.stringify(state.manifest, undefined, 2)
                state.reset()
              } else {
                delete bundle[outPath]
              }
            }
          },
        },
      ]
    })
  }
  return {
    name: 'vite:manifest',

    perEnvironmentStartEndDuringDev: true,

    applyToEnvironment(environment) {
      return !!environment.config.build.manifest
    },

    generateBundle(opts, bundle) {
      const state = getState(this)
      const { manifest } = state
      const { root } = this.environment.config
      const buildOptions = this.environment.config.build

      // 1. HELPER: Normalize all input paths to a Set of root-relative paths
      // (Removed as inputEntries is already calculated below)

      const isLegacy =
        this.environment.config.isOutputOptionsForLegacyChunks?.(opts) ?? false
      function getChunkName(chunk: OutputChunk) {
        return (
          getChunkOriginalFileName(chunk, root, isLegacy) ??
          `_${path.basename(chunk.fileName)}`
        )
      }

      function getInternalImports(imports: string[]): string[] {
        const filteredImports: string[] = []

        for (const file of imports) {
          if (bundle[file] === undefined) {
            continue
          }

          filteredImports.push(getChunkName(bundle[file] as OutputChunk))
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
        name?: string,
      ): ManifestChunk {
        const manifestChunk: ManifestChunk = {
          file: asset.fileName,
          src,
        }
        if (name) {
          manifestChunk.isEntry = true
          manifestChunk.name = name
          // @ts-expect-error keep names field for backward compatibility
          manifestChunk.names = asset.names
        }
        return manifestChunk
      }

      const entryCssReferenceIds = cssEntriesMap.get(this.environment)!
      const entryCssAssetFileNames = new Map<string, string>()
      for (const [name, id] of entryCssReferenceIds) {
        try {
          const fileName = this.getFileName(id)
          entryCssAssetFileNames.set(fileName, name)
        } catch {}
      }

      const inputEntries = new Set<string>()
      const rawInput = buildOptions.rollupOptions.input

      if (rawInput) {
        const inputList =
          typeof rawInput === 'string'
            ? [rawInput]
            : Array.isArray(rawInput)
              ? rawInput
              : Object.values(rawInput)

        for (const input of inputList) {
          const absoluteInput = path.resolve(root, input)
          const relativeInput = normalizePath(
            path.relative(root, absoluteInput),
          )
          inputEntries.add(relativeInput)
        }
      }

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk') {
          manifest[getChunkName(chunk)] = createChunk(chunk)
        } else if (chunk.type === 'asset' && chunk.names.length > 0) {
          // Add every unique asset to the manifest, keyed by its original name
          const src =
            chunk.originalFileNames.length > 0
              ? chunk.originalFileNames[0]
              : `_${path.basename(chunk.fileName)}`

          let name = entryCssAssetFileNames.get(chunk.fileName)

          if (!name && inputEntries.has(src)) {
            name = chunk.names[0]
          }

          const asset = createAsset(chunk, src, name)

          // If JS chunk and asset chunk are both generated from the same source file,
          // prioritize JS chunk as it contains more information
          const file = manifest[src]?.file
          if (!(file && endsWithJSRE.test(file))) {
            // 2. THE FIX: Fallback check
            // If isEntry is falsy, check if the original source matches our inputs
            if (!asset.isEntry && asset.src && inputEntries.has(asset.src)) {
              asset.isEntry = true
            }
            manifest[src] = asset
          }

          for (const originalFileName of chunk.originalFileNames.slice(1)) {
            const file = manifest[originalFileName]?.file
            if (!(file && endsWithJSRE.test(file))) {
              manifest[originalFileName] = asset
            }
          }
        }
      }

      state.outputCount++
      const output = buildOptions.rollupOptions.output
      const outputLength = Array.isArray(output) ? output.length : 1
      if (state.outputCount >= outputLength) {
        this.emitFile({
          fileName:
            typeof buildOptions.manifest === 'string'
              ? buildOptions.manifest
              : '.vite/manifest.json',
          type: 'asset',
          source: JSON.stringify(sortObjectKeys(manifest), undefined, 2),
        })
        state.reset()
      }
    },
  }
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
