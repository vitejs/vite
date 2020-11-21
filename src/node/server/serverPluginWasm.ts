import { ServerPlugin } from '.'
import { isImportRequest } from '../utils'
import * as wasmHelper from '../utils/wasmHelper'

export const wasmPlugin: ServerPlugin = ({ app }) => {
  app.use((ctx, next) => {
    if (ctx.path === wasmHelper.id) {
      ctx.type = 'js'
      ctx.body = `export default ${wasmHelper.code}`
      return
    } else if (ctx.path.endsWith('.wasm') && isImportRequest(ctx)) {
      ctx.type = 'js'
      ctx.body = `import initWasm from "${wasmHelper.id}"
export default opts => initWasm(opts, ${JSON.stringify(ctx.path)})`
      return
    }
    return next()
  })
}
