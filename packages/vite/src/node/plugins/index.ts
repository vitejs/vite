import { Plugin, ResolvedConfig } from '..'
import aliasPlugin from '@rollup/plugin-alias'
import jsonPlugin from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { resolvePlugin, supportedExts } from './resolve'
import { esbuildPlugin } from './esbuild'
import { rewritePlugin } from './rewrite'
import { cssPlugin } from './css'
import { assetPlugin } from './asset'

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
    aliasPlugin(config.alias),
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
    // rewrite is always applied last, even after post plugins
    isBuild ? null : rewritePlugin(config)
  ].filter(Boolean) as Plugin[]
}
