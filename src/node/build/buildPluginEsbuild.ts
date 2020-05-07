import { Plugin } from 'rollup'
import { startService, Service } from 'esbuild'
import { tjsxRE, transformWithService } from '../esbuildService'

export const createEsbuildPlugin = async (
  minify: boolean,
  jsx: {
    factory?: string
    fragment?: string
  }
): Promise<Plugin> => {
  let service: Service | undefined

  const jsxConfig = {
    jsxFactory: jsx.factory,
    jsxFragment: jsx.fragment
  }

  return {
    name: 'vite:esbuild',

    async transform(code, id) {
      const isVueTs = /\.vue\?/.test(id) && id.endsWith('lang=ts')
      if (tjsxRE.test(id) || isVueTs) {
        return transformWithService(
          service || (service = await startService()),
          code,
          id,
          { ...jsxConfig, ...(isVueTs ? { loader: 'ts' } : null) }
        )
      }
    },

    async renderChunk(code, chunk) {
      if (minify) {
        return transformWithService(
          service || (service = await startService()),
          code,
          chunk.fileName,
          {
            minify: true
          }
        )
      } else {
        return null
      }
    },

    generateBundle() {
      service && service.stop()
    }
  }
}
