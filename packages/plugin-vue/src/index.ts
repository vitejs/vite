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

export interface Options {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]

  ssr?: boolean
  isProduction?: boolean

  // options to pass on to @vue/compiler-sfc
  script?: SFCScriptCompileOptions
  template?: SFCTemplateCompileOptions
  style?: SFCStyleCompileOptions
}

export interface ResolvedOptions extends Options {
  root: string
  devServer?: ViteDevServer
}

export default function vuePlugin(rawOptions: Options = {}): Plugin {
  let options: ResolvedOptions = {
    ssr: false,
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

    handleHotUpdate(file, mods, read, server) {
      if (!filter(file)) {
        return
      }
      return handleHotUpdate(file, mods, read, server)
    },

    config(config) {
      // provide default values for vue runtime esm defines
      config.define = {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        ...config.define
      }
    },

    configResolved(config) {
      options = {
        ...options,
        root: config.root,
        isProduction: config.isProduction,
        ssr: !!config.build.ssr
      }
    },

    configureServer(server) {
      options.devServer = server
    },

    async resolveId(id, importer) {
      // serve subpart requests (*?vue) as virtual modules
      if (parseVueRequest(id).query.vue) {
        return id
      }
    },

    load(id) {
      const { filename, query } = parseVueRequest(id)
      // select corresponding block for subpart virtual modules
      if (query.vue) {
        if (query.src) {
          return fs.readFileSync(filename, 'utf-8')
        }
        const descriptor = getDescriptor(filename)
        let block: SFCBlock | null | undefined
        if (query.type === 'script') {
          // handle <scrip> + <script setup> merge via compileScript()
          block = getResolvedScript(descriptor, options.ssr)
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

    transform(code, id) {
      const { filename, query } = parseVueRequest(id)
      if (!query.vue && !filter(filename)) {
        return
      }

      if (!query.vue) {
        // main request
        return transformMain(code, filename, options, this)
      } else {
        // sub block request
        const descriptor = getDescriptor(filename)
        if (query.type === 'template') {
          return transformTemplateAsModule(code, descriptor, options, this)
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
