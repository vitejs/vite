import { ServerPlugin } from '.'
import { isImportRequest } from '../utils'

export const wasmPlugin: ServerPlugin = ({ app }) => {
  app.use((ctx, next) => {
    if (ctx.path.endsWith('.wasm') && isImportRequest(ctx)) {
      ctx.type = 'js'
      ctx.body = `export default (opts = {}) => {
        return WebAssembly.instantiateStreaming(fetch(${JSON.stringify(
          ctx.path
        )}), opts)
          .then(obj => obj.instance.exports)
      }`
      return
    }
    return next()
  })
}
