import { InputOption, InputOptions, OutputOptions, RollupOutput } from 'rollup'
import { klona } from 'klona/json'
import fs from 'fs-extra'
import path from 'path'
import mime from 'mime-types'
import slash from 'slash'
import { BuildConfig } from '../config'
import { createLogger } from '../utils/logger'
import { cleanUrl, isStaticAsset, toArray } from '../utils'
import { createResolver, InternalResolver } from '../resolver'

export interface Build extends InputOptions {
  input: InputOption
  output: OutputOptions
  /** Runs before global post-build hooks. */
  onResult?: PostBuildHook
}

export interface BuildResult {
  build: Build
  html: string
  assets: RollupOutput['output']
}

export type PreBuildHook = (build: Build, index: number) => Promise<void> | void
export type PostBuildHook = (
  result: BuildResult,
  index: number
) => Promise<void> | void
export type TailHook = (results: BuildResult[]) => Promise<void> | void

interface AssetCacheEntry {
  content?: Buffer
  fileName?: string
  url: string | undefined
}

const publicDirRE = /^public(\/|\\)/

export class BuildContext {
  private config: BuildConfig
  private preBuildHooks: PreBuildHook[] = []
  private postBuildHooks: PostBuildHook[] = []
  private tailHooks: TailHook[] = []
  private assetResolveCache = new Map<string, AssetCacheEntry>()

  readonly log = createLogger()
  readonly builds: Build[] = []
  readonly resolver: InternalResolver

  constructor({ configureBuild, ...userConfig }: Partial<BuildConfig>) {
    this.config = prepareConfig(userConfig)

    // define config accessors on the context
    const configKeys = Object.keys(this.config) as (keyof BuildConfig)[]
    for (const configKey of configKeys) {
      // prefer getters from BuildContext.prototype
      const { get = () => this.config[configKey] } =
        Object.getOwnPropertyDescriptor(BuildContext.prototype, configKey) || {}

      Object.defineProperty(this, configKey, {
        get,
        set(value) {
          this.config[configKey] = value
        }
      })
    }

    // let plugins mutate the build context
    toArray(configureBuild).forEach((configureBuild) => configureBuild(this))

    this.resolver = createResolver(
      this.root,
      this.resolvers,
      this.alias,
      this.assetsInclude
    )
  }

  get base() {
    return this.config.base.replace(/([^/])$/, '$1/') // ensure ending slash
  }

  get outDir() {
    return path.resolve(this.root, this.config.outDir)
  }

  get assetsDir() {
    return path.join(this.outDir, this.config.assetsDir)
  }

  get publicDir() {
    return path.join(this.root, 'public')
  }

  getBasedAssetPath(name: string) {
    return this.base + slash(path.join(this.config.assetsDir, name))
  }

  async resolveAsset(id: string): Promise<AssetCacheEntry> {
    id = cleanUrl(id)

    const cached = this.assetResolveCache.get(id)
    if (cached) {
      return cached
    }

    let resolved: AssetCacheEntry | undefined
    const relativePath = path.relative(this.root, id)

    if (!fs.existsSync(id)) {
      // try resolving from public dir
      const publicDirPath = path.join(this.publicDir, relativePath)
      if (fs.existsSync(publicDirPath)) {
        // file is resolved from public dir, it will be copied verbatim so no
        // need to read content here.
        resolved = {
          url: this.base + slash(relativePath)
        }
      }
    }

    if (!resolved) {
      if (publicDirRE.test(relativePath)) {
        resolved = {
          url: this.base + slash(relativePath.replace(publicDirRE, ''))
        }
      }
    }

    if (!resolved) {
      let url: string | undefined
      let content: Buffer | undefined = await fs.readFile(id)
      if (!/\.(css|svg)$/.test(id) && content.length < this.assetsInlineLimit) {
        url = `data:${mime.lookup(id)};base64,${content.toString('base64')}`
        content = undefined
      }

      resolved = {
        content,
        fileName: path.basename(id),
        url
      }
    }

    this.assetResolveCache.set(id, resolved)
    return resolved
  }

  /**
   * Enqueue another build.
   */
  build(build: Build) {
    this.builds.push(build)
  }

  /**
   * Run the given function before each `Build` starts.
   */
  beforeEach(hook: (build: Build, index: number) => void) {
    this.preBuildHooks.push(hook)
  }

  /**
   * Run the given function after each `Build` is completed.
   */
  afterEach(hook: (result: BuildResult, index: number) => void) {
    this.postBuildHooks.push(hook)
  }

  /**
   * Run the given function after all `Build`s are completed.
   */
  afterAll(hook: (results: BuildResult[]) => void) {
    this.tailHooks.push(hook)
  }
}

// Every option is exposed on the build context.
export interface BuildContext extends Omit<BuildConfig, 'configureBuild'> {}

/**
 * Clone the given config object and fill it with default values.
 */
function prepareConfig(config: Partial<BuildConfig>): BuildConfig {
  const {
    alias = {},
    assetsDir = '_assets',
    assetsInclude = isStaticAsset,
    assetsInlineLimit = 4096,
    base = '/',
    cssCodeSplit = true,
    cssModuleOptions = {},
    cssPreprocessOptions = {},
    define = {},
    emitAssets = true,
    emitIndex = true,
    emitManifest = false,
    enableEsbuild = true,
    enableRollupPluginVue = true,
    entry = 'index.html',
    env = {},
    esbuildTarget = 'es2020',
    indexHtmlTransforms = [],
    jsx = 'vue',
    minify = true,
    mode = 'production',
    optimizeDeps = {},
    outDir = 'dist',
    resolvers = [],
    rollupDedupe = [],
    rollupInputOptions = {},
    rollupOutputOptions = {},
    rollupPluginVueOptions = {},
    root = process.cwd(),
    shouldPreload = null,
    silent = false,
    sourcemap = false,
    ssr = false,
    terserOptions = {},
    transforms = [],
    vueCompilerOptions = {},
    vueCustomBlockTransforms = {},
    vueTransformAssetUrls = {},
    vueTemplatePreprocessOptions = {},
    write = true
  } = klona(config)

  return {
    ...config,
    alias,
    assetsDir,
    assetsInclude,
    assetsInlineLimit,
    base,
    cssCodeSplit,
    cssModuleOptions,
    cssPreprocessOptions,
    define,
    emitAssets,
    emitIndex,
    emitManifest,
    enableEsbuild,
    enableRollupPluginVue,
    entry,
    env,
    esbuildTarget,
    indexHtmlTransforms,
    jsx,
    minify,
    mode,
    optimizeDeps,
    outDir,
    resolvers,
    rollupDedupe,
    rollupInputOptions,
    rollupOutputOptions,
    rollupPluginVueOptions,
    root,
    shouldPreload,
    silent,
    sourcemap,
    ssr,
    terserOptions,
    transforms,
    vueCompilerOptions,
    vueCustomBlockTransforms,
    vueTransformAssetUrls,
    vueTemplatePreprocessOptions,
    write
  }
}
