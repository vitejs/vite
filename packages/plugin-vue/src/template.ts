import {
  compileTemplate,
  SFCDescriptor,
  SFCTemplateCompileOptions
} from '@vue/compiler-sfc'
import { PluginContext, TransformPluginContext } from 'rollup'
import { ResolvedOptions } from '.'
import { getResolvedScript } from './script'
import { createRollupError } from './utils/error'

export function transformTemplateAsModule(
  code: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const result = compile(code, descriptor, options, pluginContext)

  let returnCode = result.code
  if (options.devServer) {
    returnCode += `\nimport.meta.hot.accept(({ render }) => {
      __VUE_HMR_RUNTIME__.rerender(${JSON.stringify(descriptor.id)}, render)
    })`
  }

  return {
    code: returnCode,
    map: result.map as any
  }
}

/**
 * transform the template directly in the main SFC module
 */
export function transformTemplateInMain(
  code: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: PluginContext
) {
  const result = compile(code, descriptor, options, pluginContext)
  return {
    ...result,
    code: result.code.replace(
      /\nexport (function|const) (render|ssrRender)/,
      '\n$1 _sfc_$2'
    )
  }
}

export function compile(
  code: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: PluginContext
) {
  const filename = descriptor.filename
  const result = compileTemplate({
    ...getTemplateCompilerOptions(descriptor, options)!,
    source: code
  })

  if (result.errors.length) {
    result.errors.forEach((error) =>
      pluginContext.error(
        typeof error === 'string'
          ? { id: filename, message: error }
          : createRollupError(filename, error)
      )
    )
  }

  if (result.tips.length) {
    result.tips.forEach((tip) =>
      pluginContext.warn({
        id: filename,
        message: tip
      })
    )
  }

  return result
}

export function getTemplateCompilerOptions(
  descriptor: SFCDescriptor,
  options: ResolvedOptions
): Omit<SFCTemplateCompileOptions, 'source'> | undefined {
  const block = descriptor.template
  if (!block) {
    return
  }
  const resolvedScript = getResolvedScript(descriptor, options.ssr)
  const hasScoped = descriptor.styles.some((s) => s.scoped)
  return {
    ...options.template,
    id: descriptor.id,
    scoped: hasScoped,
    isProd: options.isProduction,
    filename: descriptor.filename,
    inMap: block.src ? undefined : block.map,
    ssr: options.ssr,
    ssrCssVars: descriptor.cssVars,
    transformAssetUrls: options.template?.transformAssetUrls,
    compilerOptions: {
      ...options.template?.compilerOptions,
      scopeId: hasScoped ? `data-v-${descriptor.id}` : undefined,
      bindingMetadata: resolvedScript ? resolvedScript.bindings : undefined
    }
  }
}
