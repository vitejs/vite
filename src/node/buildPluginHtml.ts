import { Plugin } from 'rollup'

export const scriptRE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gm
const srcRE = /\bsrc=(?:"([^"]+)"|'([^']+)'|([^'"\s]+)\b)/

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
          // <script type="module" src="..."/>
          // add it as an import
          const tagAttr = match[1]
          const srcMatch = tagAttr && tagAttr.match(srcRE)
          if (srcMatch) {
            script += `\nimport "${
              srcMatch[1] || srcMatch[2] || srcMatch[3]
            }"\n`
          }
          // <script type="module">...</script>
          // add its content
          script += match[2]
        }
        return script
      }
    }
  }
}
