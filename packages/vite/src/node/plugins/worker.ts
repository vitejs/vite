import path from 'node:path'
import MagicString from 'magic-string'
import type { RolldownOutput, RollupError } from 'rolldown'
import colors from 'picocolors'
import { type ImportSpecifier, init, parse } from 'es-module-lexer'
import { viteWebWorkerPostPlugin as nativeWebWorkerPostPlugin } from 'rolldown/experimental'
import type { ResolvedConfig } from '../config'
import { type Plugin, perEnvironmentPlugin } from '../plugin'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import {
  encodeURIPath,
  getHash,
  injectQuery,
  normalizePath,
  prettifyUrl,
  urlRE,
} from '../utils'
import {
  BuildEnvironment,
  ChunkMetadataMap,
  createToImportMetaURLBasedRelativeRuntime,
  injectEnvironmentToHooks,
  onRollupLog,
  toOutputFilePathInJS,
} from '../build'
import { cleanUrl } from '../../shared/utils'
import type { Logger } from '../logger'
import { fileToUrl, toOutputFilePathInJSForBundledDev } from './asset'

type WorkerBundle = {
  entryFilename: string
  entryCode: string
  entryUrlPlaceholder: string
  referencedAssets: Set<string>
  watchedFiles: string[]
}

type WorkerBundleAsset = {
  fileName: string
  /** @deprecated */
  originalFileName: string | null
  originalFileNames: string[]
  source: string | Uint8Array
}

class WorkerOutputCache {
  /**
   * worker bundle information for each input id
   * used to bundle the same worker file only once
   */
  private bundles = new Map</* inputId */ string, WorkerBundle>()
  /** list of assets emitted for the worker bundles */
  private assets = new Map<string, WorkerBundleAsset>()
  private fileNameHash = new Map<
    /* hash */ string,
    /* entryFilename */ string
  >()
  private invalidatedBundles = new Set</* inputId */ string>()

  saveWorkerBundle(
    file: string,
    watchedFiles: string[],
    outputEntryFilename: string,
    outputEntryCode: string,
    outputAssets: WorkerBundleAsset[],
    logger: Logger,
  ): WorkerBundle {
    for (const asset of outputAssets) {
      this.saveAsset(asset, logger)
    }
    const bundle: WorkerBundle = {
      entryFilename: outputEntryFilename,
      entryCode: outputEntryCode,
      entryUrlPlaceholder:
        this.generateEntryUrlPlaceholder(outputEntryFilename),
      referencedAssets: new Set(outputAssets.map((asset) => asset.fileName)),
      watchedFiles,
    }
    this.bundles.set(file, bundle)
    return bundle
  }

  saveAsset(asset: WorkerBundleAsset, logger: Logger) {
    const duplicateAsset = this.assets.get(asset.fileName)
    if (duplicateAsset) {
      if (!isSameContent(duplicateAsset.source, asset.source)) {
        logger.warn(
          `\n` +
            colors.yellow(
              `The emitted file ${JSON.stringify(asset.fileName)} overwrites a previously emitted file of the same name.`,
            ),
        )
      }
    }
    this.assets.set(asset.fileName, asset)
  }

  invalidateAffectedBundles(file: string) {
    for (const [bundleInputFile, bundle] of this.bundles.entries()) {
      if (bundle.watchedFiles.includes(file)) {
        this.invalidatedBundles.add(bundleInputFile)
      }
    }
  }

  removeBundleIfInvalidated(file: string) {
    if (this.invalidatedBundles.has(file)) {
      this.invalidatedBundles.delete(file)
      this.removeBundle(file)
    }
  }

  private removeBundle(file: string) {
    const bundle = this.bundles.get(file)
    if (!bundle) return

    this.bundles.delete(file)
    this.fileNameHash.delete(getHash(bundle.entryFilename))

    this.assets.delete(bundle.entryFilename)

    const keptBundles = [...this.bundles.values()]
    // remove assets that are only referenced by this bundle
    for (const asset of bundle.referencedAssets) {
      if (keptBundles.every((b) => !b.referencedAssets.has(asset))) {
        this.assets.delete(asset)
      }
    }
  }

