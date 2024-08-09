import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import MagicString from 'magic-string'
import * as esbuild from 'esbuild'

export function esbuildImportMetaUrlPlugin(options: {
  processingCacheDir: string
  // track worker build to prevent infinite loop on recursive worker such as
  // https://github.com/gkjohnson/three-mesh-bvh/blob/9718501eee2619f1015fa332d7bddafaf6cf562a/src/workers/parallelMeshBVH.worker.js#L12
  visited: Set<string>
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
                    options.processingCacheDir,
                    '__worker',
                    workerFilename,
                  )
                  // recursively bundle worker
                  if (
                    !fs.existsSync(outfile) &&
                    !options.visited.has(outfile)
                  ) {
                    options.visited.add(outfile)
                    await esbuild.build({
                      outfile,
                      entryPoints: [absUrl],
                      bundle: true,
                      // TODO: should we detect WorkerType and use esm only when `{ type: "module" }`?
                      format: 'esm',
                      platform: 'browser',
                      plugins: [
                        esbuildImportMetaUrlPlugin({
                          ...options,
                          recursed: true,
                        }),
                      ],
                    })
                  }
                  // To allow relocating from `deps_temp_xxx/__worker` to `deps/__worker`,
                  // worker reference needs to be relative.
                  const targetPath = options.recursed
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
              const [argStart, argEnd] = match.indices![1]!
              if (workerMatched.has(argStart)) {
                continue
              }
              const url = match[1]!.slice(1, -1)
              if (url[0] !== '/') {
                const absUrl = path.resolve(path.dirname(args.path), url)
                if (fs.existsSync(absUrl)) {
                  output.update(argStart, argEnd, JSON.stringify(absUrl))
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

function getWorkerFileName(file: string) {
  const hash = hashString(file)
  file = file.split('/node_modules/').at(-1)!
  file = file.slice(0, 100).replace(/[^0-9a-zA-Z]/g, '_')
  return `${file}-${hash}.js`
}

function hashString(s: string) {
  return crypto
    .createHash('sha256')
    .update(s)
    .digest()
    .toString('hex')
    .slice(0, 10)
}

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
const assetImportMetaUrlRE =
  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/workerImportMetaUrl.ts#L133-L134
const workerImportMetaUrlRE =
  /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg
