import { SFCBlock, compileTemplate } from '@vue/component-compiler-utils'
import * as vueTemplateCompiler from 'vue-template-compiler'
import path from 'path'
import { TransformPluginContext } from 'rollup'
import { ResolvedOptions } from './index'

export function compileSFCTemplate(
  source: string,
  block: SFCBlock,
  filename: string,
  { root, isProduction, vueTemplateOptions }: ResolvedOptions,
  pluginContext: TransformPluginContext
): string {
  const { tips, errors, code } = compileTemplate({
    source,
    filename,
    compiler: vueTemplateCompiler as any,
    transformAssetUrls: true,
    transformAssetUrlsOptions: {
      base: path.posix.dirname(path.relative(root, filename)),
    },
    isProduction,
    isFunctional: !!block.attrs.functional,
    optimizeSSR: false,
    prettify: false,
    ...vueTemplateOptions,
  })

  if (tips) {
    tips.forEach(console.warn)
  }

  // todo
  if (errors) {
    // 	errors.forEach((e) => pluginContext.error(e))
  }

  return code + `\nexport { render, staticRenderFns }`
}
