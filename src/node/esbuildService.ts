import { startService, Service, TransformOptions } from 'esbuild'
import { Plugin } from 'rollup'

// Note: when the esbuild service is held in a module level variable, it
// somehow prevents the build process from exiting even after explicitly
// calling service.stop(). Therefore make sure to only use `ensureService`
// in server plugins. Build plugins should contain the service in its creation
// closure and close it in `generateBundle`.

// lazy start the service
let _service: Service | undefined

const ensureService = async () => {
  if (!_service) {
    _service = await startService()
  }
  return _service
}

// transform used in server plugins with a more friendly API
export const transform = async (
  code: string,
  options: TransformOptions,
  operation: string
) => {
  return _transform(await ensureService(), code, options, operation)
}

// trasnform that takes the service via arguments, used in build plugins
const _transform = async (
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
      return _transform(
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
