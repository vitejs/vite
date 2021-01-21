import { compileScript, SFCDescriptor, SFCScriptBlock } from '@vue/compiler-sfc'
import { ResolvedOptions } from '.'
import { resolveTemplateCompilerOptions } from './template'

// ssr and non ssr builds would output different script content
const clientCache = new WeakMap<SFCDescriptor, SFCScriptBlock | null>()
const ssrCache = new WeakMap<SFCDescriptor, SFCScriptBlock | null>()

export function getResolvedScript(
  descriptor: SFCDescriptor,
  ssr: boolean
): SFCScriptBlock | null | undefined {
  return (ssr ? ssrCache : clientCache).get(descriptor)
}

export function setResolvedScript(
  descriptor: SFCDescriptor,
  script: SFCScriptBlock,
  ssr: boolean
) {
  ;(ssr ? ssrCache : clientCache).set(descriptor, script)
}

export function resolveScript(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  ssr: boolean
) {
  if (!descriptor.script && !descriptor.scriptSetup) {
    return null
  }

  const cacheToUse = ssr ? ssrCache : clientCache
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
    templateOptions: resolveTemplateCompilerOptions(descriptor, options, ssr)
  })

  cacheToUse.set(descriptor, resolved)
  return resolved
}
