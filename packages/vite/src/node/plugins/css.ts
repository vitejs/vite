import { createDebugger } from '../utils'
import path from 'path'
import fs, { promises as fsp } from 'fs'
import { Plugin, ResolvedConfig } from '..'
import postcssrc from 'postcss-load-config'
import merge from 'merge-source-map'
import { SourceMap } from 'rollup'
import { dataToEsm } from '@rollup/pluginutils'
import chalk from 'chalk'
import { CLIENT_PUBLIC_PATH } from '../constants'

const debug = createDebugger('vite:css')

export interface CSSOptions {
  // https://github.com/css-modules/postcss-modules
  modules?: CSSModulesOptions | false
  preprocessorOptions?: Record<string, any>
}

export interface CSSModulesOptions {
  scopeBehaviour?: 'global' | 'local'
  globalModulePaths?: string[]
  generateScopedName?:
    | string
    | ((name: string, filename: string, css: string) => string)
  hashPrefix?: string
  localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly'
}

export const cssPreprocessLangRE = /\.(css|less|sass|scss|styl|stylus|postcss)($|\?)/

export const isCSSRequest = (request: string) =>
  cssPreprocessLangRE.test(request)

export const isCSSProxy = (id: string) => isCSSRequest(id.slice(0, -3))

export const unwrapCSSProxy = (id: string) => {
  const unwrapped = id.slice(0, -3)
  return isCSSRequest(unwrapped) ? unwrapped : id
}

export function cssPlugin(config: ResolvedConfig, isBuild: boolean): Plugin {
  return {
    name: 'vite:css',

    // server only - this loads *.css.js requests which are a result
    // of import rewriting in ./rewrite.ts
    async load(id) {
      if (isCSSRequest((id = id.slice(0, -3))) && fs.existsSync(id)) {
        return fsp.readFile(id, 'utf-8')
      }
    },

    async transform(raw, id) {
      const isRawRequest = isCSSRequest(id)
      const isProxyRequest = isCSSProxy(id)

      if (!isProxyRequest && !isRawRequest) {
        return
      }

      const { code: css, modules, deps } = await compileCSS(id, raw, config)
      const modulesCode = dataToEsm(modules, { namedExports: true })

      // server-only *.css.js proxy module
      if (!isBuild) {
        if (deps) {
          deps.forEach((file) => {
            // TODO record css @import virtual modules for HMR
            this.addWatchFile(file)
          })
        }

        if (isProxyRequest) {
          debug(`[import] ${chalk.dim(path.relative(config.root, id))}`)
          return [
            `import { updateStyle, removeStyle } from ${JSON.stringify(
              CLIENT_PUBLIC_PATH
            )}`,
            `const id = ${JSON.stringify(id)}`,
            `const css = ${JSON.stringify(css)}`,
            `updateStyle(id, css)`,
            `${modulesCode || `export default css`}`,
            `import.meta.hot.accept()`,
            `import.meta.hot.dispose(() => removeStyle(id))`
          ].join('\n')
        } else {
          debug(`[link] ${chalk.dim(path.relative(config.root, id))}`)
          return modulesCode || css
        }
      }

      // TODO at build time, analyze url() asset reference
      // TODO account for comments https://github.com/vitejs/vite/issues/426
    }
  }
}

async function compileCSS(
  id: string,
  code: string,
  config: ResolvedConfig
): Promise<{
  code: string
  map?: SourceMap
  modules?: Record<string, string>
  deps?: Set<string>
}> {
  const { modules: modulesOptions, preprocessorOptions } = config.css || {}
  const isModule =
    modulesOptions !== false &&
    id.replace(cssPreprocessLangRE, '').endsWith('.module')
  // although at serve time it can work without processing, we do need to
  // crawl them in order to register watch dependencies.
  const needInlineImport = code.includes('@import')
  const postcssConfig = await loadPostcssConfig(config.root)
  const lang = id.match(cssPreprocessLangRE)?.[1]

  // 1. plain css that needs no processing
  if (lang === 'css' && !postcssConfig && !isModule && !needInlineImport) {
    return { code }
  }

  let map: SourceMap | undefined
  let modules: Record<string, string> | undefined
  const deps = new Set<string>()

  // 2. pre-processors: sass etc.
  if (lang && lang in preProcessors) {
    const preProcessor = preProcessors[lang as PreprocessLang]
    let opts = preprocessorOptions && preprocessorOptions[lang]
    // support @import from node dependencies by default
    switch (lang) {
      case 'scss':
      case 'sass':
        opts = {
          includePaths: ['node_modules'],
          ...opts
        }
        break
      case 'less':
      case 'stylus':
        opts = {
          paths: ['node_modules'],
          ...opts
        }
    }
    const preprocessResult = await preProcessor(code, undefined, opts)
    code = preprocessResult.code
    map = preprocessResult.map as SourceMap
    if (preprocessResult.deps) {
      preprocessResult.deps.forEach((dep) => deps.add(dep))
    }
  }

  // 3. postcss
  const postcssOptions = (postcssConfig && postcssConfig.options) || {}
  const postcssPlugins =
    postcssConfig && postcssConfig.plugins ? postcssConfig.plugins.slice() : []

  if (needInlineImport) {
    postcssPlugins.unshift((await import('postcss-import')).default())
  }

  if (isModule) {
    postcssPlugins.unshift(
      (await import('postcss-modules')).default({
        localsConvention: 'camelCaseOnly',
        ...modulesOptions,
        getJSON(_: string, _modules: Record<string, string>) {
          modules = _modules
        }
      })
    )
  }

  if (!postcssPlugins.length) {
    return {
      code,
      map
    }
  }

  // postcss is an unbundled dep and should be lazy imported
  const postcssResult = await (await import('postcss'))
    .default(postcssPlugins)
    .process(code, {
      ...postcssOptions,
      to: id,
      from: id,
      map: {
        inline: false,
        annotation: false,
        prev: map
      }
    })

  // record CSS dependencies from @imports
  for (const message of postcssResult.messages) {
    if (message.type === 'dependency') {
      deps.add(message.file as string)
    }
  }

  return {
    code: postcssResult.css,
    map: postcssResult.map as any,
    modules,
    deps
  }
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
    return (cachedPostcssConfig = await postcssrc({}, root))
  } catch (e) {
    if (!/No PostCSS Config found/.test(e.message)) {
      throw e
    }
    return (cachedPostcssConfig = null)
  }
}

