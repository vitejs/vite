import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { DevEngine } from 'rolldown/experimental'
import type { RolldownOutput } from 'rolldown'
import { createDebugger, normalizePath } from '../utils'
import { cleanUrl, promiseWithResolvers } from '../../shared/utils'

const debug = createDebugger('vite:full-bundle-mode')

export interface BundledDevEntryResolverOptions {
  root: string
  /** the directory the bundled output is written to for native imports */
  outDir: string
  getDevEngine: () => DevEngine
  isClosed: () => boolean
  getLastBuildError: () => Error | null
  hasActiveHmrClient: () => boolean
  waitForInitialBuildFinish: () => Promise<void>
}

/**
 * Resolves urls to the importable file urls of their bundled entry chunks for
 * `nativeModuleRunner` mode, rebuilding stale output first when needed.
 * `BundledDev` owns the dev engine and notifies the resolver of build outputs
 * and of updates that invalidate the executed graph.
 */
export class BundledDevEntryResolver {
  private facadeToChunk = new Map<string, string>()
  /** set once the first `onOutput` callback (successful or errored) ran */
  private firstOutputProcessed = false
  /** resolved and replaced on every processed build output, and on close */
  private outputProcessedSignal = promiseWithResolvers<void>()
  /**
   * Set when the executed graph can no longer be kept current with HMR
   * patches (a `FullReload` update, or a build error) and the next resolved
   * import must rebuild and re-execute the bundle. While an HMR client
   * session is active and this is unset, imports skip the rebuild — patches
   * already keep the runtime current.
   */
  private entryStale = false
  /**
   * Serializes refreshes. Rolldown's `onOutput` callback carries no build id,
   * so an output notification can only be attributed to the rebuild a
   * refresh triggered when refreshes never overlap. Refreshes are the only
   * source of rebuilds in native import mode, so under this chain the
   * notification a refresh observes is effectively a token for its own build
   * (or a newer one, which is fresher and equally safe to import).
   */
  private refreshChain: Promise<void> = Promise.resolve()

  constructor(private options: BundledDevEntryResolverOptions) {}

  /** Called for every processed build output, successful or errored. */
  onBuildOutput(): void {
    this.firstOutputProcessed = true
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

  /**
   * Called when an update cannot be applied as a patch (a `FullReload`
   * update, or an HMR-stage build error): the next resolve must rebuild.
   */
  markEntryStale(): void {
    this.entryStale = true
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
  async resolve(url: string): Promise<{ url: string; moduleId: string }> {
    await this.ensureFreshOutput()
    if (this.options.isClosed()) {
      throw new Error(`the environment was closed while resolving "${url}"`)
    }
    const lastBuildError = this.options.getLastBuildError()
    if (lastBuildError) {
      throw lastBuildError
    }
    const { facadeId, chunkFileName } = this.resolveBundledEntry(url)
    const fileUrl = pathToFileURL(path.join(this.options.outDir, chunkFileName))
    debug?.(`RESOLVE: ${url} -> ${fileUrl.href}`)
    return {
      url: fileUrl.href,
      // rolldown's runtime registers modules by their cwd-relative id
      moduleId: normalizePath(path.relative(process.cwd(), facadeId)),
    }
  }

  /**
   * With no browser clients connected, rolldown does not regenerate output on
   * file changes (`rebuildStrategy` defaults to `'never'`) — the bundle only
   * goes stale. Rebuild on demand before importing.
   */
  private ensureFreshOutput(): Promise<void> {
    const refresh = this.refreshChain.then(() => this.refreshOutputIfStale())
    // keep the chain going even when a refresh fails
    this.refreshChain = refresh.then(
      () => {},
      () => {},
    )
    return refresh
  }

  private async refreshOutputIfStale(): Promise<void> {
    await this.options.waitForInitialBuildFinish()
    // when the initial build errored, `waitForInitialBuildFinish` may return
    // before the error passed through `onOutput` — wait for it so imports
    // observe the build error instead of an empty chunk map
    if (!this.options.isClosed() && !this.firstOutputProcessed) {
      await this.outputProcessedSignal.promise
    }
    if (this.options.isClosed()) return

    if (!this.entryStale && this.options.hasActiveHmrClient()) {
      // an active HMR client session keeps the executed graph current by
      // applying patches — rebuilding here would discard the patched state
      return
    }
    // clear before the awaits below: a `markEntryStale` that arrives while
    // this refresh waits belongs to a newer change and must survive into
    // the next refresh
    this.entryStale = false

    const devEngine = this.options.getDevEngine()
    // captured before the state check: the rebuild this refresh waits for
    // may pass through `onOutput` at any point after it
    const outputProcessed = this.outputProcessedSignal.promise
    const state = await devEngine.getBundleState()
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
