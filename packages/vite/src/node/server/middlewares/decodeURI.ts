import { Connect } from 'types/connect'

export function decodeURIMiddleware(): Connect.NextHandleFunction {
  return (req, _, next) => {
    // #2195
    req.url = decodeURI(req.url!)

    // `sirv` middleware uses the req._parsedUrl values to find the file,
    // so decode it all together.
    // @ts-ignore
    const parsedUrl = req._parsedUrl
    Object.keys(parsedUrl).forEach((key) => {
      parsedUrl[key] = parsedUrl[key]
        ? decodeURI(parsedUrl[key])
        : parsedUrl[key]
    })
    next()
  }
}
