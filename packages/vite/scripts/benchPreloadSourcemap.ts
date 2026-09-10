import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import remapping from '@jridgewell/remapping'
import type { DecodedSourceMap, RawSourceMap } from '@jridgewell/remapping'
import MagicString from 'magic-string'

const source = Array.from(
  { length: 10_000 },
  (_, i) => `export const value${i} = ${i};`,
).join('\n')
const original = new MagicString(source).generateMap({
  source: 'src/entry.js',
  hires: true,
  includeContent: true,
}) as RawSourceMap
const edited = new MagicString(source)
edited.prepend('const preloadDependencies = ["lazy.js", "lazy.css"];\n')
const options = { source: 'assets/entry.js', hires: 'boundary' as const }
// Measure the composition used by combineSourcemaps without importing Vite's
// source types into the scripts project, which also loads Vite's built types.
const compose = (decoded: boolean) =>
  remapping(
    [
      decoded
        ? (edited.generateDecodedMap(options) as DecodedSourceMap)
        : (edited.generateMap(options) as RawSourceMap),
      original,
    ],
    () => null,
  )

assert.deepEqual(compose(false), compose(true))
const samples: number[][] = [[], []]
for (let round = 0; round < 25; round++) {
  for (const variant of round % 2 ? [1, 0] : [0, 1]) {
    const start = performance.now()
    compose(Boolean(variant))
    if (round >= 5) samples[variant].push(performance.now() - start)
  }
}
for (const [i, values] of samples.entries()) {
  values.sort((a, b) => a - b)
  const median = (values[9] + values[10]) / 2
  console.log(`${i ? 'decoded' : 'encoded'} median: ${median.toFixed(2)} ms`)
}
