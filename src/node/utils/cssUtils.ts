import path from 'path'
import postcssrc from 'postcss-load-config'
import chalk from 'chalk'
import { asyncReplace } from './transformUtils'
import { isExternalUrl, resolveFrom } from './pathUtils'
import { resolveCompiler } from './resolveVue'
import hash_sum from 'hash-sum'
import {
  SFCAsyncStyleCompileOptions,
  SFCStyleCompileResults
} from '@vue/compiler-sfc'

export const urlRE = /url\(\s*('[^']+'|"[^"]+"|[^'")]+)\s*\)/
export const cssPreprocessLangRE = /(.+)\.(less|sass|scss|styl|stylus|postcss)$/

export const isCSSRequest = (file: string) =>
  file.endsWith('.css') || cssPreprocessLangRE.test(file)

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
    let [matched, rawUrl] = match
    let wrap = ''
    const first = rawUrl[0]
    if (first === `"` || first === `'`) {
      wrap = first
      rawUrl = rawUrl.slice(1, -1)
    }
    if (
      isExternalUrl(rawUrl) ||
      rawUrl.startsWith('data:') ||
      rawUrl.startsWith('#')
    ) {
      return matched
    }
    return `url(${wrap}${await replacer(rawUrl)}${wrap})`
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
    preprocessLang,
    preprocessOptions = {}
  }: SFCAsyncStyleCompileOptions,
  isBuild: boolean = false
): Promise<SFCStyleCompileResults | string> {
  const id = hash_sum(publicPath)
  const postcssConfig = await loadPostcssConfig(root)
  const { compileStyleAsync } = resolveCompiler(root)

  if (
    publicPath.endsWith('.css') &&
    !modules &&
    !postcssConfig &&
    !isBuild &&
    !source.includes('@import')
  ) {
    // no need to invoke compile for plain css if no postcss config is present
    return source
  }

  const {
    options: postcssOptions,
    plugins: postcssPlugins
  } = await resolvePostcssOptions(root, isBuild)

  const res = await compileStyleAsync({
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
    preprocessOptions: {
      includePaths: ['node_modules'],
      ...preprocessOptions
    },

    postcssOptions,
    postcssPlugins
  })

  // record css import dependencies
  if (res.rawResult) {
    res.rawResult.messages.forEach((msg) => {
      let { type, file, parent } = msg
      if (type === 'dependency') {
        if (cssImportMap.has(file)) {
          cssImportMap.get(file)!.add(parent)
        } else {
          cssImportMap.set(file, new Set([parent]))
        }
      }
    })
  }

  return res
}

// postcss-load-config doesn't expose Result type
type PostCSSConfigResult = ReturnType<typeof postcssrc> extends Promise<infer T>
  ? T
  : never

let cachedPostcssConfig: PostCSSConfigResult | null | undefined

async function loadPostcssConfig(
  root: string
): Promise<PostCSSConfigResult | null> {
  if (cachedPostcssConfig !== undefined) {
    return cachedPostcssConfig
  }
  try {
    const load = require('postcss-load-config') as typeof postcssrc
    return (cachedPostcssConfig = await load({}, root))
  } catch (e) {
    if (!/No PostCSS Config found/.test(e.message)) {
      console.error(chalk.red(`[vite] Error loading postcss config:`))
      console.error(e)
    }
    return (cachedPostcssConfig = null)
  }
}

export async function resolvePostcssOptions(root: string, isBuild: boolean) {
  const config = await loadPostcssConfig(root)
  const options = config && config.options
  const plugins = config ? config.plugins : []
  plugins.unshift(require('postcss-import')())
  if (isBuild) {
    plugins.push(require('postcss-discard-comments')({ removeAll: true }))
  }
  return {
    options,
    plugins
  }
}

export const cssImportMap = new Map<
  string /*filePath*/,
  Set<string /*filePath*/>
>()

export function getCssImportBoundaries(
  filePath: string,
  boundaries = new Set<string>()
) {
  if (!cssImportMap.has(filePath)) {
    return boundaries
  }
  const importers = cssImportMap.get(filePath)!
  for (const importer of importers) {
    boundaries.add(importer)
    getCssImportBoundaries(importer, boundaries)
  }
  return boundaries
}
