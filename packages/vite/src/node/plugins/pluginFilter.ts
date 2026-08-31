import path from 'node:path'
import picomatch from 'picomatch'
import type { ModuleTypeFilter } from 'rolldown'
import { slash } from '../../shared/utils'
import { arraify } from '../utils'

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

const EXTGLOB_PREFIX_CHARS = '@+*?!'

/**
 * picomatch compiles unescaped `()` as regex capturing groups (and `|` as
 * alternation), so `*.(js)` matches `foo.js`. Rolldown's `fast_glob` treats
 * bare `()` as literals. Escape those groups so dev hook filters match
 * build. Leave extglobs (`@()`, `!()`, `?()`, `+()`, `*()`) unchanged.
 */
function escapeBareParentheses(glob: string): string {
  let result = ''
  const groupIsExtglob: boolean[] = []
  let lastWasEscaped = false

  for (let i = 0; i < glob.length; i++) {
    const char = glob[i]!

    if (char === '\\' && i + 1 < glob.length) {
      result += char + glob[++i]
      lastWasEscaped = true
      continue
    }

    if (char === '(') {
      const prev = i > 0 ? glob[i - 1] : undefined
      const isExtglob =
        !lastWasEscaped &&
        prev !== undefined &&
        EXTGLOB_PREFIX_CHARS.includes(prev)
      groupIsExtglob.push(isExtglob)
      result += isExtglob ? '(' : '\\('
      lastWasEscaped = false
      continue
    }

    if (char === ')') {
      const isExtglob = groupIsExtglob.pop() ?? false
      result += isExtglob ? ')' : '\\)'
      lastWasEscaped = false
      continue
    }

    if (char === '|') {
      const insideExtglob = groupIsExtglob.at(-1) === true
      result += insideExtglob ? '|' : '\\|'
      lastWasEscaped = false
      continue
    }

    result += char
    lastWasEscaped = false
  }

  return result
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

  const glob = escapeBareParentheses(getMatcherString(pattern, cwd))
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
