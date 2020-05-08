import { Plugin, RollupOutput } from 'rollup'
import path from 'path'
import fs from 'fs-extra'
import { isExternalUrl, cleanUrl, isStaticAsset } from '../utils/pathUtils'
import { resolveVue } from '../utils/resolveVue'
import { resolveAsset } from './buildPluginAsset'
import {
  parse,
  transform,
  NodeTransform,
  NodeTypes,
  TextNode,
  AttributeNode
} from '@vue/compiler-dom'
import MagicString from 'magic-string'
import { InternalResolver } from '../resolver'

export const createBuildHtmlPlugin = async (
  root: string,
  indexPath: string | null,
  publicBasePath: string,
  assetsDir: string,
  inlineLimit: number,
  resolver: InternalResolver
) => {
  if (!indexPath || !(await fs.pathExists(indexPath))) {
    return {
      renderIndex: (...args: any[]) => '',
      htmlPlugin: null
    }
  }

  const rawHtml = await fs.readFile(indexPath, 'utf-8')
  let { html: processedHtml, js } = await compileHtml(
    root,
    rawHtml,
    publicBasePath,
    assetsDir,
    inlineLimit,
    resolver
  )

  const htmlPlugin: Plugin = {
    name: 'vite:html',
    async load(id) {
      if (id === indexPath) {
        return js
      }
    }
  }

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

  const renderIndex = (
    root: string,
    cdn: boolean,
    cssFileName: string,
    bundleOutput: RollupOutput['output']
  ) => {
    // inject css link
    processedHtml = injectCSS(processedHtml, cssFileName)
    // if not inlining vue, inject cdn link so it can start the fetch early
    if (cdn) {
      processedHtml = injectScript(processedHtml, resolveVue(root).cdnLink)
    }
    // inject js entry chunks
    for (const chunk of bundleOutput) {
      if (chunk.type === 'chunk' && chunk.isEntry) {
        processedHtml = injectScript(processedHtml, chunk.fileName)
      }
    }
    return processedHtml
  }

  return {
    renderIndex,
    htmlPlugin
  }
}

// this extends the config in @vue/compiler-sfc with <link href>
const assetAttrsConfig: Record<string, string[]> = {
  link: ['href'],
  video: ['src', 'poster'],
  source: ['src'],
  img: ['src'],
  image: ['xlink:href', 'href'],
  use: ['xlink:href', 'href']
}

// compile index.html to a JS module, importing referenced assets
// and scripts
const compileHtml = async (
  root: string,
  html: string,
  publicBasePath: string,
  assetsDir: string,
  inlineLimit: number,
  resolver: InternalResolver
) => {
  const ast = parse(html)

  let js = ''
  const s = new MagicString(html)
  const assetUrls: AttributeNode[] = []
  const viteHtmlTrasnfrom: NodeTransform = (node, context) => {
    if (node.type === NodeTypes.ELEMENT) {
      if (node.tag === 'script') {
        const srcAttr = node.props.find(
          (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'src'
        ) as AttributeNode
        if (srcAttr && srcAttr.value) {
          // <script type="module" src="..."/>
          // add it as an import
          js += `\nimport ${JSON.stringify(srcAttr.value.content)}`
        } else if (node.children.length) {
          // <script type="module">...</script>
          // add its content
          // TODO: if there are multiple inline module scripts on the page,
          // they should technically be turned into separate modules, but
          // it's hard to imagine any reason for anyone to do that.
          js += `\n` + (node.children[0] as TextNode).content.trim() + `\n`
        }
        // remove the script tag from the html. we are going to inject new
        // ones in the end.
        s.remove(node.loc.start.offset, node.loc.end.offset)
      }
      // For asset references in index.html, also generate an import
      // statement for each - this will be handled by the asset plugin
      const assetAttrs = assetAttrsConfig[node.tag]
      if (assetAttrs) {
        for (const p of node.props) {
          if (
            p.type === NodeTypes.ATTRIBUTE &&
            p.value &&
            assetAttrs.includes(p.name) &&
            !isExternalUrl(p.value.content)
          ) {
            const url = cleanUrl(p.value.content)
            js += `\nimport ${JSON.stringify(url)}`
            if (isStaticAsset(url)) {
              assetUrls.push(p)
            }
          }
        }
      }
    }
  }

  transform(ast, {
    nodeTransforms: [viteHtmlTrasnfrom]
  })

  // for each encountered asset url, rewrite original html so that it
  // references the post-build location.
  for (const attr of assetUrls) {
    const value = attr.value!
    const { url } = await resolveAsset(
      resolver.requestToFile(value.content),
      root,
      publicBasePath,
      assetsDir,
      inlineLimit
    )
    s.overwrite(value.loc.start.offset, value.loc.end.offset, url)
  }

  return {
    html: s.toString(),
    js
  }
}
