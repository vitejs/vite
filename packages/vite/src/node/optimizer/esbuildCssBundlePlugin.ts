import { basename } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { type Plugin } from 'esbuild'

export function esbuildCssBundlePlugin(): Plugin {
  return {
    name: 'vite:dep-pre-bundle-css',
    setup(build) {
      if (!build.initialOptions.metafile) {
        throw new Error(
          'The `metafile` option must be enabled for prebundling css imports to work.',
        )
      }

      // clear package cache when esbuild is finished
      build.onEnd(async (result) => {
        await Promise.all(
          Object.keys(result.metafile!.outputs).map(async (path) => {
            const meta = result.metafile?.outputs[path]
            if (!meta || !meta.cssBundle) {
              return
            }
            const contents = await readFile(path, 'utf-8')
            const cssBundle = basename(meta.cssBundle)
            await writeFile(path, `${contents}\nimport "./${cssBundle}";\n`)
          }),
        )
      })
    },
  }
}
