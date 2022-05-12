import type { SFCDescriptor, SFCScriptBlock } from 'vue/compiler-sfc'
import { resolveTemplateCompilerOptions } from './template'
import type { ResolvedOptions } from '.'

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
): void {
  ;(ssr ? ssrCache : clientCache).set(descriptor, script)
}

// Check if we can use compile template as inlined render function
// inside <script setup>. This can only be done for build because
// inlined template cannot be individually hot updated.
export function isUseInlineTemplate(
  descriptor: SFCDescriptor,
  isProd: boolean
): boolean {
  return isProd && !!descriptor.scriptSetup && !descriptor.template?.src
}

export function resolveScript(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  ssr: boolean
): SFCScriptBlock | null {
  if (!descriptor.script && !descriptor.scriptSetup) {
    return null
  }

  const cacheToUse = ssr ? ssrCache : clientCache
  const cached = cacheToUse.get(descriptor)
  if (cached) {
    return cached
  }

  let resolved: SFCScriptBlock | null = null

  resolved = options.compiler.compileScript(descriptor, {
    ...options.script,
    id: descriptor.id,
    isProd: options.isProduction,
    inlineTemplate: isUseInlineTemplate(descriptor, !options.devServer),
    reactivityTransform: options.reactivityTransform !== false,
    templateOptions: resolveTemplateCompilerOptions(descriptor, options, ssr),
    sourceMap: options.sourceMap
  })

  cacheToUse.set(descriptor, resolved)
  return resolved
}
