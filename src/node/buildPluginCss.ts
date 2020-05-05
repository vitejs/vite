import path from 'path'
import { Plugin } from 'rollup'
import {
  AssetsOptions,
  getAssetPublicPath,
  registerAssets
} from './buildPluginAsset'
import { loadPostcssConfig } from './config'
import { isExternalUrl } from './utils'

const debug = require('debug')('vite:css')

const urlRE = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/

export const createBuildCssPlugin = (
  root: string,
  assetsDir: string,
  cssFileName: string,
  minify: boolean,
  assetsOptions: AssetsOptions
): Plugin => {
  const styles: Map<string, string> = new Map()
  const assets = new Map()

  return {
    name: 'vite:css',
    async transform(css: string, id: string) {
      if (id.endsWith('.css')) {
        // process url() - register referenced files as assets
        // and rewrite the url to the resolved public path
        if (urlRE.test(css)) {
          const fileDir = path.dirname(id)
          let match
          let remaining = css
          let rewritten = ''
          while ((match = urlRE.exec(remaining))) {
            rewritten += remaining.slice(0, match.index)
            const [matched, before, rawUrl, after] = match
            if (isExternalUrl(rawUrl)) {
              rewritten += matched
              remaining = remaining.slice(match.index + matched.length)
              return
            }

            const file = path.join(fileDir, rawUrl)
            const { fileName, content, url } = await getAssetPublicPath(
              file,
              assetsDir,
              assetsOptions
            )
            assets.set(fileName, content)
            debug(`url(${rawUrl}) -> url(${url})`)
            rewritten += `${before}${url}${after}`
            remaining = remaining.slice(match.index + matched.length)
          }
          css = rewritten + remaining
        }

        // postcss
        let modules
        const postcssConfig = await loadPostcssConfig(root)
        const expectsModule = id.endsWith('.module.css')
        if (postcssConfig || expectsModule) {
          try {
            const result = await require('postcss')([
              ...((postcssConfig && postcssConfig.plugins) || []),
              ...(expectsModule
                ? [
                    require('postcss-modules')({
                      getJSON(_: string, json: Record<string, string>) {
                        modules = json
                      }
                    })
                  ]
                : [])
            ]).process(css, {
              ...(postcssConfig && postcssConfig.options),
              from: id
            })
            css = result.css
          } catch (e) {
            console.error(`[vite] error applying postcss transforms: `, e)
          }
        }

        styles.set(id, css)
        return modules
          ? `export default ${JSON.stringify(modules)}`
          : '/* css extracted by vite */'
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
        css = (
          await require('postcss')([require('cssnano')]).process(css, {
            from: undefined
          })
        ).css
      }

      bundle[cssFileName] = {
        isAsset: true,
        type: 'asset',
        fileName: cssFileName,
        source: css
      }

      registerAssets(assets, bundle)
    }
  }
}
