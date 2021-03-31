try {
  require.resolve('@vue/compiler-sfc')
} catch (e) {
  throw new Error(
    '@vitejs/plugin-vue requires @vue/compiler-sfc to be present in the dependency ' +
      'tree.'
  )
}

import fs from 'fs'
import { Plugin, ViteDevServer } from 'vite'
import { createFilter } from '@rollup/pluginutils'
import {
  SFCBlock,
  SFCScriptCompileOptions,
  SFCStyleCompileOptions,
  SFCTemplateCompileOptions
} from '@vue/compiler-sfc'
import { parseVueRequest } from './utils/query'
import { getDescriptor } from './utils/descriptorCache'
import { getResolvedScript } from './script'
import { transformMain } from './main'
import { handleHotUpdate } from './handleHotUpdate'
import { transformTemplateAsModule } from './template'
import { transformStyle } from './style'

// extend the descriptor so we can store the scopeId on it
declare module '@vue/compiler-sfc' {
  interface SFCDescriptor {
    id: string
  }
}

export { parseVueRequest, VueQuery } from './utils/query'

export interface Options {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]

  isProduction?: boolean

  // options to pass on to @vue/compiler-sfc
  script?: Partial<SFCScriptCompileOptions>
  template?: Partial<SFCTemplateCompileOptions>
  style?: Partial<SFCStyleCompileOptions>
  /**
   * @deprecated the plugin now auto-detects whether it's being invoked for ssr.
   */
  ssr?: boolean
}

export interface ResolvedOptions extends Options {
  root: string
  devServer?: ViteDevServer
}

export default function vuePlugin(rawOptions: Options = {}): Plugin {
  let options: ResolvedOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    ...rawOptions,
    root: process.cwd()
  }

  const filter = createFilter(
    rawOptions.include || /\.vue$/,
    rawOptions.exclude
  )

  return {
    name: 'vite:vue',

    handleHotUpdate(ctx) {
      if (!filter(ctx.file)) {
        return
      }
      return handleHotUpdate(ctx)
    },

    config() {
      return {
        define: {
          __VUE_OPTIONS_API__: true,
          __VUE_PROD_DEVTOOLS__: false
        },
        ssr: {
          external: ['vue', '@vue/server-renderer']
        }
      }
    },

    configResolved(config) {
      options = {
        ...options,
        root: config.root,
        isProduction: config.isProduction
      }
    },

    configureServer(server) {
      options.devServer = server
    },

    async resolveId(id, importer) {
      // serve sub-part requests (*?vue) as virtual modules
      if (parseVueRequest(id).query.vue) {
        return id
      }
    },

    load(id, ssr = !!options.ssr) {
      const { filename, query } = parseVueRequest(id)
      // select corresponding block for sub-part virtual modules
      if (query.vue) {
        if (query.src) {
          return fs.readFileSync(filename, 'utf-8')
        }
        const descriptor = getDescriptor(filename)!
        let block: SFCBlock | null | undefined
        if (query.type === 'script') {
          // handle <scrip> + <script setup> merge via compileScript()
          block = getResolvedScript(descriptor, ssr)
        } else if (query.type === 'template') {
          block = descriptor.template!
        } else if (query.type === 'style') {
          block = descriptor.styles[query.index!]
        } else if (query.index != null) {
          block = descriptor.customBlocks[query.index]
        }
        if (block) {
          return {
            code: block.content,
            map: block.map as any
          }
        }
      }
    },

    transform(code, id, ssr = !!options.ssr) {
      const { filename, query } = parseVueRequest(id)
      if ((!query.vue && !filter(filename)) || query.raw) {
        return
      }

      if (!query.vue) {
        // main request
        return transformMain(code, filename, options, this, ssr)
      } else {
        // sub block request
        const descriptor = getDescriptor(filename)!
        if (query.type === 'template') {
          return transformTemplateAsModule(code, descriptor, options, this, ssr)
        } else if (query.type === 'style') {
          return transformStyle(
            code,
            descriptor,
            Number(query.index),
            options,
            this
          )
        }
      }
    }
  }
}

// overwrite for cjs require('...')() usage
module.exports = vuePlugin
vuePlugin['default'] = vuePlugin
