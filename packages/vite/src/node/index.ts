export * from './server'
export * from './build'
export * from './config'

// additional types
export { Plugin } from './plugin'
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
export type { WebSocketServer } from './server/ws'
export type { PluginContainer } from './server/pluginContainer'
export type { ModuleGraph, ModuleNode } from './server/moduleGraph'
export type { ProxyOptions } from './server/middlewares/proxy'
export type { TransformResult } from './server/transformRequest'
export type { HmrOptions } from './server/hmr'
export {
  HMRPayload,
  ConnectedPayload,
  UpdatePayload,
  Update,
  FullReloadPayload,
  StyleRemovePayload,
  CustomPayload,
  PrunePayload,
  ErrorPayload
} from 'types/hmrPayload'
export type { Connect } from 'types/connect'
export type { HttpProxy } from 'types/http-proxy'
export type { FSWatcher, WatchOptions } from 'types/chokidar'
