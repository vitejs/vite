import { Plugin, HtmlTagDescriptor } from 'vite'
export interface IHTMLTag {
  [key: string]: string
}

export interface Options {
  favicon?: string
  metas?: IHTMLTag[]
  links?: IHTMLTag[]
  style?: string
  headScripts?: IHTMLTag[]
  scripts?: IHTMLTag[]
}
export default function HtmlPlugin(rawOptions: Options): Plugin {
  const {
    favicon,
    headScripts = [],
    metas = [],
    links = [],
    style,
    scripts = []
  } = rawOptions

  const getScriptContent = (
    script: IHTMLTag,
    injectTo: 'head' | 'body' | 'head-prepend' | 'body-prepend'
  ) => {
    let result = {} as HtmlTagDescriptor
    if (typeof script === 'object' && script.src) {
      result = {
        tag: 'script',
        injectTo,
        attrs: { ...script }
      }
    } else if (typeof script === 'object' && script.content) {
      const { content, ...attr } = script
      result = {
        tag: 'script',
        injectTo,
        attrs: { ...attr },
        children: `${content}`
      }
    } else {
      result = {
        tag: 'script',
        injectTo,
        children: `${script}`
      }
    }
    return result
  }

  return {
    name: 'html-plugin',
    transformIndexHtml(html, ctx) {
      const htmlResult = [] as HtmlTagDescriptor[]
      if (favicon) {
        htmlResult.push({
          tag: 'link',
          attrs: { rel: 'shortcut icon', type: 'image/x-icon', href: favicon },
          injectTo: 'head'
        })
      }
      if (metas.length) {
        metas.forEach((meta) => {
          htmlResult.push({
            tag: 'meta',
            injectTo: 'head',
            attrs: { ...meta }
          })
        })
      }
      if (links.length) {
        links.forEach((meta) => {
          htmlResult.push({
            tag: 'link',
            injectTo: 'head',
            attrs: { ...meta }
          })
        })
      }
      if (style && style.length) {
        htmlResult.push({
          tag: 'style',
          injectTo: 'head',
          children: `${style}`
            .split('\n')
            .map((line) => `  ${line}`)
            .join('\n')
        })
      }
      if (headScripts.length) {
        headScripts.forEach((script) => {
          htmlResult.push(getScriptContent(script, 'head'))
        })
      }
      if (scripts.length) {
        scripts.forEach((script) => {
          htmlResult.push(getScriptContent(script, 'body'))
        })
      }
      return htmlResult
    }
  }
}

// overwrite for cjs require('...')() usage
module.exports = HtmlPlugin
HtmlPlugin['default'] = HtmlPlugin
