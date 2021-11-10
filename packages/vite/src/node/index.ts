export * from './config'
export { createServer, searchForWorkspaceRoot } from './server'
export { preview } from './preview'
export { build } from './build'
export { optimizeDeps } from './optimizer'
export { send } from './server/send'
export { createLogger, printHttpServerUrls } from './logger'
export { transformWithEsbuild } from './plugins/esbuild'
export { resolvePackageData, resolvePackageEntry } from './plugins/resolve'
export { normalizePath } from './utils'

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
  ResolvedPreviewOptions
} from './preview'
export type {
  DepOptimizationMetadata,
  DepOptimizationOptions
} from './optimizer'
export type { Plugin } from './plugin'
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
export type { JsonOptions } from './plugins/json'
export type { TransformOptions as EsbuildTransformOptions } from 'esbuild'
export type { ESBuildOptions, ESBuildTransformResult } from './plugins/esbuild'
export type { Manifest, ManifestChunk } from './plugins/manifest'
export type {
  PackageData,
  ResolveOptions,
  InternalResolveOptions
} from './plugins/resolve'
export type { WebSocketServer } from './server/ws'
export type { PluginContainer } from './server/pluginContainer'
export type { ModuleGraph, ModuleNode, ResolvedUrl } from './server/moduleGraph'
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
export type { WebSocket } from 'types/ws'
export type { HttpProxy } from 'types/http-proxy'
export type { FSWatcher, WatchOptions } from 'types/chokidar'
export type { Terser } from 'types/terser'
export type { RollupCommonJSOptions } from 'types/commonjs'
export type { RollupDynamicImportVarsOptions } from 'types/dynamicImportVars'
export type { Matcher, AnymatchPattern, AnymatchFn } from 'types/anymatch'
