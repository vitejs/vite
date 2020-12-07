import { SourceMap } from 'rollup'
import { ServerContext } from './'
import { NextHandleFunction } from 'connect'

export interface TransformResult {
  code: string
  map: SourceMap | null
}

export async function transformFile(
  url: string,
  { container, config }: ServerContext
): Promise<TransformResult | null> {
  // url -> file

  // resolve

  // load

  // transform

  return null
}

export function createTransformMiddleware(
  context: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    const result = await transformFile(req.url!, context)

    if (result) {
      console.log('result')
    } else {
      next()
    }
  }
}
