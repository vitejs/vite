import { Connect } from '../../types/connect'
import { createDebugger, prettifyUrl, timeFrom } from '../../utils'

const logTime = createDebugger('vite:time')

export function timeMiddleware(root: string): Connect.NextHandleFunction {
  return (req, res, next) => {
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
