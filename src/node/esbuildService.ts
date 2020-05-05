import { startService, Service, TransformOptions } from 'esbuild'
import { Plugin } from 'rollup'

const transform = async (
  service: Service,
  code: string,
  options: TransformOptions,
  operation: string
) => {
  try {
    const result = await service.transform(code, options)
    if (result.warnings.length) {
      console.error(`[vite] warnings while ${operation} with esbuild:`)
      // TODO pretty print this
      result.warnings.forEach((w) => console.error(w))
    }
    return {
      code: result.js || '',
      map: result.jsSourceMap || ''
    }
  } catch (e) {
    console.error(`[vite] error while ${operation} with esbuild:`)
    console.error(e)
    return {
      code: '',
      map: ''
    }
  }
}

export const createMinifyPlugin = async (): Promise<Plugin> => {
  const service = await startService()
  return {
    name: 'vite:minify',
    async renderChunk(code, chunk) {
      return transform(
        service,
        code,
        { minify: true },
        `minifying ${chunk.fileName}`
      )
    },
    generateBundle() {
      service.stop()
    }
  }
}
