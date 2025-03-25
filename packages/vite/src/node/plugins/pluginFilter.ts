import path from 'node:path'
import picomatch from 'picomatch'
import { arraify } from '../utils'
import { slash } from '../../shared/utils'

export const FALLBACK_TRUE = 1
export const FALLBACK_FALSE = 0
type FallbackValues = typeof FALLBACK_TRUE | typeof FALLBACK_FALSE

export type PluginFilter = (input: string) => boolean
export type PluginFilterWithFallback = (
  input: string,
) => boolean | FallbackValues
export type TransformHookFilter = (id: string, code: string) => boolean

export type StringFilter =
  | string
  | RegExp
  | Array<string | RegExp>
  | {
      include?: string | RegExp | Array<string | RegExp>
      exclude?: string | RegExp | Array<string | RegExp>
    }

type NormalizedStringFilter = {
  include?: Array<string | RegExp>
  exclude?: Array<string | RegExp>
}

function patternToIdFilter(pattern: string | RegExp): PluginFilter {
  if (pattern instanceof RegExp) {
    return (id: string) => {
      const normalizedId = slash(id)
      const result = pattern.test(normalizedId)
      pattern.lastIndex = 0
      return result
    }
  }

  const cwd = process.cwd()
  const matcher = picomatch(pattern, { dot: true })
  return (id: string) => {
    const normalizedId = slash(path.relative(cwd, id))
    return matcher(normalizedId)
  }
}

function patternToCodeFilter(pattern: string | RegExp): PluginFilter {
  if (pattern instanceof RegExp) {
    return (code: string) => {
      const result = pattern.test(code)
      pattern.lastIndex = 0
      return result
    }
  }
  return (code: string) => code.includes(pattern)
}

function createFilter(
  exclude: Array<PluginFilter> | undefined,
  include: Array<PluginFilter> | undefined,
): PluginFilterWithFallback | undefined {
  if (!exclude && !include) {
    return
  }

  return (input) => {
    if (exclude?.some((filter) => filter(input))) {
      return false
    }
    if (include?.some((filter) => filter(input))) {
      return true
    }
    return !!include && include.length > 0 ? FALLBACK_FALSE : FALLBACK_TRUE
  }
}

function normalizeFilter(filter: StringFilter): NormalizedStringFilter {
  if (typeof filter === 'string' || filter instanceof RegExp) {
    return {
      include: [filter],
    }
  }
  if (Array.isArray(filter)) {
    return {
      include: arraify(filter),
    }
  }
  return {
    include: filter.include ? arraify(filter.include) : undefined,
    exclude: filter.exclude ? arraify(filter.exclude) : undefined,
  }
}

export function createIdFilter(
  filter: StringFilter | undefined,
): PluginFilterWithFallback | undefined {
  if (!filter) return
  const { exclude, include } = normalizeFilter(filter)
  const excludeFilter = exclude?.map(patternToIdFilter)
  const includeFilter = include?.map(patternToIdFilter)
  return createFilter(excludeFilter, includeFilter)
}

export function createCodeFilter(
  filter: StringFilter | undefined,
): PluginFilterWithFallback | undefined {
  if (!filter) return
  const { exclude, include } = normalizeFilter(filter)
  const excludeFilter = exclude?.map(patternToCodeFilter)
  const includeFilter = include?.map(patternToCodeFilter)
  return createFilter(excludeFilter, includeFilter)
}

export function createFilterForTransform(
  idFilter: StringFilter | undefined,
  codeFilter: StringFilter | undefined,
): TransformHookFilter | undefined {
  if (!idFilter && !codeFilter) return
  const idFilterFn = createIdFilter(idFilter)
  const codeFilterFn = createCodeFilter(codeFilter)
  return (id, code) => {
    let fallback = true
    if (idFilterFn) {
      const idResult = idFilterFn(id)
      if (typeof idResult === 'boolean') {
        return idResult
      }
      fallback &&= !!idResult
    }
    if (codeFilterFn) {
      const codeResult = codeFilterFn(code)
      if (typeof codeResult === 'boolean') {
        return codeResult
      }
      fallback &&= !!codeResult
    }
    return fallback
  }
}
