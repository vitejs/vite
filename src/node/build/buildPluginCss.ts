import path from 'path'
import { Plugin } from 'rollup'
import { injectAssetRe } from './buildPluginAsset'
import { BuildContext } from './context'
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
import { dataToEsm } from '@rollup/pluginutils'

const debug = require('debug')('vite:build:css')

const cssInjectionMarker = `__VITE_CSS__`
const cssInjectionRE = /__VITE_CSS__\(\);?/g

export const createBuildCssPlugin = (ctx: BuildContext): Plugin => {
  const styles = new Map<string, string>()
  let staticCss = ''

  const emptyChunks = new Set<string>()

  return {
    name: 'vite:css',
    async transform(css: string, id: string) {
      if (isCSSRequest(id)) {
        // if this is a Vue SFC style request, it's already processed by
        // rollup-plugin-vue and we just need to rewrite URLs + collect it
        const isVueStyle = /\?vue&type=style/.test(id)
        const preprocessLang = (id.match(cssPreprocessLangRE) ||
          [])[1] as SFCAsyncStyleCompileOptions['preprocessLang']

        const result = isVueStyle
          ? css
          : await compileCss(
              ctx.root,
              id,
              {
                id: '',
                source: css,
                filename: id,
                scoped: false,
                modules: cssModuleRE.test(id),
                preprocessLang,
                preprocessOptions: ctx.cssPreprocessOptions,
                modulesOptions: ctx.cssModuleOptions
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
            process.exit(1)
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
              ? path.join(ctx.root, rawUrl)
              : path.join(fileDir, rawUrl)
            let { fileName, content, url } = await ctx.resolveAsset(file)
            if (!url && fileName && content) {
              url =
                'import.meta.ROLLUP_FILE_URL_' +
                this.emitFile({
                  name: fileName,
                  type: 'asset',
                  source: content
                })
            }
            debug(
              `url(${rawUrl}) -> ${
                url!.startsWith('data:') ? `base64 inlined` : `${file}`
              }`
            )
            return url!
          })
        }

        styles.set(id, css)
        return {
          code: modules
            ? dataToEsm(modules, { namedExports: true })
            : (ctx.cssCodeSplit
                ? // If code-splitting CSS, inject a fake marker to avoid the module
                  // from being tree-shaken. This preserves the .css file as a
                  // module in the chunk's metadata so that we can retrieve them in
                  // renderChunk.
                  `${cssInjectionMarker}()\n`
                : ``) + `export default ${JSON.stringify(css)}`,
          map: null,
          // #795 css always has side effect
          moduleSideEffects: true
        }
      }
    },

    async renderChunk(code, chunk) {
      let chunkCSS = ''
      // the order of module import is reversive
      // see https://github.com/rollup/rollup/issues/435#issue-125406562
      const ids = Object.keys(chunk.modules).reverse()
      for (const id of ids) {
        if (styles.has(id)) {
          chunkCSS += styles.get(id)
        }
      }

      let match
      while ((match = injectAssetRe.exec(chunkCSS))) {
        const basedAssetPath = ctx.getBasedAssetPath(this.getFileName(match[1]))
        chunkCSS = chunkCSS.replace(match[0], basedAssetPath)
      }

      if (ctx.cssCodeSplit) {
        code = code.replace(cssInjectionRE, '')
        if (!code.trim()) {
          // this is a shared CSS-only chunk that is empty.
          emptyChunks.add(chunk.fileName)
        }
        // for each dynamic entry chunk, collect its css and inline it as JS
        // strings.
        if (chunk.isDynamicEntry && chunkCSS) {
          chunkCSS = minifyCSS(chunkCSS)
          code =
            `let ${cssInjectionMarker} = document.createElement('style');` +
            `${cssInjectionMarker}.innerHTML = ${JSON.stringify(chunkCSS)};` +
            `document.head.appendChild(${cssInjectionMarker});` +
            code
        } else {
          staticCss += chunkCSS
        }
        return {
          code,
          map: null
        }
      } else {
        staticCss += chunkCSS
        return null
      }
    },

    async generateBundle(_options, bundle) {
      // minify css
      if (ctx.minify && staticCss) {
        staticCss = minifyCSS(staticCss)
      }

      // remove empty css chunks and their imports
      if (emptyChunks.size) {
        emptyChunks.forEach((fileName) => {
          delete bundle[fileName]
        })
        const emptyChunkFiles = [...emptyChunks].join('|').replace(/\./g, '\\.')
        const emptyChunkRE = new RegExp(
          `\\bimport\\s*"[^"]*(?:${emptyChunkFiles})";\n?`,
          'g'
        )
        for (const file in bundle) {
          const chunk = bundle[file]
          if (chunk.type === 'chunk') {
            chunk.code = chunk.code.replace(emptyChunkRE, '')
          }
        }
      }

      if (staticCss) {
        this.emitFile({
          name: 'style.css',
          type: 'asset',
          source: staticCss
        })
      }
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
    process.exit(1)
  }

  if (res.warnings && res.warnings.length) {
    console.error(chalk.yellow(`[vite] warnings when minifying css:`))
    console.error(res.warnings)
  }

  return res.styles
}
