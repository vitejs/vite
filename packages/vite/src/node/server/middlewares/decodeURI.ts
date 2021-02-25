import { Connect } from 'types/connect'

export function decodeURIMiddleware(): Connect.NextHandleFunction {
  return (req, _, next) => {
    // #2195
    req.url = decodeURI(req.url!)

    // `sirv` middleware uses the req._parsedUrl values to find the file,
    // so decode it all together.
    // @ts-ignore
    Object.keys(req._parsedUrl).forEach((key) => {
      // @ts-ignore
      if (req._parsedUrl[key]) {
        // @ts-ignore
        req._parsedUrl[key] = decodeURI(req._parsedUrl[key])
      }
    })
    next()
  }
}
