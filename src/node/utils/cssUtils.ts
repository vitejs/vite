import path from 'path'
import { asyncReplace } from './transformUtils'
import { isExternalUrl } from './pathUtils'

const urlRE = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/

type Replacer = (url: string) => string | Promise<string>

export function rewriteCssUrls(
  css: string,
  replacerOrBase: string | Replacer
): Promise<string> {
  let replacer: Replacer
  if (typeof replacerOrBase === 'string') {
    replacer = (rawUrl) => {
      return path.posix.resolve(path.posix.dirname(replacerOrBase), rawUrl)
    }
  } else {
    replacer = replacerOrBase
  }

  return asyncReplace(css, urlRE, async (match) => {
    const [matched, before, rawUrl, after] = match
    if (isExternalUrl(rawUrl) || rawUrl.startsWith('data:')) {
      return matched
    }
    return before + (await replacer(rawUrl)) + after
  })
}
