import { Plugin } from '../config'
import { ServerContext } from '..'
import { OutputBundle } from 'rollup'

export interface HtmlTagDescriptor {
  tag: string
  attrs?: Record<string, string>
  children?: string | HtmlTagDescriptor[]
  injectTo?: 'head' | 'body'
}

export type IndexHtmlTransformResult = string | HtmlTagDescriptor[]

export type IndexHtmlTransformHook = (
  html: string,
  serverCtx?: ServerContext,
  bundle?: OutputBundle
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
  hooks: IndexHtmlTransformHook[],
  ctx: ServerContext
): Promise<string>
export async function applyHtmlTransforms(
  html: string,
  hooks: IndexHtmlTransformHook[],
  ctx: undefined,
  bundle: OutputBundle
): Promise<string>
export async function applyHtmlTransforms(
  html: string,
  hooks: IndexHtmlTransformHook[],
  ctx?: ServerContext,
  bundle?: OutputBundle
): Promise<string> {
  const headTags: HtmlTagDescriptor[] = []
  const bodyTags: HtmlTagDescriptor[] = []

  for (const hook of hooks) {
    const res = await hook(html, ctx, bundle)
    if (typeof res === 'string') {
      html = res
    } else {
      for (const tag of res) {
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
