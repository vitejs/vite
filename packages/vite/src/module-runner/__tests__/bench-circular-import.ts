/**
 * Benchmark for isCircularImport performance in Vite's ModuleRunner.
 *
 * Creates synthetic module graphs at various scales and measures the
 * total time to evaluate all modules via ModuleRunner.import().
 *
 * Usage:
 *   node --import tsx packages/vite/src/module-runner/__tests__/bench-circular-import.ts
 *
 * With CPU profiling:
 *   node --cpu-prof --cpu-prof-dir=./profiles --import tsx packages/vite/src/module-runner/__tests__/bench-circular-import.ts
 */

import type { HotPayload } from '../../types/hmrPayload'
import type {
  InvokeSendData,
  ViteFetchResult,
} from '../../shared/invokeMethods'
import type { ModuleRunnerTransport } from '../../shared/moduleRunnerTransport'
import { ModuleRunner } from '../runner'
import { ESModulesEvaluator } from '../esmEvaluator'

// ---------------------------------------------------------------------------
// Graph generation
// ---------------------------------------------------------------------------

interface GraphConfig {
  /** Number of modules */
  moduleCount: number
  /** Average imports per module */
  avgImports: number
  /** Fraction of modules involved in cycles (0..1) */
  cycleFraction: number
}

interface SyntheticGraph {
  /** Map of module id -> list of dependency ids */
  edges: Map<string, string[]>
  /** The entry module id */
  entry: string
}

function moduleId(i: number): string {
  return `/mod_${i}.js`
}

/**
 * Generate a synthetic module graph with configurable size, density, and cycles.
 *
 * Strategy:
 * 1. Create a chain: mod_0 -> mod_1 -> ... -> mod_{n-1} (ensures all reachable)
 * 2. Add random cross-edges to reach target avg imports
 * 3. Add back-edges to create cycles for cycleFraction of modules
 */
function generateGraph(config: GraphConfig): SyntheticGraph {
  const { moduleCount, avgImports, cycleFraction } = config
  const edges = new Map<string, string[]>()

  // Initialize all modules
  for (let i = 0; i < moduleCount; i++) {
    edges.set(moduleId(i), [])
  }

  // 1. Chain: each module imports the next (ensures all reachable from entry)
  for (let i = 0; i < moduleCount - 1; i++) {
    edges.get(moduleId(i))!.push(moduleId(i + 1))
  }

  // 2. Random edges to reach target density (may include back-edges)
  const targetTotalEdges = moduleCount * avgImports
  const currentEdges = moduleCount - 1
  const extraEdges = Math.max(0, targetTotalEdges - currentEdges)

  // Use seeded PRNG for reproducibility
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff
    return seed / 0x7fffffff
  }

  for (let e = 0; e < extraEdges; e++) {
    const from = Math.floor(rand() * moduleCount)
    const to = Math.floor(rand() * moduleCount)
    if (from !== to) {
      const deps = edges.get(moduleId(from))!
      const target = moduleId(to)
      if (!deps.includes(target)) {
        deps.push(target)
      }
    }
  }

  // 3. Add cycles: back-edges from later modules to earlier ones
  const cycleModules = Math.floor(moduleCount * cycleFraction)
  for (let c = 0; c < cycleModules; c++) {
    // Pick a module in the later half, add back-edge to earlier half
    const from = Math.floor(moduleCount * 0.5 + rand() * moduleCount * 0.5)
    const to = Math.floor(rand() * moduleCount * 0.5)
    if (from < moduleCount && to < moduleCount && from !== to) {
      const deps = edges.get(moduleId(from))!
      const target = moduleId(to)
      if (!deps.includes(target)) {
        deps.push(target)
      }
    }
  }

  return { edges, entry: moduleId(0) }
}

// ---------------------------------------------------------------------------
// SSR code generation
// ---------------------------------------------------------------------------

/**
 * Generate SSR-transformed code for a module with the given dependencies.
 * The code uses __vite_ssr_import__ and __vite_ssr_exportName__ which are
 * the parameter names injected by ESModulesEvaluator's AsyncFunction wrapper.
 */
