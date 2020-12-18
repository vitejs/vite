import fs from 'fs'
import { Plugin } from '../plugin'
import { ViteDevServer } from '../server'
import { OutputBundle } from 'rollup'
import { cleanUrl } from '../utils'

const htmlProxyRE = /\?html-proxy&index=(\d+)\.js$/
export const isHTMLProxy = (id: string) => htmlProxyRE.test(id)
export const scriptRE = /(<script\b[^>]*type\s*=\s*(?:"module"|'module')[^>]*>)([\s\S]*?)<\/script>/gm

export function htmlPlugin(): Plugin {
  return {
    name: 'vite:html',
    resolveId(id) {
      if (htmlProxyRE.test(id)) {
        return id
      }
    },
    load(id) {
      const proxyMatch = id.match(htmlProxyRE)
      if (proxyMatch) {
        const index = Number(proxyMatch[1])
        const file = cleanUrl(id)
        const html = fs.readFileSync(file, 'utf-8')
        let match
        scriptRE.lastIndex = 0
        for (let i = 0; i <= index; i++) {
          match = scriptRE.exec(html)
        }
        if (match) {
          return match[2]
        } else {
          throw new Error(`No matching html proxy module found from ${id}`)
        }
      }
    }
  }
}

export interface HtmlTagDescriptor {
  tag: string
  attrs?: Record<string, string>
  children?: string | HtmlTagDescriptor[]
  injectTo?: 'head' | 'body'
}

export type IndexHtmlTransformResult =
  | string
  | HtmlTagDescriptor[]
  | {
      html: string
      tags: HtmlTagDescriptor[]
    }

export interface IndexHtmlTransformContext {
  /**
   * public path when served
   */
  path: string
  /**
   * filename on disk
   */
  filename: string
  server?: ViteDevServer
  bundle?: OutputBundle
}

export type IndexHtmlTransformHook = (
  html: string,
  ctx: IndexHtmlTransformContext
) => IndexHtmlTransformResult | Promise<IndexHtmlTransformResult>

export type IndexHtmlTransform =
  | IndexHtmlTransformHook
  | {
      enforce?: 'pre' | 'post'
      transform: IndexHtmlTransformHook
    }

export function resolveHtmlTransforms(plugins: readonly Plugin[]) {
  const preHooks: IndexHtmlTransformHook[] = []
  const postHooks: IndexHtmlTransformHook[] = []

  for (const plugin of plugins) {
    const hook = plugin.transformIndexHtml
    if (hook) {
      if (typeof hook === 'function') {
        postHooks.push(hook)
      } else if (hook.enforce === 'pre') {
        preHooks.push(hook.transform)
      } else {
        postHooks.push(hook.transform)
      }
    }
  }

  return [preHooks, postHooks]
}

export async function applyHtmlTransforms(
  html: string,
  path: string,
  filename: string,
  hooks: IndexHtmlTransformHook[],
  server: ViteDevServer
): Promise<string>
export async function applyHtmlTransforms(
  html: string,
  path: string,
  filename: string,
  hooks: IndexHtmlTransformHook[],
  server: undefined,
  bundle: OutputBundle
): Promise<string>
export async function applyHtmlTransforms(
  html: string,
  path: string,
  filename: string,
  hooks: IndexHtmlTransformHook[],
  server?: ViteDevServer,
  bundle?: OutputBundle
): Promise<string> {
  const headTags: HtmlTagDescriptor[] = []
  const bodyTags: HtmlTagDescriptor[] = []

  const ctx = {
    path,
    filename,
    server,
    bundle
  }

  for (const hook of hooks) {
    const res = await hook(html, ctx)
    if (typeof res === 'string') {
      html = res
    } else {
      let tags
      if (Array.isArray(res)) {
        tags = res
      } else {
        html = res.html
        tags = res.tags
      }
      for (const tag of tags) {
        if (tag.injectTo === 'body') {
          bodyTags.push(tag)
        } else {
          headTags.push(tag)
        }
      }
    }
  }

  // inject tags
  if (headTags.length) {
    html = injectToHead(html, headTags)
  }
  if (bodyTags.length) {
    html = injectToBody(html, bodyTags)
  }

  return html
}

const headInjectRE = [/<head>/, /<!doctype html>/i]

function injectToHead(html: string, tags: HtmlTagDescriptor[]) {
  const tagsHtml = serializeTags(tags) + `\n`
  // inject after head or doctype
  for (const re of headInjectRE) {
    if (re.test(html)) {
      return html.replace(re, `$&${tagsHtml}`)
    }
  }
  // if no <head> tag or doctype is present, just prepend
  return tagsHtml + html
}

const bodyInjectRE = /<\/body>/

function injectToBody(html: string, tags: HtmlTagDescriptor[]) {
  const tagsHtml = `\n` + serializeTags(tags)
  if (bodyInjectRE.test(html)) {
    return html.replace(bodyInjectRE, `${tagsHtml}$&`)
  }
  // append
  return html + tagsHtml
}

const unaryTags = new Set(['link', 'meta', 'base'])

function serializeTag({ tag, attrs, children }: HtmlTagDescriptor): string {
  if (unaryTags.has(tag)) {
    return `<${tag}${serializeAttrs(attrs)}>`
  } else {
    return `<${tag}${serializeAttrs(attrs)}>${serializeTags(children)}</${tag}>`
  }
}

function serializeTags(tags: HtmlTagDescriptor['children']): string {
  if (typeof tags === 'string') {
    return tags
  } else if (tags) {
    return tags.map(serializeTag).join(`\n  `)
  }
  return ''
}

function serializeAttrs(attrs: HtmlTagDescriptor['attrs']): string {
  let res = ''
  for (const key in attrs) {
    res += ` ${key}=${JSON.stringify(attrs[key])}`
  }
  return res
}
