import path from 'path'
import { Plugin } from 'rollup'
import { resolveAsset, registerAssets } from './buildPluginAsset'
import { BuildConfig } from '../config'
import hash_sum from 'hash-sum'
import {
  urlRE,
  compileCss,
  cssPreprocessLangRE,
  rewriteCssUrls,
  isCSSRequest,
  cssModuleRE
} from '../utils/cssUtils'
import {
  SFCStyleCompileResults,
  SFCAsyncStyleCompileOptions
} from '@vue/compiler-sfc'
import chalk from 'chalk'

const debug = require('debug')('vite:build:css')

const cssInjectionMarker = `__VITE_CSS__`
const cssInjectionRE = /__VITE_CSS__\(\)/g

interface BuildCssOption {
  root: string
  publicBase: string
  assetsDir: string
  minify?: BuildConfig['minify']
  inlineLimit?: number
  cssCodeSplit?: boolean
  preprocessOptions?: SFCAsyncStyleCompileOptions['preprocessOptions']
}

export const createBuildCssPlugin = ({
  root,
  publicBase,
  assetsDir,
  minify = false,
  inlineLimit = 0,
  cssCodeSplit = true,
  preprocessOptions = {}
}: BuildCssOption): Plugin => {
  const styles: Map<string, string> = new Map()
  const assets = new Map<string, Buffer>()

  return {
    name: 'vite:css',
    async transform(css: string, id: string) {
      if (isCSSRequest(id)) {
        // if this is a Vue SFC style request, it's already processed by
        // rollup-plugin-vue and we just need to rewrite URLs + collect it
        const isVueStyle = /\?vue&type=style/.test(id)
        const result = isVueStyle
          ? css
          : await compileCss(
              root,
              id,
              {
                id: '',
                source: css,
                filename: id,
                scoped: false,
                modules: cssModuleRE.test(id),
                preprocessLang: id.replace(
                  cssPreprocessLangRE,
                  '$2'
                ) as SFCAsyncStyleCompileOptions['preprocessLang'],
                preprocessOptions
              },
              true
            )

        let modules: SFCStyleCompileResults['modules']
        if (typeof result === 'string') {
          css = result
        } else {
          if (result.errors.length) {
            console.error(`[vite] error applying css transforms: `)
            result.errors.forEach(console.error)
          }
          css = result.code
          modules = result.modules
        }

        // process url() - register referenced files as assets
        // and rewrite the url to the resolved public path
        if (urlRE.test(css)) {
          const fileDir = path.dirname(id)
          css = await rewriteCssUrls(css, async (rawUrl) => {
            const file = path.posix.isAbsolute(rawUrl)
              ? path.join(root, rawUrl)
              : path.join(fileDir, rawUrl)
            const { fileName, content, url } = await resolveAsset(
              file,
              root,
              publicBase,
              assetsDir,
              inlineLimit
            )
            if (fileName && content) {
              assets.set(fileName, content)
            }
            debug(
              `url(${rawUrl}) -> ${
                url.startsWith('data:') ? `base64 inlined` : `url(${url})`
              }`
            )
            return url
          })
        }

        styles.set(id, css)
        return {
          code: modules
            ? `export default ${JSON.stringify(modules)}`
            : (cssCodeSplit
                ? // If code-splitting CSS, inject a fake marker to avoid the module
                  // from being tree-shaken. This preserves the .css file as a
                  // module in the chunk's metadata so that we can retrieve them in
                  // renderChunk.
                  `${cssInjectionMarker}()\n`
                : ``) + `export default ${JSON.stringify(css)}`,
          map: null
        }
      }
    },

    async renderChunk(code, chunk) {
      if (!cssCodeSplit) {
        return null
      }
      code = code.replace(cssInjectionRE, '')
      // for each dynamic entry chunk, collect its css and inline it as JS
      // strings.
      if (chunk.isDynamicEntry) {
        let chunkCSS = ''
        for (const id in chunk.modules) {
          if (styles.has(id)) {
            chunkCSS += styles.get(id)
            styles.delete(id) // remove inlined css
          }
        }
        chunkCSS = minifyCSS(chunkCSS)
        code =
          `let ${cssInjectionMarker} = document.createElement('style');` +
          `${cssInjectionMarker}.innerHTML = ${JSON.stringify(chunkCSS)};` +
          `document.head.appendChild(${cssInjectionMarker});` +
          code
      }
      return {
        code,
        map: null
      }
    },

    async generateBundle(_options, bundle) {
      let css = ''
      // finalize extracted css
      styles.forEach((s) => {
        css += s
      })
      // minify with cssnano
      if (minify) {
        css = minifyCSS(css)
      }

      const cssFileName = `style.${hash_sum(css)}.css`

      bundle[cssFileName] = {
        name: cssFileName,
        isAsset: true,
        type: 'asset',
        fileName: cssFileName,
        source: css
      }

      registerAssets(assets, bundle)
    }
  }
}

let CleanCSS: any

function minifyCSS(css: string) {
  CleanCSS = CleanCSS || require('clean-css')
  const res = new CleanCSS({ level: 2, rebase: false }).minify(css)

  if (res.errors && res.errors.length) {
    console.error(chalk.red(`[vite] error when minifying css:`))
    console.error(res.errors)
  }

  if (res.warnings && res.warnings.length) {
    console.error(chalk.yellow(`[vite] warnings when minifying css:`))
    console.error(res.warnings)
  }

  return res.styles
}
