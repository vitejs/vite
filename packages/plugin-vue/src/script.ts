import { compileScript, SFCDescriptor, SFCScriptBlock } from '@vue/compiler-sfc'
import { ResolvedOptions } from '.'
import { resolveTemplateCompilerOptions } from './template'

// ssr and non ssr builds would output different script content
const clientCache = new WeakMap<SFCDescriptor, SFCScriptBlock | null>()
const ssrCache = new WeakMap<SFCDescriptor, SFCScriptBlock | null>()

export function getResolvedScript(
  descriptor: SFCDescriptor,
  isServer = false
): SFCScriptBlock | null | undefined {
  return (isServer ? ssrCache : clientCache).get(descriptor)
}

export function setResolvedScript(
  descriptor: SFCDescriptor,
  script: SFCScriptBlock,
  isServer = false
) {
  ;(isServer ? ssrCache : clientCache).set(descriptor, script)
}

export function resolveScript(
  descriptor: SFCDescriptor,
  options: ResolvedOptions
) {
  if (!descriptor.script && !descriptor.scriptSetup) {
    return null
  }

  const cacheToUse = options.ssr ? ssrCache : clientCache
  const cached = cacheToUse.get(descriptor)
  if (cached) {
    return cached
  }

  let resolved: SFCScriptBlock | null = null

  resolved = compileScript(descriptor, {
    ...options.script,
    id: descriptor.id,
    isProd: options.isProduction,
    inlineTemplate: !options.devServer,
    templateOptions: resolveTemplateCompilerOptions(descriptor, options)
  })

  cacheToUse.set(descriptor, resolved)
  return resolved
}
