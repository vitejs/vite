import path from 'path'
import { startService, Service, TransformOptions } from 'esbuild'

export const tjsxRE = /\.(tsx?|jsx)$/

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
  file: string,
  options: TransformOptions = {}
) => {
  return transformWithService(await ensureService(), code, file, options)
}

// trasnform that takes the service via arguments, used in build plugins
export const transformWithService = async (
  service: Service,
  code: string,
  file: string,
  options: TransformOptions = {}
) => {
  try {
    if (!options.loader) {
      options.loader = path.extname(file).slice(1) as any
    }
    options.sourcemap = true
    const result = await service.transform(code, options)
    if (result.warnings.length) {
      console.error(`[vite] warnings while transforming ${file} with esbuild:`)
      // TODO pretty print this
      result.warnings.forEach((w) => console.error(w))
    }
    return {
      code: result.js || '',
      map: result.jsSourceMap || ''
    }
  } catch (e) {
    console.error(`[vite] error while transforming ${file} with esbuild:`)
    console.error(e)
    return {
      code: '',
      map: ''
    }
  }
}
