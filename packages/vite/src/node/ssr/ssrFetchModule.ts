import type { ViteDevServer } from '../server'
import type { FetchResult } from '../../runtime/types'
import { asyncFunctionDeclarationPaddingLineCount } from '../../shared/utils'
import { fetchModule } from './fetchModule'

export function ssrFetchModule(
  server: ViteDevServer,
  id: string,
  importer?: string,
): Promise<FetchResult> {
  return fetchModule(server, id, importer, {
    processSourceMap(map) {
      // this assumes that "new AsyncFunction" is used to create the module
      return Object.assign({}, map, {
        mappings:
          ';'.repeat(asyncFunctionDeclarationPaddingLineCount) + map.mappings,
      })
    },
  })
}