// Preprocessor support. This logic is largely replicated from @vue/compiler-sfc

type PreprocessLang = 'less' | 'sass' | 'scss' | 'styl' | 'stylus'

type StylePreprocessor = (
  source: string,
  map: SourceMap | undefined,
  options: {
    [key: string]: any
    additionalData?: string | ((source: string, filename: string) => string)
    filename: string
  }
) => StylePreprocessorResults | Promise<StylePreprocessorResults>

export interface StylePreprocessorResults {
  code: string
  map?: object
  errors: Error[]
  deps: string[]
}

function loadPreprocessor(lang: PreprocessLang) {
  try {
    return require(lang)
  } catch (e) {
    throw new Error(
      `Preprocessor dependency ${lang} not found. Did you install it?`
    )
  }
}

// .scss/.sass processor
const scss: StylePreprocessor = async (source, map, options) => {
  const nodeSass = loadPreprocessor('sass')
  const finalOptions = {
    ...options,
    data: getSource(source, options.filename, options.additionalData),
    file: options.filename,
    outFile: options.filename,
    sourceMap: !!map
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      nodeSass.render(finalOptions, (err: Error | null, res: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
    const deps = result.stats.includedFiles
    if (map) {
      return {
        code: result.css.toString(),
        map: merge(map, JSON.parse(result.map.toString())),
        errors: [],
        deps
      }
    }

    return { code: result.css.toString(), errors: [], deps }
  } catch (e) {
    return { code: '', errors: [e], deps: [] }
  }
}

const sass: StylePreprocessor = (source, map, options) =>
  scss(source, map, {
    ...options,
    indentedSyntax: true
  })

// .less
const less: StylePreprocessor = (source, map, options) => {
  const nodeLess = loadPreprocessor('less')

  let result: any
  let error: Error | null = null
  nodeLess.render(
    getSource(source, options.filename, options.additionalData),
    { ...options, syncImport: true },
    (err: Error | null, output: any) => {
      error = err
      result = output
    }
  )

  if (error) return { code: '', errors: [error], deps: [] }
  const deps = result.imports
  if (map) {
    return {
      code: result.css.toString(),
      map: merge(map, result.map),
      errors: [],
      deps
    }
  }

  return {
    code: result.css.toString(),
    errors: [],
    deps
  }
}

// .styl
const styl: StylePreprocessor = (source, map, options) => {
  const nodeStylus = loadPreprocessor('stylus')
  try {
    const ref = nodeStylus(source)
    Object.keys(options).forEach((key) => ref.set(key, options[key]))
    if (map) ref.set('sourcemap', { inline: false, comment: false })

    const result = ref.render()
    const deps = ref.deps()
    if (map) {
      return {
        code: result,
        map: merge(map, ref.sourcemap),
        errors: [],
        deps
      }
    }

    return { code: result, errors: [], deps }
  } catch (e) {
    return { code: '', errors: [e], deps: [] }
  }
}

function getSource(
  source: string,
  filename: string,
  additionalData?: string | ((source: string, filename: string) => string)
) {
  if (!additionalData) return source
  if (typeof additionalData === 'function') {
    return additionalData(source, filename)
  }
  return additionalData + source
}

const preProcessors = {
  less,
  sass,
  scss,
  styl,
  stylus: styl
}
