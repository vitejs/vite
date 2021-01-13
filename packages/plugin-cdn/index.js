// @ts-check
const fetch = require('node-fetch').default
const { init, parse } = require('es-module-lexer')
const MagicString = require('magic-string').default

const providers = {
  skypack: ['https://cdn.skypack.dev/'],
  'esm.run': ['https://cdn.jsdelivr.net/', 'npm/', '/+esm'],
  jspm: ['https://jspm.dev/']
}

/**
 * @type {import('.').default}
 */
function cdnPlugin(provider, include = {}) {
  if (!(provider in providers)) {
    throw new Error(
      `Unsupported provider: ${provider}. Supported providers: ${Object.keys(
        providers
      ).join(', ')}`
    )
  }

  const [base, prefix = '', postfix = ''] = providers[provider]
  let isBuild = false
  let needSourcemap = true

  return {
    name: 'cdn-bundle',
    enforce: 'pre',

    config() {
      return {
        alias: Object.keys(include).map((id) => ({
          find: id,
          replacement: `${base}${prefix}${id}@${include[id]}${postfix}`
        }))
      }
    },

    configResolved(config) {
      isBuild = config.command === 'build'
      needSourcemap = isBuild ? !!config.build.sourcemap : true
    },

    resolveId(id) {
      if (id.startsWith(base)) {
        return id
      }
    },

    async load(id) {
      if (isBuild && id.startsWith(base)) {
        const src = await (await fetch(id)).text()
        await init
        let imports
        try {
          imports = parse(src)[0]
        } catch (e) {
          const err = new Error(`failed to parse external request ${id}.`)
          this.error(err, e.idx)
        }
        if (!imports.length) {
          return src
        }

        /**
         * @type {MagicString | undefined}
         */
        let s
        const ss = () => s || (s = new MagicString(src))
        for (let index = 0; index < imports.length; index++) {
          const { s: start, e: end, d: dynamicIndex } = imports[index]
          let url = src.slice(start, end)

          let isLiteralDynamic = false
          if (dynamicIndex >= 0) {
            url = url.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '').trim()
            const literalIdMatch = url.match(/^'([^']+)'|"([^"]+)"$/)
            if (literalIdMatch) {
              isLiteralDynamic = true
              url = literalIdMatch[1] || literalIdMatch[2]
            }
          }

          if (url.startsWith('/')) {
            url = base + url.slice(1)
            ss().overwrite(start, end, isLiteralDynamic ? `"${url}"` : url)
          }
        }

        if (s) {
          return {
            code: s.toString(),
            map: needSourcemap ? s.generateMap({ hires: true }) : null
          }
        } else {
          return src
        }
      }
    }
  }
}

module.exports = cdnPlugin
cdnPlugin.default = cdnPlugin
