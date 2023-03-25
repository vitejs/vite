import path from 'node:path'
import MagicString from 'magic-string'
import type {
  EmittedAsset,
  NormalizedOutputOptions,
  OutputChunk,
  OutputOptions,
  RollupBuild,
} from 'rollup'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import { cleanUrl, getHash, injectQuery, parseRequest } from '../utils'
import {
  createToImportMetaURLBasedRelativeRuntime,
  onRollupWarning,
  toOutputFilePathInJS,
} from '../build'
import { fileToUrl } from './asset'

type WorkerOutput = [OutputChunk, ...(OutputChunk | EmittedAsset)[]]

interface WorkerData {
  bundle: RollupBuild
  entryMap: Map<
    NormalizedOutputOptions,
    { referencedId: string; chunk: OutputChunk }
  >
  hash: string
}

interface WorkerCache {
  // save the bundle and the hash that are created per each worker
  // <workerId, data>
  workersData: Map<string, WorkerData>

  // <hash, id>
  idHash: Map<string, string>
}

export type WorkerType = 'classic' | 'module' | 'ignore'

export const WORKER_FILE_ID = 'worker_file'
const workerCache = new WeakMap<ResolvedConfig, WorkerCache>()
const getWorkerCache = (config: ResolvedConfig) =>
  workerCache.get(config.mainConfig || config)!

export async function bundleWorker(
  config: ResolvedConfig,
  id: string,
): Promise<RollupBuild> {
  // bundle the file as entry to support imports
  const { rollup } = await import('rollup')
  const { plugins, rollupOptions } = config.worker
  const bundle = await rollup({
    ...rollupOptions,
    input: cleanUrl(id),
    plugins,
    onwarn(warning, warn) {
      onRollupWarning(warning, warn, config)
    },
    preserveEntrySignatures: false,
  })
  return bundle
}

async function generateWorker(
  bundle: RollupBuild,
  config: ResolvedConfig,
  callerOutputOptions: OutputOptions,
): Promise<{ output: WorkerOutput; sourceMap: EmittedAsset | undefined }> {
  const { format } = config.worker

  const workerOutputConfig = config.worker.rollupOptions.output
  const workerConfig = workerOutputConfig
    ? typeof workerOutputConfig === 'function'
      ? // @ts-expect-error this is an internal(currently) option to have output config as a function
        workerOutputConfig(callerOutputOptions)
      : Array.isArray(workerOutputConfig)
      ? workerOutputConfig[0] || {}
      : workerOutputConfig
    : {}
  const rollupOutput = await bundle.generate({
    entryFileNames: path.posix.join(config.build.assetsDir, '[name]-[hash].js'),
    chunkFileNames: path.posix.join(config.build.assetsDir, '[name]-[hash].js'),
    assetFileNames: path.posix.join(
      config.build.assetsDir,
      '[name]-[hash].[ext]',
    ),
    ...workerConfig,
    format,
    sourcemap: config.build.sourcemap && 'hidden',
  })
  const output: WorkerOutput = rollupOutput.output
  //const entry = output[0]
  const sourceMap = /*emitSourcemapForWorkerEntry(config, entry)*/ undefined // TODO: Reenable sourceMap in a lazy way later
  return { output, sourceMap }
}

// function emitSourcemapForWorkerEntry(
//   config: ResolvedConfig,
//   chunk: OutputChunk,
// ): EmittedAsset | undefined {
//   const { map: sourcemap } = chunk

//   if (sourcemap) {
//     if (
//       config.build.sourcemap === 'hidden' ||
//       config.build.sourcemap === true
//     ) {
//       const data = sourcemap.toString()
//       const mapFileName = chunk.fileName + '.map'
//       return {
//         fileName: mapFileName,
//         type: 'asset',
//         source: data,
//       }
//     }
//   }
// }

export const workerAssetUrlRE = /__VITE_WORKER_ASSET__([a-z\d]{8})__/g
export const workerInlineRE = /__VITE_WORKER_INLINE__([a-z\d]{8})__/g

