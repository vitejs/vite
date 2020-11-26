import { IndexHtmlTransform } from '../transform'

export async function asyncReplace(
  input: string,
  re: RegExp,
  replacer: (match: RegExpExecArray) => string | Promise<string>
) {
  let match: RegExpExecArray | null
  let remaining = input
  let rewritten = ''
  while ((match = re.exec(remaining))) {
    rewritten += remaining.slice(0, match.index)
    rewritten += await replacer(match)
    remaining = remaining.slice(match.index + match[0].length)
  }
  rewritten += remaining
  return rewritten
}

const injectReplaceRE = [/<head>/, /<!doctype html>/i]

export function injectScriptToHtml(html: string, script: string) {
  // inject after head or doctype
  for (const re of injectReplaceRE) {
    if (re.test(html)) {
      return html.replace(re, `$&${script}`)
    }
  }
  // if no <head> tag or doctype is present, just prepend
  return script + html
}

export async function transformIndexHtml(
  html: string,
  transforms: IndexHtmlTransform[] = [],
  apply: 'pre' | 'post',
  isBuild = false
) {
  let code = html
  for (let t of transforms) {
    if (typeof t === 'function') {
      t = { apply: 'post', transform: t }
    }
    if (t.apply === apply) {
      code = await t.transform({ isBuild, code })
    }
  }
  return code
}
