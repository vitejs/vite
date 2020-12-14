import { Plugin, ResolvedConfig } from '..'
import aliasPlugin from '@rollup/plugin-alias'
import jsonPlugin from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { resolvePlugin, supportedExts } from './resolve'
import { esbuildPlugin } from './esbuild'
import { importAnalysisPlugin } from './imports'
import { cssPlugin } from './css'
import { assetPlugin } from './asset'
import { clientInjectionsPlugin } from './clientInjections'

export function resolvePlugins(
  command: 'build' | 'serve',
  config: ResolvedConfig,
  prePlugins: Plugin[],
  normalPlugins: Plugin[],
  postPlugins: Plugin[]
): Plugin[] {
  const isBuild = command === 'build'

  return [
    ...prePlugins,
    aliasPlugin({ entries: config.alias }),
    ...normalPlugins,
    resolvePlugin(config),
    nodeResolve({
      extensions: supportedExts,
      mainFields: ['module', 'jsnext', 'jsnext:main', 'browser', 'main']
    }),
    esbuildPlugin(config.esbuild || {}),
    cssPlugin(config, isBuild),
    jsonPlugin(),
    assetPlugin(config, isBuild),
    ...postPlugins,
    // internal server-only plugins are always applied after everything else
    ...(isBuild
      ? []
      : [clientInjectionsPlugin(config), importAnalysisPlugin(config)])
  ].filter(Boolean) as Plugin[]
}
