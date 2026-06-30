import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import type { OutputChunk, RolldownOutput } from 'rolldown'
import { build } from '../../build'
import { walkImportChain } from '../../plugins/worker'

const fixturesDir = resolve(import.meta.dirname, 'fixtures')

test('?worker&url should produce the same hash in client and SSR builds', async () => {
  const root = resolve(fixturesDir, 'worker-url')

  const clientResult = (await build({
    root,
    logLevel: 'silent',
    build: {
      write: false,
      rolldownOptions: {
        input: resolve(root, 'entry.js'),
      },
    },
  })) as RolldownOutput

  const ssrResult = (await build({
    root,
    logLevel: 'silent',
    build: {
      write: false,
      ssr: resolve(root, 'entry.js'),
    },
  })) as RolldownOutput

  // Extract the worker URL from both builds.
  // The entry chunk will contain the worker asset URL as a string.
  const clientEntry = clientResult.output.find(
    (o): o is OutputChunk => o.type === 'chunk' && o.isEntry,
  )!
  const ssrEntry = ssrResult.output.find(
    (o): o is OutputChunk => o.type === 'chunk' && o.isEntry,
  )!

  const workerUrlPattern = /assets\/worker-[\w-]+\.js/g
  const clientWorkerUrls = clientEntry.code.match(workerUrlPattern) ?? []
  const ssrWorkerUrls = ssrEntry.code.match(workerUrlPattern) ?? []

  expect(clientWorkerUrls.length).toBeGreaterThan(0)
  expect(ssrWorkerUrls.length).toBeGreaterThan(0)
  expect(ssrWorkerUrls).toEqual(clientWorkerUrls)
})

test('walkImportChain traverses import chains in post-order', () => {
  // Simulate a chunk graph: entry → a → c, entry → b
  const chunks = new Map<string, { imports: readonly string[] }>([
    ['entry.js', { imports: ['a.js', 'b.js'] }],
    ['a.js', { imports: ['c.js'] }],
    ['b.js', { imports: [] }],
    ['c.js', { imports: [] }],
  ])
  const lookup = (file: string) => chunks.get(file)

  const result = walkImportChain(['entry.js'], lookup)

  // Invariant 1: dependencies before dependents (post-order)
  expect(result.indexOf('c.js')).toBeLessThan(result.indexOf('a.js'))
  expect(result.indexOf('a.js')).toBeLessThan(result.indexOf('entry.js'))

  // Invariant 2: no duplicates
  expect(new Set(result).size).toBe(result.length)

  // Invariant 3: every reachable file is present
  expect(result).toEqual(
    expect.arrayContaining(['a.js', 'b.js', 'c.js', 'entry.js']),
  )
})

test('walkImportChain handles circular imports', () => {
  const chunks = new Map<string, { imports: readonly string[] }>([
    ['a.js', { imports: ['b.js'] }],
    ['b.js', { imports: ['c.js'] }],
    ['c.js', { imports: ['a.js'] }],
  ])
  const lookup = (file: string) => chunks.get(file)

  const result = walkImportChain(['a.js'], lookup)

  // No infinite loop — each file visited once
  expect(new Set(result).size).toBe(result.length)
  expect(result).toEqual(expect.arrayContaining(['a.js', 'b.js', 'c.js']))
})

test('walkImportChain passes externals through', () => {
  const chunks = new Map<string, { imports: readonly string[] }>([
    ['entry.js', { imports: ['a.js', 'external-pkg'] }],
    ['a.js', { imports: [] }],
  ])
  const lookup = (file: string) => chunks.get(file)

  const result = walkImportChain(['entry.js'], lookup)

  expect(result).toContain('external-pkg')
  expect(result).toContain('entry.js')
  expect(result).toContain('a.js')
})

test('walkImportChain shares seen set across calls', () => {
  const seen = new Set<string>()
  const chunks = new Map<string, { imports: readonly string[] }>([
    ['a.js', { imports: [] }],
    ['b.js', { imports: ['a.js'] }],
  ])
  const lookup = (file: string) => chunks.get(file)

  const first = walkImportChain(['a.js'], lookup, seen)
  const second = walkImportChain(['b.js'], lookup, seen)

  // 'a.js' already in seen from first call, second call only adds 'b.js'
  expect(first).toEqual(['a.js'])
  expect(second).toEqual(['b.js'])
})
