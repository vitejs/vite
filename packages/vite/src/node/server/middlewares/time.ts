import { NextHandleFunction } from 'connect'
import _debug from 'debug'
import { prettifyUrl, timeFrom } from '../../utils'

export function timeMiddleware(root: string): NextHandleFunction {
  const logTime = _debug('vite:time')

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
