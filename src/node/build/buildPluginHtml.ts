import { Plugin, RollupOutput, OutputChunk } from 'rollup'
import path from 'path'
import fs from 'fs-extra'
import MagicString from 'magic-string'
import {
  isExternalUrl,
  cleanUrl,
  isDataUrl,
  transformIndexHtml
} from '../utils'
import { resolveAsset, registerAssets } from './buildPluginAsset'
import { InternalResolver } from '../resolver'
import { UserConfig } from '../config'
import {
  parse as Parse,
  transform as Transform,
  NodeTransform,
  NodeTypes,
  TextNode,
  AttributeNode
} from '@vue/compiler-dom'

export const createBuildHtmlPlugin = async (
  root: string,
  indexPath: string | null,
  publicBasePath: string,
  assetsDir: string,
  inlineLimit: number,
  resolver: InternalResolver,
  shouldPreload: ((chunk: OutputChunk) => boolean) | null,
  config: UserConfig
) => {
  if (!indexPath || !fs.existsSync(indexPath)) {
    return {
      renderIndex: () => '',
      htmlPlugin: null
    }
  }

  const rawHtml = await fs.readFile(indexPath, 'utf-8')
  const preprocessedHtml = await transformIndexHtml(
    rawHtml,
    config.indexHtmlTransforms,
    'pre',
    true
  )
  const assets = new Map<string, Buffer>()
  let { html: processedHtml, js } = await compileHtml(
    root,
    preprocessedHtml,
    publicBasePath,
    assetsDir,
    inlineLimit,
    resolver,
    assets
  )

  const htmlPlugin: Plugin = {
    name: 'vite:html',
    async load(id) {
      if (id === indexPath) {
        return js
      }
    },

    generateBundle(_options, bundle) {
      registerAssets(assets, bundle)
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
    if (/<\/head>/.test(html)) {
      return html.replace(/<\/head>/, `${tag}\n</head>`)
    } else {
      return html + '\n' + tag
    }
  }

  const injectPreload = (html: string, filename: string) => {
    filename = isExternalUrl(filename)
      ? filename
      : `${publicBasePath}${path.posix.join(assetsDir, filename)}`
    const tag = `<link rel="modulepreload" href="${filename}" />`
    if (/<\/head>/.test(html)) {
      return html.replace(/<\/head>/, `${tag}\n</head>`)
    } else {
      return tag + '\n' + html
    }
  }

  const renderIndex = async (bundleOutput: RollupOutput['output']) => {
    let result = processedHtml
    for (const chunk of bundleOutput) {
      if (chunk.type === 'chunk') {
        if (chunk.isEntry) {
          // js entry chunk
          result = injectScript(result, chunk.fileName)
        } else if (shouldPreload && shouldPreload(chunk)) {
          // async preloaded chunk
          result = injectPreload(result, chunk.fileName)
        }
      } else {
        // imported css chunks
        if (
          chunk.fileName.endsWith('.css') &&
          chunk.source &&
          !assets.has(chunk.fileName)
        ) {
          result = injectCSS(result, chunk.fileName)
        }
      }
    }

    return await transformIndexHtml(
      result,
      config.indexHtmlTransforms,
      'post',
      true
    )
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
  resolver: InternalResolver,
  assets: Map<string, Buffer>
) => {
  const { parse, transform } = require('@vue/compiler-dom')

  // @vue/compiler-core doesn't like lowercase doctypes
  html = html.replace(/<!doctype\s/i, '<!DOCTYPE ')
  const ast = (parse as typeof Parse)(html)

  let js = ''
  const s = new MagicString(html)
  const assetUrls: AttributeNode[] = []
  const viteHtmlTransform: NodeTransform = (node) => {
    if (node.type === NodeTypes.ELEMENT) {
      if (node.tag === 'script') {
        let shouldRemove = false

        const srcAttr = node.props.find(
          (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'src'
        ) as AttributeNode
        const typeAttr = node.props.find(
          (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'type'
        ) as AttributeNode
        const isJsModule =
          typeAttr && typeAttr.value && typeAttr.value.content === 'module'

        if (isJsModule) {
          if (srcAttr && srcAttr.value) {
            if (!isExternalUrl(srcAttr.value.content)) {
              // <script type="module" src="..."/>
              // add it as an import
              js += `\nimport ${JSON.stringify(srcAttr.value.content)}`
              shouldRemove = true
            }
          } else if (node.children.length) {
            // <script type="module">...</script>
            // add its content
            // TODO: if there are multiple inline module scripts on the page,
            // they should technically be turned into separate modules, but
            // it's hard to imagine any reason for anyone to do that.
            js += `\n` + (node.children[0] as TextNode).content.trim() + `\n`
            shouldRemove = true
          }
        }

        if (shouldRemove) {
          // remove the script tag from the html. we are going to inject new
          // ones in the end.
          s.remove(node.loc.start.offset, node.loc.end.offset)
        }
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
            !isExternalUrl(p.value.content) &&
            !isDataUrl(p.value.content)
          ) {
            assetUrls.push(p)
          }
        }
      }
    }
  }

  ;(transform as typeof Transform)(ast, {
    nodeTransforms: [viteHtmlTransform]
  })

  // for each encountered asset url, rewrite original html so that it
  // references the post-build location.
  for (const attr of assetUrls) {
    const value = attr.value!
    const { fileName, content, url } = await resolveAsset(
      resolver.requestToFile(value.content),
      root,
      publicBasePath,
      assetsDir,
      cleanUrl(value.content).endsWith('.css') ? 0 : inlineLimit
    )
    s.overwrite(value.loc.start.offset, value.loc.end.offset, `"${url}"`)
    if (fileName && content) {
      assets.set(fileName, content)
    }
  }

  return {
    html: s.toString(),
    js
  }
}
