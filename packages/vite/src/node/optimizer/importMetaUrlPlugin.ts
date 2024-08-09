import fs from 'node:fs'
import path from 'node:path'
import MagicString from 'magic-string'
import * as esbuild from 'esbuild'

export function esbuildImportMetaUrlPlugin({
  processingCacheDir,
  bundleChain = [],
  bundleMap = new Map(),
}: {
  processingCacheDir: string
  bundleChain?: string[] // track recursive worker build
  bundleMap?: Map<string, ReturnType<typeof esbuild.build>>
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
                  // handle circular worker import similar to vite build
                  if (bundleChain.at(-1) === absUrl) {
                    output.update(urlStart, urlEnd, 'self.location.href')
                    continue
                  } else if (bundleChain.includes(absUrl)) {
                    throw new Error(
                      'Unsupported circular worker imports: ' +
                        [...bundleChain].join(' -> '),
                    )
                  }
                  let bundlePromise = bundleMap.get(absUrl)
                  if (!bundlePromise) {
                    bundlePromise = esbuild.build({
                      outdir: path.join(processingCacheDir, '__worker'),
                      entryPoints: [absUrl],
                      entryNames: '[name]-[hash]',
                      bundle: true,
                      metafile: true,
                      // TODO: should we detect WorkerType and use esm only when `{ type: "module" }`?
                      format: 'esm',
                      platform: 'browser',
                      plugins: [
                        esbuildImportMetaUrlPlugin({
                          processingCacheDir,
                          bundleChain: [...bundleChain, absUrl],
                          bundleMap,
                        }),
                      ],
                    })
                    bundleMap.set(absUrl, bundlePromise)
                  }
                  const result = await bundlePromise
                  const filename = path.basename(
                    Object.keys(result.metafile!.outputs)[0],
                  )
                  output.update(
                    urlStart,
                    urlEnd,
                    JSON.stringify(`./__worker/${filename}`),
                  )
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

// packages/vite/src/node/plugins/assetImportMetaUrl.ts
const assetImportMetaUrlRE =
  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg

// packages/vite/src/node/plugins/workerImportMetaUrl.ts
const workerImportMetaUrlRE =
  /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg
