import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import type { OutputAsset, OutputBundle, OutputChunk } from 'rolldown'
import { VERSION } from './constants'

const compress = promisify(gzip)

/**
 * Statistics for an individual asset in the build output
 */
export interface AssetStats {
  /** File name of the asset */
  name: string
  /** Type identifier */
  type: 'asset'
  /** Size in bytes */
  size: number
  /** Gzip compressed size in bytes (null if not computed) */
  gzipSize: number | null
}

/**
 * Statistics for an individual chunk in the build output
 */
export interface ChunkStats {
  /** File name of the chunk */
  name: string
  /** Type identifier */
  type: 'chunk'
  /** Size in bytes */
  size: number
  /** Gzip compressed size in bytes (null if not computed) */
  gzipSize: number | null
  /** Whether this is an entry chunk */
  isEntry: boolean
  /** Whether this is a dynamic entry chunk */
  isDynamicEntry: boolean
  /** Module IDs included in this chunk */
  modules: string[]
  /** Static imports */
  imports: string[]
  /** Dynamic imports */
  dynamicImports: string[]
}

/**
 * Aggregated statistics for an environment's build output
 */
export interface EnvironmentBuildStats {
  /** Output directory path */
  outDir: string
  /** List of asset statistics */
  assets: AssetStats[]
  /** List of chunk statistics */
  chunks: ChunkStats[]
  /** Aggregated totals */
  totals: {
    /** Total number of assets */
    assetCount: number
    /** Total number of chunks */
    chunkCount: number
    /** Total size of all outputs in bytes */
    totalSize: number
    /** Total gzip size of all outputs in bytes (null if not computed) */
    totalGzipSize: number | null
  }
}

/**
 * Warning collected during build
 */
export interface BuildWarning {
  /** Warning message */
  message: string
  /** Plugin that generated the warning */
  plugin?: string
}

/**
 * Error collected during build
 */
export interface BuildError {
  /** Error message */
  message: string
  /** Plugin that generated the error */
  plugin?: string
}

/**
 * Complete build statistics output
 */
export interface BuildStatistics {
  /** Vite version */
  version: string
  /** Build timestamp in Unix milliseconds */
  timestamp: number
  /** Total build duration in milliseconds */
  duration: number
  /** Whether the build succeeded */
  success: boolean
  /** Statistics per environment */
  outputs: Record<string, EnvironmentBuildStats>
  /** Warnings collected during build */
  warnings: BuildWarning[]
  /** Errors collected during build */
  errors: BuildError[]
}

/**
 * Collector for build statistics
 */
export class BuildStatsCollector {
  private startTime: number = 0
  private outputs: Record<string, EnvironmentBuildStats> = {}
  private warnings: BuildWarning[] = []
  private errors: BuildError[] = []
  private reportCompressedSize: boolean

  constructor(reportCompressedSize: boolean = true) {
    this.reportCompressedSize = reportCompressedSize
  }

  /**
   * Mark the start of the build
   */
  start(): void {
    this.startTime = Date.now()
    this.outputs = {}
    this.warnings = []
    this.errors = []
  }

  /**
   * Add a warning to the statistics
   */
  addWarning(message: string, plugin?: string): void {
    this.warnings.push({ message, ...(plugin && { plugin }) })
  }

  /**
   * Add an error to the statistics
   */
  addError(message: string, plugin?: string): void {
    this.errors.push({ message, ...(plugin && { plugin }) })
  }

  /**
   * Process and add output bundle statistics for an environment
   */
  async addOutput(
    environmentName: string,
    output: OutputBundle,
    outDir: string,
  ): Promise<void> {
    const assets: AssetStats[] = []
    const chunks: ChunkStats[] = []

    let totalSize = 0
    let totalGzipSize: number | null = this.reportCompressedSize ? 0 : null

    for (const [fileName, item] of Object.entries(output)) {
      // Skip source maps
      if (fileName.endsWith('.map')) continue

      if (item.type === 'chunk') {
        const chunk = item as OutputChunk
        const size = Buffer.byteLength(chunk.code)
        const gzipSize = this.reportCompressedSize
          ? await this.getCompressedSize(chunk.code)
          : null

        chunks.push({
          name: fileName,
          type: 'chunk',
          size,
          gzipSize,
          isEntry: chunk.isEntry,
          isDynamicEntry: chunk.isDynamicEntry,
          modules: Object.keys(chunk.modules),
          imports: chunk.imports,
          dynamicImports: chunk.dynamicImports,
        })

        totalSize += size
        if (totalGzipSize != null && gzipSize != null) {
          totalGzipSize += gzipSize
        }
      } else {
        const asset = item as OutputAsset
        const size = Buffer.byteLength(asset.source)
        const isCompressible = this.isCompressible(fileName)
        const gzipSize =
          this.reportCompressedSize && isCompressible
            ? await this.getCompressedSize(asset.source)
            : null

        assets.push({
          name: fileName,
          type: 'asset',
          size,
          gzipSize,
        })

        totalSize += size
        if (totalGzipSize != null && gzipSize != null) {
          totalGzipSize += gzipSize
        }
      }
    }

    // Sort by size descending
    assets.sort((a, b) => b.size - a.size)
    chunks.sort((a, b) => b.size - a.size)

    this.outputs[environmentName] = {
      outDir,
      assets,
      chunks,
      totals: {
        assetCount: assets.length,
        chunkCount: chunks.length,
        totalSize,
        totalGzipSize,
      },
    }
  }

  /**
   * Generate the final build statistics
   */
  getStats(success: boolean): BuildStatistics {
    return {
      version: VERSION,
      timestamp: this.startTime,
      duration: Date.now() - this.startTime,
      success,
      outputs: this.outputs,
      warnings: this.warnings,
      errors: this.errors,
    }
  }

  /**
   * Check if a file should have its gzip size computed
   */
  private isCompressible(fileName: string): boolean {
    return /\.(?:html|json|svg|txt|xml|xhtml|wasm|js|mjs|cjs|css)$/.test(
      fileName,
    )
  }

  /**
   * Compute gzip compressed size
   */
  private async getCompressedSize(
    content: string | Uint8Array,
  ): Promise<number> {
    const buffer =
      typeof content === 'string' ? Buffer.from(content) : Buffer.from(content)
    const compressed = await compress(buffer)
    return compressed.length
  }
}

/**
 * Write build statistics to a file or stdout
 * @param stats - The build statistics to write
 * @param output - File path to write to, or true for stdout
 */
export async function writeBuildStats(
  stats: BuildStatistics,
  output: string | true,
): Promise<void> {
  const json = JSON.stringify(stats, null, 2)

  if (output === true) {
    // Write to stdout
    process.stdout.write(json)
  } else {
    // Write to file
    const outputPath = path.resolve(output)
    const outputDir = path.dirname(outputPath)

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      await fsp.mkdir(outputDir, { recursive: true })
    }

    await fsp.writeFile(outputPath, json, 'utf-8')
  }
}
