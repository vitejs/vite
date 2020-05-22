import path from 'path'
import { asyncReplace } from './transformUtils'
import { isExternalUrl, resolveFrom } from './pathUtils'
import { resolveCompiler } from './resolveVue'
import { loadPostcssConfig } from './resolvePostCssConfig'
import hash_sum from 'hash-sum'
import { SFCAsyncStyleCompileOptions } from '@vue/compiler-sfc'

const urlRE = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/
export const cssPreprocessLangReg = /(.+).(less|sass|scss|styl|stylus)$/

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

export async function compileCss(
  root: string,
  publicPath: string,
  {
    source,
    filename,
    scoped,
    modules,
    preprocessLang
  }: SFCAsyncStyleCompileOptions,
  isBuild: boolean = false
) {
  const id = hash_sum(publicPath)
  const postcssConfig = await loadPostcssConfig(root)
  const { compileStyleAsync } = resolveCompiler(root)

  const result = await compileStyleAsync({
    source,
    filename,
    id: `data-v-${id}`,
    scoped,
    modules,
    modulesOptions: {
      generateScopedName: `[local]_${id}`
    },
    preprocessLang: preprocessLang,
    preprocessCustomRequire: (id: string) => require(resolveFrom(root, id)),
    ...(postcssConfig
      ? {
          postcssOptions: postcssConfig.options,
          postcssPlugins: postcssConfig.plugins
        }
      : {})
  })
  if (!isBuild) {
    // rewrite relative urls
    result.code = await rewriteCssUrls(result.code, publicPath)
  }
  return result
}
