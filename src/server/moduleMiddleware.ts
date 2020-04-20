import path from 'path'
import resolve from 'resolve-cwd'
import { sendJSStream } from './utils'
import { ServerResponse } from 'http'

export function moduleMiddleware(id: string, res: ServerResponse) {
  let modulePath: string
  // TODO support custom imports map e.g. for snowpack web_modules

  // fallback to node resolve
  try {
    modulePath = resolve(id)
    if (id === 'vue') {
      modulePath = path.join(
        path.dirname(modulePath),
        'dist/vue.runtime.esm-browser.js'
      )
    }
    sendJSStream(res, modulePath)
  } catch (e) {
    res.statusCode = 404
    res.end()
  }
}
