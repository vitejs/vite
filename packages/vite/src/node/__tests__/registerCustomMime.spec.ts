import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import * as mrmime from 'mrmime'
import { registerCustomMime } from '../plugins/asset'

const TS_EXTENSIONS = ['ts', 'tsx', 'mts', 'cts'] as const

describe('registerCustomMime', () => {
  let savedMimes: Partial<Record<string, string>>

  beforeEach(() => {
    savedMimes = Object.fromEntries(
      TS_EXTENSIONS.map((ext) => [ext, mrmime.mimes[ext]]),
    )
  })

  afterEach(() => {
    for (const ext of TS_EXTENSIONS) {
      const saved = savedMimes[ext]
      if (saved === undefined) {
        delete mrmime.mimes[ext]
      } else {
        mrmime.mimes[ext] = saved
      }
    }
  })

  test('overrides .ts from video/mp2t to text/javascript', () => {
    // mrmime maps .ts to video/mp2t (MPEG-2 transport stream); wrong when inlining compiled worker files
    expect(mrmime.lookup('worker.ts')).toBe('video/mp2t')
    registerCustomMime()
    expect(mrmime.lookup('worker.ts')).toBe('text/javascript')
    expect(mrmime.lookup('worker.tsx')).toBe('text/javascript')
    expect(mrmime.lookup('worker.mts')).toBe('text/javascript')
    expect(mrmime.lookup('worker.cts')).toBe('text/javascript')
  })
})
