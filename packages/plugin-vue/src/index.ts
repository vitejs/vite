import fs from 'fs'
import type { Plugin, ViteDevServer } from 'vite'
import { createFilter } from '@rollup/pluginutils'
/* eslint-disable import/no-duplicates */
import type {
  SFCBlock,
  SFCScriptCompileOptions,
  SFCStyleCompileOptions,
  SFCTemplateCompileOptions
} from 'vue/compiler-sfc'
import type * as _compiler from 'vue/compiler-sfc'
/* eslint-enable import/no-duplicates */
import { resolveCompiler } from './compiler'
import { parseVueRequest } from './utils/query'
import { getDescriptor, getSrcDescriptor } from './utils/descriptorCache'
import { getResolvedScript } from './script'
import { transformMain } from './main'
import { handleHotUpdate } from './handleHotUpdate'
import { transformTemplateAsModule } from './template'
import { transformStyle } from './style'
import { EXPORT_HELPER_ID, helperCode } from './helper'

export { parseVueRequest } from './utils/query'
export type { VueQuery } from './utils/query'

export interface Options {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]

  isProduction?: boolean

  // options to pass on to vue/compiler-sfc
  script?: Partial<SFCScriptCompileOptions>
  template?: Partial<SFCTemplateCompileOptions>
  style?: Partial<SFCStyleCompileOptions>

  /**
   * Transform Vue SFCs into custom elements.
   * - `true`: all `*.vue` imports are converted into custom elements
   * - `string | RegExp`: matched files are converted into custom elements
   *
   * @default /\.ce\.vue$/
   */
  customElement?: boolean | string | RegExp | (string | RegExp)[]

  /**
   * Enable Vue reactivity transform (experimental).
   * https://github.com/vuejs/core/tree/master/packages/reactivity-transform
   * - `true`: transform will be enabled for all vue,js(x),ts(x) files except
   *           those inside node_modules
   * - `string | RegExp`: apply to vue + only matched files (will include
   *                      node_modules, so specify directories in necessary)
   * - `false`: disable in all cases
   *
   * @default false
   */
  reactivityTransform?: boolean | string | RegExp | (string | RegExp)[]

  /**
   * Use custom compiler-sfc instance. Can be used to force a specific version.
   */
  compiler?: typeof _compiler
}

export interface ResolvedOptions extends Options {
  compiler: typeof _compiler
  root: string
  sourceMap: boolean
  cssDevSourcemap: boolean
  devServer?: ViteDevServer
  devToolsEnabled?: boolean
}

export default function vuePlugin(rawOptions: Options = {}): Plugin {
  const {
    include = /\.vue$/,
    exclude,
    customElement = /\.ce\.vue$/,
    reactivityTransform = false
  } = rawOptions

  const filter = createFilter(include, exclude)

  const customElementFilter =
    typeof customElement === 'boolean'
      ? () => customElement
      : createFilter(customElement)

  const refTransformFilter =
    reactivityTransform === false
      ? () => false
      : reactivityTransform === true
      ? createFilter(/\.(j|t)sx?$/, /node_modules/)
      : createFilter(reactivityTransform)

  let options: ResolvedOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    compiler: null as any, // to be set in buildStart
    ...rawOptions,
    include,
    exclude,
    customElement,
    reactivityTransform,
    root: process.cwd(),
    sourceMap: true,
    cssDevSourcemap: false,
    devToolsEnabled: process.env.NODE_ENV !== 'production'
  }

  // Temporal handling for 2.7 breaking change
  const isSSR = (opt: { ssr?: boolean } | boolean | undefined) =>
    opt === undefined
      ? false
      : typeof opt === 'boolean'
      ? opt
      : opt?.ssr === true

  return {
    name: 'vite:vue',

    handleHotUpdate(ctx) {
      if (!filter(ctx.file)) {
        return
      }
      return handleHotUpdate(ctx, options)
    },

    config(config) {
      return {
        define: {
          __VUE_OPTIONS_API__: config.define?.__VUE_OPTIONS_API__ ?? true,
          __VUE_PROD_DEVTOOLS__: config.define?.__VUE_PROD_DEVTOOLS__ ?? false
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
        sourceMap: config.command === 'build' ? !!config.build.sourcemap : true,
        cssDevSourcemap: config.css?.devSourcemap ?? false,
        isProduction: config.isProduction,
        devToolsEnabled:
          !!config.define!.__VUE_PROD_DEVTOOLS__ || !config.isProduction
      }
    },

    configureServer(server) {
      options.devServer = server
    },

    buildStart() {
      options.compiler = options.compiler || resolveCompiler(options.root)
    },

    async resolveId(id) {
      // component export helper
      if (id === EXPORT_HELPER_ID) {
        return id
      }
      // serve sub-part requests (*?vue) as virtual modules
      if (parseVueRequest(id).query.vue) {
        return id
      }
    },

    load(id, opt) {
      const ssr = isSSR(opt)
      if (id === EXPORT_HELPER_ID) {
        return helperCode
      }

      const { filename, query } = parseVueRequest(id)
      // select corresponding block for sub-part virtual modules
      if (query.vue) {
        if (query.src) {
          return fs.readFileSync(filename, 'utf-8')
        }
        const descriptor = getDescriptor(filename, options)!
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

    transform(code, id, opt) {
      const ssr = isSSR(opt)
      const { filename, query } = parseVueRequest(id)
      if (query.raw) {
        return
      }
      if (!filter(filename) && !query.vue) {
        if (
          !query.vue &&
          refTransformFilter(filename) &&
          options.compiler.shouldTransformRef(code)
        ) {
          return options.compiler.transformRef(code, {
            filename,
            sourceMap: true
          })
        }
        return
      }

      if (!query.vue) {
        // main request
        return transformMain(
          code,
          filename,
          options,
          this,
          ssr,
          customElementFilter(filename)
        )
      } else {
        // sub block request
        const descriptor = query.src
          ? getSrcDescriptor(filename, query)!
          : getDescriptor(filename, options)!

        if (query.type === 'template') {
          return transformTemplateAsModule(code, descriptor, options, this, ssr)
        } else if (query.type === 'style') {
          return transformStyle(
            code,
            descriptor,
            Number(query.index),
            options,
            this,
            filename
          )
        }
      }
    }
  }
}
