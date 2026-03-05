import path from 'node:path'
import picomatch from 'picomatch'
import type { ModuleTypeFilter } from 'rolldown'
import { arraify } from '../utils'
import { slash } from '../../shared/utils'

export type PluginFilter = (input: string) => boolean
export type TransformHookFilter = (
  id: string,
  code: string,
  moduleType: string,
) => boolean

export type StringFilter<Value = string | RegExp> =
  | Value
  | Array<Value>
  | {
      include?: Value | Array<Value>
      exclude?: Value | Array<Value>
    }

type NormalizedStringFilter = {
  include?: Array<string | RegExp>
  exclude?: Array<string | RegExp>
}

function getMatcherString(glob: string, cwd: string) {
  if (glob.startsWith('**') || path.isAbsolute(glob)) {
    return slash(glob)
  }

  const resolved = path.join(cwd, glob)
  return slash(resolved)
}

function patternToIdFilter(
  pattern: string | RegExp,
  cwd: string,
): PluginFilter {
  if (pattern instanceof RegExp) {
    return (id: string) => {
      const normalizedId = slash(id)
      const result = pattern.test(normalizedId)
      pattern.lastIndex = 0
      return result
    }
  }

  const glob = getMatcherString(pattern, cwd)
  const matcher = picomatch(glob, { dot: true })
  return (id: string) => {
    const normalizedId = slash(id)
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
): PluginFilter | undefined {
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
    return !(include && include.length > 0)
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
      include: filter,
    }
  }
  return {
    include: filter.include ? arraify(filter.include) : undefined,
    exclude: filter.exclude ? arraify(filter.exclude) : undefined,
  }
}

export function createIdFilter(
  filter: StringFilter | undefined,
  cwd: string = process.cwd(),
): PluginFilter | undefined {
  if (!filter) return
  const { exclude, include } = normalizeFilter(filter)
  const excludeFilter = exclude?.map((p) => patternToIdFilter(p, cwd))
  const includeFilter = include?.map((p) => patternToIdFilter(p, cwd))
  return createFilter(excludeFilter, includeFilter)
}

export function createCodeFilter(
  filter: StringFilter | undefined,
): PluginFilter | undefined {
  if (!filter) return
  const { exclude, include } = normalizeFilter(filter)
  const excludeFilter = exclude?.map(patternToCodeFilter)
  const includeFilter = include?.map(patternToCodeFilter)
  return createFilter(excludeFilter, includeFilter)
}

function createModuleTypeFilter(
  filter: ModuleTypeFilter | undefined,
): PluginFilter | undefined {
  if (!filter) return
  const include = Array.isArray(filter) ? filter : (filter.include ?? [])
  return (moduleType: string) => include.includes(moduleType)
}

export function createFilterForTransform(
  idFilter: StringFilter | undefined,
  codeFilter: StringFilter | undefined,
  moduleTypeFilter: ModuleTypeFilter | undefined,
  cwd?: string,
): TransformHookFilter | undefined {
  if (!idFilter && !codeFilter && !moduleTypeFilter) return
  const idFilterFn = createIdFilter(idFilter, cwd)
  const codeFilterFn = createCodeFilter(codeFilter)
  const moduleTypeFilterFn = createModuleTypeFilter(moduleTypeFilter)
  return (id, code, moduleType) => {
    let fallback = moduleTypeFilterFn?.(moduleType) ?? true
    if (!fallback) {
      return false
    }

    if (idFilterFn) {
      fallback &&= idFilterFn(id)
    }
    if (!fallback) {
      return false
    }

    if (codeFilterFn) {
      fallback &&= codeFilterFn(code)
    }
    return fallback
  }
}
