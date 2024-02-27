import type { ViteDevServer } from '../server'
import type { FetchResult } from '../../runtime/types'
import { fetchModule } from './fetchModule'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = async function () {}.constructor as typeof Function
const fnDeclarationLineCount = (() => {
  const body = '/*code*/'
  const source = new AsyncFunction('a', 'b', body).toString()
  return source.slice(0, source.indexOf(body)).split('\n').length - 1
})()

export function ssrFetchModule(
  server: ViteDevServer,
  id: string,
  importer?: string,
): Promise<FetchResult> {
  return fetchModule(server, id, importer, {
    processSourceMap(map) {
      // this assumes that "new AsyncFunction" is used to create the module
      return Object.assign({}, map, {
        // currently we need to offset the line
        // https://github.com/nodejs/node/issues/43047#issuecomment-1180632750
        mappings: ';'.repeat(fnDeclarationLineCount) + map.mappings,
      })
    },
  })
}