  getWorkerBundle(file: string) {
    return this.bundles.get(file)
  }

  getAssets() {
    return this.assets.values()
  }

  getEntryFilenameFromHash(hash: string) {
    return this.fileNameHash.get(hash)
  }

  private generateEntryUrlPlaceholder(entryFilename: string): string {
    const hash = getHash(entryFilename)
    if (!this.fileNameHash.has(hash)) {
      this.fileNameHash.set(hash, entryFilename)
    }
    return `__VITE_WORKER_ASSET__${hash}__`
  }
}

export type WorkerType = 'classic' | 'module' | 'ignore'

export const workerOrSharedWorkerRE: RegExp =
  /(?:\?|&)(worker|sharedworker)(?:&|$)/
const workerFileRE = /(?:\?|&)worker_file&type=(\w+)(?:&|$)/
const inlineRE = /[?&]inline\b/

export const WORKER_FILE_ID = 'worker_file'
const workerOutputCaches = new WeakMap<ResolvedConfig, WorkerOutputCache>()

async function bundleWorkerEntry(
  config: ResolvedConfig,
  id: string,
): Promise<WorkerBundle> {
  const input = cleanUrl(id)

  const workerOutput = workerOutputCaches.get(config.mainConfig || config)!
  workerOutput.removeBundleIfInvalidated(input)

  const bundleInfo = workerOutput.getWorkerBundle(input)
  if (bundleInfo) {
    return bundleInfo
  }

  const newBundleChain = [...config.bundleChain, input]
  if (config.bundleChain.includes(input)) {
    throw new Error(
      'Circular worker imports detected. Vite does not support it. ' +
        `Import chain: ${newBundleChain.map((id) => prettifyUrl(id, config.root)).join(' -> ')}`,
    )
  }

  // bundle the file as entry to support imports
  const { rolldown } = await import('rolldown')
  const { plugins, rollupOptions, format } = config.worker
  const workerConfig = await plugins(newBundleChain)
  const workerEnvironment = new BuildEnvironment('client', workerConfig) // TODO: should this be 'worker'?
  await workerEnvironment.init()

  const chunkMetadataMap = new ChunkMetadataMap()
  const bundle = await rolldown({
    ...rollupOptions,
    input,
    plugins: workerEnvironment.plugins.map((p) =>
      injectEnvironmentToHooks(workerEnvironment, chunkMetadataMap, p),
    ),
    onLog(level, log) {
      onRollupLog(level, log, workerEnvironment)
    },
    // TODO: remove this and enable rolldown's CSS support later
    moduleTypes: {
      '.css': 'js',
      ...rollupOptions.moduleTypes,
    },
    preserveEntrySignatures: false,
  })
  let result: RolldownOutput
  let watchedFiles: string[] | undefined
  try {
    const workerOutputConfig = config.worker.rollupOptions.output
    const workerConfig = workerOutputConfig
      ? Array.isArray(workerOutputConfig)
        ? workerOutputConfig[0] || {}
        : workerOutputConfig
      : {}
    result = await bundle.generate({
      entryFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].js',
      ),
      chunkFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].js',
      ),
      assetFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].[ext]',
      ),
      minify:
        config.build.minify === 'oxc'
          ? true
          : config.build.minify === false
            ? 'dce-only'
            : undefined,
      ...workerConfig,
      format,
      sourcemap: config.build.sourcemap,
    })
    watchedFiles = (await bundle.watchFiles).map((f) => normalizePath(f))
  } catch (e) {
    // adjust rollup format error
    if (
      e instanceof Error &&
      e.name === 'RollupError' &&
      (e as RollupError).code === 'INVALID_OPTION' &&
      e.message.includes('"output.format"')
    ) {
      e.message = e.message.replace('output.format', 'worker.format')
    }
    throw e
  } finally {
    await bundle.close()
  }

  const {
    output: [outputChunk, ...outputChunks],
  } = result
  const assets = outputChunks.map((outputChunk) =>
    outputChunk.type === 'asset'
      ? outputChunk
      : {
          fileName: outputChunk.fileName,
          originalFileName: null,
          originalFileNames: [],
          source: outputChunk.code,
        },
  )
  if (
    (config.build.sourcemap === 'hidden' || config.build.sourcemap === true) &&
    outputChunk.map
  ) {
    assets.push({
      fileName: outputChunk.fileName + '.map',
      originalFileName: null,
      originalFileNames: [],
      source: outputChunk.map.toString(),
    })
  }

  const newBundleInfo = workerOutputCaches
    .get(config.mainConfig || config)!
    .saveWorkerBundle(
      input,
      watchedFiles,
      outputChunk.fileName,
      outputChunk.code,
      assets,
      config.logger,
    )
  return newBundleInfo
}

