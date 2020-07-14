import { resolver } from './resolver'
import { vuePlugin, setVueCompilerOptions } from './serverPlugin'
import { TemplateCompileOptions } from '@vue/component-compiler-utils/lib/compileTemplate'
import { VuePluginOptions } from 'rollup-plugin-vue'

export interface VueViteOptions {
  /**
   * The options for `@vue/component-compiler-utils`.
   */
  vueTemplateOptions?: TemplateCompileOptions
  /**
   * The options for `rollup-plugin-vue`.
   */
  rollupPluginVueOptions?: VuePluginOptions
}

export function createVuePlugin(options: VueViteOptions = {}) {
  const { vueTemplateOptions, rollupPluginVueOptions } = options
  if (vueTemplateOptions) {
    setVueCompilerOptions(vueTemplateOptions)
  }

  return {
    resolvers: [resolver],
    configureServer: vuePlugin,
    enableRollupPluginVue: false,
    rollupInputOptions: {
      plugins: [
        require('rollup-plugin-vue')({
          ...rollupPluginVueOptions,
          compiler: vueTemplateOptions && vueTemplateOptions.compiler,
        }),
      ],
    },
  }
}
