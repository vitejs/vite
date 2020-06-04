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
import { hmrClientPublicPath } from '../server/serverPluginHmr'

export const urlRE = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/
export const cssPreprocessLangRE = /(.+).(less|sass|scss|styl|stylus)$/

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
    if (
      isExternalUrl(rawUrl) ||
      rawUrl.startsWith('data:') ||
      rawUrl.startsWith('#')
    ) {
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
    preprocessLang,
    preprocessOptions = {}
  }: SFCAsyncStyleCompileOptions
): Promise<SFCStyleCompileResults | string> {
  const id = hash_sum(publicPath)
  let postcssConfig = await loadPostcssConfig(root)
  const { compileStyleAsync } = resolveCompiler(root)

  if (
    publicPath.endsWith('.css') &&
    !modules &&
    !postcssConfig &&
    !source.includes('@import')
  ) {
    // no need to invoke compile for plain css if no postcss config is present
    return source
  }

  const postcssOptions = postcssConfig && postcssConfig.options
  const postcssPlugins = postcssConfig ? postcssConfig.plugins : []
  postcssPlugins.push(require('postcss-import')())

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

export function codegenCss(
  id: string,
  css: string,
  modules?: Record<string, string>
): string {
  let code =
    `import { updateStyle } from "${hmrClientPublicPath}"\n` +
    `const css = ${JSON.stringify(css)}\n` +
    `updateStyle(${JSON.stringify(id)}, css)\n`
  if (modules) {
    code += `export default ${JSON.stringify(modules)}`
  } else {
    code += `export default css`
  }
  return code
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
