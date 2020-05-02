import { Plugin } from 'rollup'
import { scriptRE } from './utils'

export const createBuildHtmlPlugin = (
  indexPath: string,
  indexContent: string
): Plugin => {
  return {
    name: 'vite:html',
    load(id) {
      if (id === indexPath) {
        let script = ''
        let match
        while ((match = scriptRE.exec(indexContent))) {
          // TODO handle <script type="module" src="..."/>
          // just add it as an import
          script += match[1]
        }
        return script
      }
    }
  }
}
