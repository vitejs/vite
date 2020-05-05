import { Plugin, RollupOutput } from 'rollup'
import path from 'path'
import { isExternalUrl } from './utils'
import { resolveVue } from './vueResolver'

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

export const genIndex = (
  root: string,
  rawIndexContent: string,
  publicBasePath: string,
  assetsDir: string,
  cdn: boolean,
  cssFileName: string,
  bundleOutput: RollupOutput['output']
) => {
  let generatedIndex = rawIndexContent.replace(scriptRE, '').trim()

  const injectCSS = (html: string, filename: string) => {
    const tag = `<link rel="stylesheet" href="${publicBasePath}${path.posix.join(
      assetsDir,
      filename
    )}">`
    if (/<\/head>/.test(html)) {
      return html.replace(/<\/head>/, `${tag}\n</head>`)
    } else {
      return tag + '\n' + html
    }
  }

  const injectScript = (html: string, filename: string) => {
    filename = isExternalUrl(filename)
      ? filename
      : `${publicBasePath}${path.posix.join(assetsDir, filename)}`
    const tag = `<script type="module" src="${filename}"></script>`
    if (/<\/body>/.test(html)) {
      return html.replace(/<\/body>/, `${tag}\n</body>`)
    } else {
      return html + '\n' + tag
    }
  }

  if (generatedIndex) {
    // inject css link
    generatedIndex = injectCSS(generatedIndex, cssFileName)
    if (cdn) {
      // if not inlining vue, inject cdn link so it can start the fetch early
      generatedIndex = injectScript(generatedIndex, resolveVue(root).cdnLink)
    }
  }

  for (const chunk of bundleOutput) {
    if (chunk.type === 'chunk' && chunk.isEntry) {
      // inject entry chunk to html
      generatedIndex = injectScript(generatedIndex, chunk.fileName)
    }
  }

  return generatedIndex
}
