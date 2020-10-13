import { resolver } from './resolver'
import { vuePlugin, setVueCompilerOptions } from './serverPlugin'
import { TemplateCompileOptions } from '@vue/component-compiler-utils/lib/compileTemplate'
import { VuePluginOptions } from 'rollup-plugin-vue'
import { jsxTransform } from './jsxTransform'

export interface VueViteOptions {
  /**
   * The options for `@vue/component-compiler-utils`.
   */
  vueTemplateOptions?: TemplateCompileOptions
  /**
   * The options for `rollup-plugin-vue`.
   */
  rollupPluginVueOptions?: VuePluginOptions
  /**
   * The options for jsx transform
   * @default false
   */
  jsx?: boolean
}

export function createVuePlugin(options: VueViteOptions = {}) {
  const { vueTemplateOptions, rollupPluginVueOptions, jsx } = options
  if (vueTemplateOptions) {
    setVueCompilerOptions(vueTemplateOptions)
  }

  return {
    resolvers: [resolver],
    transforms: [jsxTransform],
    // if set truly `jsx` option, should disabled esbuild
    enableEsbuild: !jsx,
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
