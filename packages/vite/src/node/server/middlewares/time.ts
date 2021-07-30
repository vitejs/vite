import { Connect } from 'types/connect'
import { prettifyUrl, timeFrom } from '../../utils'
import { createDebugger, DebugScopes } from '../../debugger'

const logTime = createDebugger(DebugScopes.TIME)

export function timeMiddleware(root: string): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteTimeMiddleware(req, res, next) {
    const start = Date.now()
    const end = res.end
    res.end = (...args: any[]) => {
      logTime(`${timeFrom(start)} ${prettifyUrl(req.url!, root)}`)
      // @ts-ignore
      return end.call(res, ...args)
    }
    next()
  }
}
