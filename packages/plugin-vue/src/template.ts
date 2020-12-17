import path from 'path'
import slash from 'slash'
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
  const { id, filename, cssVars } = descriptor

  let transformAssetUrls = options.template?.transformAssetUrls
  // inject vite base so that @vue/compiler-sfc can transform relative paths
  // directly to absolute paths without incurring an extra import request
  if (filename.startsWith(options.root)) {
    // TODO account for vite base config
    const base =
      '/' + slash(path.relative(options.root, path.dirname(filename)))
    if (transformAssetUrls && typeof transformAssetUrls === 'object') {
      // presence of array fields means this is raw tags config
      if (
        Object.keys(transformAssetUrls).some((key) =>
          Array.isArray((transformAssetUrls as any)[key])
        )
      ) {
        transformAssetUrls = { base, tags: transformAssetUrls } as any
      } else {
        transformAssetUrls = { ...transformAssetUrls, base }
      }
    } else {
      transformAssetUrls = { base }
    }
  }

  return {
    ...options.template,
    id,
    filename,
    scoped: hasScoped,
    isProd: options.isProduction,
    inMap: block.src ? undefined : block.map,
    ssr: options.ssr,
    ssrCssVars: cssVars,
    transformAssetUrls,
    preprocessLang: block.lang,
    preprocessOptions: block.lang && options.template?.preprocessOptions,
    compilerOptions: {
      ...options.template?.compilerOptions,
      scopeId: hasScoped ? `data-v-${id}` : undefined,
      bindingMetadata: resolvedScript ? resolvedScript.bindings : undefined
    }
  }
}