function generateSSRCode(deps: string[]): string {
  const lines: string[] = []

  // Import each dependency
  deps.forEach((dep, i) => {
    lines.push(
      `const __vite_ssr_import_${i}__ = await __vite_ssr_import__("${dep}");`,
    )
  })

  // Export a value
  lines.push(
    `__vite_ssr_exportName__("value", () => { try { return value } catch {} });`,
  )
  lines.push(`const value = ${deps.length};`)

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Mock transport
// ---------------------------------------------------------------------------

function createMockTransport(graph: SyntheticGraph): ModuleRunnerTransport {
  const moduleMap = new Map<string, ViteFetchResult>()

  for (const [id, deps] of graph.edges) {
    moduleMap.set(id, {
      code: generateSSRCode(deps),
      file: id,
      id,
      url: id,
      invalidate: false,
    })
  }

  return {
    async invoke(payload: HotPayload) {
      const invokeData = payload.data as InvokeSendData
      const { name, data } = invokeData

      if (name === 'fetchModule') {
        const [id] = data as [string, string?, object?]
        const mod = moduleMap.get(id)
        if (mod) {
          return { result: mod }
        }
        return { result: { externalize: id, type: 'builtin' as const } }
      }

      if (name === 'getBuiltins') {
        return { result: [] }
      }

      return { result: null }
    },
  }
}

// ---------------------------------------------------------------------------
// Instrumentation (monkey-patch to count calls)
// ---------------------------------------------------------------------------

interface CallCounts {
  cachedRequest: number
  isCircularImport: number
  evaluatedCacheHits: number
  promiseCacheHits: number
}

function instrumentRunner(runner: ModuleRunner): CallCounts {
  const counts: CallCounts = {
    cachedRequest: 0,
    isCircularImport: 0,
    evaluatedCacheHits: 0,
    promiseCacheHits: 0,
  }

  // Patch cachedRequest
  const origCachedRequest = (runner as any).cachedRequest.bind(runner)
  ;(runner as any).cachedRequest = function (
    url: string,
    mod: any,
    callstack: string[] = [],
    metadata?: any,
  ) {
    counts.cachedRequest++
    if (mod.evaluated && mod.promise) {
      counts.evaluatedCacheHits++
    } else if (mod.promise) {
      counts.promiseCacheHits++
    }
    return origCachedRequest(url, mod, callstack, metadata)
  }

  // Patch isCircularImport (counts include recursive calls, not just top-level)
  const origIsCircularImport = (runner as any).isCircularImport.bind(runner)
  ;(runner as any).isCircularImport = function (...args: any[]) {
    counts.isCircularImport++
    return origIsCircularImport(...args)
  }

  return counts
}

// ---------------------------------------------------------------------------
// Benchmark runner
// ---------------------------------------------------------------------------

interface BenchResult {
  moduleCount: number
  edgeCount: number
  timeMs: number
  counts: CallCounts
}

async function runBenchmark(config: GraphConfig): Promise<BenchResult> {
  const graph = generateGraph(config)

  // Count total edges
  let edgeCount = 0
  for (const deps of graph.edges.values()) {
    edgeCount += deps.length
  }

  const transport = createMockTransport(graph)
  const runner = new ModuleRunner(
    {
      transport,
      hmr: false,
      sourcemapInterceptor: false,
    },
    new ESModulesEvaluator(),
  )

  const counts = instrumentRunner(runner)

  const start = performance.now()
  await runner.import(graph.entry)
  const timeMs = performance.now() - start

  await runner.close()

  return {
    moduleCount: config.moduleCount,
    edgeCount,
    timeMs,
    counts,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Vite isCircularImport Benchmark ===\n')

  const scales = [100, 500, 1000, 2000, 5000]
  const results: BenchResult[] = []

  // Warmup: single small run to trigger JIT compilation
  await runBenchmark({ moduleCount: 100, avgImports: 3, cycleFraction: 0.05 })

  for (const n of scales) {
    const result = await runBenchmark({
      moduleCount: n,
      avgImports: 3,
      cycleFraction: 0.05,
    })
    results.push(result)

    console.log(`N=${n}:`)
    console.log(`  modules: ${result.moduleCount}, edges: ${result.edgeCount}`)
    console.log(`  time: ${result.timeMs.toFixed(1)}ms`)
    console.log(`  cachedRequest calls: ${result.counts.cachedRequest}`)
    console.log(`  isCircularImport calls: ${result.counts.isCircularImport}`)
    console.log(
      `  evaluated cache hits (skipped circular checks): ${result.counts.evaluatedCacheHits}`,
    )
    console.log(`  promise cache hits: ${result.counts.promiseCacheHits}`)
    console.log(
      `  ratio (isCircularImport / modules): ${(result.counts.isCircularImport / result.moduleCount).toFixed(1)}x`,
    )
    console.log()
  }

  // Scaling analysis
  console.log('=== Scaling Analysis ===')
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1]
    const curr = results[i]
    const nRatio = curr.moduleCount / prev.moduleCount
    const timeRatio = curr.timeMs / prev.timeMs
    console.log(
      `  N: ${prev.moduleCount} -> ${curr.moduleCount} (${nRatio.toFixed(1)}x), ` +
        `time: ${prev.timeMs.toFixed(1)}ms -> ${curr.timeMs.toFixed(1)}ms (${timeRatio.toFixed(1)}x)` +
        `${timeRatio > nRatio * 1.3 ? ' ← SUPERLINEAR' : ''}`,
    )
  }
}

main().catch(console.error)
