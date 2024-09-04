import type { OriginalMapping } from '@jridgewell/trace-mapping'
import { originalPositionFor } from '@jridgewell/trace-mapping'
import { posixResolve } from '../utils'

interface SourceMapLike {
  version: number
  mappings?: string
  names?: string[]
  sources?: string[]
  sourcesContent?: string[]
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
export function getOriginalPosition(
  map: DecodedMap,
  needle: Needle,
): OriginalMapping | null {
  const result = originalPositionFor(map as any, needle)
  if (result.column == null) {
    return null
  }
  return result
}
