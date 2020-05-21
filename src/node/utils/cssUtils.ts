import path from 'path'
import { asyncReplace } from './transformUtils'
import { isExternalUrl } from './pathUtils'
import { PreprocessLang, processors } from './stylePreprocessors'

const urlRE = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/
export const cssPreprocessLangReg = /.(less|sass|scss|styl|stylus)$/

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

export function processorCss(css: string, pathUrl: string) {
  const ext = path.extname(pathUrl)
  if (cssPreprocessLangReg.test(ext)) {
    const preprocessor = processors[ext.replace('.', '') as PreprocessLang]
    if (preprocessor) {
      const result = preprocessor.render(css, undefined, {})
      if (result.errors) {
        result.errors.forEach(console.error)
      }
      return result.code
    }
  }
  return css
}
