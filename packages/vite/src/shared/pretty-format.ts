/**
 * Minimal subset of @vitest/pretty-format for forwarded console objects.
 *
 * This keeps its basic/complex printer split, path-based circular reference
 * tracking, and bounded array/object traversal. It omits plugins, colors,
 * indentation, specialized collection printers, toJSON calls, output-budget
 * heuristics, and option validation.
 *
 * At introduction, this formatter and its forward-console integration added
 * about 2.7 kB raw / 1.0 kB gzip to Vite's client bundle.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors.
 * MIT License.
 */

export interface PrettyFormatOptions {
  maxDepth?: number
  maxWidth?: number
}

interface Config {
  maxDepth: number
  maxWidth: number
}

type Refs = unknown[]

const DEFAULT_OPTIONS: Config = {
  // Node's default inspect depth is 2 levels below the root. This formatter
  // counts the root as the first level, so 3 produces equivalent nesting.
  maxDepth: 3,
  // Match Node's default maxArrayLength, and also apply it to object properties
  // so both deep and wide object graphs remain bounded.
  maxWidth: 100,
}

const objectToString = Object.prototype.toString
const errorToString = Error.prototype.toString
const identifierRE = /^[a-z_$][\w$]*$/i

export function prettyFormat(
  value: unknown,
  options: PrettyFormatOptions = {},
): string {
  const config: Config = { ...DEFAULT_OPTIONS, ...options }
  return printer(value, config, 0, [])
}

function printer(
  value: unknown,
  config: Config,
  depth: number,
  refs: Refs,
): string {
  const basic = printBasicValue(value)
  return basic ?? printComplexValue(value as object, config, depth, refs)
}

function printBasicValue(value: unknown): string | undefined {
  if (value == null) {
    return String(value)
  }
  if (typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    return Object.is(value, -0) ? '-0' : String(value)
  }
  if (typeof value === 'bigint') {
    return `${value}n`
  }
  if (typeof value === 'boolean' || typeof value === 'symbol') {
    return String(value)
  }
  if (typeof value === 'function') {
    return value.name ? `[Function: ${value.name}]` : '[Function]'
  }

  const type = objectToString.call(value)
  if (type === '[object Date]') {
    return Number.isNaN(+(value as Date))
      ? 'Date { NaN }'
      : (value as Date).toISOString()
  }
  if (type === '[object Error]' || value instanceof Error) {
    return `[${errorToString.call(value)}]`
  }
}

function printComplexValue(
  value: object,
  config: Config,
  depth: number,
  refs: Refs,
): string {
  if (refs.includes(value)) {
    return '[Circular]'
  }
  refs = [...refs, value]

  const hitMaxDepth = ++depth > config.maxDepth
  if (Array.isArray(value)) {
    return hitMaxDepth
      ? '[Array]'
      : `[${printListItems(value, config, depth, refs)}]`
  }
  return hitMaxDepth
    ? '[Object]'
    : `{${printObjectProperties(
        value as Record<string, unknown>,
        config,
        depth,
        refs,
      )}}`
}

function printListItems(
  value: unknown[],
  config: Config,
  depth: number,
  refs: Refs,
): string {
  const width = Math.min(value.length, config.maxWidth)
  const result: string[] = []
  for (let i = 0; i < width; i++) {
    result.push(i in value ? printer(value[i], config, depth, refs) : '')
  }
  if (width < value.length) {
    result.push(`…(${value.length - width})`)
  }
  return withSpacing(result)
}

function printObjectProperties(
  value: Record<string, unknown>,
  config: Config,
  depth: number,
  refs: Refs,
): string {
  const keys = Object.keys(value)
  const width = Math.min(keys.length, config.maxWidth)
  const result: string[] = []
  for (let i = 0; i < width; i++) {
    const key = keys[i]
    const name =
      key !== '__proto__' && identifierRE.test(key) ? key : JSON.stringify(key)
    result.push(`${name}: ${printer(value[key], config, depth, refs)}`)
  }
  if (width < keys.length) {
    result.push(`…(${keys.length - width})`)
  }
  return withSpacing(result)
}

function withSpacing(values: string[]): string {
  return values.length === 0 ? '' : ` ${values.join(', ')} `
}
