import fs from 'node:fs'
import path from 'node:path'
import MagicString from 'magic-string'
import * as esbuild from 'esbuild'
import { flattenId, getHash } from '../utils'

export function esbuildImportMetaUrlPlugin({
  processingCacheDir,
  visited = new Set(),
  recursed,
}: {
  processingCacheDir: string
  // track worker build to prevent infinite loop on recursive worker such as
  // https://github.com/gkjohnson/three-mesh-bvh/blob/9718501eee2619f1015fa332d7bddafaf6cf562a/src/workers/parallelMeshBVH.worker.js#L12
  visited?: Set<string>
  recursed?: boolean
}): esbuild.Plugin {
  return {
    name: esbuildImportMetaUrlPlugin.name,
    setup(build) {
      const filter = /\.m?js$/

      build.onLoad({ filter, namespace: 'file' }, async (args) => {
        const data = await fs.promises.readFile(args.path, 'utf-8')
        if (data.includes('import.meta.url')) {
          const output = new MagicString(data)
          const workerMatched = new Set<number>()

          // replace
          //   new Worker(new URL("./worker.js", import.meta.url))
          // with
          //   new Worker(new URL("./__worker/worker-file-name-with-hash.js", import.meta.url))
          {
            const matches = data.matchAll(workerImportMetaUrlRE)
            for (const match of matches) {
              const [urlStart, urlEnd] = match.indices![2]!
              workerMatched.add(urlStart)

              const url = match[2]!.slice(1, -1)
              if (url[0] !== '/') {
                const absUrl = path.resolve(path.dirname(args.path), url)
                if (fs.existsSync(absUrl)) {
                  const workerFilename = getWorkerFileName(absUrl)
                  const outfile = path.resolve(
                    processingCacheDir,
                    '__worker',
                    workerFilename,
                  )
                  // recursively bundle worker
                  if (!fs.existsSync(outfile) && !visited.has(outfile)) {
                    visited.add(outfile)
                    await esbuild.build({
                      outfile,
                      entryPoints: [absUrl],
                      bundle: true,
                      // TODO: should we detect WorkerType and use esm only when `{ type: "module" }`?
                      format: 'esm',
                      platform: 'browser',
                      plugins: [
                        esbuildImportMetaUrlPlugin({
                          processingCacheDir,
                          visited,
                          recursed: true,
                        }),
                      ],
                    })
                  }
                  // To allow relocating from `deps_temp_xxx/__worker` to `deps/__worker`,
                  // worker reference needs to be relative.
                  const targetPath = recursed
                    ? `./${workerFilename}`
                    : `./__worker/${workerFilename}`
                  output.update(urlStart, urlEnd, JSON.stringify(targetPath))
                }
              }
            }
          }

          // replace
          //   new URL("./asset.svg", import.meta.url)
          // with
          //   new URL("/abs-path-to-node-module-package/asset.svg", import.meta.url)
          {
            const matches = data.matchAll(assetImportMetaUrlRE)
            for (const match of matches) {
              const [urlStart, urlEnd] = match.indices![1]!
              if (workerMatched.has(urlStart)) {
                continue
              }
              const url = match[1]!.slice(1, -1)
              if (url[0] !== '/') {
                const absUrl = path.resolve(path.dirname(args.path), url)
                if (fs.existsSync(absUrl)) {
                  output.update(urlStart, urlEnd, JSON.stringify(absUrl))
                }
              }
            }
          }

          if (output.hasChanged()) {
            return {
              loader: 'js',
              contents: output.toString(),
            }
          }
        }
        return null
      })
    },
  }
}

// make recognizable filename
function getWorkerFileName(file: string) {
  const id = flattenId(file.split('/node_modules/').at(-1)!)
  const hash = getHash(file)
  return `${id}-${hash}.js`
}

// packages/vite/src/node/plugins/assetImportMetaUrl.ts
const assetImportMetaUrlRE =
  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg

// packages/vite/src/node/plugins/workerImportMetaUrl.ts
const workerImportMetaUrlRE =
  /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg
