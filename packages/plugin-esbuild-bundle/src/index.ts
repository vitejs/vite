import type { Plugin, ResolvedConfig } from 'vite'
import { build } from 'esbuild'
import path from 'path'

export function viteEsbuildBundlePlugin(): Plugin {
  let config: ResolvedConfig
  const facadeChunks = []
  return {
    name: 'vite:esbuild',
    enforce: 'pre',
    apply: 'build',
    config(cfg) {
      return {
        build: {
          cssCodeSplit: false,
          commonjsOptions: {
            include: ['']
          }
        }
      }
    },
    configResolved(cfg) {
      config = cfg
    },
    async resolveId(source, importer) {
      const realId = await this.resolve(source, importer, {
        skipSelf: true
      })
      if (realId?.id.includes('node_modules')) {
        return {
          id: source,
          external: true
        }
      }
      return undefined
    },
    async generateBundle(options, chunkMap) {
      const entryPoints = {}

      for (const [file, chunk] of Object.entries(chunkMap)) {
        if (file.endsWith('.js') && chunk.type === 'chunk') {
          entryPoints[path.resolve(config.root, file)] = chunk
          if (chunk.isEntry) {
            facadeChunks.push(file)
          }
        }
      }
      /* eslint-disable */
      const context = this
      /* eslint-enable */
      const result = await build({
        entryPoints: Object.keys(entryPoints),
        write: false,
        absWorkingDir: __dirname,
        bundle: true,
        outdir: '/assets',
        format: 'esm',
        allowOverwrite: true,
        splitting: true,
        plugins: [
          {
            name: 'memfs',
            setup(build) {
              build.onResolve({ filter: /.*/ }, async (args) => {
                const realPath = path.resolve(args.resolveDir, args.path)
                if (entryPoints[realPath]) {
                  return {
                    path: realPath
                  }
                } else {
                  const result = await context.resolve(
                    args.path,
                    args.importer,
                    {
                      skipSelf: true
                    }
                  )
                  return {
                    path: result.id
                  }
                }
              })
              build.onLoad({ filter: /.*/ }, (args) => {
                const res = entryPoints[args.path]
                if (res) {
                  return {
                    contents: entryPoints[args.path].code,
                    resolveDir: path.dirname(args.path)
                  }
                }
              })
            }
          }
        ]
      })
      for (const output of result.outputFiles) {
        const fileName = path.relative('/', output.path)
        const formatedContent = output.text.replace(
          '"__VITE_PRELOAD__"',
          'void 0'
        )
        /**
         * rollup not support emitChunk in generate bundle,which is hard to deal with
         * so we have to use transformIndexHtml to handle script injection
         * see https://github.com/rollup/rollup/issues/4210
         */
        this.emitFile({
          type: 'asset',
          fileName: fileName,
          source: formatedContent
        })
      }
    },
    async transformIndexHtml(html) {
      return [
        // js entry chunk for this page
        {
          tag: 'script',
          attrs: {
            type: 'module',
            crossorigin: true,
            src: facadeChunks[0]
          }
        }
      ]
    }
  } as Plugin
}
