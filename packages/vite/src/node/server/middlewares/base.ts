import { ViteDevServer } from '..'
import { Connect } from 'types/connect'

export function baseMiddleware({
  config
}: ViteDevServer): Connect.NextHandleFunction {
  const base = config.env.BASE_URL!

  return (req, res, next) => {
    const url = req.url!
    if (url.startsWith(base)) {
      // rewrite url to remove base.. this ensures that other middleware does not need to consider base being prepended or not
      req.url = url.replace(base, '/')
    }
    next()
  }
}
