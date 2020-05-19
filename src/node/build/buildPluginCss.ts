import path from 'path'
import { Plugin } from 'rollup'
import { resolveAsset, registerAssets } from './buildPluginAsset'
import { loadPostcssConfig, parseWithQuery } from '../utils'
import { Transform } from '../config'
import hash_sum from 'hash-sum'
import { rewriteCssUrls } from '../utils/cssUtils'

const debug = require('debug')('vite:build:css')

const urlRE = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/

export const createBuildCssPlugin = (
  root: string,
  publicBase: string,
  assetsDir: string,
  minify = false,
  inlineLimit = 0,
  transforms: Transform[] = []
): Plugin => {
  const styles: Map<string, string> = new Map()
  const assets = new Map<string, Buffer>()
  transforms = transforms.filter((t) => t.as === 'css')

  return {
    name: 'vite:css',
    async transform(css: string, id: string) {
      let transformed = false

      if (transforms.length) {
        const { path, query } = parseWithQuery(id)
        for (const t of transforms) {
          if (t.test(path, query)) {
            css = await t.transform(css, true)
            transformed = true
            break
          }
        }
      }

      if (transformed || id.endsWith('.css')) {
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
                      generateScopedName: `[local]_${hash_sum(id)}`,
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
        return {
          code: modules
            ? `export default ${JSON.stringify(modules)}`
            : '/* css extracted by vite */',
          map: null
        }
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

      const cssFileName = `style.${hash_sum(css)}.css`

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
