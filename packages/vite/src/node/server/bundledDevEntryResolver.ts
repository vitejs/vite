import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { RolldownOutput } from 'rolldown'
import type { DevEngine } from 'rolldown/experimental'
import { cleanUrl, promiseWithResolvers } from '../../shared/utils'
import { createDebugger, normalizePath } from '../utils'

const debug = createDebugger('vite:full-bundle-mode')

export interface BundledDevEntryResolverOptions {
  root: string
  /** the directory the bundled output is written to for native imports */
  outDir: string
  getDevEngine: () => DevEngine
  isClosed: () => boolean
  getLastBuildError: () => Error | null
  waitForInitialBuildFinish: () => Promise<void>
}

/**
 * Resolves urls to the importable file urls of their bundled entry chunks for
 * `nativeModuleRunner` mode, rebuilding stale output first when needed.
 * `BundledDev` owns the dev engine and notifies the resolver of build outputs.
 */
export class BundledDevEntryResolver {
  private facadeToChunk = new Map<string, string>()
  /** set once the first `onOutput` callback (successful or errored) ran */
  private firstOutputProcessed = false
  /** incremented for every successfully written full-bundle output */
  private buildId = 0
  /** resolved and replaced on every processed build output, and on close */
  private outputProcessedSignal = promiseWithResolvers<void>()

  constructor(private options: BundledDevEntryResolverOptions) {}

  /** Called for every processed build output, successful or errored. */
  onBuildOutput(success: boolean): void {
    this.firstOutputProcessed = true
    if (success) this.buildId++
    const processed = this.outputProcessedSignal
    this.outputProcessedSignal = promiseWithResolvers<void>()
    processed.resolve()
  }

  /**
   * Unblocks pending output waits so in-flight resolves observe the closed
   * state instead of waiting for an output that will never come.
   */
  onClose(): void {
    this.outputProcessedSignal.resolve()
  }

  registerChunks(output: RolldownOutput['output'][number][]): void {
    for (const outputFile of output) {
      if (outputFile.type === 'chunk' && outputFile.facadeModuleId) {
        this.facadeToChunk.set(
          normalizePath(outputFile.facadeModuleId),
          outputFile.fileName,
        )
      }
    }
  }

  /**
   * Resolve a url to the importable file url of its bundled entry chunk,
   * rebuilding stale output first. The url may be a root-relative url
   * (`/src/entry-server.js`) or an absolute file path of a module that is
   * part of the environment's rolldown input.
   */
  async resolve(url: string): Promise<{ url: string; buildId: number }> {
    await this.ensureFreshOutput()
    this.throwIfUnavailable(url)
    const { chunkFileName } = this.resolveBundledEntry(url)
    const fileUrl = pathToFileURL(path.join(this.options.outDir, chunkFileName))
    debug?.(`RESOLVE: ${url} -> ${fileUrl.href}`)
    return {
      url: fileUrl.href,
      buildId: this.buildId,
    }
  }

  /**
   * Resolve without regenerating full-bundle output. The native runner uses
   * this id to return an already-executed module from its HMR-patched graph;
   * only an unexecuted module proceeds to `resolve()`.
   */
  async resolveModuleId(url: string): Promise<string> {
    await this.waitForInitialOutput()
    this.throwIfUnavailable(url)
    const { facadeId } = this.resolveBundledEntry(url)
    return normalizePath(path.relative(process.cwd(), facadeId))
  }

  private async waitForInitialOutput(): Promise<void> {
    await this.options.waitForInitialBuildFinish()
    // when the initial build errored, `waitForInitialBuildFinish` may return
    // before the error passed through `onOutput` — wait for it so imports
    // observe the build error instead of an empty chunk map
    if (!this.options.isClosed() && !this.firstOutputProcessed) {
      await this.outputProcessedSignal.promise
    }
  }

  /**
   * Rolldown's default `rebuildStrategy` leaves full output stale after HMR.
   * An unexecuted entry needs that output regenerated before native import.
   */
  private async ensureFreshOutput(): Promise<void> {
    await this.waitForInitialOutput()
    if (this.options.isClosed()) return

    const devEngine = this.options.getDevEngine()
    const state = await devEngine.getBundleState()
    if (state.lastBuildErrored && state.lastErrorStage !== 'Hmr') {
      // Full-build and rebuild-stage failures are surfaced through onOutput.
      // Rolldown intentionally does not retry them on access.
      return
    }

    // ensureLatestBuildOutput waits for the disk write. This additional
    // signal waits for Vite to process onOutput and update the hashed entry
    // map (or store the build error).
    const outputProcessed = this.outputProcessedSignal.promise
    if (state.lastBuildErrored && state.lastErrorStage === 'Hmr') {
      // HMR-stage failures don't go through `onOutput` — force a full
      // rebuild to surface the error (or pick up a fix) on import
      devEngine.triggerFullBuild()
    } else if (!state.hasStaleOutput) {
      return
    }
    await devEngine.ensureLatestBuildOutput()
    // `onOutput` may be invoked after `ensureLatestBuildOutput` resolves —
    // wait until the new output (or its build error) has been processed
    await outputProcessed
  }

  private throwIfUnavailable(url: string): void {
    if (this.options.isClosed()) {
      throw new Error(`the environment was closed while resolving "${url}"`)
    }
    const lastBuildError = this.options.getLastBuildError()
    if (lastBuildError) throw lastBuildError
  }

  private resolveBundledEntry(url: string): {
    facadeId: string
    chunkFileName: string
  } {
    const cleanedUrl = cleanUrl(url)
    const candidates = new Set([
      normalizePath(cleanedUrl),
      normalizePath(
        path.resolve(
          this.options.root,
          cleanedUrl[0] === '/' ? cleanedUrl.slice(1) : cleanedUrl,
        ),
      ),
    ])
    for (const candidate of candidates) {
      const chunk = this.facadeToChunk.get(candidate)
      if (chunk) return { facadeId: candidate, chunkFileName: chunk }
    }
    throw new Error(
      `no bundled chunk found for "${url}". Bundled modules: ` +
        `${[...this.facadeToChunk.keys()].join(', ') || '(none)'}`,
    )
  }
}
