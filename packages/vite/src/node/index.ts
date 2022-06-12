export * from './config'
export { createServer } from './server'
export { preview } from './preview'
export { build } from './build'
export { optimizeDeps } from './optimizer'
export { formatPostcssSourceMap } from './plugins/css'
export { transformWithEsbuild } from './plugins/esbuild'
export { resolvePackageEntry } from './plugins/resolve'
export { resolvePackageData } from './packages'
export * from './publicUtils'

// additional types
export type { CorsOptions, CorsOrigin, CommonServerOptions } from './http'
export type {
  ViteDevServer,
  ServerOptions,
  FileSystemServeOptions,
  ServerHook,
  ResolvedServerOptions
} from './server'
export type {
  BuildOptions,
  LibraryOptions,
  LibraryFormats,
  ResolvedBuildOptions
} from './build'
export type {
  PreviewOptions,
  PreviewServer,
  PreviewServerHook,
  ResolvedPreviewOptions
} from './preview'
export type {
  DepOptimizationMetadata,
  DepOptimizationOptions,
  DepOptimizationResult,
  DepOptimizationProcessing,
  OptimizedDepInfo,
  DepsOptimizer,
  ExportsData
} from './optimizer'
export type {
  ResolvedSSROptions,
  SSROptions,
  SSRFormat,
  SSRTarget
} from './ssr'
export type { Plugin } from './plugin'
export type { PackageCache, PackageData } from './packages'
export type {
  Logger,
  LogOptions,
  LogErrorOptions,
  LogLevel,
  LogType,
  LoggerOptions
} from './logger'
export type {
  AliasOptions,
  ResolverFunction,
  ResolverObject,
  Alias
} from 'types/alias'
export type {
  IndexHtmlTransform,
  IndexHtmlTransformHook,
  IndexHtmlTransformContext,
  IndexHtmlTransformResult,
  HtmlTagDescriptor
} from './plugins/html'
export type { CSSOptions, CSSModulesOptions } from './plugins/css'
export type { ChunkMetadata } from './plugins/metadata'
export type { JsonOptions } from './plugins/json'
export type { TransformOptions as EsbuildTransformOptions } from 'esbuild'
export type { ESBuildOptions, ESBuildTransformResult } from './plugins/esbuild'
export type { Manifest, ManifestChunk } from './plugins/manifest'
export type { ResolveOptions, InternalResolveOptions } from './plugins/resolve'
export type { SplitVendorChunkCache } from './plugins/splitVendorChunk'
import type { ChunkMetadata } from './plugins/metadata'

export type {
  WebSocketServer,
  WebSocketClient,
  WebSocketCustomListener
} from './server/ws'
export type { PluginContainer } from './server/pluginContainer'
export type { ModuleGraph, ModuleNode, ResolvedUrl } from './server/moduleGraph'
export type { SendOptions } from './server/send'
export type { ProxyOptions } from './server/middlewares/proxy'
export type {
  TransformOptions,
  TransformResult
} from './server/transformRequest'
export type { HmrOptions, HmrContext } from './server/hmr'

export type {
  HMRPayload,
  ConnectedPayload,
  UpdatePayload,
  Update,
  FullReloadPayload,
  CustomPayload,
  PrunePayload,
  ErrorPayload
} from 'types/hmrPayload'
export type { Connect } from 'types/connect'
export type { WebSocket, WebSocketAlias } from 'types/ws'
export type { HttpProxy } from 'types/http-proxy'
export type {
  FSWatcher,
  WatchOptions,
  AwaitWriteFinishOptions
} from 'types/chokidar'
export type { Terser } from 'types/terser'
export type { RollupCommonJSOptions } from 'types/commonjs'
export type { RollupDynamicImportVarsOptions } from 'types/dynamicImportVars'
export type { CustomEventMap, InferCustomEventPayload } from 'types/customEvent'
export type { Matcher, AnymatchPattern, AnymatchFn } from 'types/anymatch'
export type {
  ImportGlobFunction,
  ImportGlobEagerFunction,
  ImportGlobOptions,
  KnownAsTypeMap
} from 'types/importGlob'

declare module 'rollup' {
  export interface RenderedChunk {
    viteMetadata: ChunkMetadata
  }
}