export const workerAssetUrlRE: RegExp = /__VITE_WORKER_ASSET__([a-z\d]{8})__/g

export async function workerFileToUrl(
  config: ResolvedConfig,
  id: string,
): Promise<WorkerBundle> {
  const workerOutput = workerOutputCaches.get(config.mainConfig || config)!
  const bundle = await bundleWorkerEntry(config, id)
  workerOutput.saveAsset(
    {
      fileName: bundle.entryFilename,
      originalFileName: null,
      originalFileNames: [],
      source: bundle.entryCode,
    },
    config.logger,
  )
  return bundle
}

export function webWorkerPostPlugin(config: ResolvedConfig): Plugin {
  if (config.isBundled && config.nativePluginEnabledLevel >= 1) {
    return perEnvironmentPlugin(
      'native:web-worker-post-plugin',
      (environment) => {
        if (environment.config.worker.format === 'iife') {
          return nativeWebWorkerPostPlugin()
        }
      },
    )
  }

  return {
    name: 'vite:worker-post',
    transform: {
      filter: {
        code: 'import.meta',
      },
      order: 'post',
      async handler(code, id) {
        // import.meta is unavailable in the IIFE worker, so we need to replace it
        if (this.environment.config.worker.format === 'iife') {
          await init

          let imports: readonly ImportSpecifier[]
          try {
            imports = parse(code)[0]
          } catch {
            // ignore if parse fails
            return
          }

          let injectedImportMeta = false
          let s: MagicString | undefined
          for (const { s: start, e: end, d: dynamicIndex } of imports) {
            // is import.meta
            if (dynamicIndex === -2) {
              const prop = code.slice(end, end + 4)
              if (prop === '.url') {
                s ||= new MagicString(code)
                s.overwrite(start, end + 4, 'self.location.href')
              } else {
                s ||= new MagicString(code)
                if (!injectedImportMeta) {
                  s.prepend(
                    'const _vite_importMeta = { url: self.location.href };\n',
                  )
                  injectedImportMeta = true
                }
                s.overwrite(start, end, '_vite_importMeta')
              }
            }
          }

          if (!s) return

          return {
            code: s.toString(),
            map: s.generateMap({ hires: 'boundary', source: id }),
          }
        }
      },
    },
  }
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  const isWorker = config.isWorker

  workerOutputCaches.set(config, new WorkerOutputCache())
  const emittedAssets = new Set<string>()

  return {
    name: 'vite:worker',

    buildStart() {
      if (isWorker) return
      emittedAssets.clear()
    },

    load: {
      filter: { id: workerOrSharedWorkerRE },
      async handler(id) {
        const workerMatch = workerOrSharedWorkerRE.exec(id)
        if (!workerMatch) return

        const { format } = config.worker
        const workerConstructor =
          workerMatch[1] === 'sharedworker' ? 'SharedWorker' : 'Worker'
        const workerType = config.isBundled
          ? format === 'es'
            ? 'module'
            : 'classic'
          : 'module'
        const workerTypeOption = `{
          ${workerType === 'module' ? `type: "module",` : ''}
          name: options?.name
        }`

        let urlCode: string
        if (config.isBundled) {
          if (isWorker && config.bundleChain.at(-1) === cleanUrl(id)) {
            urlCode = 'self.location.href'
          } else if (inlineRE.test(id)) {
            const result = await bundleWorkerEntry(config, id)
            for (const file of result.watchedFiles) {
              this.addWatchFile(file)
            }

            const jsContent = `const jsContent = ${JSON.stringify(result.entryCode)};`

            const code =
              // Using blob URL for SharedWorker results in multiple instances of a same worker
              workerConstructor === 'Worker'
                ? `${jsContent}
            const blob = typeof self !== "undefined" && self.Blob && new Blob([${
              // NOTE: Revoke the objURL after creating the worker, otherwise it breaks WebKit-based browsers
              workerType === 'classic'
                ? `'(self.URL || self.webkitURL).revokeObjectURL(self.location.href);',`
                : // `URL` is always available, in `Worker[type="module"]`
                  `'URL.revokeObjectURL(import.meta.url);',`
            }jsContent], { type: "text/javascript;charset=utf-8" });
            export default function WorkerWrapper(options) {
              let objURL;
              try {
                objURL = blob && (self.URL || self.webkitURL).createObjectURL(blob);
                if (!objURL) throw ''
                const worker = new ${workerConstructor}(objURL, ${workerTypeOption});
                worker.addEventListener("error", () => {
                  (self.URL || self.webkitURL).revokeObjectURL(objURL);
                });
                return worker;
              } catch(e) {
                return new ${workerConstructor}(
                  'data:text/javascript;charset=utf-8,' + encodeURIComponent(jsContent),
                  ${workerTypeOption}
                );
              }
            }`
                : `${jsContent}
            export default function WorkerWrapper(options) {
              return new ${workerConstructor}(
                'data:text/javascript;charset=utf-8,' + encodeURIComponent(jsContent),
                ${workerTypeOption}
              );
            }
            `

            return {
              code,
              // Empty sourcemap to suppress Rollup warning
              map: { mappings: '' },
            }
          } else {
            const result = await workerFileToUrl(config, id)
            let url: string
            if (
              this.environment.config.command === 'serve' &&
              this.environment.config.experimental.bundledDev
            ) {
              url = toOutputFilePathInJSForBundledDev(
                this.environment,
                result.entryFilename,
              )
            } else {
              url = result.entryUrlPlaceholder
            }
            urlCode = JSON.stringify(url)
            for (const file of result.watchedFiles) {
              this.addWatchFile(file)
            }
          }
        } else {
          let url = await fileToUrl(this, cleanUrl(id))
          url = injectQuery(url, `${WORKER_FILE_ID}&type=${workerType}`)
          urlCode = JSON.stringify(url)
        }

        if (urlRE.test(id)) {
          return {
            code: `export default ${urlCode}`,
            map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
          }
        }

        return {
          code: `export default function WorkerWrapper(options) {
            return new ${workerConstructor}(
              ${urlCode},
              ${workerTypeOption}
            );
          }`,
          map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
        }
      },
    },

    transform: {
      filter: { id: workerFileRE },
      async handler(raw, id) {
        const workerFileMatch = workerFileRE.exec(id)
        if (workerFileMatch) {
          // if import worker by worker constructor will have query.type
          // other type will be import worker by esm
          const workerType = workerFileMatch[1] as WorkerType
          let injectEnv = ''

          if (workerType === 'classic') {
            // base needs to be joined as the base is not injected to `importScripts` automatically
            const scriptPath = JSON.stringify(
              path.posix.join(config.base, ENV_PUBLIC_PATH),
            )
            injectEnv = `importScripts(${scriptPath})\n`
          } else if (workerType === 'module') {
            const scriptPath = JSON.stringify(ENV_PUBLIC_PATH)
            injectEnv = `import ${scriptPath}\n`
          } else if (workerType === 'ignore') {
            if (config.isBundled) {
              injectEnv = ''
            } else {
              // dynamic worker type we can't know how import the env
              // so we copy /@vite/env code of server transform result into file header
              const environment = this.environment
              const moduleGraph =
                environment.mode === 'dev' ? environment.moduleGraph : undefined
              const module = moduleGraph?.getModuleById(ENV_ENTRY)
              injectEnv = module?.transformResult?.code || ''
            }
          }
          if (injectEnv) {
            const s = new MagicString(raw)
            s.prepend(injectEnv + ';\n')
            return {
              code: s.toString(),
              map: s.generateMap({ hires: 'boundary' }),
            }
          }
        }
      },
    },

    ...(isBuild
      ? {
          renderChunk(code, chunk, outputOptions) {
            let s: MagicString
            const result = () => {
              return (
                s && {
                  code: s.toString(),
                  map: this.environment.config.build.sourcemap
                    ? s.generateMap({ hires: 'boundary' })
                    : null,
                }
              )
            }
            workerAssetUrlRE.lastIndex = 0
            if (workerAssetUrlRE.test(code)) {
              const toRelativeRuntime =
                createToImportMetaURLBasedRelativeRuntime(
                  outputOptions.format,
                  this.environment.config.isWorker,
                )

              let match: RegExpExecArray | null
              s = new MagicString(code)
              workerAssetUrlRE.lastIndex = 0

              // Replace "__VITE_WORKER_ASSET__5aa0ddc0__" using relative paths
              const workerOutputCache = workerOutputCaches.get(
                config.mainConfig || config,
              )!

              while ((match = workerAssetUrlRE.exec(code))) {
                const [full, hash] = match
                const filename =
                  workerOutputCache.getEntryFilenameFromHash(hash)
                if (!filename) {
                  this.warn(`Could not find worker asset for hash: ${hash}`)
                  continue
                }
                const replacement = toOutputFilePathInJS(
                  this.environment,
                  filename,
                  'asset',
                  chunk.fileName,
                  'js',
                  toRelativeRuntime,
                )
                const replacementString =
                  typeof replacement === 'string'
                    ? JSON.stringify(encodeURIPath(replacement)).slice(1, -1)
                    : `"+${replacement.runtime}+"`
                s.update(
                  match.index,
                  match.index + full.length,
                  replacementString,
                )
              }
            }
            return result()
          },
        }
      : {}),

    generateBundle(opts, bundle) {
      // to avoid emitting duplicate assets for modern build and legacy build
      if (
        this.environment.config.isOutputOptionsForLegacyChunks?.(opts) ||
        isWorker
      ) {
        return
      }
      for (const asset of workerOutputCaches.get(config)!.getAssets()) {
        if (emittedAssets.has(asset.fileName)) continue
        emittedAssets.add(asset.fileName)

        const duplicateAsset = bundle[asset.fileName]
        if (duplicateAsset) {
          const content =
            duplicateAsset.type === 'asset'
              ? duplicateAsset.source
              : duplicateAsset.code
          // don't emit if the file name and the content is same
          if (isSameContent(content, asset.source)) {
            continue
          }
        }

        this.emitFile({
          type: 'asset',
          fileName: asset.fileName,
          source: asset.source,
          // NOTE: fileName is already generated when bundling the worker
          //       so no need to pass originalFileNames/names
        })
      }
    },

    watchChange(file) {
      if (isWorker) return
      workerOutputCaches
        .get(config)!
        .invalidateAffectedBundles(normalizePath(file))
    },
  }
}

function isSameContent(a: string | Uint8Array, b: string | Uint8Array) {
  if (typeof a === 'string') {
    if (typeof b === 'string') {
      return a === b
    }
    return Buffer.from(a).equals(b)
  }
  return Buffer.from(b).equals(a)
}
