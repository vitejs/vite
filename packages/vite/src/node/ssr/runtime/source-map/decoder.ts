import { posixResolve } from '../utils'

interface SourceMapLike {
  version: number
  mappings?: string
  names?: string[]
  sources?: string[]
  sourcesContent?: string[]
}

type OriginalMapping = {
  source: string | null
  line: number
  column: number
  name: string | null
}

type Needle = {
  line: number
  column: number
}

export class DecodedMap {
  _encoded: string
  _decoded: undefined | number[][][]
  _decodedMemo: Stats
  url: string
  version: number
  names: string[] = []
  resolvedSources: string[]

  constructor(
    public map: SourceMapLike,
    from: string,
  ) {
    const { mappings, names, sources } = map
    this.version = map.version
    this.names = names || []
    this._encoded = mappings || ''
    this._decodedMemo = memoizedState()
    this.url = from
    this.resolvedSources = (sources || []).map((s) =>
      posixResolve(s || '', from),
    )
  }
}

// This is a copy of all methods that we need for decoding a source map from "@jridgewell/trace-mapping"

function indexOf(mappings: string, index: number) {
  const idx = mappings.indexOf(';', index)
  return idx === -1 ? mappings.length : idx
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const charToInt = new Uint8Array(128) // z is 122 in ASCII
for (let i = 0; i < chars.length; i++) {
  const c = chars.charCodeAt(i)
  charToInt[c] = i
}

function decodeInteger(
  mappings: string,
  pos: number,
  state: Int32Array,
  j: number,
) {
  let value = 0
  let shift = 0
  let integer = 0
  do {
    const c = mappings.charCodeAt(pos++)
    integer = charToInt[c]
    value |= (integer & 31) << shift
    shift += 5
  } while (integer & 32)
  const shouldNegate = value & 1
  value >>>= 1
  if (shouldNegate) {
    value = -0x80000000 | -value
  }
  state[j] += value
  return pos
}

const comma = ','.charCodeAt(0)

function hasMoreVlq(mappings: string, i: number, length: number) {
  if (i >= length) return false
  return mappings.charCodeAt(i) !== comma
}

function decode(mappings: string): number[][][] {
  const state = new Int32Array(5)
  const decoded: number[][][] = []
  let index = 0
  do {
    const semi = indexOf(mappings, index)
    const line = []
    let sorted = true
    let lastCol = 0
    state[0] = 0
    for (let i = index; i < semi; i++) {
      let seg
      i = decodeInteger(mappings, i, state, 0) // genColumn
      const col = state[0]
      if (col < lastCol) sorted = false
      lastCol = col
      if (hasMoreVlq(mappings, i, semi)) {
        i = decodeInteger(mappings, i, state, 1) // sourcesIndex
        i = decodeInteger(mappings, i, state, 2) // sourceLine
        i = decodeInteger(mappings, i, state, 3) // sourceColumn
        if (hasMoreVlq(mappings, i, semi)) {
          i = decodeInteger(mappings, i, state, 4) // namesIndex
          seg = [col, state[1], state[2], state[3], state[4]]
        } else {
          seg = [col, state[1], state[2], state[3]]
        }
      } else {
        seg = [col]
      }
      line.push(seg)
    }
    if (!sorted) line.sort((a, b) => a[0] - b[0])
    decoded.push(line)
    index = semi + 1
  } while (index <= mappings.length)
  return decoded
}

const LINE_GTR_ZERO = '`line` must be greater than 0 (lines start at line 1)'
const COL_GTR_EQ_ZERO =
  '`column` must be greater than or equal to 0 (columns start at column 0)'

const COLUMN = 0
const SOURCES_INDEX = 1
const SOURCE_LINE = 2
const SOURCE_COLUMN = 3
const NAMES_INDEX = 4

function OMapping(
  source: string | null,
  line: number,
  column: number,
  name: string | null,
): OriginalMapping {
  return { source, line, column, name }
}

function decodedMappings(map: DecodedMap): number[][][] {
  return map._decoded || (map._decoded = decode(map._encoded))
}

let found = false
function binarySearch(
  haystack: number[][],
  needle: number,
  low: number,
  high: number,
) {
  while (low <= high) {
    const mid = low + ((high - low) >> 1)
    const cmp = haystack[mid][COLUMN] - needle
    if (cmp === 0) {
      found = true
      return mid
    }
    if (cmp < 0) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  found = false
  return low - 1
}

function lowerBound(haystack: number[][], needle: number, index: number) {
  for (let i = index - 1; i >= 0; index = i--) {
    if (haystack[i][COLUMN] !== needle) break
  }
  return index
}
interface Stats {
  lastKey: number
  lastNeedle: number
  lastIndex: number
}
function memoizedState(): Stats {
  return {
    lastKey: -1,
    lastNeedle: -1,
    lastIndex: -1,
  }
}
function memoizedBinarySearch(
  haystack: number[][],
  needle: number,
  state: Stats,
  key: number,
) {
  const { lastKey, lastNeedle, lastIndex } = state
  let low = 0
  let high = haystack.length - 1
  if (key === lastKey) {
    if (needle === lastNeedle) {
      found = lastIndex !== -1 && haystack[lastIndex][COLUMN] === needle
      return lastIndex
    }
    if (needle >= lastNeedle) {
      // lastIndex may be -1 if the previous needle was not found.
      low = lastIndex === -1 ? 0 : lastIndex
    } else {
      high = lastIndex
    }
  }
  state.lastKey = key
  state.lastNeedle = needle
  return (state.lastIndex = binarySearch(haystack, needle, low, high))
}

function traceSegmentInternal(
  segments: number[][],
  memo: Stats,
  line: number,
  column: number,
) {
  let index = memoizedBinarySearch(segments, column, memo, line)
  if (found) {
    index = lowerBound(segments, column, index)
  }
  if (index === -1 || index === segments.length) return -1
  return index
}

export function getOriginalPosition(
  map: DecodedMap,
  { line, column }: Needle,
): OriginalMapping | null {
  line--
  if (line < 0) throw new Error(LINE_GTR_ZERO)
  if (column < 0) throw new Error(COL_GTR_EQ_ZERO)
  map._decodedMemo ??= memoizedState()
  const decoded = decodedMappings(map)
  // It's common for parent source maps to have pointers to lines that have no
  // mapping (like a "//# sourceMappingURL=") at the end of the child file.
  if (line >= decoded.length) return null
  const segments = decoded[line]
  const index = traceSegmentInternal(segments, map._decodedMemo, line, column)
  if (index === -1) return null
  const segment = segments[index]
  if (segment.length === 1) return null
  const { names, resolvedSources } = map
  return OMapping(
    resolvedSources[segment[SOURCES_INDEX]],
    segment[SOURCE_LINE] + 1,
    segment[SOURCE_COLUMN],
    segment.length === 5 ? names[segment[NAMES_INDEX]] : null,
  )
}
