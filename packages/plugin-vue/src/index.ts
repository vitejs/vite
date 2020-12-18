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
import { getDescriptor, setDescriptor } from './utils/descriptorCache'
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

    handleHotUpdate,

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
      const { filename, query } = parseVueRequest(id)
      // serve subpart requests (*?vue) as virtual modules
      if (query.vue) {
        if (query.src) {
          const resolved = await this.resolve(filename, importer, {
            skipSelf: true
          })
          if (resolved) {
            // associate this imported file to the importer SFC's descriptor
            // so that we can retrieve it in transform()
            setDescriptor(resolved.id, getDescriptor(importer!))
            const [, originalQuery] = id.split('?', 2)
            resolved.id += `?${originalQuery}`
            return resolved
          }
        } else if (!filter(filename)) {
          return null
        }
        return id
      }
    },

    load(id) {
      const { filename, query } = parseVueRequest(id)
      if (!filter(filename)) {
        return
      }
      // serve subpart virtual modules
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
        } else if (query.index) {
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
      if (!filter(filename)) {
        return
      }

      if (!query.vue) {
        // main request
        return transformMain(code, filename, options, this)
      }

      if (query.vue) {
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
