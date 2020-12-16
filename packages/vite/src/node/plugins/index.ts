import { Plugin, ResolvedConfig } from '..'
import aliasPlugin from '@rollup/plugin-alias'
import jsonPlugin from '@rollup/plugin-json'
import { resolvePlugin } from './resolve'
import { esbuildPlugin } from './esbuild'
import { importAnalysisPlugin } from './importsAnalysis'
import { cssPlugin, cssPostPlugin } from './css'
import { assetPlugin } from './asset'
import { clientInjectionsPlugin } from './clientInjections'
import { htmlPlugin } from './html'

export function resolvePlugins(
  command: 'build' | 'serve',
  config: ResolvedConfig,
  prePlugins: Plugin[],
  normalPlugins: Plugin[],
  postPlugins: Plugin[]
): Plugin[] {
  const isBuild = command === 'build'

  return [
    aliasPlugin({ entries: config.alias }),
    ...prePlugins,
    resolvePlugin(config.root),
    htmlPlugin(),
    cssPlugin(config, isBuild),
    esbuildPlugin(config.esbuild || {}),
    jsonPlugin(),
    assetPlugin(config, isBuild),
    ...normalPlugins,
    ...postPlugins,
    cssPostPlugin(config, isBuild),
    // internal server-only plugins are always applied after everything else
    ...(isBuild
      ? []
      : [clientInjectionsPlugin(config), importAnalysisPlugin(config)])
  ].filter(Boolean) as Plugin[]
}
