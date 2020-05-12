import { Plugin } from 'rollup'
import { tjsxRE, transform, reoslveJsxOptions } from '../esbuildService'
import { SharedConfig } from '../config'

export const createEsbuildPlugin = async (
  minify: boolean,
  jsx: SharedConfig['jsx']
): Promise<Plugin> => {
  const jsxConfig = reoslveJsxOptions(jsx)

  return {
    name: 'vite:esbuild',

    async transform(code, id) {
      const isVueTs = /\.vue\?/.test(id) && id.endsWith('lang=ts')
      if (tjsxRE.test(id) || isVueTs) {
        return transform(
          code,
          id,
          {
            ...jsxConfig,
            ...(isVueTs ? { loader: 'ts' } : null)
          },
          jsx
        )
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
