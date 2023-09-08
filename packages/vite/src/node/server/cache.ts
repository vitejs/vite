import type { ModuleNode } from './moduleGraph.js'

export interface CacheLoadReadResult {
  code: string
  map?: any
}

export interface CacheLoadWriteData {
  cacheKey: string
  id: string
  file: string
  url: string
  code: string
  map?: any
  mod?: ModuleNode | null
  ssr: boolean
}

export interface CacheTransformReadResult {
  code: string
  map?: any
  importedModules?: Set<string>
  importedBindings?: Map<string, Set<string>> | null
  acceptedModules?: Set<string>
  acceptedExports?: Set<string>
  isSelfAccepting?: boolean
}

export interface CacheTransformWriteData {
  cacheKey: string
  id: string
  file: string
  url: string
  code: string
  map?: any
  mod?: ModuleNode | null
  ssr: boolean
}
