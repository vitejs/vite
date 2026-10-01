/**
 * Benchmark for the ModuleRunner
 *
 * Creates synthetic module graphs at various scales and measures the
 * total time to evaluate all modules.
 *
 * Usage:
 *   node packages/vite/scripts/benchCircularImport.ts
 *
 * With CPU profiling:
 *   node --cpu-prof --cpu-prof-dir=./profiles packages/vite/scripts/benchCircularImport.ts
 */

import { createServer, createServerModuleRunner } from 'vite'

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
  return `/bench/mod_${i}.js`
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
// Benchmark plugin (resolveId + load)
// ---------------------------------------------------------------------------

const BENCH_PREFIX = '/bench/'

function createBenchPlugin(graph: SyntheticGraph) {
  return {
    name: 'bench-circular-import',

    resolveId(id: string) {
      if (id.startsWith(BENCH_PREFIX)) {
        // Return a virtual module id (null-byte prefix prevents fs lookup)
        return `\0${id}`
      }
    },

    load(id: string) {
      if (id.startsWith(`\0${BENCH_PREFIX}`)) {
        const realId = id.slice(1)
        const deps = graph.edges.get(realId)
        if (deps) {
          const lines = deps.map(
            (dep, i) => `import { value as __dep_${i}__ } from "${dep}";`,
          )
          lines.push(`export const value = ${deps.length};`)
          return lines.join('\n')
        }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Benchmark runner
// ---------------------------------------------------------------------------

interface BenchResult {
  moduleCount: number
  edgeCount: number
  timeMs: number
}

async function runBenchmark(config: GraphConfig): Promise<BenchResult> {
  const graph = generateGraph(config)

  let edgeCount = 0
  for (const deps of graph.edges.values()) {
    edgeCount += deps.length
  }

  const server = await createServer({
    configFile: false,
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    root: import.meta.dirname,
    logLevel: 'error',
    server: {
      middlewareMode: true,
      ws: false,
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    plugins: [createBenchPlugin(graph)],
  })

  const runner = createServerModuleRunner(server.environments.ssr, {
    hmr: false,
    sourcemapInterceptor: false,
  })

  const start = performance.now()
  await runner.import(graph.entry)
  const timeMs = performance.now() - start

  await runner.close()
  await server.close()

  return {
    moduleCount: config.moduleCount,
    edgeCount,
    timeMs,
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
    console.log()
  }
}

main().catch(console.error)
