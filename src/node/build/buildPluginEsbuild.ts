import { Plugin } from 'rollup'
import { tjsxRE, transform } from '../esbuildService'

export const createEsbuildPlugin = async (
  minify: boolean,
  jsx: {
    factory?: string
    fragment?: string
  }
): Promise<Plugin> => {
  const jsxConfig = {
    jsxFactory: jsx.factory,
    jsxFragment: jsx.fragment
  }

  return {
    name: 'vite:esbuild',

    async transform(code, id) {
      const isVueTs = /\.vue\?/.test(id) && id.endsWith('lang=ts')
      if (tjsxRE.test(id) || isVueTs) {
        return transform(code, id, {
          ...jsxConfig,
          ...(isVueTs ? { loader: 'ts' } : null)
        })
      }
    },

    async renderChunk(code, chunk) {
      if (minify) {
        return transform(code, chunk.fileName, {
          minify: true
        })
      } else {
        return null
      }
    }
  }
}