// TODO: We can also start worker build and never block, and just in the end of `buildEnd` we shall wait for all builds to finish
/**
 * Return a token that will be replaced by the actual URL (or the inlined code in base64, when `isInline` is `true`) of the worker.
 * If the worker hasn't been built yet, it will also build the worker bundle (but the output will be generated only later!).
 * @param config
 * @param id
 * @param isInline
 * @returns
 */
export async function workerIdToToken(
  config: ResolvedConfig,
  id: string,
  isInline = false,
): Promise<string> {
  const workerMap = getWorkerCache(config)
  let data = workerMap.workersData.get(id)
  if (data == null) {
    data = {
      bundle: await bundleWorker(config, id),
      entryMap: new Map(),
      hash: getHash(id),
    }
    workerMap.workersData.set(id, data)
    workerMap.idHash.set(data.hash, id)
  }
  return `__VITE_WORKER_${isInline ? 'INLINE' : 'ASSET'}__${data.hash}__`
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let server: ViteDevServer
  const isWorker = config.isWorker

  const isWorkerQueryId = (id: string) => {
    const parsedQuery = parseRequest(id)
    if (
      parsedQuery &&
      (parsedQuery.worker ?? parsedQuery.sharedworker) != null
    ) {
      return true
    }

    return false
  }

  return {
    name: 'vite:worker',

    configureServer(_server) {
      server = _server
    },

    buildStart() {
      if (isWorker) {
        return
      }
      workerCache.set(config, {
        workersData: new Map(),
        idHash: new Map(),
      })
    },

    load(id) {
      if (isBuild && isWorkerQueryId(id)) {
        return ''
      }
    },

    shouldTransformCachedModule({ id }) {
      if (isBuild && isWorkerQueryId(id) && config.build.watch) {
        return true
      }
      return false
    },

    async transform(raw, id) {
      const query = parseRequest(id)
      if (query && query[WORKER_FILE_ID] != null) {
        // if import worker by worker constructor will have query.type
        // other type will be import worker by esm
        const workerType = query['type']! as WorkerType
        let injectEnv = ''

        if (workerType === 'classic') {
          injectEnv = `importScripts('${ENV_PUBLIC_PATH}')\n`
        } else if (workerType === 'module') {
          injectEnv = `import '${ENV_PUBLIC_PATH}'\n`
        } else if (workerType === 'ignore') {
          if (isBuild) {
            injectEnv = ''
          } else if (server) {
            // dynamic worker type we can't know how import the env
            // so we copy /@vite/env code of server transform result into file header
            const { moduleGraph } = server
            const module = moduleGraph.getModuleById(ENV_ENTRY)
            injectEnv = module?.transformResult?.code || ''
          }
        }
        return {
          code: injectEnv + raw,
        }
      }
      if (
        query == null ||
        (query && (query.worker ?? query.sharedworker) == null)
      ) {
        return
      }

      // stringified url or `new URL(...)`
      let url: string
      const { format } = config.worker
      const workerConstructor =
        query.sharedworker != null ? 'SharedWorker' : 'Worker'
      const workerType = isBuild
        ? format === 'es'
          ? 'module'
          : 'classic'
        : 'module'
      const workerOptions = workerType === 'classic' ? '' : ',{type: "module"}'

      if (isBuild) {
        if (query.inline != null) {
          const codeBase64Token = await workerIdToToken(config, id, true)
          const encodedJs = `const encodedJs = ${codeBase64Token};`

          const code =
            // Using blob URL for SharedWorker results in multiple instances of a same worker
            workerConstructor === 'Worker'
              ? `${encodedJs}
          const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
          export default function WorkerWrapper() {
            let objURL;
            try {
              objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              if (!objURL) throw ''
              return new ${workerConstructor}(objURL)
            } catch(e) {
              return new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
            } finally {
              objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
            }
          }`
              : `${encodedJs}
          export default function WorkerWrapper() {
            return new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
          }
          `

          return {
            code,
            // Empty sourcemap to suppress Rollup warning
            map: { mappings: '' },
          }
        } else {
          url = await workerIdToToken(config, id)
        }
      } else {
        url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WORKER_FILE_ID)
        url = injectQuery(url, `type=${workerType}`)
        url = JSON.stringify(url)
      }

      if (query.url != null) {
        return {
          code: `export default ${url}`,
          map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
        }
      }

      return {
        code: `export default function WorkerWrapper() {
          return new ${workerConstructor}(${url}${workerOptions})
        }`,
        map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
      }
    },

    // TODO: We can just start rendering the workers output without waiting here
    async renderStart(outputOptions) {
      if (isWorker) {
        return
      }
      const { workersData } = getWorkerCache(config)
      await Promise.all(
        [...workersData.values()].map(async (data) => {
          //for (const data of workersData.values()) {// TODO: Remove this and back to the parallel version above
          const { output, sourceMap } = await generateWorker(
            data.bundle,
            config,
            outputOptions,
          )
          const entry = output[0]
          // TODO: Emit in a lazy way, meaning emit them only if we need to reference the worker in the main rendered chunks
          // TODO: Make sure we're not emitting the same source twice or more, and in this case just share the same output file
          const referencedId = this.emitFile({
            fileName: entry.fileName,
            source: entry.code,
            type: 'asset',
            //needsCodeReference: true, // TODO: Shell we use this option?
          })
          data.entryMap.set(outputOptions, { referencedId, chunk: entry })

          if (sourceMap) {
            this.emitFile(sourceMap)
          }

          // @ts-expect-error asset emits are skipped in legacy bundle (but not now)
          if (!outputOptions.__vite_skip_asset_emit__) {
            // emit the rest
            for (let i = 1; i < output.length; ++i) {
              const file = output[i]
              if (file.type === 'asset') {
                this.emitFile(file)
              } else if (file.type === 'chunk') {
                this.emitFile({
                  fileName: file.fileName,
                  source: file.code,
                  type: 'asset',
                })
              }
            }
          }
        }),
      )
    },

    renderChunk(code, chunk, outputOptions) {
      let s: MagicString
      const result = () => {
        return (
          s && {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null,
          }
        )
      }
      if (
        code.match(workerAssetUrlRE) ||
        code.match(workerInlineRE) ||
        code.includes('import.meta.url')
      ) {
        const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
          outputOptions.format,
        )

        let match: RegExpExecArray | null
        s = new MagicString(code)
        // though the RE are accessed from many coroutines, it's safe since the scanning itself isn't async
        workerAssetUrlRE.lastIndex = 0
        workerInlineRE.lastIndex = 0

        // Replace "__VITE_WORKER_ASSET__5aa0ddc0__" using relative paths
        const workerMap = getWorkerCache(config)
        const { workersData: workers_data, idHash } = workerMap

        while ((match = workerAssetUrlRE.exec(code))) {
          const [full, hash] = match
          const id = idHash.get(hash)!
          const { referencedId } = workers_data
            .get(id)!
            .entryMap.get(outputOptions)!
          const filename = this.getFileName(referencedId)
          const replacement = toOutputFilePathInJS(
            filename,
            'asset',
            chunk.fileName,
            'js',
            config,
            toRelativeRuntime,
          )
          const replacementString =
            typeof replacement === 'string'
              ? JSON.stringify(replacement)
              : replacement.runtime
          s.update(match.index, match.index + full.length, replacementString)
        }

        while ((match = workerInlineRE.exec(code))) {
          const [full, hash] = match
          const id = idHash.get(hash)!
          const { chunk: entryChunk } = workers_data
            .get(id)!
            .entryMap.get(outputOptions)!
          const replacement = Buffer.from(entryChunk.code).toString('base64')
          const replacementString = JSON.stringify(replacement)
          s.update(match.index, match.index + full.length, replacementString)
        }
      }
      return result()
    },

    async closeBundle() {
      if (isWorker) {
        return
      }
      const workerMap = getWorkerCache(config)
      if (workerMap != null) {
        await Promise.all(
          [...workerMap.workersData.values()].map(({ bundle }) =>
            bundle.close(),
          ),
        )
      }
    },
  }
}
