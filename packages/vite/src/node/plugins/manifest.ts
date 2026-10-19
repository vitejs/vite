import path from 'node:path'
import type { OutputChunk, RenderedChunk } from 'rolldown'
import { viteManifestPlugin as nativeManifestPlugin } from 'rolldown/experimental'
import { type Environment, perEnvironmentPlugin } from '..'
import { perEnvironmentState } from '../environment'
import type { Plugin } from '../plugin'
import { normalizePath } from '../utils'
import { cssEntriesMap } from './asset'
import { collectHtmlTags } from './html'

const endsWithJSRE = /\.[cm]?js$/

export type Manifest = ManifestV0 | ManifestV1

export type ManifestV0 = ManifestChunks

export interface ManifestV1 {
  version: 1
  chunks: ManifestChunks
  /**
   * Tag groups in hook execution order. Each group uses the same injection
   * semantics as the tags returned by a single transformIndexHtml hook.
   */
  htmlTags: ManifestHtmlTagDescriptor[][]
}

export interface ManifestHtmlTagDescriptor extends ManifestHtmlTag {
  /**
   * Defaults to 'head-prepend' when the hook omits an injection target.
   */
  injectTo: 'head' | 'body' | 'head-prepend' | 'body-prepend'
}

export interface ManifestHtmlTag {
  tag: string
  /**
   * String attribute values must be escaped when injecting the tag into HTML.
   */
  attrs?: Record<string, string | boolean | undefined>
  /**
   * Raw HTML or nested tags.
   */
  children?: string | ManifestHtmlTag[]
}

export type ManifestChunks = Record<string, ManifestChunk>

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
      manifest: {} as ManifestChunks,
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
        async generateBundle(_, bundle) {
          const newManifestFormat =
            this.environment.config.experimental.newManifestFormat
          const asset = bundle[outPath]
          if (asset.type === 'asset') {
            let manifest: ManifestChunks | undefined
            for (const output of Object.values(bundle)) {
              const importedCss = output.viteMetadata?.importedCss
              const importedAssets = output.viteMetadata?.importedAssets
              if (!importedCss?.size && !importedAssets?.size) continue
              manifest ??= JSON.parse(asset.source.toString()) as ManifestChunks
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
            if (manifest && outputLength === 1 && !newManifestFormat) {
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
              const chunks = state.manifest
              state.reset()
              const manifest: Manifest = newManifestFormat
                ? {
                    version: 1,
                    chunks,
                    htmlTags: await collectHtmlTags(
                      this.environment.plugins,
                      this,
                      bundle,
                    ),
                  }
                : chunks
              asset.source = JSON.stringify(manifest, undefined, 2)
            } else {
              delete bundle[outPath]
            }
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
