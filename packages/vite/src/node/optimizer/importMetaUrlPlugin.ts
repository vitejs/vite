import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import MagicString from 'magic-string'
import * as esbuild from 'esbuild'
import { flattenId, normalizePath } from '../utils'
import { getAssetImportMetaUrlRE } from '../plugins/assetImportMetaUrl'
import { getWorkerImportMetaUrlRE } from '../plugins/workerImportMetaUrl'

// This is mostly a standalone esbuild plugiin, which is usable outside of Vite.
// Only assumption is that output js files are required to be in the same directory
// so that `new URL("./__worker-...", import.meta.url)` works uniformly.
export function esbuildImportMetaUrlPlugin({
  filter = /\.m?js$/,
  buildChain = [],
  buildPromiseMap = new Map(),
}: {
  filter?: RegExp
  // track recursive worker build
  buildChain?: string[]
  buildPromiseMap?: Map<string, ReturnType<typeof esbuild.build>>
}): esbuild.Plugin {
  const assetImportMetaUrlRE = getAssetImportMetaUrlRE()
  const workerImportMetaUrlRE = getWorkerImportMetaUrlRE()

  return {
    name: 'vite:import-meta-url',
    setup(build) {
      let outdir: string
      build.onStart(() => {
        outdir = build.initialOptions.outdir!
      })

      build.onLoad({ filter, namespace: 'file' }, async (args) => {
        const data = await fs.promises.readFile(args.path, 'utf-8')
        if (data.includes('import.meta.url')) {
          const output = new MagicString(data)
          const workerMatched = new Set<number>()

          // replace
          //   new Worker(new URL("./worker.js", import.meta.url))
          // with
          //   new Worker(new URL("./__worker-(name)-(hash).js", import.meta.url))
          {
            const matches = data.matchAll(workerImportMetaUrlRE)
            for (const match of matches) {
              const [urlStart, urlEnd] = match.indices![2]!
              workerMatched.add(urlStart)

              const url = match[2]!.slice(1, -1)
              if (url[0] !== '/') {
                // TODO: use build.resolve? https://esbuild.github.io/plugins/#resolve
                // however esbuild requires explicit "./", so need to resolve twice for
                // - build.resolve("relative-or-package")
                // - build.resolve("./relative-or-package")
                const absUrl = path.resolve(path.dirname(args.path), url)

                if (fs.existsSync(absUrl)) {
                  // handle circular worker import similar to vite build
                  if (buildChain.at(-1) === absUrl) {
                    output.update(urlStart, urlEnd, 'self.location.href')
                    continue
                  }
                  if (buildChain.includes(absUrl)) {
                    throw new Error(
                      'Unsupported circular worker imports: ' +
                        [...buildChain, '...'].join(' -> '),
                    )
                  }
                  let bundlePromise = buildPromiseMap.get(absUrl)
                  if (!bundlePromise) {
                    const entryName = makeOutputFilename(absUrl)
                    bundlePromise = esbuild.build({
                      // inherit config
                      absWorkingDir: build.initialOptions.absWorkingDir,
                      outdir: build.initialOptions.outdir,
                      platform: build.initialOptions.platform,
                      define: build.initialOptions.define,
                      target: build.initialOptions.target,
                      // own config
                      entryPoints: {
                        [entryName]: absUrl,
                      },
                      entryNames: './__worker-[name]-[hash]',
                      bundle: true,
                      metafile: true,
                      // TODO: should we detect WorkerType and use esm only when `{ type: "module" }`?
                      format: 'esm',
                      // TODO: worker condition? https://github.com/vitejs/vite/issues/7439
                      // conditions: ["worker"],
                      plugins: [
                        esbuildImportMetaUrlPlugin({
                          filter,
                          buildChain: [...buildChain, absUrl],
                          buildPromiseMap: buildPromiseMap,
                        }),
                      ],
                    })
                    buildPromiseMap.set(absUrl, bundlePromise)
                  }
                  const result = await bundlePromise
                  const filename = path.basename(
                    Object.keys(result.metafile!.outputs)[0]!,
                  )
                  output.update(
                    urlStart,
                    urlEnd,
                    JSON.stringify(`./${filename}`),
                  )
                }
              }
            }
          }

          // replace
          //   new URL("./asset.svg", import.meta.url)
          // with
          //   new URL("./__asset-(name)-(hash).svg", import.meta.url)
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
                  const assetName = makeOutputFilename(absUrl)
                  const assetData = await fs.promises.readFile(absUrl)
                  const hash = crypto
                    .createHash('sha1')
                    .update(assetData)
                    .digest()
                    .toString('hex')
                    .slice(0, 8)
                  const filename =
                    `__asset-${assetName}-${hash}` + path.extname(absUrl)
                  await fs.promises.writeFile(
                    path.join(outdir, filename),
                    assetData,
                  )
                  output.update(
                    urlStart,
                    urlEnd,
                    JSON.stringify(`./${filename}`),
                  )
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

function makeOutputFilename(id: string) {
  return flattenId(normalizePath(id).split('/node_modules/').at(-1)!)
}
